import { Type } from "../Type";
export declare class ForeignType extends Type<ForeignType> {
    constructor(entity: string);
    withForeign(field: string): ForeignType;
    hasMany(foreignField: string): ForeignType;
}
