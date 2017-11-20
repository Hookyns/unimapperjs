import { BaseType } from "./BaseType";
export declare class ExtendedType<T> extends BaseType<T> {
    constructor(type: string);
    unique(): T;
    primary(): T;
    length(length: any): T;
}
