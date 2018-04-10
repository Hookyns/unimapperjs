"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UnitOfWork {
    constructor(parent = undefined) {
        this.rolledBack = false;
        this.__changesSaved = false;
        this.__touchedEntitiesMap = {};
        this.__symbol = Symbol("Unit of Work");
        if (new.target != Activator) {
            throw new Error("This constructor is private");
        }
        this.__parentUnit = parent;
    }
    static async create(callback) {
        if (callback.constructor.name != "AsyncFunction") {
            throw new Error("Unit of work block (callback) must be async function (returning promise).");
        }
        const uow = Reflect.construct(UnitOfWork, [], Activator);
        try {
            await callback(uow);
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
    async nest(callback) {
        if (callback.constructor.name != "AsyncFunction") {
            throw new Error("Unit of work block (callback) must be async function (returning promise).");
        }
        const uow = Reflect.construct(UnitOfWork, [this], Activator);
        try {
            await callback(uow);
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
    insert(entity) {
        this.snapEntity(entity, true);
        if (!entity.__isNew)
            console.warn("Entity is not marked as NEW but nsert is requested", entity);
    }
    update(entity) {
        this.snapEntity(entity, true);
        if (!entity.__isDirty)
            console.warn("Entity is not marked as NEW but nsert is requested", entity);
    }
    remove(entity) {
        this.touchEntity(entity);
        entity.__isRemoved = true;
    }
    async saveChanges() {
        this.__changesSaved = true;
    }
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
    touchEntity(entity) {
        this.__touchedEntitiesMap[entity.__symbol] = entity;
    }
    snapEntity(e, preventOverride = false) {
        if (!preventOverride || !e.__snaps[this.__symbol]) {
            e.__snaps[this.__symbol] = {
                __changedProps: Object.assign({}, e.__changedProps),
                __properties: Object.assign({}, e.__properties)
            };
        }
        this.touchEntity(e);
    }
    async rollbackChanges() {
        let entity, snap;
        let symbols = Object.getOwnPropertySymbols(this.__touchedEntitiesMap);
        for (let i = symbols.length - 1; i >= 0; i--) {
            entity = this.__touchedEntitiesMap[symbols[i]];
            snap = entity.__snaps[this.__symbol] || {
                __changedProps: {}
            };
            entity.__changedProps = snap.__changedProps;
            if (snap.__properties)
                entity.__properties = snap.__properties;
        }
        this.rolledBack = true;
        this.reset();
    }
    async commitChanges() {
        const domains = {};
        let touched = this.__touchedEntitiesMap;
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
        symbols = Object.getOwnPropertySymbols(domains);
        for (let i = symbols.length - 1; i >= 0; i--) {
            domainItem = domains[symbols[i]];
            domainItem[0].commit(domainItem[1]);
        }
    }
    reset() {
        this.__touchedEntitiesMap = {};
        this.__changesSaved = false;
    }
}
exports.UnitOfWork = UnitOfWork;
class Activator extends UnitOfWork {
}
//# sourceMappingURL=UnitOfWork.js.map