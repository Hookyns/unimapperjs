"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtendedType_1 = require("../ExtendedType");
class DateType extends ExtendedType_1.ExtendedType {
    constructor() {
        super(ExtendedType_1.ExtendedType.Types.Date);
    }
    now() {
        return super.default(function () { return new Date(); });
    }
}
exports.DateType = DateType;
//# sourceMappingURL=DateType.js.map