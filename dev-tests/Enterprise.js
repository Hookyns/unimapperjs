"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const domain = require("./domain.js");
const Entity_1 = require("../src/Entity");
class Enterprise extends Entity_1.default {
    constructor() {
        super(index_1.type.number);
        this.name = index_1.type.string.length(150);
        this.created = index_1.type.date.now();
        this.deleted = index_1.type.boolean.default(false);
    }
    static seed() {
        return [
            new Enterprise().mapFrom({ name: "Fukushima", created: new Date("2017-10-10") })
        ];
    }
}
exports.Enterprise = Enterprise;
domain.registerEntity(Enterprise);
