import Entity from "./Entity";
import { Domain } from "./Domain";
export declare class UnitOfWork {
    private __changesSaved;
    private __changedEntities;
    private __domains;
    constructor();
    static create(callback: any): Promise<void>;
    insert(entity: Entity<any>): Promise<void>;
    update(entity: Entity<any>): Promise<void>;
    remove(entity: Entity<any>): Promise<void>;
    saveChanges(): Promise<void>;
    private rollbackChanges();
    private commitChanges();
    createTransaction(domain: Domain): Promise<void>;
    getConnection(domain: Domain): any;
}
