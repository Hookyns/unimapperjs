"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connections = [];
class UnitOfWork {
    constructor() {
        this.__changesSaved = false;
        this.__touchedEntitiesMap = {};
        this.__domains = [];
        this.__symbol = Symbol("Unit of Work");
        if (new.target != Activator) {
            throw new Error("This constructor is private");
        }
    }
    static async create(callback) {
        if (!(callback instanceof Promise) && callback.constructor.name != "AsyncFunction") {
            throw new Error("Unit of work block (callback) must be async function.");
        }
        const uow = Reflect.construct(UnitOfWork, [], Activator);
        try {
            await callback(uow);
            if (!uow.__changesSaved)
                await uow.rollbackChanges();
            else
                await uow.commitChanges();
        }
        catch (e) {
            await uow.rollbackChanges();
            throw e;
        }
    }
    async insert(entity) {
        this.touchEntity(entity);
        const domain = entity.constructor.domain;
        await this.createTransaction(domain);
        const conn = this.getConnection(domain);
        await entity.constructor.insert(entity, conn);
    }
    async update(entity) {
        this.touchEntity(entity);
        const domain = entity.constructor.domain;
        await this.createTransaction(domain);
        const conn = this.getConnection(domain);
        await entity.save(conn);
    }
    async remove(entity) {
        const entCtrl = entity.constructor;
        const domain = entCtrl.domain;
        await this.createTransaction(domain);
        const conn = this.getConnection(domain);
        await entCtrl.remove(entity, conn);
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
    snapEntity(e) {
        e.__snaps[this.__symbol] = e.__changedProps;
        this.touchEntity(e);
    }
    async rollbackChanges() {
        const domains = this.__domains;
        for (let d = 0; d < domains.length; d++) {
            await domains[d].__adapter.rollback(connections[d]);
        }
        let entity;
        for (let e in this.__touchedEntitiesMap) {
            if (this.__touchedEntitiesMap.hasOwnProperty(e)) {
                entity = this.__touchedEntitiesMap[e];
                entity.__changedProps = entity.__snaps[this.__symbol] || {};
            }
        }
        this.reset();
    }
    reset() {
        this.__touchedEntitiesMap = {};
        this.__domains = [];
        this.__changesSaved = false;
    }
    async commitChanges() {
        const domains = this.__domains;
        for (let d = 0; d < domains.length; d++) {
            await domains[d].__adapter.commit(connections[d]);
        }
    }
    async createTransaction(domain) {
        const domains = this.__domains;
        if (domains.indexOf(domain) == -1) {
            const adapter = domain.__adapter;
            const conn = await adapter.getConnection();
            await adapter.startTransaction(conn);
            domains.push(domain);
            connections.push(conn);
        }
    }
    getConnection(domain) {
        let i;
        const domains = this.__domains;
        if ((i = domains.indexOf(domain)) != -1) {
            return connections[i];
        }
        throw new Error("No connection stored for this domain yet");
    }
}
exports.UnitOfWork = UnitOfWork;
class Activator extends UnitOfWork {
}
//# sourceMappingURL=UnitOfWork.js.map