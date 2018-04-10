import { ExtendedType } from "../ExtendedType";
/**
 * Number type class
 * @class
 */
export declare class NumberType extends ExtendedType<NumberType> {
    constructor();
    /**
     * Enable auto incrementing
     * @returns {NumberType}
     */
    autoIncrement(): NumberType;
    /**
     * Set number of decimals - precision
     * @param {Number} decimals
     * @returns {NumberType}
     */
    decimals(decimals: number): NumberType;
}
