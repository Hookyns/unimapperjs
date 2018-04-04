"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtendedType_1 = require("../ExtendedType");
const uuid = require("uuid/v1");
class UuidType extends ExtendedType_1.ExtendedType {
    constructor() {
        super(ExtendedType_1.ExtendedType.Types.String);
        this.description.primary = true;
        this.description.length = 37;
        this.description.default = function () {
            return uuid();
        };
    }
    notPrimary() {
        this.description.primary = false;
        return this;
    }
}
exports.UuidType = UuidType;
//# sourceMappingURL=UuidType.js.map