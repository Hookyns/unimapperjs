import {BaseType} from "./BaseType";

// noinspection JSUnusedGlobalSymbols
/**
 * Extended type class describing data type of entity field
 * @class
 */
export class ExtendedType<T> extends BaseType<T> {

    //<editor-fold desc="Ctor">

    constructor(type: string) {
        super(type);
    }

    //</editor-fold>

    //<editor-fold desc="Public Methods">

    // noinspection JSUnusedGlobalSymbols, JSValidateJSDoc
    /**
     * Mark field as unique
     */
    unique(): T {
        this.description.unique = true;
        return <any>this;
    }

    // noinspection JSUnusedGlobalSymbols, JSValidateJSDoc
    /**
     * Mark field as primary
     */
    primary(): T {
        this.description.primary = true;
        return <any>this;
    }

    // noinspection JSUnusedGlobalSymbols, JSValidateJSDoc
    /**
     * Set length
     * @param length
     */
    length(length): T {
        this.description.length = ~~length;
        return <any>this;
    }

    //</editor-fold>
}