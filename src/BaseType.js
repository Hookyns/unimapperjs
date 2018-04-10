"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Type_1 = require("./Type");
// noinspection JSUnusedGlobalSymbols
/**
 * Base type class describing data type of entity field
 * @class
 */
class BaseType extends Type_1.Type {
    //<editor-fold desc="Ctor">
    // noinspection JSUnusedGlobalSymbols
    constructor(type) {
        super(type);
    }
    //</editor-fold>
    //<editor-fold desc="Public Methods">
    // noinspection JSUnusedGlobalSymbols, JSValidateJSDoc
    /**
     * Mark field as nullable
     */
    nullable() {
        this.description.nullable = true;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols, ReservedWordAsName, JSValidateJSDoc
    /**
     * Set default value
     * @param value
     */
    default(value) {
        this.description.default = value;
        return this;
    }
}
exports.BaseType = BaseType;
//# sourceMappingURL=BaseType.js.map