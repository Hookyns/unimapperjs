/**
 * Type description Interface
 */
export interface ITypeDescription {
    type: string;
    nullable: boolean;
    length?: number;
    decimals?: number;
    primary: boolean;
    unique: boolean;
    autoIncrement: boolean;
    "default": any;
    foreignEntity?: string;
    hasMany?: string;
    withForeign?: string;
}
/**
 * Base Type class describing data type of entity field
 * @class
 */
export declare abstract class Type<T> {
    /**
     * Store type description structure
     * @type {ITypeDescription}
     */
    protected description: ITypeDescription;
    /**
     * List of available data types
     * @returns {{String: string, Number: string, Boolean: string, Date: string, Uuid: string}}
     */
    static readonly Types: {
        String: string;
        Number: string;
        Boolean: string;
        Date: string;
        Uuid: string;
        Virtual: string;
    };
    protected constructor(type: string);
    /**
     * Get Type description
     * @returns {ITypeDescription}
     */
    getDescription(): ITypeDescription;
}
