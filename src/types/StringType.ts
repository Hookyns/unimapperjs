import {ExtendedType} from "../ExtendedType";

// noinspection JSUnusedGlobalSymbols
/**
 * String type class
 * @class
 */
export class StringType extends ExtendedType<StringType> {

    //<editor-fold desc="Ctor">

    // noinspection JSUnusedGlobalSymbols
    constructor() {
        super(ExtendedType.Types.String);

        // String default length 255
        this.description.length = 255;
    }

    //</editor-fold>

    //<editor-fold desc="Public Properties">


    //</editor-fold>
}