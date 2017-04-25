const Type = require("../Type");

/**
 * @class
 */
class DateType extends Type {

	//<editor-fold desc="Ctor">

	/**
	 * @constructor
	 */
	constructor() {
		super(Type.Types.Date);
	}

	//</editor-fold>

	//<editor-fold desc="Public Properties">

	/**
	 * Mark field as nullable
	 * @returns {DateType}
	 */
	nullable() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.nullable();
	}

	/**
	 * Mark field as unique
	 * @returns {DateType}
	 */
	unique() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.unique();
	}

	/**
	 * Mark field as primary
	 * @returns {DateType}
	 */
	primary() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.primary();
	}

	/**
	 * Set default value
	 * @param value
	 * @returns {DateType}
	 */
	default(value) {
		// if (typeof value != "function") {
		// 	throw new Error("Value of Date type must be function.");
		// }

		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super["default"](value);
	}

	/**
	 * Set default value to NOW - it means date and time when item created
	 * @returns {DateType}
	 */
	now() {
		return super["default"](function() { return new Date(); });
	}

	//</editor-fold>
}

module.exports = DateType;