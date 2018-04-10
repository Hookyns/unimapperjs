"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// noinspection ES6ConvertVarToLetConst
const FieldTypes = {
    String: "String",
    Number: "Number",
    Boolean: "Boolean",
    Date: "Date",
    Uuid: "Uuid",
    Virtual: "Virtual" // Just for foreign properties
};
/**
 * Base Type class describing data type of entity field
 * @class
 */
class Type {
    //</editor-fold>
    //<editor-fold desc="Ctor">
    constructor(type) {
        //<editor-fold desc="Fields">
        /**
         * Store type description structure
         * @type {ITypeDescription}
         */
        this.description = {
            type: null,
            nullable: false,
            length: null,
            decimals: null,
            primary: false,
            unique: false,
            autoIncrement: false,
            "default": null,
            foreignEntity: null,
            withForeign: null,
            hasMany: null
        };
        if (!FieldTypes.hasOwnProperty(type)) {
            throw new Error("Unknown type '" + type + "'.");
        }
        this.description.type = type;
    }
    //</editor-fold>
    //<editor-fold desc="Static Propeties">
    // noinspection JSUnusedGlobalSymbols
    /**
     * List of available data types
     * @returns {{String: string, Number: string, Boolean: string, Date: string, Uuid: string}}
     */
    static get Types() {
        return FieldTypes;
    }
    //</editor-fold>
    //<editor-fold desc="Public Methods">
    //</editor-fold>
    //<editor-fold desc="Private Methods">
    // noinspection JSUnusedGlobalSymbols
    /**
     * Get Type description
     * @returns {ITypeDescription}
     */
    getDescription() {
        return Object.assign({}, this.description);
    }
}
exports.Type = Type;
//# sourceMappingURL=Type.js.map