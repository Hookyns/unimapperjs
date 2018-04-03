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
const {Entity} = require("./src/Entity");

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

const $fs = require("fs");
const $path = require("path");

function goThroughDir(dir, action) {
	let list = $fs.readdirSync(dir);

	list.forEach(function (fileName) {
		if (fileName.charAt(0) === "." || fileName === "node_modules") return;

		let file = $path.resolve(dir, fileName);
		file = file.charAt(0).toLowerCase() + file.slice(1);
		let stat = $fs.lstatSync(file);

		if (stat) {
			if (stat.isDirectory()) {
				goThroughDir(file, action);
			} else if (stat.isFile()) {
				action(file);
			}
		}
	});
}

module.exports = {
	type: type,

	/**
	 * @type {UnitOfWork}
	 */
	UnitOfWork: require("./src/UnitOfWork").UnitOfWork,

	/**
	 *
	 * @param {Object} adapter
	 * @param {String | Object} connectionInfo
	 * @returns {Domain}
	 */
	createDomain: function createDomain(adapter, connectionInfo) {
		return new Domain(adapter, connectionInfo);
	},

	/**
	 * Init entities from given path
	 * @param path
	 */
	initEntitiesFrom(path) {
		path = $path.resolve(path);
		path = path.charAt(0).toLowerCase() + path.slice(1); // lowercase drive letter on windows

		goThroughDir(path, (file) => {
			if (file.slice(-3) !== ".js") return;
			/*let c = */require(file);
			// console.log(c);
			// let p = $path.parse(file);
			// let cls = c[p.base] || c["default"] || c;

			// if (Object.getPrototypeOf(cls) === Entity) { // extends from entity
			//
			// }
		});
	}
};