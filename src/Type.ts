/**
 * Type description Interface
 */
export interface ITypeDescription {
    type: string,
    nullable: boolean,
    length?: number,
    decimals?: number,
    primary: boolean,
    unique: boolean,
    autoIncrement: boolean,
    "default": any,
    foreignEntity?: string,
    hasMany?: string,
    withForeign?: string
}

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
export abstract class Type<T> {

    //<editor-fold desc="Fields">

    /**
     * Store type description structure
     * @type {ITypeDescription}
     */
    protected description: ITypeDescription = {
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

    //</editor-fold>

    //<editor-fold desc="Static Propeties">

    // noinspection JSUnusedGlobalSymbols
    /**
     * List of available data types
     * @returns {{String: string, Number: string, Boolean: string, Date: string, Uuid: string}}
     */
    static get Types(): { String: string, Number: string, Boolean: string, Date: string, Uuid: string, Virtual: string } {
        return FieldTypes;
    }

    //</editor-fold>

    //<editor-fold desc="Ctor">

    protected constructor(type: string) {
        if (!FieldTypes.hasOwnProperty(type)) {
            throw new Error("Unknown type '" + type +"'.");
        }

        this.description.type = type;
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
    getDescription(): ITypeDescription {
        return (<any>Object).assign({}, this.description);
    }

    //</editor-fold>
}