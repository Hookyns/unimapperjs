
function convertWhereExpr(expr) {
	var str = expr.toString();
}

// convertWhereExpr(e => e.name == "Test" && e.foo > 5);

/**
 * @class Entity
 * @alias UniMapperEntity
 */
class Entity {

	//<editor-fold desc="Ctor">

	constructor(data) {
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
		this.__changedProperties = !!data ? Object.keys(data) : [];
	}

	//</editor-fold>

	//<editor-fold desc="Static Methods">

	static addUnique(...fields) {

	}

	static addPrimary(...fields) {

	}

	/**
	 * Insert new entity
	 * @param entity
	 * @param [connection]
	 */
	static async insert(entity, connection) {
		await this.domain.__adapter.insert(this.name, entity.__properties, entity, this.getDescription().id, connection);
	}

	static async delete(entity) {
		// await deletedEntities.push(entity);
	}

	static async find(whereExpr) {
		// return await storageAdapter.select(convertWhereExpr(whereExpr));
	}

	static async findOne(whereExpr) {

	}

	static async findById(id) {

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

	async select(selectExpr) {

	}

	async save() {

	}

	//</editor-fold>

}

/**
 * Entity domain - set when entity created
 * @type {Domain}
 */
Entity.domain = null;

module.exports = Entity;

