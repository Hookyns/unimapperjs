import { Type } from "../Type";
/**
 * Class for cpecifiing foreign virtual type
 */
export declare class ForeignType extends Type<ForeignType> {
    /**
     * @param {string} entity Name of foreign Entity
     */
    constructor(entity: string);
    /**
     * Setup real field on which foreign will be created.
     * It must be real existing field of type Number or Uuid.
     * @param {string} field
     * @returns {ForeignType}
     */
    withForeign<TEntity>(field: ((map: TEntity) => any) | string): ForeignType;
    /**
     * Setup foreign field by which will be related entities found
     * @param {string} foreignField
     * @return {ForeignType}
     */
    hasMany<TEntity>(foreignField: ((map: TEntity) => any) | string): ForeignType;
}
