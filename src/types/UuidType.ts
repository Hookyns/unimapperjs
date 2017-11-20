import {ExtendedType} from "../ExtendedType";
const uuid = require("uuid/v1");

// noinspection JSUnusedGlobalSymbols
/**
 * Uuid type class
 * @class
 */
export class UuidType extends ExtendedType<UuidType> {

    //<editor-fold desc="Ctor">

    // noinspection JSUnusedGlobalSymbols
    constructor() {
        super(ExtendedType.Types.String);

        this.description.primary = true;
        this.description.length = 37;
        this.description.default = function() {
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
    notPrimary(): UuidType {
        this.description.primary = false;
        return this;
    }

    //</editor-fold>

}