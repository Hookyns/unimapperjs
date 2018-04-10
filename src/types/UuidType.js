"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtendedType_1 = require("../ExtendedType");
const uuid = require("uuid/v1");
// noinspection JSUnusedGlobalSymbols
/**
 * Uuid type class
 * @class
 */
class UuidType extends ExtendedType_1.ExtendedType {
    //<editor-fold desc="Ctor">
    // noinspection JSUnusedGlobalSymbols
    constructor() {
        super(ExtendedType_1.ExtendedType.Types.String);
        this.description.primary = true;
        this.description.length = 37;
        this.description.default = function () {
            return uuid();
        };
    }
    //</editor-fold>
    //<editor-fold desc="Public Properties">
    // noinspection JSUnusedGlobalSymbols
    /**
     * Remove default PRIMARY mark
     * @returns {UuidType}
     */
    notPrimary() {
        this.description.primary = false;
        return this;
    }
}
exports.UuidType = UuidType;
//# sourceMappingURL=UuidType.js.map