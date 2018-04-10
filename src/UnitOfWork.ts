"use strict";

import {Entity} from "./Entity";
import {Domain} from "./Domain";

export class UnitOfWork
{
	//region Fields

	/**
	 * Was uow rolled back?
	 * @type {boolean}
	 */
	public rolledBack: boolean = false;

	/**
	 * True if user saved changes
	 * @private
	 * @ignore
	 */
	private __changesSaved: boolean = false;

	/**
	 * List of changed entities
	 * @private
	 * @ignore
	 */
	private __touchedEntitiesMap: { [key: string/*Symbol*/]: Entity<any> } = {};

	/**
	 * UoW Symbol identifier
	 * @private
	 */
	private __symbol: Symbol = Symbol("Unit of Work");

	/**
	 * Parent Unit of Work if this is nested UoW
	 */
	private __parentUnit: UnitOfWork;

	//endregion

	//region Ctor

	/**
	 * @param {UnitOfWork} [parent]
	 */
	constructor(parent: UnitOfWork = undefined)
	{
		if (new.target != Activator)
		{
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
	static async create(callback: (uow: UnitOfWork) => void): Promise<UnitOfWork>
	{
		if (callback.constructor.name != "AsyncFunction")
		{
			throw new Error("Unit of work block (callback) must be async function (returning promise).");
		}

		// Create UoW
		const uow: UnitOfWork = Reflect.construct(UnitOfWork, [], Activator);

		try
		{
			// Call uow block and wait till end
			await callback(uow);

			// Check if saveChanges() was called, call rollback if not
			if (!uow.__changesSaved)
			{
				await uow.rollbackChanges();
			}
			else
			{
				await uow.commitChanges();
			}

			return uow;
		}
		catch (e)
		{
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
	async nest(callback: (uow: UnitOfWork) => void): Promise<UnitOfWork>
	{
		if (callback.constructor.name != "AsyncFunction")
		{
			throw new Error("Unit of work block (callback) must be async function (returning promise).");
		}

		// Create nested UoW
		const uow: UnitOfWork = Reflect.construct(UnitOfWork, [this], Activator);

		try
		{
			// Call uow block and wait till end
			await callback(uow);

			// Check if saveChanges() was called, call rollback if not
			if (!uow.__changesSaved)
			{
				await uow.rollbackChanges();
			}
			else
			{
				await uow.commitChanges();
			}

			return uow;
		}
		catch (e)
		{
			await uow.rollbackChanges();
			throw e;
		}
	}

	/**
	 * Insert new entity
	 * @param {Entity<{}>} entity
	 * @returns {Promise<void>}
	 */
	async insert(entity: Entity<any>)
	{
		this.snapEntity(entity, true);
		if (!(<any>entity).__isNew) console.warn("Entity is not marked as NEW but nsert is requested", entity);
		// this.__insert.push(entity);
		// const domain = (<typeof Entity>entity.constructor).domain;
		// await this.createTransaction(domain); // Create transaction if not started in given domain yet
		// const conn = this.getConnection(domain);
		// await (<typeof Entity>entity.constructor).insert(entity, conn);
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Update given entity
	 * @param {Entity<{}>} entity
	 * @returns {Promise<void>}
	 */
	async update(entity: Entity<any>)
	{
		this.snapEntity(entity, true);
		if (!(<any>entity).__isDirty) console.warn("Entity is not marked as NEW but nsert is requested", entity);
		// this.__update.push(entity);
		// const domain = (<typeof Entity>entity.constructor).domain;
		// await this.createTransaction(domain); // Create transaction if not started in given domain yet
		// const conn = this.getConnection(domain);
		// await entity.save(conn);
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Remove entity from repository
	 * @param {Entity<{}>} entity
	 * @returns {Promise<void>}
	 */
	async remove(entity: Entity<any>)
	{
		this.touchEntity(entity);
		(<any>entity).__isRemoved = true;
		// this.__removed.push(entity);
		// const entCtrl: typeof Entity = <any>entity.constructor;
		// const domain = entCtrl.domain;
		// await this.createTransaction(domain); // Create transaction if not started in given domain yet
		// const conn = this.getConnection(domain);
		// await entCtrl.remove(entity, conn);
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Save your changes
	 * @returns {Promise<void>}
	 */
	async saveChanges()
	{
		this.__changesSaved = true;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Store current Entity state.
	 * @description If rollback will be called, entity is going to be revert to the state which snap create.
	 * @param {Entity<{}> | Array<Entity<{}>>} entity
	 */
	snap(entity: Entity<any> | Array<Entity<any>>)
	{
		if (entity.constructor === Array)
		{
			let e;
			for (e of <Array<Entity<any>>>entity)
			{
				this.snapEntity(e);
			}
		}
		else
		{
			this.snapEntity(<Entity<any>>entity);
		}
	}

	//endregion

	//region Private methods

	/**
	 * Add entity to list of touched entities
	 * @param {Entity<{}>} entity
	 */
	private touchEntity(entity: Entity<any>)
	{
		this.__touchedEntitiesMap[<string>(<any>entity).__symbol] = entity;
	}

	/**
	 * Create entity state snapshot
	 * @param {Entity<{}>} e
	 * @param {boolean} preventOverride
	 */
	private snapEntity(e: Entity<any>, preventOverride: boolean = false)
	{
		if (!preventOverride || !(<any>e).__snaps[<any>this.__symbol])
		{
			(<any>e).__snaps[<any>this.__symbol] = {
				__changedProps: Object.assign({}, (<any>e).__changedProps),
				__properties: Object.assign({}, (<any>e).__properties)
			};
		}
		this.touchEntity(e);
	}

	/**
	 * Rollback changes updated with this UoW
	 * @returns {Promise<void>}
	 */
	private async rollbackChanges()
	{
		// Rollback changes on entities
		let entity, snap;
		let symbols = Object.getOwnPropertySymbols(this.__touchedEntitiesMap);
		for (let i = symbols.length - 1; i >= 0; i--)
		{
			entity = this.__touchedEntitiesMap[symbols[i]];
			snap = (<any>entity).__snaps[<any>this.__symbol]; // snap for this UoW
			(<any>entity).__changedProps = snap.__changedProps;
			(<any>entity).__properties = snap.__properties;
		}

		this.rolledBack = true;
		this.reset();
	}

	/**
	 * Commit changes
	 * @returns {Promise<void>}
	 */
	private async commitChanges()
	{
		const domains = {};
		let touched = this.__touchedEntitiesMap;

		// Iterate through touched entities and find unique domains and start transacions for them
		let symbols = Object.getOwnPropertySymbols(touched);
		let domain, adapter, conn, ctor, domainItem, entity;

		for (let i = symbols.length - 1; i >= 0; i--)
		{
			entity = touched[symbols[i]];
			ctor = entity.constructor;
			domain = ctor.domain;
			domainItem = domains[domain.__symbol];

			if (!domainItem)
			{
				adapter = domain.__adapter;
				conn = await adapter.getConnection();
				domains[domain.__symbol] = domainItem = [adapter, conn];
				await adapter.startTransaction(conn);
			}

			if (entity.__isRemoved)
			{
				await ctor.remove(entity, domainItem[1]);
			}
			else if (entity.__isNew)
			{
				await ctor.insert(entity, domainItem[1]);
			}
			else if (entity.__isDirty)
			{
				await entity.save(domainItem[1]);
			}
		}

		// Commit changes
		symbols = Object.getOwnPropertySymbols(domains);

		for (let i = symbols.length - 1; i >= 0; i--)
		{
			domainItem = domains[symbols[i]];
			domainItem[0].commit(domainItem[1]);
		}
	}

	/**
	 * Reset UoW state, same as creating new UoW
	 */
	private reset()
	{
		this.__touchedEntitiesMap = {};
		this.__changesSaved = false;
	}

	//endregion
}

class Activator extends UnitOfWork
{
}