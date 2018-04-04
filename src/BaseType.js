"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Type_1 = require("./Type");
class BaseType extends Type_1.Type {
    constructor(type) {
        super(type);
    }
    nullable() {
        this.description.nullable = true;
        return this;
    }
    default(value) {
        this.description.default = value;
        return this;
    }
}
exports.BaseType = BaseType;
//# sourceMappingURL=BaseType.js.map