const Type = require("../Type");

/**
 * @class
 */
class StringType extends Type {

	//<editor-fold desc="Ctor">

	/**
	 * @constructor
	 */
	constructor() {
		super(Type.Types.String);

		// String default length 255
		this.description.length = 255;
	}

	//</editor-fold>

	//<editor-fold desc="Public Properties">

	/**
	 * Mark field as nullable
	 * @returns {StringType}
	 */
	nullable() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.nullable();
	}

	/**
	 * Mark field as unique
	 * @returns {StringType}
	 */
	unique() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.unique();
	}

	/**
	 * Mark field as primary
	 * @returns {StringType}
	 */
	primary() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.primary();
	}

	/**
	 * Set default value
	 * @param value
	 * @returns {StringType}
	 */
	default(value) {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super["default"](value);
	}

	/**
	 * Set length
	 * @param length
	 * @returns {StringType}
	 */
	length(length) {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.length(length);
	}

	//</editor-fold>
}

module.exports = StringType;