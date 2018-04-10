import { ExtendedType } from "../ExtendedType";
/**
 * Date type class
 * @class
 */
export declare class DateType extends ExtendedType<DateType> {
    constructor();
    /**
     * Set default value to NOW - it means date and time when item created
     * @returns {DateType}
     */
    now(): DateType;
}
