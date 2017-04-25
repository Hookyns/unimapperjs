const Type = require("../Type");

/**
 * @class
 */
class BooleanType extends Type {

	//<editor-fold desc="Ctor">

	/**
	 * @constructor
	 */
	constructor() {
		super(Type.Types.Boolean);
	}

	//</editor-fold>

	//<editor-fold desc="Public Properties">

	/**
	 * Mark field as nullable
	 * @returns {BooleanType}
	 */
	nullable() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.nullable();
	}

	/**
	 * Set default value
	 * @param value
	 * @returns {BooleanType}
	 */
	default(value) {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super["default"](value);
	}

	//</editor-fold>
}

module.exports = BooleanType;