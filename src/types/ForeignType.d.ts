import { Type } from "../Type";
export declare class ForeignType extends Type<ForeignType> {
    constructor(entity: string);
    withForeign<TEntity>(field: ((map: TEntity) => any) | string): ForeignType;
    hasMany<TEntity>(foreignField: ((map: TEntity) => any) | string): ForeignType;
}
