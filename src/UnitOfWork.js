"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domains = [];
const connections = [];
class UnitOfWork {
    constructor() {
        this.__changesSaved = false;
        this.__changedEntities = [];
        this.__domains = [];
        if (new.target != Activator) {
            throw new Error("This constructor is private");
        }
    }
    static async create(callback) {
        if (!(callback instanceof Promise) && callback.constructor.name != "AsyncFunction") {
            throw new Error("Transaction block (callback) must be async function.");
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
        const domain = entity.constructor.domain;
        await this.createTransaction(domain);
        const conn = this.getConnection(domain);
        await entity.constructor.insert(entity, conn);
    }
    async update(entity) {
        this.__changedEntities.push(entity);
        const domain = entity.constructor.domain;
        await this.createTransaction(domain);
        const conn = this.getConnection(domain);
        await entity.save(conn);
        this.__changedEntities = [];
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
    async rollbackChanges() {
        const domains = this.__domains;
        for (let d = 0; d < domains.length; d++) {
            await domains[d].__adapter.rollback(connections[d]);
        }
        for (let e of this.__changedEntities) {
            e.__changedProps = {};
        }
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