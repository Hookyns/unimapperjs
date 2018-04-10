import { Entity } from "./Entity";
export declare class UnitOfWork {
    /**
     * Was uow rolled back?
     * @type {boolean}
     */
    rolledBack: boolean;
    /**
     * True if user saved changes
     * @private
     * @ignore
     */
    private __changesSaved;
    /**
     * List of changed entities
     * @private
     * @ignore
     */
    private __touchedEntitiesMap;
    /**
     * UoW Symbol identifier
     * @private
     */
    private __symbol;
    /**
     * Parent Unit of Work if this is nested UoW
     */
    private __parentUnit;
    /**
     * @param {UnitOfWork} [parent]
     */
    constructor(parent?: UnitOfWork);
    /**
     * Create unit of work
     * @param callback
     */
    static create(callback: (uow: UnitOfWork) => void): Promise<UnitOfWork>;
    /**
     * Create nested UoW
     * @param {(uow: UnitOfWork) => void} callback
     * @returns {Promise<void>}
     */
    nest(callback: (uow: UnitOfWork) => void): Promise<UnitOfWork>;
    /**
     * Insert new entity
     * @param {Entity<{}>} entity
     */
    insert(entity: Entity<any>): void;
    /**
     * Update given entity
     * @param {Entity<{}>} entity
     */
    update(entity: Entity<any>): void;
    /**
     * Remove entity from repository
     * @param {Entity<{}>} entity
     */
    remove(entity: Entity<any>): void;
    /**
     * Save your changes
     * @returns {Promise<void>}
     */
    saveChanges(): Promise<void>;
    /**
     * Store current Entity state.
     * @description If rollback will be called, entity is going to be revert to the state which snap create.
     * @param {Entity<{}> | Array<Entity<{}>>} entity
     */
    snap(entity: Entity<any> | Array<Entity<any>>): void;
    /**
     * Add entity to list of touched entities
     * @param {Entity<{}>} entity
     */
    private touchEntity(entity);
    /**
     * Create entity state snapshot
     * @param {Entity<{}>} e
     * @param {boolean} preventOverride
     */
    private snapEntity(e, preventOverride?);
    /**
     * Rollback changes updated with this UoW
     * @returns {Promise<void>}
     */
    private rollbackChanges();
    /**
     * Commit changes
     * @returns {Promise<void>}
     */
    private commitChanges();
    /**
     * Reset UoW state, same as creating new UoW
     */
    private reset();
}
