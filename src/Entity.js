"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
const Type_1 = require("./Type");
const NumberType_1 = require("./types/NumberType");
const WhereExpression_1 = require("./WhereExpression");
// Name of field holding entity identifier
const ID_FIELD_NAME = "id";
// Error ID
const ENTITY_NOT_FOUND = "entity_not_found";
/**
 * @class
 * @template TEntity
 */
class Entity {
    //endregion
    //region Ctor
    /**
     * @param [data]
     * @param {boolean} [markDataAsChangedProperties]
     */
    constructor(data = {}, markDataAsChangedProperties = true) {
        /**
         * Entity states - used from UnitOfWork
         * @type {{}}
         * @private
         */
        this.__snaps = {};
        // noinspection JSUnusedGlobalSymbols
        /**
         * Entity Symbol ID
         * @private
         */
        this.__symbol = Symbol();
        /**
         * Delete state flag
         * @protected
         */
        this.__isRemoved = false;
        /**
         * Insert state flag
         * @protected
         */
        this.__isNew = false;
        /**
         * Update state flag
         * @protected
         */
        this.__isDirty = false;
        const ctor = this.constructor;
        let defaultData = ctor.__defaultData; // Contains data for all existing properties
        //let entityProps = ctor._description;
        let changedProps = {}, p;
        // let propKeys = Object.keys(data);
        let defKeys = Object.keys(defaultData);
        let properties = {};
        for (let i = 0; i < defKeys.length; i++) {
            p = defKeys[i];
            properties[p] = p in data ? data[p] : defaultData[p]();
        }
        // for (let i = 0; i < propKeys.length; i++)
        // {
        // 	p = propKeys[i];
        // 	properties[p] = data[p];
        // }
        if (markDataAsChangedProperties) {
            for (p in properties) {
                if (properties.hasOwnProperty(p) && p != ID_FIELD_NAME) {
                    changedProps[p] = properties[p];
                }
            }
        }
        if (!data["id"]) {
            this.__isNew = true;
        }
        else if (markDataAsChangedProperties) {
            this.__isDirty = true;
        }
        this.__properties = properties;
        this.__changedProps = changedProps;
    }
    //endregion
    //region Static methods
    /**
     * Add unique key created by more fields
     * @param {Array<String>} fields List of fields
     */
    static addUnique(...fields) {
        console.warn("Entity.addUnique() not implemented yet!");
        // return this;
    }
    /**
     * Add primary key created by more fields
     * @param {Array<String>} fields List of fields
     */
    static addPrimary(...fields) {
        console.warn("Entity.addPrimary() not implemented yet!");
        // return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Insert new entity
     * @param {Entity} entity
     * @param [connection]
     */
    static async insert(entity, connection) {
        if (!(entity instanceof Entity)) {
            throw new Error("Parameter entity must be of type Entity");
        }
        if (entity.__properties.id > 0) {
            throw new Error("This entity already exists");
        }
        await this.domain.__adapter.insert(entity, entity.getData(), connection);
        entity.resetFlags();
        // TODO: dořešit kaskádované uložení entit, včetně insertu a mazání; u required entit i u hasMany
        // Při editaci seznamu entit je třeba dohledat cizí klíč a ten upravit
        //      Př. přidám Employee do Enterprise.users bez toho, abych měnil enterpriseId u entity Employee, chci, aby se to změnilo samo
        entity.storeChanges();
        await entity.saveRelatedVirtuals(connection);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Remove entity
     * @param {Entity} entity Entity which should be removed
     * @param [connection]
     */
    static async remove(entity, connection) {
        if (!(entity instanceof Entity)) {
            throw new Error("Parameter entity must be of type Entity");
        }
        await this.domain.__adapter.remove(this, [{
                field: ID_FIELD_NAME,
                func: "=",
                arg: entity.__properties[ID_FIELD_NAME]
            }], connection);
        entity.__isRemoved = true;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Remove entities matching given query where expression
     * @param {(entity: TEntity) => boolean} expression
     * @param args
     * @returns {Promise<void>}
     */
    static async removeWhere(expression, ...args) {
        let expr = new WhereExpression_1.WhereExpression();
        expr.addExpression(expression, ...args);
        await this.domain.__adapter.remove(this, expr.getConditions());
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Get all records
     * @template TEntity
     * @returns {Query<TEntity>}
     */
    static getAll() {
        return new Query_1.Query(this);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Select record by its id
     * @param {Number | Uuid | *} id
     * @param fields
     * @template TEntity
     * @returns {TEntity}
     */
    static async getById(id, ...fields) {
        const entity = await this.domain.__adapter.select(this, fields || [], [{ field: ID_FIELD_NAME, func: "=", arg: id }]);
        if (!entity[0])
            return null;
        return Reflect.construct(this, [entity[0], true]);
    }
    /**
     * Select record by its id. Throw error if not fond.
     * @param {number | string} id
     * @param {string} fields
     * @returns {Promise<any>}
     */
    static async getByIdOrThrow(id, ...fields) {
        let entity = await this.getById(id, ...fields);
        if (entity === null) {
            throw {
                id: ENTITY_NOT_FOUND,
                statusCode: 404,
                message: `Entity ${this.name} (id: ${id}) not found.`
            };
        }
        return entity;
    }
    /**
     * Check that entity with given Id exists
     * @param {number | string} id
     * @returns {Promise<boolean>}
     */
    static async exists(id) {
        // TODO: Create exists in adapter; Related Query.some() - use some() rather then count() after implementation
        // return (await this.getAll().where(x => x.id == $, id).count().exec()) == 1;
        return (await this.domain.__adapter.select(this, [{ func: "count", arg: null }], [{ field: ID_FIELD_NAME, func: "=", arg: id }]))[0].count == 1;
    }
    /**
     * Check that entity with given Id exists. If not, throw error
     * @param {number | string} id
     * @returns {Promise<boolean>}
     */
    static async existsOrThrow(id) {
        let exists = await this.exists(id);
        if (!exists) {
            throw {
                id: ENTITY_NOT_FOUND,
                statusCode: 404,
                message: `Entity ${this.name} (id: ${id}) not found.`
            };
        }
        return exists;
    }
    /**
     * Returns description of entity
     * @returns {{}}
     */
    static getDescription() {
        const description = {};
        const fields = this._description;
        for (let prop in fields) {
            if (fields.hasOwnProperty(prop)) {
                description[prop] = fields[prop].getDescription();
            }
        }
        return description;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Method for seeding. Implement this method and return data which should be seeded.
     */
    static async seed() { return []; }
    /**
     * Entity mapping. Implement this method.
     * @param {Entity} map
     */
    static map(map) { }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Reconstruct entity instance from given data. It'll not mark properties as changed.
     * @param {Object} data
     */
    static reconstructFrom(data) {
        let entity = new this.constructor(data, false);
        return entity;
    }
    /**
     * Data validator
     * @param {TEntity} entity
     * @returns {Promise<boolean>}
     */
    static async validate(entity) { return true; }
    /**
     * Allows you to handle entity deletion
     * @param {Entity<Entity>} entity
     * @param {IPreventableEvent} event
     */
    static async onRemove(entity, event) { }
    /**
     * Allows you to handle build deletion
     * @param {(entity: Entity<any>) => boolean} expression
     * @param args
     * @returns {Promise<void>}
     */
    static async onRemoveWhere(expression, ...args) { }
    /**
     * Allow you to add something into each query
     * @param {Query<Entity>} query
     * @returns {Promise<void>}
     */
    static async baseQuery(query) { }
    //endregion
    //region Public methods
    /**
     * Return object with raw data
     * @returns {{}}
     */
    getData() {
        const desc = this.constructor._description;
        const rtrn = {}, props = this.__properties, chp = this.__changedProps;
        for (let p in props) {
            if (props.hasOwnProperty(p) && desc[p].description.type !== Type_1.Type.Types.Virtual) {
                rtrn[p] = p in chp ? chp[p] : props[p];
            }
        }
        return rtrn;
    }
    /**
     * Return object with raw data but just that changed
     * @returns {{}}
     */
    getChangedData() {
        const desc = this.constructor._description;
        const changedData = {}, chp = this.__changedProps;
        for (let p in chp) {
            if (chp.hasOwnProperty(p) && desc[p].description.type !== Type_1.Type.Types.Virtual) {
                changedData[p] = chp[p];
            }
        }
        return changedData;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Return new object with selected properties
     * @param {Array<String>} fields List of property names
     * @returns {{}}
     */
    select(...fields) {
        const outObj = {};
        // If no fields specified, select all
        if (!fields) {
            return Object.assign({}, this.__properties);
        }
        for (let f of fields) {
            outObj[f] = this.__properties[f];
        }
        return outObj;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Save tracked changes
     * @param [connection]
     */
    async save(connection) {
        // Return if no props were changed
        if (Object.keys(this.__changedProps).length === 0) {
            return;
        }
        const id = this.__properties[ID_FIELD_NAME];
        if (!id) {
            throw new Error("You can't update entity without id");
        }
        await this.constructor.domain.__adapter.update(this.constructor, this.getChangedData(), { id: id }, connection);
        this.storeChanges();
        await this.saveRelatedVirtuals(connection);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Remove changes on this entity instance
     */
    rollbackChanges() {
        this.__changedProps = {};
        this.__isDirty = false;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Map data from given Object into current entity instance.
     * Data will me marked as changed if differ from existing values.
     * @param {Object} data
     */
    mapFrom(data) {
        //let entity: TEntity = new (<any>this.constructor)();
        for (let field in data) {
            if (data.hasOwnProperty(field)
                && field in this.constructor._description) {
                if (this[field] !== data[field] && field != ID_FIELD_NAME) {
                    this.__changedProps[field] = data[field];
                    this.__isDirty = true;
                }
            }
        }
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Implement toJSON
     * @returns {{}}
     */
    toJSON() {
        return this.__properties;
    }
    //endregion
    //region Private methods
    /**
     * Reset state flags
     */
    resetFlags() {
        this.__isNew = false;
        this.__isDirty = false;
        this.__isRemoved = false;
    }
    /**
     * Copy values from changes to own properties and clear list of changed values
     */
    storeChanges() {
        const chp = this.__changedProps;
        const props = this.__properties;
        for (let propName in chp) {
            if (chp.hasOwnProperty(propName) && propName != ID_FIELD_NAME) {
                props[propName] = chp[propName];
            }
        }
        this.rollbackChanges();
    }
    /**
     * Update changed related entities and go through many relations and update it's foreign key's
     * @param {{}} connection
     * @returns {Promise<void>}
     */
    async saveRelatedVirtuals(connection) {
        const desc = this.constructor._description;
        let promises = [];
        this.saveSimpleRelatedVirtuals(desc, promises, connection);
        // 1:N
        this.saveRelatedManyVirtuals(desc, promises, connection);
        await Promise.all(promises);
    }
    /**
     * Go through virtual collections of related entities and save them
     * @param {{}} desc
     * @param {{}[]} promises
     * @param {{}} connection
     */
    saveRelatedManyVirtuals(desc, promises, connection) {
        let manys = this.getManyVirtuals(desc), fieldName, relatedEntity, foreignField, collection;
        for (fieldName in manys) {
            if (manys.hasOwnProperty(fieldName)) {
                collection = manys[fieldName];
                for (relatedEntity of collection) {
                    foreignField = desc[fieldName].description.hasMany;
                    relatedEntity[foreignField] = this.id;
                    // TODO: If it has virtual type too, it should be set too
                    //relatedEntity[virtualFieldName] = this;
                    if (relatedEntity.id == undefined) {
                        promises.push(relatedEntity.save(connection));
                    }
                    else {
                        promises.push(relatedEntity.constructor.insert(relatedEntity, connection));
                    }
                }
            }
        }
    }
    /**
     * Save directly related virtual properties/entities
     * @param {{}} desc
     * @param {Promise[]} promises
     * @param {{}} connection
     */
    saveSimpleRelatedVirtuals(desc, promises, connection) {
        let virts = this.getChangedVirtuals(desc); // N:1
        for (let fieldName in virts) {
            if (virts.hasOwnProperty(fieldName)) {
                let relatedEntity = virts[fieldName];
                // Set related ID to withForeign field of this property
                let foreignField = desc[fieldName].description.withForeign;
                if (foreignField) {
                    this[foreignField] = relatedEntity.id;
                    // TODO: set from second side too.
                    // relatedEntity[relatedVirtualField] = this;
                    // relatedEntity[relatedForeignField] = this.id;
                }
                if (relatedEntity.id == undefined) {
                    promises.push(relatedEntity.save(connection));
                }
                else {
                    promises.push(relatedEntity.constructor.insert(relatedEntity, connection));
                }
            }
        }
    }
    /**
     * Get object with changed virtual properties
     * @param {{}} desc
     * @returns {{}}
     */
    getChangedVirtuals(desc) {
        const rtrn = {}, chp = this.__changedProps;
        for (let p in chp) {
            if (chp.hasOwnProperty(p) && desc[p].description.withForeign) {
                rtrn[p] = chp[p];
            }
        }
        return rtrn;
    }
    /**
     * Return object with hasMany virtual properties
     * @param {{}} desc
     * @returns {{}}
     */
    getManyVirtuals(desc) {
        const rtrn = {}, props = this.__properties;
        let p;
        for (p in props) {
            if (props.hasOwnProperty(p) && props[p] && desc[p].description.hasMany) {
                rtrn[p] = props[p];
            }
        }
        return rtrn;
    }
}
/**
 * Entity domain - set when entity created
 */
Entity.domain = null;
/**
 * Entity description - set when entity created
 */
Entity._description = {
    id: new NumberType_1.NumberType().primary().autoIncrement()
};
/**
 * Entity default data
 * @private
 */
Entity.__defaultData = {};
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map