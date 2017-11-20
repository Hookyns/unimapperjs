/**
 * UniMapperJS - universal object mapper for SQL and noSQL databases
 * @author Roman Jámbor
 */

const {StringType} = require("./src/types/StringType");
const {NumberType} = require("./src/types/NumberType");
const {BooleanType} = require("./src/types/BooleanType");
const {DateType} = require("./src/types/DateType");
const {UuidType} = require("./src/types/UuidType");
const {ForeignType} = require("./src/types/ForeignType");
const {Domain} = require("./src/Domain");

/**
 * Object with type returning getters
 * @type {{string: StringType, number: NumberType, boolean: BooleanType, date: DateType, uuid: UuidType}}
 */
const type = {
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

// ForeignType
Object.defineProperty(type, "foreign", {
	value: function (entity) {
		return new ForeignType(entity);
	}
});

module.exports = {
	type: type,

	// /**
	//  * @type {UnitOfWork}
	//  */
	// UnitOfWork: require("./src/UnitOfWork"),

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