import { ExtendedType } from "../ExtendedType";
export declare class NumberType extends ExtendedType<NumberType> {
    constructor();
    autoIncrement(): NumberType;
    decimals(decimals: number): NumberType;
}
