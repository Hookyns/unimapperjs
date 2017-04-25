const Type = require("../Type");

/**
 * @class
 */
class NumberType extends Type {

	//<editor-fold desc="Ctor">

	/**
	 * @constructor
	 */
	constructor() {
		super(Type.Types.Number);

		// Number default length 11
		this.description.length = 11; // => 4B - INTEGER
	}

	//</editor-fold>

	//<editor-fold desc="Public Properties">

	/**
	 * Enable auto incrementing
	 * @returns {NumberType}
	 */
	autoIncrement() {
		if (this.description.decimals > 0) {
			throw new Error("Number type with decimals cannot be auto-incremented");
		}

		this.description.autoIncrement = true;
		return this;
	}

	/**
	 * Set number of decimals - precision
	 * @param {Number} decimals
	 * @returns {NumberType}
	 */
	decimals(decimals) {
		if (this.description.autoIncrement) {
			throw new Error("Auto-incrementing Number type cannot have decimals");
		}

		if (decimals < 0) {
			throw new Error("Decimal parameter must be greater then or equal to 0");
		}

		this.description.decimals = decimals;
		return this;
	}

	/**
	 * Mark field as nullable
	 * @returns {NumberType}
	 */
	nullable() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.nullable();
	}

	/**
	 * Mark field as unique
	 * @returns {NumberType}
	 */
	unique() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.unique();
	}

	/**
	 * Mark field as primary
	 * @returns {NumberType}
	 */
	primary() {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.primary();
	}

	/**
	 * Set default value
	 * @param value
	 * @returns {NumberType}
	 */
	default(value) {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super["default"](value);
	}

	/**
	 * Set length
	 * @param length
	 * @returns {NumberType}
	 */
	length(length) {
		// Override just cuz of return type (IDE hints)
		// This doesn't affect performance cuz it runs only on startup
		return super.length(length);
	}

	//</editor-fold>
}

module.exports = NumberType;