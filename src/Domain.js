"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = require("./Entity");
const Type_1 = require("./Type");
const NumberType_1 = require("./types/NumberType");
const UuidType_1 = require("./types/UuidType");
const $path = require("path");
const $fs = require("fs");
const prettify = require("json-prettify/json2").stringify;
const Types = Type_1.Type.Types;
// Name of field holding entity identifier
const ID_FIELD_NAME = "id";
/**
 *
 * @param data
 * @param tabs
 */
function toText(data, tabs) {
    return prettify(data, null, "\t").replace(/^/gm, tabs);
}
/**
 * Return new object with all property names converted to lower case
 * @param {Object} obj
 * @param {boolean} [deep]
 * @returns {Object}
 */
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
// /**
//  * List of all created Entities
//  * @type {Array}
//  */
// const createdEntities: Array<typeof Entity> = [];
class Domain {
    //endregion
    //region Ctor
    /**
     * @param {Function} adapter
     * @param {String} connectionInfo
     */
    constructor(adapter, connectionInfo) {
        /**
         * List of created Entities (their classes)
         * @type {Function<Entity>[]}
         * @private
         */
        this.__createdEntities = [];
        /**
         * List of entities waiting for registration.
         * @type {Function<Entity>[]}
         * @private
         */
        this.__waitingEntities = [];
        // noinspection JSUnusedGlobalSymbols
        /**
         * Domain Symbol ID
         * @protected
         */
        this.__symbol = Symbol();
        this.__adapter = new adapter(connectionInfo);
        this.__connectionInfo = connectionInfo;
    }
    //endregion
    //<editor-fold desc="Static Methods">
    //</editor-fold>
    //<editor-fold desc="Public Methods">
    /**
     * Create new entity schema / domain model
     * @param {String} name
     * @param {Object<Type>} properties
     * @param {Type} [idType]
     * @param {Function} [_entityClass]
     * @returns {Function}
     */
    createEntity(name, properties, idType = undefined, _entityClass = undefined) {
        if (properties.constructor !== Object) {
            throw new Error("Parameter 'properties' is not Object.");
        }
        // Create class from properties if _entityClass not passed
        if (!_entityClass) {
            // Define ID
            if (!(ID_FIELD_NAME in properties)) {
                if (!idType) {
                    idType = new NumberType_1.NumberType().primary().autoIncrement();
                }
                // Add id; assign used to create new object with id on first place,
                // otherwise it'll be last column; just design detail
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
        // Store default data
        _entityClass.__defaultData = this.getDefaultValues(properties);
        // const entity = this.extendEntity(defaultData);
        this.addEntityClassInfo(_entityClass, name, properties);
        this.proxifyEntityProperties(properties, _entityClass);
        this.__createdEntities.push(_entityClass);
        this.removeFromWaiting(_entityClass);
        return _entityClass;
    }
    /**
     * Entity decorator registering entity
     */
    entity() {
        return (target) => {
            // Reflect.defineMetadata("domain.entity", target.name, target);
            // Cuz this method is called right in entity's module, instance of entity is created
            // before module is fully ready. Entity's method map() is called here too,
            // but map() can contains requires to another entities which should have cycle dependencyies.
            // It means that those dependencies cannot be resolved. So it's important to release context
            // and let module finish.
            this.__waitingEntities.push(target);
            process.nextTick(() => {
                // Get class fields
                let inst = new target();
                target.map(inst); // Map Types into fields
                let properties = {};
                let props = Object.getOwnPropertyNames(inst);
                let prop;
                for (let p of props) {
                    prop = inst[p];
                    if (prop instanceof Type_1.Type) {
                        properties[p] = prop;
                    }
                }
                let idProp = properties[ID_FIELD_NAME];
                if (!idProp) {
                    throw new Error("Id property is missing in entity " + target.name);
                }
                if (!(idProp instanceof NumberType_1.NumberType || idProp instanceof UuidType_1.UuidType)) {
                    throw new Error("Id property must be instance of NumberType or UuidType.");
                }
                this.createEntity(target.name, properties, idProp, target);
            });
        };
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Create plain query, it shouldn't be supported by all adapters
     * @param {String} query
     * @param params
     */
    async nativeQuery(query, ...params) {
        let q = this.__adapter.query;
        if (!q)
            return;
        return await q(query, params);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Return entity by its name
     * @param entityName
     * @returns {*}
     */
    getEntityByName(entityName) {
        for (let e of this.__createdEntities) {
            if (e.name === entityName && e.domain === this)
                return e;
        }
        // Try waiting ones
        for (let e of this.__waitingEntities) {
            if (e.name === entityName)
                return e;
        }
        return null;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Create migration script
     * @param {String} path
     */
    async createMigration(path) {
        await new Promise(r => setImmediate(r));
        const tables = await this.__adapter.getListOfEntities();
        const foreigns = {};
        let output = "";
        for (let entity of this.__createdEntities) {
            // Entity description
            let fields = entity.getDescription();
            // Create array with foreigns for entity
            foreigns[entity.name] = [];
            let fieldsLowerCase = allPropertiesToLowerCase(fields);
            // let notReducedFields = entity.getDescription();
            // let notReducedFieldsLowerCase = allPropertiesToLowerCase(notReducedFields);
            // Remove properties with null & false, virtual foreign fields
            // and properties default - default values are set from code
            // foreign keys from entity are added to foreign
            Domain.prepareFields(entity, fields, foreigns);
            // If entitiy not exists in database
            if (!tables.some(x => (x.toLowerCase() === entity.name.toLowerCase()))) {
                output += `\t\tawait adapter.createEntity("${entity.name}", ${toText(fields, "\t\t").trim()});\n\n`;
            }
            else {
                output = await this.updateEntity(entity, fields, fieldsLowerCase, output, foreigns);
            }
        }
        output = this.removeEntities(tables, output); // Drop removed entities
        output = Domain.addForeignKeys(foreigns, output); // Create foreign keys
        output = `
/**
 * Migration script
 */

module.exports = {\n\tup: async function up(adapter) {\n`
            + output
            + "\t}\n};";
        $fs.writeFileSync($path.join(path, (new Date().getTime()).toString() + ".migration.js"), output);
    }
    /**
     * Run latest migration from path
     * @param {String} path
     */
    async runMigration(path) {
        path = $path.resolve(path);
        const files = $fs.readdirSync(path).filter(name => /\.migration\.js$/.test(name)).sort();
        if (files.length === 0)
            return;
        const migration = $path.join(path, files[files.length - 1]);
        try {
            // Run migration
            await require(migration).up(this.__adapter);
            // Remove migration file from require cache
            delete require.cache[migration];
            // Rename migration script - mark as applied
            $fs.renameSync(migration, migration.slice(0, -3) + ".applied");
        }
        catch (e) {
            console.error(e.stack);
        }
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Run migrations from more paths
     * @param {Array<String>} paths
     */
    async runMigrations(...paths) {
        for (let path of paths) {
            await this.runMigration(path);
        }
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Run seeding
     * @returns {Promise<void>}
     */
    async runSeeding() {
        const $uow = require("./UnitOfWork").UnitOfWork;
        await new Promise(r => setImmediate(r));
        try {
            await $uow.create(async (uow) => {
                for (let entity of this.__createdEntities) {
                    let data = await entity.seed();
                    for (let item of data) {
                        uow.insert(item);
                    }
                }
                await uow.saveChanges();
            });
        }
        catch (e) {
            console.error("Seeding error:\n" + e.stack);
        }
    }
    /**
     * Call dispose in adapter if needed
     */
    async dispose() {
        if (this.__adapter.dispose)
            this.__adapter.dispose(this.__connectionInfo);
    }
    //</editor-fold>
    //<editor-fold desc="Private Methods>
    /**
     * Remove from list of waiting entities
     * @param {typeof Entity} entity
     */
    removeFromWaiting(entity) {
        let i = this.__waitingEntities.indexOf(entity);
        this.__waitingEntities = this.__waitingEntities.splice(i, 1);
    }
    /**
     * Remove removed entities
     * @private
     * @param tables
     * @param {String} output
     * @returns {String}
     */
    removeEntities(tables, output) {
        for (let table of tables) {
            // If there is no entity with given table name -> table should be removed
            if (!this.__createdEntities.some(e => (table.toLowerCase() === e.name.toLowerCase()))) {
                output += `\t\tawait adapter.removeEntity("${table}");\n`;
            }
        }
        return output;
    }
    /**
     * Check for changes on existing entity
     * @private
     * @param entity
     * @param fields
     * @param fieldsLowerCase
     * @param output
     * @param foreigns
     * @returns {Promise.<*>}
     */
    async updateEntity(entity, fields, fieldsLowerCase, output, foreigns) {
        let tableInfo = await this.__adapter.getEntityStructure(entity.name);
        let tableInfoLowerCase = allPropertiesToLowerCase(tableInfo);
        for (let fieldName in fields) {
            if (fields.hasOwnProperty(fieldName)) {
                let fieldNameLowerCase = fieldName.toLowerCase();
                // New field
                if (!(fieldNameLowerCase in tableInfoLowerCase)) {
                    output += `\t\tawait adapter.addField("${entity.name}", "${fieldName}", ${toText(fields[fieldName], "\t\t").slice(2)});\n`;
                }
                else {
                    output = Domain.updateEntityField(fieldsLowerCase, fieldNameLowerCase, entity, tableInfoLowerCase, output);
                }
            }
        }
        // Check for keys deletation
        output = Domain.removeForeignKey(tableInfo, foreigns, entity, output);
        // remove foreign keys from variable foreign which has been already created
        Domain.filterForeignKeys(tableInfo, foreigns, entity);
        // Check for field deletion
        output = Domain.removeField(tableInfoLowerCase, fieldsLowerCase, tableInfo, output, entity);
        return output;
    }
    /**
     * Check for changes on given entity field
     * @private
     * @param fieldsLowerCase
     * @param fieldNameLowerCase
     * @param entity
     * @param tableInfoLowerCase
     * @param output
     * @returns {*}
     */
    static updateEntityField(fieldsLowerCase, fieldNameLowerCase, entity, tableInfoLowerCase, output) {
        let changed = false;
        let entityTypeFields = fieldsLowerCase[fieldNameLowerCase];
        let tableInfoTypeFields = tableInfoLowerCase[fieldNameLowerCase];
        // Check if something differ
        for (let typeFieldName in entityTypeFields) {
            if (entityTypeFields.hasOwnProperty(typeFieldName) /* && typeFieldName !== "default"*/) {
                if (entityTypeFields.type === Types.Boolean && typeFieldName === "length") {
                    continue;
                }
                if (tableInfoTypeFields[typeFieldName] !== entityTypeFields[typeFieldName]
                    && (typeFieldName !== "length"
                        || entityTypeFields.type !== Types.String
                        || ~~tableInfoTypeFields[typeFieldName] != entityTypeFields[typeFieldName] // If type is string and fieldName is length cast table info into number -> null is same as 0
                    )) {
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
    /**
     * Remove removed fields
     * @private
     * @param tableInfoLowerCase
     * @param notReducedFieldsLowerCase
     * @param tableInfo
     * @param output
     * @param entity
     * @returns {*}
     */
    static removeField(tableInfoLowerCase, notReducedFieldsLowerCase, tableInfo, output, entity) {
        for (let tf in tableInfoLowerCase) {
            if (tableInfoLowerCase.hasOwnProperty(tf) && !notReducedFieldsLowerCase.hasOwnProperty(tf)) {
                let fieldName = Object.keys(tableInfo)[Object.keys(tableInfoLowerCase).indexOf(tf)];
                output += `\t\tawait adapter.removeField("${entity.name}", "${fieldName}");\n`;
            }
        }
        return output;
    }
    /**
     * Add new foreign keys
     * @private
     * @param foreigns
     * @param {String} output
     * @returns {String}
     */
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
    /**
     * Remove removed foreign keys
     * @private
     * @param tableInfo
     * @param foreigns
     * @param entity
     * @param output
     * @returns {*}
     */
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
    /**
     * remove foreign keys from variable foreign which has been already created
     * @param tableInfo
     * @param foreigns
     * @param entity
     */
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
    /**
     * Remove default data, unwanted fields and find foreign keys
     * @private
     * @param entity
     * @param fields
     * @param foreigns
     * @returns {*}
     */
    static prepareFields(entity, fields, foreigns) {
        let tmpFieldType;
        for (let field in fields) {
            if (fields.hasOwnProperty(field)) {
                tmpFieldType = fields[field];
                // Find foreigns, store them in extra list and delete it from fields
                if (tmpFieldType.type == Types.Virtual) {
                    if (tmpFieldType.hasMany === null) {
                        tmpFieldType.keyName = `fk_${entity.name}_${tmpFieldType.withForeign}_${tmpFieldType.foreignEntity}_id`;
                        foreigns[entity.name].push(tmpFieldType);
                    }
                    delete fields[field];
                    continue;
                }
                // Delete non-real field properties
                delete tmpFieldType["default"];
                delete tmpFieldType["foreignEntity"];
                delete tmpFieldType["hasMany"];
                delete tmpFieldType["withForeign"];
                // Delete field properties which has default values (null and false)
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
    /**
     * Add extra properties to Entity
     * @private
     * @param entity
     * @param name
     * @param properties
     */
    addEntityClassInfo(entity, name, properties) {
        // Change name of class
        Object.defineProperty(entity, "name", { value: name });
        // Store entity description
        Object.defineProperty(entity, "_description", {
            get: function () {
                return Object.assign({}, properties);
            }
        });
        entity.domain = this;
    }
    /**
     * Create proxy over properties which will detect changes
     * @private
     * @param properties
     * @param entity
     */
    proxifyEntityProperties(properties, entity) {
        for (let propName in properties) {
            if (properties.hasOwnProperty(propName)) {
                let desc = properties[propName].description;
                let isVirt = desc.type == Type_1.Type.Types.Virtual;
                let fEtity = isVirt ? entity.domain.getEntityByName(desc.foreignEntity) : null;
                let fkField = desc.withForeign;
                let hasMany = desc.hasMany;
                if (isVirt && !fEtity) {
                    throw new Error(`Foreign property '${propName}' of entity '${entity.name}'refers`
                        + ` to unexisting entity '${desc.foreignEntity}'`);
                }
                Object.defineProperty(entity.prototype, propName, {
                    enumerable: true,
                    get: function () {
                        const chps = this.__changedProps;
                        const props = this.__properties;
                        // noinspection JSAccessibilityCheck
                        let val = propName in chps ? chps[propName] : props[propName];
                        if (val == undefined && isVirt) {
                            val = new Promise((resolve, reject) => {
                                setImmediate(async () => {
                                    try {
                                        let val;
                                        if (fkField) {
                                            // Foreign Id can be null if it's optional relation
                                            let id = fkField in chps ? chps[fkField] : props[fkField];
                                            if (id) {
                                                val = await fEtity.getById(id);
                                            }
                                            else {
                                                val = null;
                                            }
                                            // Store foreign
                                            props[desc.withForeign] = val;
                                        }
                                        else if (hasMany) {
                                            // TODO: Finish 1:M relation
                                            if (props.id > 0) {
                                                val = await fEtity.getAll()
                                                    .where(x => x.$ == $, hasMany, props.id)
                                                    .exec();
                                            }
                                            else {
                                                return [];
                                            }
                                        }
                                        resolve(val);
                                    }
                                    catch (e) {
                                        reject(e);
                                    }
                                });
                            });
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
                        // Mark change
                        this.__isDirty = this.__changedProps[propName] != value;
                        this.__changedProps[propName] = value;
                    }
                });
            }
        }
    }
    /**
     * Return object with default property values
     * @private
     * @param properties
     * @returns {{}}
     */
    getDefaultValues(properties) {
        const defaultData = {};
        for (let prop in properties) {
            if (properties.hasOwnProperty(prop)) {
                let propertyDesc = properties[prop].description;
                if (propertyDesc.type == Type_1.Type.Types.Virtual)
                    continue; // Ignore virtual types
                let defVal = propertyDesc.default;
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