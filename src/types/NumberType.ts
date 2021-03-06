import {ExtendedType} from "../ExtendedType";

/**
 * Number type class
 * @class
 */
export class NumberType extends ExtendedType<NumberType> {

    //<editor-fold desc="Ctor">

    constructor() {
        super(ExtendedType.Types.Number);

        // Number default length 11
        this.description.length = 11; // => 4B - INTEGER
    }

    //</editor-fold>

    //<editor-fold desc="Public Properties">

    /**
     * Enable auto incrementing
     * @returns {NumberType}
     */
    autoIncrement(): NumberType {
        if (this.description.decimals > 0) {
            throw new Error("Number type with decimals cannot be auto-incremented");
        }

        this.description.autoIncrement = true;
        return this;
    }

    /**
     * Set number of decimals - precision
     * @param {Number} decimals
     * @returns {NumberType}
     */
    decimals(decimals: number): NumberType {
        if (this.description.autoIncrement) {
            throw new Error("Auto-incrementing Number type cannot have decimals");
        }

        if (decimals < 0) {
            throw new Error("Decimal parameter must be greater then or equal to 0");
        }

        this.description.decimals = decimals;
        return this;
    }

    //</editor-fold>
}