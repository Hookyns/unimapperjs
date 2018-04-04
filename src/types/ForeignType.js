"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Type_1 = require("../Type");
const member_expression_1 = require("../member-expression");
class ForeignType extends Type_1.Type {
    constructor(entity) {
        super(ForeignType.Types.Virtual);
        if (typeof entity !== "string") {
            throw new Error("Parameter 'entity' must be string name of foreign Entity.");
        }
        this.description.foreignEntity = entity;
        this.description.withForeign = null;
        this.description.hasMany = null;
    }
    withForeign(field) {
        if (field.constructor === Function) {
            return this.withForeign(member_expression_1.memberExression(field));
        }
        if (this.description.hasMany) {
            throw new Error("withForeign() cannot be used with hasMany()");
        }
        if (typeof field !== "string") {
            throw new Error("Parameter 'field' must be string name of field holding foreign key to foreign entity.");
        }
        this.description.withForeign = field;
        return this;
    }
    hasMany(foreignField) {
        if (foreignField.constructor === Function) {
            return this.hasMany(member_expression_1.memberExression(foreignField));
        }
        if (this.description.withForeign) {
            throw new Error("hasMany cannot be used with withForeign()");
        }
        if (typeof foreignField !== "string") {
            throw new Error("Parameter 'foreignField' must be (string name of/expression pointing to) foreign entity's field holding key to this entity.");
        }
        this.description.hasMany = foreignField;
        return this;
    }
}
exports.ForeignType = ForeignType;
//# sourceMappingURL=ForeignType.js.map