"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseType_1 = require("./BaseType");
class ExtendedType extends BaseType_1.BaseType {
    constructor(type) {
        super(type);
    }
    unique() {
        this.description.unique = true;
        return this;
    }
    primary() {
        this.description.primary = true;
        return this;
    }
    length(length) {
        this.description.length = ~~length;
        return this;
    }
}
exports.ExtendedType = ExtendedType;
//# sourceMappingURL=ExtendedType.js.map