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
export declare abstract class Type<T> {
    protected description: ITypeDescription;
    static readonly Types: {
        String: string;
        Number: string;
        Boolean: string;
        Date: string;
        Uuid: string;
        Virtual: string;
    };
    protected constructor(type: string);
    getDescription(): ITypeDescription;
}
