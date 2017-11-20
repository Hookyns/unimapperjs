"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domains = [];
const connections = [];
class UnitOfWork {
    constructor() {
        this.__changesSaved = false;
        if (new.target != Activator) {
            throw new Error("This constructor is private");
        }
        this.__changesSaved = false;
    }
    static async create(callback) {
        if (!(callback instanceof Promise) && callback.constructor.name != "AsyncFunction") {
            throw new Error("Transaction block (callback) must be async function.");
        }
        const uow = Reflect.construct(UnitOfWork, [], Activator);
        try {
            await callback(uow);
            if (!uow.__changesSaved) {
                for (let d = 0; d < domains.length; d++) {
                    await domains[d].__adapter.rollback(connections[d]);
                }
            }
            else {
                for (let d = 0; d < domains.length; d++) {
                    await domains[d].__adapter.commit(connections[d]);
                }
            }
        }
        catch (e) {
            for (let d = 0; d < domains.length; d++) {
                await domains[d].__adapter.rollback(connections[d]);
            }
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
    }
    async remove(entity) {
    }
    async saveChanges() {
        this.__changesSaved = true;
    }
    async createTransaction(domain) {
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
        if ((i = domains.indexOf(domain)) != -1) {
            return connections[i];
        }
        throw new Error("No connection stored for this domain yet");
    }
}
class Activator extends UnitOfWork {
}
module.exports = UnitOfWork;
