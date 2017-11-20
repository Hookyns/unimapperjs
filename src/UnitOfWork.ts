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



class UnitOfWork {

    /**
	 * True if user saved changes
	 * @ignore
     */
	private __changesSaved: boolean = false;

	//<editor-fold desc="Ctor">

	constructor() {
		if (new.target != Activator) {
			throw new Error("This constructor is private");
		}

		// /**
		//  * List of domains with started transactions
		//  * @type {Array<Domain>}
		//  * @private
		//  * @ignore
		//  */
		// this.__domains = [];
		//
		// /**
		//  * List of connections from domains -> paired 1:1 to this.__domains
		//  * @type {Array}
		//  * @private
		//  */
		// this.__connections = [];

		this.__changesSaved = false;
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
		const uow = Reflect.construct(UnitOfWork, [], Activator);

		// Call uow block and wait till end
		try {
			await callback(uow);

			// Check if saveChanges() was called, call rollback if not
			if (!uow.__changesSaved) {
				for (let d = 0; d < domains.length; d++) {
					await domains[d].__adapter.rollback(connections[d]);
				}
			} else {
				for (let d = 0; d < domains.length; d++) {
					await domains[d].__adapter.commit(connections[d]);
				}
			}
		} catch (e) {
			// Call rolback
			for (let d = 0; d < domains.length; d++) {
				await domains[d].__adapter.rollback(connections[d]);
			}

			throw e;
		}
	}

	//</editor-fold>

	//<editor-fold desc="Public Methods">

	async insert(entity: Entity<any>) {
		const domain = (<typeof Entity>entity.constructor).domain;

		// Create transaction if not started in given domain yet
		await this.createTransaction(domain);
		const conn = this.getConnection(domain);
		await (<typeof Entity>entity.constructor).insert(entity, conn);
	}

	async update(entity) {

	}

	async remove(entity) {

	}

	async saveChanges() {
		this.__changesSaved = true;
	}

	//</editor-fold>

	//<editor-fold desc="Private Methods">

	/**
	 * Create transaction and store entity domain and transaction connection
	 * @private
	 * @ignore
	 * @param {Domain} domain
	 */
	async createTransaction(domain: Domain) {
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

		if ((i = domains.indexOf(domain)) != -1) {
			return connections[i];
		}

		throw new Error("No connection stored for this domain yet");
	}

	//</editor-fold>

}

class Activator extends UnitOfWork {}

module.exports = UnitOfWork;