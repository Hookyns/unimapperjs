import { BaseType } from "./BaseType";
/**
 * Extended type class describing data type of entity field
 * @class
 */
export declare class ExtendedType<T> extends BaseType<T> {
    constructor(type: string);
    /**
     * Mark field as unique
     */
    unique(): T;
    /**
     * Mark field as primary
     */
    primary(): T;
    /**
     * Set length
     * @param length
     */
    length(length: any): T;
}
