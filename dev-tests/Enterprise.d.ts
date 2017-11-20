import Entity from "../src/Entity";
export declare class Enterprise extends Entity<Enterprise> {
    name: string;
    created: Date;
    deleted: Date;
    constructor();
    static seed(): Enterprise[];
}
