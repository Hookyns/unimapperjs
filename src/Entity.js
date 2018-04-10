"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
const Type_1 = require("./Type");
const NumberType_1 = require("./types/NumberType");
const WhereExpression_1 = require("./WhereExpression");
const ID_FIELD_NAME = "id";
class Entity {
    constructor(data = {}, markDataAsChangedProperties = true) {
        this.__snaps = {};
        this.__symbol = Symbol();
        this.__isRemoved = false;
        this.__isNew = false;
        this.__isDirty = false;
        let defaultData = this.constructor.__defaultData;
        let changedProps = {}, p;
        let propKeys = Object.keys(data);
        let defKeys = Object.keys(defaultData);
        let properties = {};
        for (let i = 0; i < defKeys.length; i++) {
            p = defKeys[i];
            properties[p] = defaultData[p]();
        }
        for (let i = 0; i < propKeys.length; i++) {
            p = propKeys[i];
            properties[p] = data[p];
        }
        if (markDataAsChangedProperties) {
            for (p in properties) {
                if (properties.hasOwnProperty(p) && p != ID_FIELD_NAME) {
                    changedProps[p] = properties[p];
                }
            }
        }
        if (!properties["id"]) {
            this.__isNew = true;
        }
        else {
            this.__isDirty = true;
        }
        this.__properties = properties;
        this.__changedProps = changedProps;
    }
    static addUnique(...fields) {
        console.warn("Entity.addUnique() not implemented yet!");
    }
    static addPrimary(...fields) {
        console.warn("Entity.addPrimary() not implemented yet!");
    }
    static async insert(entity, connection) {
        if (!(entity instanceof Entity)) {
            throw new Error("Parameter entity must be of type Entity");
        }
        if (entity.__properties.id > 0) {
            throw new Error("This entity already exists");
        }
        await this.domain.__adapter.insert(entity, entity.getData(), connection);
        entity.resetFlags();
        entity.storeChanges();
        await entity.saveRelatedVirtuals(connection);
    }
    static async remove(entity, connection) {
        if (!(entity instanceof Entity)) {
            throw new Error("Parameter entity must be of type Entity");
        }
        await this.domain.__adapter.remove(this, {
            field: "id",
            func: "=",
            args: entity.__properties[ID_FIELD_NAME]
        }, connection);
        entity.__isRemoved = true;
    }
    static async removeWhere(expression, ...args) {
        let expr = new WhereExpression_1.WhereExpression();
        expr.addExpression(expression, ...args);
        await this.domain.__adapter.remove(this, expr.getConditions());
    }
    static getAll() {
        return new Query_1.Query(this);
    }
    static async getById(id, ...fields) {
        const entity = await this.domain.__adapter.select(this, fields || [], [{ field: ID_FIELD_NAME, func: "=", arg: id }]);
        if (!entity[0])
            return null;
        return Reflect.construct(this, [entity[0], true]);
    }
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
    static seed() {
        return [];
    }
    static map(map) {
    }
    static reconstructFrom(data) {
        let entity = new this.constructor(data, false);
        return entity;
    }
    getData() {
        const desc = this.constructor._description;
        const rtrn = {}, props = this.__properties, chp = this.__changedProps;
        for (let p in props) {
            if (props.hasOwnProperty(p) && desc[p].description.type !== Type_1.Type.Types.Virtual) {
                rtrn[p] = chp[p] || props[p];
            }
        }
        return rtrn;
    }
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
    select(...fields) {
        const outObj = {};
        if (!fields) {
            return Object.assign({}, this.__properties);
        }
        for (let f of fields) {
            outObj[f] = this.__properties[f];
        }
        return outObj;
    }
    async save(connection) {
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
    mapFrom(data) {
        for (let field in data) {
            if (data.hasOwnProperty(field)) {
                if (this[field] !== data[field] && field != ID_FIELD_NAME) {
                    this.__changedProps[field] = data[field];
                    this.__isDirty = true;
                }
            }
        }
        return this;
    }
    resetFlags() {
        this.__isNew = false;
        this.__isDirty = false;
        this.__isRemoved = false;
    }
    storeChanges() {
        const chp = this.__changedProps;
        const props = this.__properties;
        for (let propName in chp) {
            if (chp.hasOwnProperty(propName)) {
                props[propName] = chp[propName];
            }
        }
        this.__changedProps = {};
    }
    async saveRelatedVirtuals(connection) {
        const desc = this.constructor._description;
        let promises = [];
        this.saveSimpleRelatedVirtuals(desc, promises, connection);
        this.saveRelatedManyVirtuals(desc, promises, connection);
        await Promise.all(promises);
    }
    saveRelatedManyVirtuals(desc, promises, connection) {
        let manys = this.getManyVirtuals(desc), fieldName, relatedEntity, foreignField, collection;
        for (fieldName in manys) {
            if (manys.hasOwnProperty(fieldName)) {
                collection = manys[fieldName];
                for (relatedEntity of collection) {
                    foreignField = desc[fieldName].description.hasMany;
                    relatedEntity[foreignField] = this.id;
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
    saveSimpleRelatedVirtuals(desc, promises, connection) {
        let virts = this.getChangedVirtuals(desc);
        for (let fieldName in virts) {
            if (virts.hasOwnProperty(fieldName)) {
                let relatedEntity = virts[fieldName];
                let foreignField = desc[fieldName].description.withForeign;
                if (foreignField) {
                    this[foreignField] = relatedEntity.id;
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
    getChangedVirtuals(desc) {
        const rtrn = {}, chp = this.__changedProps;
        for (let p in chp) {
            if (chp.hasOwnProperty(p) && desc[p].description.withForeign) {
                rtrn[p] = chp[p];
            }
        }
        return rtrn;
    }
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
Entity.domain = null;
Entity._description = {
    id: new NumberType_1.NumberType().primary().autoIncrement()
};
Entity.__defaultData = {};
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map