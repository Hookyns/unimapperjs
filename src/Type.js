"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FieldTypes = {
    String: "String",
    Number: "Number",
    Boolean: "Boolean",
    Date: "Date",
    Uuid: "Uuid",
    Virtual: "Virtual"
};
class Type {
    constructor(type) {
        this.description = {
            type: null,
            nullable: false,
            length: null,
            decimals: null,
            primary: false,
            unique: false,
            autoIncrement: false,
            "default": null,
            foreignEntity: null,
            withForeign: null,
            hasMany: null
        };
        if (!FieldTypes.hasOwnProperty(type)) {
            throw new Error("Unknown type '" + type + "'.");
        }
        this.description.type = type;
    }
    static get Types() {
        return FieldTypes;
    }
    getDescription() {
        return Object.assign({}, this.description);
    }
}
exports.Type = Type;
//# sourceMappingURL=Type.js.map