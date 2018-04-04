"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtendedType_1 = require("../ExtendedType");
class NumberType extends ExtendedType_1.ExtendedType {
    constructor() {
        super(ExtendedType_1.ExtendedType.Types.Number);
        this.description.length = 11;
    }
    autoIncrement() {
        if (this.description.decimals > 0) {
            throw new Error("Number type with decimals cannot be auto-incremented");
        }
        this.description.autoIncrement = true;
        return this;
    }
    decimals(decimals) {
        if (this.description.autoIncrement) {
            throw new Error("Auto-incrementing Number type cannot have decimals");
        }
        if (decimals < 0) {
            throw new Error("Decimal parameter must be greater then or equal to 0");
        }
        this.description.decimals = decimals;
        return this;
    }
}
exports.NumberType = NumberType;
//# sourceMappingURL=NumberType.js.map