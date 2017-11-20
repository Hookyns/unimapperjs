"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
const NumberType_1 = require("./types/NumberType");
class Entity {
    constructor(idType = null) {
        this.__changedProperties = [];
        this.__deleted = false;
        if (idType !== null)
            this.constructor._description.id = idType;
        const defaultData = this.getDefaultValues();
        for (let p in defaultData) {
            if (defaultData.hasOwnProperty(p)) {
                this[p] = defaultData[p]();
            }
        }
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
        await this.domain.__adapter.insert(entity, entity.__properties, connection);
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
        if (this.__changedProperties.length === 0) {
            return;
        }
        if (!~~this.__properties["id"]) {
            throw new Error("You can't update entity without id");
        }
        const data = {};
        for (let field of this.__changedProperties) {
            data[field] = this.__properties[field];
        }
        await Entity.domain.__adapter.update(this.constructor, data, { id: this.__properties["id"] }, connection);
    }
    mapFrom(data) {
        for (let field in data) {
            if (data.hasOwnProperty(field)) {
                if (this[field] !== data[field] && field != "id") {
                    this.__changedProperties.push(field);
                }
                this[field] = data[field];
            }
        }
        return this;
    }
    getDefaultValues() {
        const ctor = this.constructor;
        console.log(ctor, ctor._description);
        if (ctor._defaultData) {
            return ctor._defaultData;
        }
        const defaultData = {};
        const properties = ctor._description;
        for (let prop in properties) {
            if (properties.hasOwnProperty(prop)) {
                let defVal = properties[prop].getDescription().default;
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
Entity.domain = null;
Entity._description = {
    id: new NumberType_1.NumberType().primary().autoIncrement()
};
exports.default = Entity;
