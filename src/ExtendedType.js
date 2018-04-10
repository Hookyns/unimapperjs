"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseType_1 = require("./BaseType");
// noinspection JSUnusedGlobalSymbols
/**
 * Extended type class describing data type of entity field
 * @class
 */
class ExtendedType extends BaseType_1.BaseType {
    //<editor-fold desc="Ctor">
    constructor(type) {
        super(type);
    }
    //</editor-fold>
    //<editor-fold desc="Public Methods">
    // noinspection JSUnusedGlobalSymbols, JSValidateJSDoc
    /**
     * Mark field as unique
     */
    unique() {
        this.description.unique = true;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols, JSValidateJSDoc
    /**
     * Mark field as primary
     */
    primary() {
        this.description.primary = true;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols, JSValidateJSDoc
    /**
     * Set length
     * @param length
     */
    length(length) {
        this.description.length = ~~length;
        return this;
    }
}
exports.ExtendedType = ExtendedType;
//# sourceMappingURL=ExtendedType.js.map