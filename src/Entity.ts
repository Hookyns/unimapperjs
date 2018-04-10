import {Query} from "./Query";
import {Type} from "./Type";
import {Domain} from "./Domain";
import {NumberType} from "./types/NumberType";
import {WhereExpression} from "./WhereExpression";

// Name of field holding entity identifier
const ID_FIELD_NAME = "id";

/**
 * @class
 */
export abstract class Entity<TEntity extends Entity<any>>
{

	//region Fields

	/**
	 * Entity identifier
	 * @see ID_FIELD_NAME
	 */
	abstract id: any;

	/**
	 * Entity domain - set when entity created
	 */
	static domain: Domain = null;

	/**
	 * Entity description - set when entity created
	 */
	private static _description: { [fieldName: string]: Type<any> } = {
		id: new NumberType().primary().autoIncrement()
	};

	/**
	 * Object storing entity's data
	 */
	private __properties: { [key: string]: any; };

	/**
	 * List of changed properties which will be saved
	 */
	private __changedProps: { [key: string]: any; };

	/**
	 * Entity default data
	 * @private
	 */
	private static __defaultData = {};

	/**
	 * Entity states - used from UnitOfWork
	 * @type {{}}
	 * @private
	 */
	protected __snaps: {
		[uowKey: string/*Symbol*/]: {
			__changedProps: { [key: string]: any; },
			__properties: { [key: string]: any; }
		}
	} = {};

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Entity Symbol ID
	 * @private
	 */
	protected __symbol: Symbol = Symbol();

	/**
	 * Delete state flag
	 * @protected
	 */
	protected __isRemoved: boolean = false;

	/**
	 * Insert state flag
	 * @protected
	 */
	protected __isNew: boolean = false;

	/**
	 * Update state flag
	 * @protected
	 */
	protected __isDirty: boolean = false;

	//endregion

	//region Ctor

	/**
	 * @param [data]
	 * @param {boolean} [markDataAsChangedProperties]
	 */
	constructor(data: any = {}, markDataAsChangedProperties: boolean = true)
	{
		let defaultData = (<any>this.constructor).__defaultData;
		let changedProps = {}, p;

		let propKeys = Object.keys(data);
		let defKeys = Object.keys(defaultData);
		let properties = {};

		for (let i = 0; i < defKeys.length; i++)
		{
			p = defKeys[i];
			properties[p] = defaultData[p]();
		}

		for (let i = 0; i < propKeys.length; i++)
		{
			p = propKeys[i];
			properties[p] = data[p];
		}

		if (markDataAsChangedProperties)
		{
			for (p in properties)
			{
				if (properties.hasOwnProperty(p) && p != ID_FIELD_NAME)
				{
					changedProps[p] = properties[p];
				}
			}
		}

		if (!data["id"])
		{
			this.__isNew = true;
		}
		else
		{
			this.__isDirty = true;
		}

		this.__properties = properties;
		this.__changedProps = changedProps;
	}

	//endregion

	//region Static methods

	/**
	 * Add unique key created by more fields
	 * @param {Array<String>} fields List of fields
	 */
	static addUnique(...fields: Array<string>)
	{
		console.warn("Entity.addUnique() not implemented yet!");
		// return this;
	}

