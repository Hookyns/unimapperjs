// const Type = require("./src/Type");
const StringType = require("./src/types/String");
const NumberType = require("./src/types/Number");
const BooleanType = require("./src/types/Boolean");
const DateType = require("./src/types/Date");
const UuidType = require("./src/types/Uuid");
const Domain = require("./src/Domain");

/**
 * Object with type returning getters
 * @type {{string: StringType, number: NumberType, boolean: BooleanType, date: DateType, uuid: UuidType}}
 */
var type = {
	/** @type StringType */
	string: null,
	/** @type NumberType */
	number: null,
	/** @type BooleanType */
	boolean: null,
	/** @type DateType */
	date: null,
	/** @type UuidType */
	uuid: null
};

// StringType
Object.defineProperty(type, "string", {
	get: function () {
		return new StringType();
	}
});

// NumberType
Object.defineProperty(type, "number", {
	get: function () {
		return new NumberType();
	}
});

// BooleanType
Object.defineProperty(type, "boolean", {
	get: function () {
		return new BooleanType();
	}
});

// DateType
Object.defineProperty(type, "date", {
	get: function () {
		return new DateType();
	}
});

// DateType
Object.defineProperty(type, "uuid", {
	get: function () {
		return new UuidType();
	}
});


module.exports = {
	type: type,

	/**
	 *
	 * @param {Object} adapter
	 * @param {String | Object} connectionInfo
	 * @returns {Domain}
	 */
	createDomain: function createDomain(adapter, connectionInfo) {
		return new Domain(adapter, connectionInfo);
	}
};