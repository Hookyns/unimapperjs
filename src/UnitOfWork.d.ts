import { Entity } from "./Entity";
export declare class UnitOfWork {
    rolledBack: boolean;
    private __changesSaved;
    private __touchedEntitiesMap;
    private __symbol;
    private __parentUnit;
    constructor(parent?: UnitOfWork);
    static create(callback: (uow: UnitOfWork) => void): Promise<UnitOfWork>;
    nest(callback: (uow: UnitOfWork) => void): Promise<UnitOfWork>;
    insert(entity: Entity<any>): Promise<void>;
    update(entity: Entity<any>): Promise<void>;
    remove(entity: Entity<any>): Promise<void>;
    saveChanges(): Promise<void>;
    snap(entity: Entity<any> | Array<Entity<any>>): void;
    private touchEntity(entity);
    private snapEntity(e, preventOverride?);
    private rollbackChanges();
    private commitChanges();
    private reset();
}
