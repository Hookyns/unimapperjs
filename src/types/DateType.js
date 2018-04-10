"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtendedType_1 = require("../ExtendedType");
// noinspection JSUnusedGlobalSymbols
/**
 * Date type class
 * @class
 */
class DateType extends ExtendedType_1.ExtendedType {
    //<editor-fold desc="Ctor">
    // noinspection JSUnusedGlobalSymbols
    constructor() {
        super(ExtendedType_1.ExtendedType.Types.Date);
    }
    //</editor-fold>
    //<editor-fold desc="Public Properties">
    /**
     * Set default value to NOW - it means date and time when item created
     * @returns {DateType}
     */
    now() {
        return super.default(function () { return new Date(); });
    }
}
exports.DateType = DateType;
//# sourceMappingURL=DateType.js.map