"use strict";

import Entity from "./Entity";
import {Domain} from "./Domain";

/**
 * List of domains with started transactions
 * @type {Array<Domain>}
 */
const domains = [];

/**
 * List of connections from domains -> paired 1:1 to this.__domains
 * @type {Array}
 */
const connections = [];

export class UnitOfWork {

    /**
	 * True if user saved changes
     * @private
	 * @ignore
     */
	private __changesSaved: boolean = false;

    /**
	 * List of changed entities
     * @type {Array}
     * @private
	 * @ignore
     */
	private __changedEntities: Array<Entity<any>> = [];

    /**
	 * List of domains with started transactions
     * @type {Array}
     * @private
     * @ignore
     */
	private __domains: Array<Domain> = [];

	//<editor-fold desc="Ctor">

	constructor() {
		if (new.target != Activator) {
			throw new Error("This constructor is private");
		}
	}

	//</editor-fold>

	//<editor-fold desc="Static Methods">

	// noinspection JSUnusedGlobalSymbols
    /**
	 * Create unit of work
	 * @param callback
	 */
	static async create(callback) {
		if (!(callback instanceof Promise) && callback.constructor.name != "AsyncFunction") {
			throw new Error("Transaction block (callback) must be async function.");
		}

		// Create UoW
		const uow: UnitOfWork = Reflect.construct(UnitOfWork, [], Activator);

		// Call uow block and wait till end
		try {
			await callback(uow);

			// Check if saveChanges() was called, call rollback if not
			if (!uow.__changesSaved) await uow.rollbackChanges();
			else await uow.commitChanges();
		} catch (e) {
			await uow.rollbackChanges();
			throw e;
		}
	}

//</editor-fold>

	//<editor-fold desc="Public Methods">

    /**
	 * Insert new entity
     * @param {Entity<any>} entity
     * @returns {Promise<void>}
     */
	async insert(entity: Entity<any>) {
		const domain = (<typeof Entity>entity.constructor).domain;
        await this.createTransaction(domain); // Create transaction if not started in given domain yet
		const conn = this.getConnection(domain);
		await (<typeof Entity>entity.constructor).insert(entity, conn);
	}

    // noinspection JSUnusedGlobalSymbols
    /**
	 * Update given entity
     * @param {Entity<any>} entity
     * @returns {Promise<void>}
     */
	async update(entity: Entity<any>) {
        this.__changedEntities.push(entity);
        const domain = (<typeof Entity>entity.constructor).domain;
        await this.createTransaction(domain); // Create transaction if not started in given domain yet
        const conn = this.getConnection(domain);
		await entity.save(conn);
        this.__changedEntities = [];
	}

    // noinspection JSUnusedGlobalSymbols
    /**
	 * Remove entity from repository
     * @param {Entity<any>} entity
     * @returns {Promise<void>}
     */
	async remove(entity: Entity<any>) {
		const entCtrl: typeof Entity = <any>entity.constructor;
        const domain = entCtrl.domain;
        await this.createTransaction(domain); // Create transaction if not started in given domain yet
        const conn = this.getConnection(domain);
        await entCtrl.remove(entity, conn);
	}

    // noinspection JSUnusedGlobalSymbols
    /**
	 * Save your changes
     * @returns {Promise<void>}
     */
	async saveChanges() {
		this.__changesSaved = true;
	}

	//</editor-fold>

	//<editor-fold desc="Private Methods">

    /**
	 * Rollback changes updated with this UoW
     * @returns {Promise<void>}
     */
	private async rollbackChanges() {
        const domains = this.__domains;

        // Call rolback on storage
        for (let d = 0; d < domains.length; d++) {
            await (<any>domains[d]).__adapter.rollback(connections[d]);
        }

        // Rollback changes on entities
		for (let e of this.__changedEntities) {
			(<any>e).__changedProps = {};
		}
	}

    /**
	 * Commit changes
     * @returns {Promise<void>}
     */
    private async commitChanges() {
        const domains = this.__domains;

        for (let d = 0; d < domains.length; d++) {
            await (<any>domains[d]).__adapter.commit(connections[d]);
        }
    }

	/**
	 * Create transaction and store entity domain and transaction connection
	 * @private
	 * @ignore
	 * @param {Domain} domain
	 */
	async createTransaction(domain: Domain) {
        const domains = this.__domains;

		if (domains.indexOf(domain) == -1) {
			const adapter = (<any>domain).__adapter;
			const conn = await adapter.getConnection();
			await adapter.startTransaction(conn);

			domains.push(domain);
			connections.push(conn);
		}
	}

	/**
	 * Return connection for given domain
	 * @param {Domain} domain
	 * @returns {*}
	 */
	getConnection(domain: Domain) {
		let i;
        const domains = this.__domains;

		if ((i = domains.indexOf(domain)) != -1) {
			return connections[i];
		}

		throw new Error("No connection stored for this domain yet");
	}

	//</editor-fold>

}

class Activator extends UnitOfWork {}