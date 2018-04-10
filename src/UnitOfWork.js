"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UnitOfWork {
    //endregion
    //region Ctor
    /**
     * @param {UnitOfWork} [parent]
     */
    constructor(parent = undefined) {
        //region Fields
        /**
         * Was uow rolled back?
         * @type {boolean}
         */
        this.rolledBack = false;
        /**
         * True if user saved changes
         * @private
         * @ignore
         */
        this.__changesSaved = false;
        /**
         * List of changed entities
         * @private
         * @ignore
         */
        this.__touchedEntitiesMap = {};
        /**
         * UoW Symbol identifier
         * @private
         */
        this.__symbol = Symbol("Unit of Work");
        if (new.target != Activator) {
            throw new Error("This constructor is private");
        }
        this.__parentUnit = parent;
    }
    //endregion
    //region Static methods
    // noinspection JSUnusedGlobalSymbols
    /**
     * Create unit of work
     * @param callback
     */
    static async create(callback) {
        if (callback.constructor.name != "AsyncFunction") {
            throw new Error("Unit of work block (callback) must be async function (returning promise).");
        }
        // Create UoW
        const uow = Reflect.construct(UnitOfWork, [], Activator);
        try {
            // Call uow block and wait till end
            await callback(uow);
            // Check if saveChanges() was called, call rollback if not
            if (!uow.__changesSaved) {
                await uow.rollbackChanges();
            }
            else {
                await uow.commitChanges();
            }
            return uow;
        }
        catch (e) {
            await uow.rollbackChanges();
            throw e;
        }
    }
    //endregion
    //region Public methods
    // noinspection JSUnusedGlobalSymbols
    /**
     * Create nested UoW
     * @param {(uow: UnitOfWork) => void} callback
     * @returns {Promise<void>}
     */
    async nest(callback) {
        if (callback.constructor.name != "AsyncFunction") {
            throw new Error("Unit of work block (callback) must be async function (returning promise).");
        }
        // Create nested UoW
        const uow = Reflect.construct(UnitOfWork, [this], Activator);
        try {
            // Call uow block and wait till end
            await callback(uow);
            // Check if saveChanges() was called, call rollback if not
            if (!uow.__changesSaved) {
                await uow.rollbackChanges();
            }
            else {
                await uow.commitChanges();
            }
            return uow;
        }
        catch (e) {
            await uow.rollbackChanges();
            throw e;
        }
    }
    /**
     * Insert new entity
     * @param {Entity<{}>} entity
     */
    insert(entity) {
        this.snapEntity(entity, true);
        if (!entity.__isNew)
            console.warn("Entity is not marked as NEW but nsert is requested", entity);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Update given entity
     * @param {Entity<{}>} entity
     */
    update(entity) {
        this.snapEntity(entity, true);
        if (!entity.__isDirty)
            console.warn("Entity is not marked as NEW but nsert is requested", entity);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Remove entity from repository
     * @param {Entity<{}>} entity
     */
    remove(entity) {
        this.touchEntity(entity);
        entity.__isRemoved = true;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Save your changes
     * @returns {Promise<void>}
     */
    async saveChanges() {
        this.__changesSaved = true;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Store current Entity state.
     * @description If rollback will be called, entity is going to be revert to the state which snap create.
     * @param {Entity<{}> | Array<Entity<{}>>} entity
     */
    snap(entity) {
        if (entity.constructor === Array) {
            let e;
            for (e of entity) {
                this.snapEntity(e);
            }
        }
        else {
            this.snapEntity(entity);
        }
    }
    //endregion
    //region Private methods
    /**
     * Add entity to list of touched entities
     * @param {Entity<{}>} entity
     */
    touchEntity(entity) {
        this.__touchedEntitiesMap[entity.__symbol] = entity;
    }
    /**
     * Create entity state snapshot
     * @param {Entity<{}>} e
     * @param {boolean} preventOverride
     */
    snapEntity(e, preventOverride = false) {
        if (!preventOverride || !e.__snaps[this.__symbol]) {
            e.__snaps[this.__symbol] = {
                __changedProps: Object.assign({}, e.__changedProps),
                __properties: Object.assign({}, e.__properties)
            };
        }
        this.touchEntity(e);
    }
    /**
     * Rollback changes updated with this UoW
     * @returns {Promise<void>}
     */
    async rollbackChanges() {
        // Rollback changes on entities
        let entity, snap;
        let symbols = Object.getOwnPropertySymbols(this.__touchedEntitiesMap);
        for (let i = symbols.length - 1; i >= 0; i--) {
            entity = this.__touchedEntitiesMap[symbols[i]];
            // Find snap if exists
            snap = entity.__snaps[this.__symbol] || {
                __changedProps: {}
            }; // snap for this UoW
            entity.__changedProps = snap.__changedProps;
            if (snap.__properties)
                entity.__properties = snap.__properties;
        }
        this.rolledBack = true;
        this.reset();
    }
    /**
     * Commit changes
     * @returns {Promise<void>}
     */
    async commitChanges() {
        // If this is nested UoW, move changes up
        if (this.__parentUnit) {
            // Concat touched entities
            this.__parentUnit.__touchedEntitiesMap = Object.assign(this.__parentUnit.__touchedEntitiesMap, this.__touchedEntitiesMap);
            return;
        }
        const domains = {};
        let touched = this.__touchedEntitiesMap;
        // Iterate through touched entities and find unique domains and start transacions for them
        let symbols = Object.getOwnPropertySymbols(touched);
        let domain, adapter, conn, ctor, domainItem, entity;
        for (let i = symbols.length - 1; i >= 0; i--) {
            entity = touched[symbols[i]];
            ctor = entity.constructor;
            domain = ctor.domain;
            domainItem = domains[domain.__symbol];
            if (!domainItem) {
                adapter = domain.__adapter;
                conn = await adapter.getConnection();
                domains[domain.__symbol] = domainItem = [adapter, conn];
                await adapter.startTransaction(conn);
            }
            if (entity.__isRemoved) {
                await ctor.remove(entity, domainItem[1]);
            }
            else if (entity.__isNew) {
                await ctor.insert(entity, domainItem[1]);
            }
            else if (entity.__isDirty) {
                await entity.save(domainItem[1]);
            }
        }
        // Commit changes
        symbols = Object.getOwnPropertySymbols(domains);
        for (let i = symbols.length - 1; i >= 0; i--) {
            domainItem = domains[symbols[i]];
            domainItem[0].commit(domainItem[1]);
        }
    }
    /**
     * Reset UoW state, same as creating new UoW
     */
    reset() {
        this.__touchedEntitiesMap = {};
        this.__changesSaved = false;
    }
}
exports.UnitOfWork = UnitOfWork;
class Activator extends UnitOfWork {
}
//# sourceMappingURL=UnitOfWork.js.map