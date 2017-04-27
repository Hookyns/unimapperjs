const Query = require("./Query");

/**
 * @class Entity
 * @alias UniMapperEntity
 */
class Entity {

	//<editor-fold desc="Ctor">

	constructor(data, selected = false) {
		/**
		 * Object storing entity's data
		 * @type {{}}
		 * @private
		 */
		this.__properties = data || {};

		/**
		 * List of changed properties which will be saved
		 * @type {Array}
		 * @private
		 */
		this.__changedProperties = !!data && !selected ? Object.keys(data) : [];

		/**
		 * Mark entity as deleted - just for some checks
		 * @type {boolean}
		 * @private
		 */
		this.__deleted = false;
	}

	//</editor-fold>

	//<editor-fold desc="Static Methods">

	/**
	 * Add unique key created by more fields
	 * @param {Array<String>} fields List of fields
	 */
	static addUnique(...fields) {
		console.warn("Entity.addUnique() not implemented yet!");
		return this;
	}

	/**
	 * Add primary key created by more fields
	 * @param {Array<String>} fields List of fields
	 */
	static addPrimary(...fields) {
		console.warn("Entity.addPrimary() not implemented yet!");
		return this;
	}

	/**
	 * Insert new entity
	 * @param entity
	 * @param [connection]
	 */
	static async insert(entity, connection) {
		if (!(entity instanceof Entity)) {
			throw new Error("Parameter entity must be of type Entity");
		}
		if (entity.__properties.id > 0) {
			throw new Error("This entity already exists");
		}

		await this.domain.__adapter.insert(entity, entity.__properties, connection);
	}

	/**
	 * Remove entity
	 * @param {Entity} entity Instance of entity
	 * @param [connection]
	 */
	static async remove(entity, connection) {
		if (!(entity instanceof Entity)) {
			throw new Error("Parameter entity must be of type Entity");
		}
		entity.__deleted = true;
		await this.domain.__adapter.remove(this, { id: entity.__properties["id"] }, connection);
	}

	/**
	 * Get all records
	 * @returns {Query}
	 */
	static getAll() {
		return new Query(this);
	}

	/**
	 * Select record by its id
	 * @param {Number | Uuid | *} id
	 * @returns {Entity}
	 */
	static async getById(id) {
		var entity = await this.domain.__adapter.select(this, [],
			[ { field: "id", func: "=", arg: id } ]);
		if (!entity[0]) return null;
		return Reflect.construct(this, [entity[0], true]);
	}

	/**
	 * Returns object description of entity
	 * @returns {{}}
	 */
	static getDescription() {
		var description = {};
		var fields = this._description;

		for (var prop in fields) {
			if (fields.hasOwnProperty(prop)) {
				description[prop] = fields[prop].getDescription();
			}
		}

		return description;
	}

	//</editor-fold>

	//<editor-fold desc="Public Methods">

	/**
	 * Return new object with selected properties
	 * @param {Array<String>} fields List of property names
	 * @returns {{}}
	 */
	select(...fields) {
		var outObj = {};

		// If no fields specified, select all
		if (!fields) {
			return Object.assign({}, this.__properties);
		}

		for (let f of fields) {
			outObj[f] = this.__properties[f];
		}

		return outObj;
	}

	/**
	 * Save tracked changes
	 * @param [connection]
	 */
	async save(connection) {
		if (this.__changedProperties.length == 0) {
			return;
		}

		if (!~~this.__properties["id"]) {
			throw new Error("You can't update entity without id");
		}

		var data = {};

		for (let field of this.__changedProperties) {
			data[field] = this.__properties[field];
		}

		await this.constructor.domain.__adapter.update(this.constructor, data, { id: this.__properties["id"] }, connection);
	}

	//</editor-fold>

}

/**
 * Entity domain - set when entity created
 * @type {Domain}
 */
Entity.domain = null;

module.exports = Entity;

