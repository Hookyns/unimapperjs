import {ExtendedType} from "../ExtendedType";

// noinspection JSUnusedGlobalSymbols
/**
 * Date type class
 * @class
 */
export class DateType extends ExtendedType<DateType> {

    //<editor-fold desc="Ctor">

    // noinspection JSUnusedGlobalSymbols
    constructor() {
        super(ExtendedType.Types.Date);
    }

    //</editor-fold>

    //<editor-fold desc="Public Properties">

    /**
     * Set default value to NOW - it means date and time when item created
     * @returns {DateType}
     */
    now(): DateType {
        return <DateType>super.default(function() { return new Date(); });
    }

    //</editor-fold>
}