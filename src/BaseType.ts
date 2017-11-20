import {Type} from "./Type";

// noinspection JSUnusedGlobalSymbols
/**
 * Base type class describing data type of entity field
 * @class
 */
export class BaseType<T> extends Type<T> {

    //<editor-fold desc="Ctor">

    // noinspection JSUnusedGlobalSymbols
    constructor(type: string) {
        super(type);
    }

    //</editor-fold>

    //<editor-fold desc="Public Methods">

    // noinspection JSUnusedGlobalSymbols, JSValidateJSDoc
    /**
     * Mark field as nullable
     */
    nullable(): T {
        this.description.nullable = true;
        return <any>this;
    }

    // noinspection JSUnusedGlobalSymbols, ReservedWordAsName, JSValidateJSDoc
    /**
     * Set default value
     * @param value
     */
    default(value: any): T {
        this.description.default = value;
        return <any>this;
    }

    //</editor-fold>
}