	/**
	 * Add primary key created by more fields
	 * @param {Array<String>} fields List of fields
	 */
	static addPrimary(...fields: Array<string>)
	{
		console.warn("Entity.addPrimary() not implemented yet!");
		// return this;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Insert new entity
	 * @param {Entity} entity
	 * @param [connection]
	 */
	static async insert<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection?: any)
	{
		if (!(entity instanceof Entity))
		{
			throw new Error("Parameter entity must be of type Entity");
		}
		if (entity.__properties.id > 0)
		{
			throw new Error("This entity already exists");
		}

		await (<any>this.domain).__adapter.insert(entity, entity.getData(), connection);
		entity.resetFlags();

		// TODO: dořešit kaskádované uložení entit, včetně insertu a mazání; u required entit i u hasMany
		// Při editaci seznamu entit je třeba dohledat cizí klíč a ten upravit
		//      Př. přidám Employee do Enterprise.users bez toho, abych měnil enterpriseId u entity Employee, chci, aby se to změnilo samo

		entity.storeChanges();

		await entity.saveRelatedVirtuals(connection);
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Remove entity
	 * @param {Entity} entity Entity which should be removed
	 * @param [connection]
	 */
	static async remove<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection?: any)
	{
		if (!(entity instanceof Entity))
		{
			throw new Error("Parameter entity must be of type Entity");
		}

		await (<any>this.domain).__adapter.remove(this, {
			field: "id",
			func: "=",
			args: entity.__properties[ID_FIELD_NAME]
		}, connection);
		entity.__isRemoved = true;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Remove entities matching given query where expression
	 * @param {(entity: TEntity) => boolean} expression
	 * @param args
	 * @returns {Promise<void>}
	 */
	static async removeWhere<TEntity extends Entity<any>>(expression: (entity: TEntity) => boolean, ...args)
	{
		let expr = new WhereExpression();
		expr.addExpression(expression, ...args);

		await (<any>this.domain).__adapter.remove(this, expr.getConditions(), /*, connection*/);
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Get all records
	 * @template TEntity
	 * @returns {Query<TEntity>}
	 */
	static getAll<TEntity extends Entity<any>>(): Query<TEntity>
	{
		return new Query(this);
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Select record by its id
	 * @param {Number | Uuid | *} id
	 * @param fields
	 * @template TEntity
	 * @returns {TEntity}
	 */
	static async getById<TEntity extends Entity<any>>(id: number | string, ...fields: Array<string>)
	{
		const entity = await (<any>this.domain).__adapter.select(this, fields || [],
			[{field: ID_FIELD_NAME, func: "=", arg: id}]);

		if (!entity[0]) return null;

		return (<any>Reflect).construct(this, [entity[0], true]);
	}

	/**
	 * Returns description of entity
	 * @returns {{}}
	 */
	static getDescription()
	{
		const description = {};
		const fields = this._description;

		for (let prop in fields)
		{
			if (fields.hasOwnProperty(prop))
			{
				description[prop] = fields[prop].getDescription();
			}
		}

		return description;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Method for seeding. Implement this method and return data which should be seeded.
	 */
	static seed(): Entity<any>[]
	{
		return [];
	}

	/**
	 * Entity mapping. Implement this method.
	 * @param {Entity} map
	 */
	static map(map: Entity<any>)
	{
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Reconstruct entity instance from given data. It'll not mark properties as changed.
	 * @param {Object} data
	 */
	static reconstructFrom(data: any): Entity<any>
	{
		let entity: Entity<any> = new (<any>this.constructor)(data, false);
		return entity;
	}

	//endregion

	//region Public methods

	/**
	 * Return object with raw data
	 * @returns {{}}
	 */
	getData(): {}
	{
		const desc = (<typeof Entity>this.constructor)._description;
		const rtrn = {}, props = this.__properties, chp = this.__changedProps;

		for (let p in props)
		{
			if (props.hasOwnProperty(p) && (<any>desc[p]).description.type !== Type.Types.Virtual)
			{
				rtrn[p] = chp[p] || props[p];
			}
		}

		return rtrn;
	}

	/**
	 * Return object with raw data but just that changed
	 * @returns {{}}
	 */
	getChangedData()
	{
		const desc = (<typeof Entity>this.constructor)._description;
		const changedData = {}, chp = this.__changedProps;

		for (let p in chp)
		{
			if (chp.hasOwnProperty(p) && (<any>desc[p]).description.type !== Type.Types.Virtual)
			{
				changedData[p] = chp[p];
			}
		}
		return changedData;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Return new object with selected properties
	 * @param {Array<String>} fields List of property names
	 * @returns {{}}
	 */
	select(...fields: Array<string>)
	{
		const outObj = {};

		// If no fields specified, select all
		if (!fields)
		{
			return (<any>Object).assign({}, this.__properties);
		}

		for (let f of fields)
		{
			outObj[f] = this.__properties[f];
		}

		return outObj;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Save tracked changes
	 * @param [connection]
	 */
	async save(connection: any)
	{
		// Return if no props were changed
		if (Object.keys(this.__changedProps).length === 0)
		{
			return;
		}

		const id = this.__properties[ID_FIELD_NAME];

		if (!id)
		{
			throw new Error("You can't update entity without id");
		}

		await (<any>this.constructor).domain.__adapter.update(
			this.constructor,
			this.getChangedData(),
			{id: id},
			connection
		);

		this.storeChanges();

		await this.saveRelatedVirtuals(connection);
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Remove changes on this entity instance
	 */
	rollbackChanges() {
		this.__changedProps = {};
		this.__isDirty = false;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Map data from given Object into current entity instance.
	 * Data will me marked as changed if differ from existing values.
	 * @param {Object} data
	 */
	mapFrom(data: any): TEntity
	{
		//let entity: TEntity = new (<any>this.constructor)();

		for (let field in data)
		{
			if (data.hasOwnProperty(field))
			{
				if (this[field] !== data[field] && field != ID_FIELD_NAME)
				{
					this.__changedProps[field] = data[field];
					this.__isDirty = true;
				}
			}
		}

		return <any>this;
	}

	//endregion

	//region Private methods

	/**
	 * Reset state flags
	 */
	private resetFlags()
	{
		this.__isNew = false;
		this.__isDirty = false;
		this.__isRemoved = false;
	}

	/**
	 * Copy values from changes to own properties and clear list of changed values
	 */
	private storeChanges()
	{
		const chp = this.__changedProps;
		const props = this.__properties;

		for (let propName in chp)
		{
			if (chp.hasOwnProperty(propName))
			{
				props[propName] = chp[propName];
			}
		}

		this.rollbackChanges();
	}

	/**
	 * Update changed related entities and go through many relations and update it's foreign key's
	 * @param {{}} connection
	 * @returns {Promise<void>}
	 */
	private async saveRelatedVirtuals(connection: {})
	{
		const desc = (<typeof Entity>this.constructor)._description;
		let promises = [];

		this.saveSimpleRelatedVirtuals(desc, promises, connection);

		// 1:N
		this.saveRelatedManyVirtuals(desc, promises, connection);

		await Promise.all(promises);
	}

	/**
	 * Go through virtual collections of related entities and save them
	 * @param {{}} desc
	 * @param {{}[]} promises
	 * @param {{}} connection
	 */
	private saveRelatedManyVirtuals(desc: { [p: string]: Type<any> }, promises: any[], connection: {})
	{
		let manys = this.getManyVirtuals(desc), fieldName: string, relatedEntity: Entity<any>, foreignField: string,
			collection: Entity<any>[];

		for (fieldName in manys)
		{
			if (manys.hasOwnProperty(fieldName))
			{
				collection = manys[fieldName];

				for (relatedEntity of collection)
				{
					foreignField = (<any>/*<ForeignType>*/desc[fieldName]).description.hasMany;
					relatedEntity[foreignField] = this.id;
					// TODO: If it has virtual type too, it should be set too
					//relatedEntity[virtualFieldName] = this;

					if (relatedEntity.id == undefined)
					{ // undefined match null too with ==
						promises.push(relatedEntity.save(connection));
					}
					else
					{
						promises.push((<typeof Entity>relatedEntity.constructor).insert(relatedEntity, connection));
					}
				}
			}
		}
	}

	/**
	 * Save directly related virtual properties/entities
	 * @param {{}} desc
	 * @param {Promise[]} promises
	 * @param {{}} connection
	 */
	private saveSimpleRelatedVirtuals(desc: { [p: string]: Type<any> }, promises: Promise<any>[], connection: {})
	{
		let virts = this.getChangedVirtuals(desc); // N:1

		for (let fieldName in virts)
		{
			if (virts.hasOwnProperty(fieldName))
			{
				let relatedEntity: Entity<any> = virts[fieldName];

				// Set related ID to withForeign field of this property
				let foreignField = (<any>/*<ForeignType>*/desc[fieldName]).description.withForeign;
				if (foreignField)
				{
					this[foreignField] = relatedEntity.id;
					// TODO: set from second side too.
					// relatedEntity[relatedVirtualField] = this;
					// relatedEntity[relatedForeignField] = this.id;
				}

				if (relatedEntity.id == undefined)
				{// undefined match null too with ==
					promises.push(relatedEntity.save(connection));
				}
				else
				{
					promises.push((<typeof Entity>relatedEntity.constructor).insert(relatedEntity, connection));
				}
			}
		}
	}

	/**
	 * Get object with changed virtual properties
	 * @param {{}} desc
	 * @returns {{}}
	 */
	private getChangedVirtuals(desc: { [fieldName: string]: Type<any> }): { [key: string]: Entity<any> }
	{
		const rtrn = {}, chp = this.__changedProps;

		for (let p in chp)
		{
			if (chp.hasOwnProperty(p) && (<any>desc[p]).description.withForeign)
			{
				rtrn[p] = chp[p];
			}
		}

		return rtrn;
	}

	/**
	 * Return object with hasMany virtual properties
	 * @param {{}} desc
	 * @returns {{}}
	 */
	private getManyVirtuals(desc: { [p: string]: Type<any> })
	{
		const rtrn = {}, props = this.__properties;
		let p;

		for (p in props)
		{
			if (props.hasOwnProperty(p) && props[p] && (<any>desc[p]).description.hasMany)
			{
				rtrn[p] = props[p];
			}
		}

		return rtrn;
	}

	//endregion
}