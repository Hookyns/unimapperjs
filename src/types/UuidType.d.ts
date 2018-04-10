import { ExtendedType } from "../ExtendedType";
/**
 * Uuid type class
 * @class
 */
export declare class UuidType extends ExtendedType<UuidType> {
    constructor();
    /**
     * Remove default PRIMARY mark
     * @returns {UuidType}
     */
    notPrimary(): UuidType;
}
