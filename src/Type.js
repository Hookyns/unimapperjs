/**
 * Base Type class describing data type of entity field
 * @abstract
 * @class
 */
class Type {

	//<editor-fold desc="Static Propeties">

	/**
	 * List of available data types
	 * @returns {{String: string, Number: string, Boolean: string, Date: string}}
	 * @constructor
	 */
	static get Types() {
		return {
			String: "String",
			Number: "Number",
			Boolean: "Boolean",
			Date: "Date",
			Uuid: "Uuid"
		};
	}

	//</editor-fold>

	//<editor-fold desc="Ctor">

	constructor(type) {
		if(!Type.Types.hasOwnProperty(type)) {
			throw new Error("Unknown type.");
		}

		/**
		 * @protected
		 * @type {{}}
		 */
		this.description = {
			type: type,
			nullable: false,
			length: null,
			decimals: null,
			primary: false,
			unique: false,
			autoIncrement: false,
			"default": null
		};
	}

	//</editor-fold>

	//<editor-fold desc="Public Methods">

	/**
	 * Mark field as nullable
	 * @returns {Type}
	 */
	nullable() {
		this.description.nullable = true;
		return this;
	}

	/**
	 * Mark field as unique
	 * @returns {Type}
	 */
	unique() {
		this.description.unique = true;
		return this;
	}

	/**
	 * Mark field as primary
	 * @returns {Type}
	 */
	primary() {
		this.description.primary = true;
		return this;
	}

	/**
	 * Set default value
	 * @param value
	 * @returns {Type}
	 */
	default(value) {
		this.description.default = value;
		return this;
	}

	/**
	 * Set length
	 * @param length
	 * @returns {Type}
	 */
	length(length) {
		this.description.length = ~~length;
		return this;
	}

	//</editor-fold>

	//<editor-fold desc="Private Properties">

	/**
	 * Get Type description
	 * @returns {{}}
	 */
	getDescription() {
		return Object.assign({}, this.description);
	}

	//</editor-fold>
}

module.exports = Type;