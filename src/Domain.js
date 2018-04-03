"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = require("./Entity");
const Type_1 = require("./Type");
const NumberType_1 = require("./types/NumberType");
const BaseType_1 = require("./BaseType");
const UuidType_1 = require("./types/UuidType");
const $path = require("path");
const $fs = require("fs");
const prettify = require("../node_modules/json-prettify/json2").stringify;
const Types = Type_1.Type.Types;
function toText(data, tabs) {
    return prettify(data, null, "\t").replace(/^/gm, tabs);
}
function allPropertiesToLowerCase(obj, deep = false) {
    if (!obj)
        return null;
    if (obj.constructor !== Object) {
        throw new Error("Parameter obj must be of type Object.");
    }
    const out = {};
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            out[prop.toLowerCase()] = (deep && obj[prop].constructor === Object)
                ? allPropertiesToLowerCase(obj[prop]) : obj[prop];
        }
    }
    return out;
}
const createdEntities = [];
class Domain {
    constructor(adapter, connectionInfo) {
        this.__adapter = new adapter(connectionInfo);
        this.__connectionInfo = connectionInfo;
    }
    createEntity(name, properties, idType = undefined, _entityClass = undefined) {
        if (properties.constructor !== Object) {
            throw new Error("Parameter 'properties' is not Object.");
        }
        if (!_entityClass) {
            if (!("id" in properties)) {
                if (!idType) {
                    idType = new NumberType_1.NumberType().primary().autoIncrement();
                }
                properties = Object.assign({
                    id: idType
                }, properties);
            }
            else {
                console.warn(`WARN You define custom id in entity ${name}. `
                    + `Use third parameter of Domain.createEntity() to change native id type.`);
            }
            _entityClass = class extends Entity_1.Entity {
            };
        }
        _entityClass.__defaultData = this.getDefaultValues(properties);
        this.addEntityClassInfo(_entityClass, name, properties);
        this.proxifyEntityProperties(properties, _entityClass);
        createdEntities.push(_entityClass);
        return _entityClass;
    }
    entity() {
        return (target) => {
            let inst = new target();
            target.map(inst);
            let properties = {};
            let props = Object.getOwnPropertyNames(inst);
            let prop;
            for (let p of props) {
                prop = inst[p];
                if (prop instanceof BaseType_1.BaseType) {
                    properties[p] = prop;
                }
            }
            let idProp = properties["id"];
            if (!idProp) {
                throw new Error("Id property is missing in entity " + target.name);
            }
            if (!(idProp instanceof NumberType_1.NumberType || idProp instanceof UuidType_1.UuidType)) {
                throw new Error("Id property must be instance of NumberType or UuidType.");
            }
            this.createEntity(target.name, properties, idProp, target);
        };
    }
    async nativeQuery(query, ...params) {
        return await this.__adapter.query(query, params);
    }
    getEntityByName(entityName) {
        for (let e of createdEntities) {
            if (e.name === entityName && e.domain === this)
                return e;
        }
        return null;
    }
    async createMigration(path) {
        const tables = await this.__adapter.getListOfEntities();
        const foreigns = {};
        let output = "";
        for (let entity of createdEntities) {
            let fields = entity.getDescription();
            foreigns[entity.name] = [];
            let fieldsLowerCase = allPropertiesToLowerCase(fields);
            Domain.prepareFields(entity, fields, foreigns);
            if (!tables.some(x => (x.toLowerCase() === entity.name.toLowerCase()))) {
                output += `\t\tawait adapter.createEntity("${entity.name}", ${toText(fields, "\t\t").trim()});\n\n`;
            }
            else {
                output = await this.updateEntity(entity, fields, fieldsLowerCase, output, foreigns);
            }
        }
        output = Domain.removeEntities(tables, output);
        output = Domain.addForeignKeys(foreigns, output);
        output = `
/**
 * Migration script
 */

module.exports = {\n\tup: async function up(adapter) {\n`
            + output
            + "\t}\n};";
        $fs.writeFileSync($path.join(path, (new Date().getTime()).toString() + ".migration.js"), output);
    }
    async runMigration(path) {
        path = $path.resolve(path);
        const files = $fs.readdirSync(path).filter(name => /\.migration\.js$/.test(name)).sort();
        if (files.length === 0)
            return;
        const migration = $path.join(path, files[files.length - 1]);
        try {
            await require(migration).up(this.__adapter);
            delete require.cache[migration];
            $fs.renameSync(migration, migration.slice(0, -3) + ".applied");
        }
        catch (e) {
            console.log(e.stack);
        }
    }
    async runMigrations(...paths) {
        for (let path of paths) {
            await this.runMigration(path);
        }
    }
    async dispose() {
        if (this.__adapter.dispose)
            this.__adapter.dispose(this.__connectionInfo);
    }
    static removeEntities(tables, output) {
        for (let table of tables) {
            if (!createdEntities.some(e => (table.toLowerCase() === e.name.toLowerCase()))) {
                output += `\t\tawait adapter.removeEntity("${table}");\n`;
            }
        }
        return output;
    }
    async updateEntity(entity, fields, fieldsLowerCase, output, foreigns) {
        let tableInfo = await this.__adapter.getEntityStructure(entity.name);
        let tableInfoLowerCase = allPropertiesToLowerCase(tableInfo);
        for (let fieldName in fields) {
            if (fields.hasOwnProperty(fieldName)) {
                let fieldNameLowerCase = fieldName.toLowerCase();
                if (!(fieldNameLowerCase in tableInfoLowerCase)) {
                    output += `\t\tawait adapter.addField("${entity.name}", "${fieldName}", ${toText(fields[fieldName], "\t\t").slice(2)});\n`;
                }
                else {
                    output = Domain.updateEntityField(fieldsLowerCase, fieldNameLowerCase, entity, tableInfoLowerCase, output);
                }
            }
        }
        output = Domain.removeForeignKey(tableInfo, foreigns, entity, output);
        Domain.filterForeignKeys(tableInfo, foreigns, entity);
        output = Domain.removeField(tableInfoLowerCase, fieldsLowerCase, tableInfo, output, entity);
        return output;
    }
    static updateEntityField(fieldsLowerCase, fieldNameLowerCase, entity, tableInfoLowerCase, output) {
        let changed = false;
        let entityTypeFields = fieldsLowerCase[fieldNameLowerCase];
        let tableInfoTypeFields = tableInfoLowerCase[fieldNameLowerCase];
        for (let typeFieldName in entityTypeFields) {
            if (entityTypeFields.hasOwnProperty(typeFieldName)) {
                if (entityTypeFields.type === Types.Boolean && typeFieldName === "length") {
                    continue;
                }
                if (tableInfoTypeFields[typeFieldName] !== entityTypeFields[typeFieldName]) {
                    changed = true;
                    break;
                }
            }
        }
        if (changed) {
            output += `\t\tawait adapter.changeField("${entity.name}", "${fieldNameLowerCase}", ${toText(fieldsLowerCase[fieldNameLowerCase], "\t\t").slice(2)});\n`;
        }
        return output;
    }
    static removeField(tableInfoLowerCase, notReducedFieldsLowerCase, tableInfo, output, entity) {
        for (let tf in tableInfoLowerCase) {
            if (tableInfoLowerCase.hasOwnProperty(tf) && !notReducedFieldsLowerCase.hasOwnProperty(tf)) {
                let fieldName = Object.keys(tableInfo)[Object.keys(tableInfoLowerCase).indexOf(tf)];
                output += `\t\tawait adapter.removeField("${entity.name}", "${fieldName}");\n`;
            }
        }
        return output;
    }
    static addForeignKeys(foreigns, output) {
        let fks, fk;
        for (let entityName in foreigns) {
            if (foreigns.hasOwnProperty(entityName)) {
                fks = foreigns[entityName];
                for (fk of fks) {
                    output += `\t\tawait adapter.addForeignKey("${entityName}", "${fk.withForeign}", "${fk.foreignEntity}", "${fk.keyName}");\n`;
                }
            }
        }
        return output;
    }
    static removeForeignKey(tableInfo, foreigns, entity, output) {
        for (let fieldName in tableInfo) {
            if (tableInfo.hasOwnProperty(fieldName)) {
                for (let index of tableInfo[fieldName].indexes) {
                    if (index.name.slice(0, 3) === "fk_"
                        && !foreigns[entity.name].some(f => f.keyName === index.name)) {
                        output += `\t\tawait adapter.removeForeignKey("${entity.name}", "${index.name}");\n`;
                    }
                }
            }
        }
        return output;
    }
    static filterForeignKeys(tableInfo, foreigns, entity) {
        const allForeigns = foreigns[entity.name];
        const shouldBeAdded = [];
        for (let fk of allForeigns) {
            if (!tableInfo[fk.withForeign] || !tableInfo[fk.withForeign].indexes.some(index => index.name === fk.keyName)) {
                shouldBeAdded.push(fk);
            }
        }
        foreigns[entity.name] = shouldBeAdded;
    }
    static prepareFields(entity, fields, foreigns) {
        let tmpFieldType;
        for (let field in fields) {
            if (fields.hasOwnProperty(field)) {
                tmpFieldType = fields[field];
                if (tmpFieldType.type == Types.Virtual) {
                    if (tmpFieldType.hasMany === null) {
                        tmpFieldType.keyName = `fk_${entity.name}_${tmpFieldType.withForeign}_${tmpFieldType.foreignEntity}_id`;
                        foreigns[entity.name].push(tmpFieldType);
                    }
                    delete fields[field];
                    continue;
                }
                delete tmpFieldType["default"];
                delete tmpFieldType["foreignEntity"];
                delete tmpFieldType["hasMany"];
                delete tmpFieldType["withForeign"];
                for (let fieldTypePropety in tmpFieldType) {
                    if (tmpFieldType.hasOwnProperty(fieldTypePropety)) {
                        if (tmpFieldType[fieldTypePropety] === null || tmpFieldType[fieldTypePropety] === false) {
                            delete tmpFieldType[fieldTypePropety];
                        }
                    }
                }
            }
        }
    }
    addEntityClassInfo(entity, name, properties) {
        Object.defineProperty(entity, "name", { value: name });
        Object.defineProperty(entity, "_description", {
            get: function () {
                return Object.assign({}, properties);
            }
        });
        entity.domain = this;
    }
    proxifyEntityProperties(properties, entity) {
        for (let propName in properties) {
            if (properties.hasOwnProperty(propName)) {
                let desc = properties[propName].description;
                let isVirt = desc.type == Type_1.Type.Types.Virtual;
                Object.defineProperty(entity.prototype, propName, {
                    enumerable: true,
                    get: async function () {
                        const chps = this.__changedProps;
                        const props = this.__properties;
                        let val = chps[propName] || props[propName];
                        if (val === null && isVirt) {
                            let fEtity = isVirt ? entity.domain.getEntityByName(desc.foreignEntity) : null;
                            if (!fEtity) {
                                throw new Error(`Foreign property '${propName}' of entity '${entity.name}'refers`
                                    + ` to unexisting entity '${desc.foreignEntity}'`);
                            }
                            if (desc.withForeign) {
                                let id = chps[desc.withForeign] || props[desc.withForeign];
                                val = id ? await fEtity.getById(id) : null;
                            }
                            else {
                                if (props.id > 0) {
                                }
                            }
                            props[desc.withForeign] = val;
                        }
                        return val;
                    },
                    set: function (value) {
                        if (isVirt) {
                            if (desc.withForeign) {
                                let fId = value.id;
                                if (fId != this.__changedProps[desc.withForeign]) {
                                    this.__changedProps[desc.withForeign] = fId;
                                }
                            }
                        }
                        this.__changedProps[propName] = value;
                    }
                });
            }
        }
    }
    getDefaultValues(properties) {
        const defaultData = {};
        for (let prop in properties) {
            if (properties.hasOwnProperty(prop)) {
                let defVal = properties[prop].description.default;
                let defValFunc;
                if (typeof defVal !== "function") {
                    defValFunc = function () {
                        return defVal;
                    };
                }
                else {
                    defValFunc = defVal;
                }
                defaultData[prop] = defValFunc;
            }
        }
        return defaultData;
    }
}
exports.Domain = Domain;
//# sourceMappingURL=Domain.js.map