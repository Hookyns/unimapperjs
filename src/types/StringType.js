"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtendedType_1 = require("../ExtendedType");
class StringType extends ExtendedType_1.ExtendedType {
    constructor() {
        super(ExtendedType_1.ExtendedType.Types.String);
        this.description.length = 255;
    }
}
exports.StringType = StringType;
//# sourceMappingURL=StringType.js.map