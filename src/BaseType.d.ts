import { Type } from "./Type";
export declare class BaseType<T> extends Type<T> {
    constructor(type: string);
    nullable(): T;
    default(value: any): T;
}
