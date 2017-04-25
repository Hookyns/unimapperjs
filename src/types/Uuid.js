const Type = require("../Type");
const uuid = require("uuid/v1");

/**
 * @class
 */
class UuidType extends Type {

	//<editor-fold desc="Ctor">

	/**
	 * @constructor
	 */
	constructor() {
		super(Type.Types.String);

		this.description.primary = true;
		this.description.length = 37;
		this.description.default = function() {
			return uuid();
		};
	}

	//</editor-fold>

	//<editor-fold desc="Public Properties">

	/**
	 * Mark field as unique
	 * @returns {UuidType}
	 */
	unique() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.unique();
	}

	/**
	 * Remove default PRIMARY mark
	 * @returns {UuidType}
	 */
	notPrimary() {
		this.description.primary = false;
		return this;
	}

	//</editor-fold>

}

module.exports = UuidType;