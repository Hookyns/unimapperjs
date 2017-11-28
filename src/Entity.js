"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
const Type_1 = require("./Type");
const NumberType_1 = require("./types/NumberType");
class Entity {
    constructor(data, selected = false) {
        this.__deleted = false;
        this.__properties = data || {};
        this.__changedProps = !!data && !selected ? Object.assign({}, data) : {};
        delete this.__changedProps["id"];
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
        let virts = entity.getChangedVirtuals();
        let proms = [];
        for (let v in virts) {
            if (virts.hasOwnProperty(v)) {
                let virt = virts[v];
                if (virt.id) {
                    proms.push(virt.save(connection));
                }
                else {
                    proms.push(virt.constructor.insert(virt, connection));
                }
            }
        }
        entity.storeChanges();
        await Promise.all(proms);
    }
    static async remove(entity, connection) {
        if (!(entity instanceof Entity)) {
            throw new Error("Parameter entity must be of type Entity");
        }
        entity.__deleted = true;
        await this.domain.__adapter.remove(this, { id: entity.__properties["id"] }, connection);
    }
    static getAll() {
        return new Query_1.Query(this);
    }
    static async getById(id, ...fields) {
        const entity = await this.domain.__adapter.select(this, fields || [], [{ field: "id", func: "=", arg: id }]);
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
    static reconstructFrom(data) {
        let entity = new this.constructor();
        for (let field in data) {
            if (data.hasOwnProperty(field)) {
                entity[field] = data[field];
            }
        }
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
        if (Object.getOwnPropertyNames(this.__changedProps).length === 0) {
            return;
        }
        const id = this.__properties["id"];
        if (!id) {
            throw new Error("You can't update entity without id");
        }
        const changedData = this.__changedProps;
        if (Object.getOwnPropertyNames(changedData).length === 0)
            return;
        await Entity.domain.__adapter.update(this.constructor, changedData, { id: id }, connection);
        this.storeChanges();
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
    mapFrom(data) {
        for (let field in data) {
            if (data.hasOwnProperty(field)) {
                if (this[field] !== data[field] && field != "id") {
                    this.__changedProps[field] = data[field];
                }
            }
        }
        return this;
    }
    getChangedVirtuals() {
        const desc = this.constructor._description;
        const rtrn = {}, chp = this.__changedProps;
        for (let p in chp) {
            if (chp.hasOwnProperty(p) && desc[p].description.withForeign) {
                rtrn[p] = chp[p];
            }
        }
        return rtrn;
    }
}
Entity.domain = null;
Entity._description = {
    id: new NumberType_1.NumberType().primary().autoIncrement()
};
exports.default = Entity;
