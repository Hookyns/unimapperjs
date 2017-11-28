"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = require("./Entity");
const Type_1 = require("./Type");
const NumberType_1 = require("./types/NumberType");
const $path = require("path");
const $fs = require("fs");
const prettify = require("../node_modules/json-prettify/json2").stringify;
const Types = Type_1.Type.Types;
function toText(data, tabs) {
    return prettify(data, null, "\t").replace(/^/gm, tabs);
}
function allPropertiesToLowerCase(obj) {
    if (!obj)
        return null;
    if (obj.constructor !== Object) {
        throw new Error("Parameter obj must be of type Object.");
    }
    const out = {};
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            out[prop.toLowerCase()] = obj[prop] && obj[prop].constructor === Object
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
    createEntity(name, properties, idType = null) {
        if (properties.constructor !== Object) {
            throw new Error("Parameter 'properties' is not Object.");
        }
        if (!properties.hasOwnProperty("id")) {
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
        const defaultData = this.getDefaultValues(properties);
        const entity = this.extendEntity(defaultData);
        this.addEntityClassInfo(entity, name, properties);
        this.proxifyEntityProperties(properties, entity);
        createdEntities.push(entity);
        return entity;
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
            let notReducedFields = entity.getDescription();
            let notReducedFieldsLowerCase = allPropertiesToLowerCase(notReducedFields);
            Domain.prepareFields(entity, fields, foreigns);
            if (!tables.some(x => (x.toLowerCase() === entity.name.toLowerCase()))) {
                output += `\t\tawait adapter.createEntity("${entity.name}", ${toText(fields, "\t\t").trim()});\n\n`;
            }
            else {
                output = await this.updateEntity(entity, fields, output, notReducedFieldsLowerCase, foreigns);
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
    async updateEntity(entity, fields, output, notReducedFieldsLowerCase, foreigns) {
        let tableInfo = await this.__adapter.getEntityStructure(entity.name);
        let tableInfoLowerCase = allPropertiesToLowerCase(tableInfo);
        for (let f in fields) {
            if (fields.hasOwnProperty(f)) {
                if (!tableInfoLowerCase.hasOwnProperty(f.toLowerCase())) {
                    output += `\t\tawait adapter.addField("${entity.name}", "${f}", ${toText(fields[f], "\t\t").slice(2)});\n`;
                }
                else {
                    output = Domain.updateEntityField(notReducedFieldsLowerCase, f, tableInfoLowerCase, output, entity, fields);
                }
            }
        }
        output = Domain.removeForeignKey(tableInfo, foreigns, entity, output);
        Domain.filterForeignKeys(tableInfo, foreigns, entity);
        output = Domain.removeField(tableInfoLowerCase, notReducedFieldsLowerCase, tableInfo, output, entity);
        return output;
    }
    static updateEntityField(notReducedFieldsLowerCase, f, tableInfoLowerCase, output, entity, fields) {
        let changed = false;
        let lcFields = notReducedFieldsLowerCase[f.toLowerCase()];
        for (let prop in lcFields) {
            if (lcFields.hasOwnProperty(prop) && prop !== "default") {
                if (lcFields.type === Types.Boolean && prop === "length") {
                    continue;
                }
                if (tableInfoLowerCase[f.toLowerCase()][prop] !== lcFields[prop]) {
                    changed = true;
                    break;
                }
            }
        }
        if (changed) {
            output += `\t\tawait adapter.changeField("${entity.name}", "${f}", ${toText(fields[f], "\t\t").slice(2)});\n`;
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
        let tmpField;
        for (let field in fields) {
            if (fields.hasOwnProperty(field)) {
                tmpField = fields[field];
                delete tmpField["default"];
                if (tmpField.hasOwnProperty("foreignEntity")) {
                    if (tmpField.hasMany === null) {
                        tmpField.keyName = `fk_${entity.name}_${tmpField.withForeign}_${tmpField.foreignEntity}_id`;
                        foreigns[entity.name].push(tmpField);
                    }
                    delete fields[field];
                    continue;
                }
                for (let prop in fields[field]) {
                    if (fields[field].hasOwnProperty(prop)) {
                        if (fields[field][prop] === null || fields[field][prop] === false) {
                            delete fields[field][prop];
                        }
                    }
                }
            }
        }
        return tmpField;
    }
    extendEntity(defaultData) {
        return class X extends Entity_1.default {
            constructor(data, selected) {
                const defData = {};
                for (let p in defaultData) {
                    if (defaultData.hasOwnProperty(p)) {
                        defData[p] = defaultData[p]();
                    }
                }
                if (data) {
                    for (let p in data) {
                        if (data.hasOwnProperty(p)) {
                            defData[p] = data[p];
                        }
                    }
                }
                super(defData, selected);
            }
        };
    }
    addEntityClassInfo(entity, name, properties) {
        Object.defineProperty(entity, "name", { value: name });
        Object.defineProperty(entity.constructor, "name", { value: name });
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
                        if (isVirt && val == null) {
                            if (desc.withForeign) {
                                let fEtity = this.domain.getEntityByName(desc.withForeign);
                                if (fEtity) {
                                    val = await fEtity.getById(chps[desc.withForeign] || props[desc.withForeign]);
                                }
                            }
                        }
                        return val;
                    },
                    set: function (value) {
                        if (isVirt) {
                            if (desc.withForeign) {
                                this.__changedProps[desc.withForeign] = value.id;
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
