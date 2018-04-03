import { Entity } from "./Entity";
export declare class UnitOfWork {
    private __changesSaved;
    private __touchedEntitiesMap;
    private __domains;
    private __symbol;
    constructor();
    static create(callback: (uow: UnitOfWork) => void): Promise<void>;
    insert(entity: Entity<any>): Promise<void>;
    update(entity: Entity<any>): Promise<void>;
    remove(entity: Entity<any>): Promise<void>;
    saveChanges(): Promise<void>;
    snap(entity: Entity<any> | Array<Entity<any>>): void;
    private touchEntity(entity);
    private snapEntity(e);
    private rollbackChanges();
    private reset();
    private commitChanges();
    private createTransaction(domain);
    private getConnection(domain);
}
