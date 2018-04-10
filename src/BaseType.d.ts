import { Type } from "./Type";
/**
 * Base type class describing data type of entity field
 * @class
 */
export declare class BaseType<T> extends Type<T> {
    constructor(type: string);
    /**
     * Mark field as nullable
     */
    nullable(): T;
    /**
     * Set default value
     * @param value
     */
    default(value: any): T;
}
