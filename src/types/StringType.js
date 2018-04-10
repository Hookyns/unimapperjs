"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtendedType_1 = require("../ExtendedType");
// noinspection JSUnusedGlobalSymbols
/**
 * String type class
 * @class
 */
class StringType extends ExtendedType_1.ExtendedType {
    //<editor-fold desc="Ctor">
    // noinspection JSUnusedGlobalSymbols
    constructor() {
        super(ExtendedType_1.ExtendedType.Types.String);
        // String default length 255
        this.description.length = 255;
    }
}
exports.StringType = StringType;
//# sourceMappingURL=StringType.js.map