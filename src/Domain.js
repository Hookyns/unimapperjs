const Entity = require("./Entity");
const Types = require("./Type").Types;
const NumberType = require("./types/Number");
const $path = require("path");
const $fs = require("fs");
const prettify = require("../node_modules/json-prettify/json2").stringify;

/**
 *
 * @param data
 * @param tabs
 */
function toText(data, tabs) {
	return prettify(data, null, "\t").replace(/^/gm, tabs);
}

/**
 * Return new object with all property names converted to lower case
 * @param {Object} obj
 * @returns {Object}
 */
function allPropertiesToLowerCase(obj) {
	if (!obj) return null;

	if (obj.constructor != Object) {
		throw new Error("Parameter obj must be of type Object.");
	}

	var out = {};

	for (let prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			out[prop.toLowerCase()] = obj[prop] && obj[prop].constructor == Object
				? allPropertiesToLowerCase(obj[prop]) : obj[prop];
		}
	}

	return out;
}


/**
 * List of all created createdEntities
 * @type {Array}
 */
var createdEntities = [];


class Domain {

	//<editor-fold desc="Ctor">

	/**
	 * @param {Function} adapter
	 * @param {String} connectionInfo
	 */
	constructor(adapter, connectionInfo) {
		/**
		 * Adapter object
		 * @type {Object}
		 * @private
		 * @ignore
		 */
		this.__adapter = new adapter(connectionInfo);

		/**
		 * Database connection string
		 * @type {String}
		 * @private
		 * @ignore
		 */
		this.__connectionInfo = connectionInfo;
	}

	//</editor-fold>

	//<editor-fold desc="Static Methods">

	//</editor-fold>

	//<editor-fold desc="Public Methods">

	/**
	 * Create new entity schema / domain model
	 * @param {String} name
	 * @param {Object<Type>} properties
	 * @param {Type} [idType]
	 * @returns {Entity}
	 */
	createEntity(name, properties, idType = null) {
		if (properties.constructor != Object) {
			throw new Error("Parameter 'properties' is not Object.");
		}

		// Define ID
		if (!properties.hasOwnProperty("id")) {
			if (!idType) {
				idType = new NumberType().primary().autoIncrement();
			}

			properties.id = idType;
		} else {
			console.warn(`WARN You define custom id in entity ${this.name}. `
				+ `Use third parameter of Domain.createEntity() to change native id type.`);
		}

		var defaultData = {};

		for (var prop in properties) {
			if (properties.hasOwnProperty(prop)) {
				let defVal = properties[prop].getDescription().default;
				let defValFunc;

				if (typeof defVal != "function") {
					defValFunc = function () {
						return defVal;
					}
				} else {
					defValFunc = defVal;
				}

				defaultData[prop] = defValFunc;
			}
		}

		var domain = this;

		var entity = class extends Entity {
			constructor(data) {
				var defData = {};

				for (var p in defaultData) {
					if (data.hasOwnProperty(p)) {
						defData[p] = data[p];
					} else if (defaultData.hasOwnProperty(p)) {
						defData[p] = defaultData[p]();
					}
				}

				super(defData);
			}
		};

		createdEntities.push(entity);

		// Change name of class
		Object.defineProperty(entity, "name", {value: name});
		Object.defineProperty(entity.constructor, "name", {value: name});

		// Store entity description
		Object.defineProperty(entity, "_description", {
			get: function () {
				return properties;
			}
		});

		entity.domain = this;
		// Object.defineProperty(entity, "domain", {
		// 	get: () => {
		// 		return this;
		// 	}
		// });

		for (let propName in properties) {
			if (properties.hasOwnProperty(propName)) {
				Object.defineProperty(entity.prototype, propName, {
					get: function () {
						return this.__properties[propName];
					},
					set: function (value) {
						// Change value
						this.__properties[propName] = value;
						// Mark change
						this.__changedProperties.push(propName);
					}
				});
			}
		}

		return entity;
	}

	/**
	 * Create migration script
	 * @param path
	 */
	async createMigration(path) {
		var tables = await this.__adapter.getListOfEntities(this.__connectionInfo);
		var output = `
/**
 * Migration script
 */

module.exports = {\n\tup: async function up(adapter) {\n`;

		for (let entity of createdEntities) {
			// Entity description
			let fields = entity.getDescription();

			// let fieldsLowerCase = allPropertiesToLowerCase(fields);
			let notReducedFields = entity.getDescription();
			let notReducedFieldsLowerCase = allPropertiesToLowerCase(notReducedFields);

			// Remove properties with null and false and properties default - default values are set from code
			for (let field in fields) {
				if (fields.hasOwnProperty(field)) {
					delete fields[field]["default"];

					for (let prop in fields[field]) {
						if (fields[field].hasOwnProperty(prop)) {
							if (fields[field][prop] == null || fields[field][prop] === false) {
								delete fields[field][prop];
							}
						}
					}
				}
			}

			// If entitiy not exists in database
			if (!tables.some(x => (x.toLowerCase() == entity.name.toLowerCase()))) {
				output += `\t\tawait adapter.createEntity("${entity.name}", ${toText(fields, "\t\t").trim()});\n\n`;
			}

			// If exists - find changes
			else {
				let tableInfo = await this.__adapter.getEntityStructure(entity.name);
				let tableInfoLowerCase = allPropertiesToLowerCase(tableInfo);

				for (let f in fields) {
					if (fields.hasOwnProperty(f)) {
						// New field
						if (!tableInfoLowerCase.hasOwnProperty(f.toLowerCase())) {
							output += `\t\tawait adapter.addField("${entity.name}", "${f}", ${
								toText(fields[f], "\t\t").slice(2)});\n`;
						}

						// Change
						else {
							let changed = false;
							let lcFields = notReducedFieldsLowerCase[f.toLowerCase()];

							// Check if something differ
							for (let prop in lcFields) {
								if (lcFields.hasOwnProperty(prop) && prop != "default") { // Ignore default values - not set to DB
									if (lcFields.type == Types.Boolean && prop == "length") {
										continue;
									}

									if (tableInfoLowerCase[f.toLowerCase()][prop] !== lcFields[prop]) {
										changed = true;
										break;
									}
								}
							}

							if (changed) {
								output += `\t\tawait adapter.changeField("${entity.name}", "${f}", ${
									toText(fields[f], "\t\t").slice(2)});\n`;
							}
						}
					}
				}

				// Check for field deletion
				for (let tf in tableInfoLowerCase) {
					if (tableInfoLowerCase.hasOwnProperty(tf) && !notReducedFieldsLowerCase.hasOwnProperty(tf)) {
						var fieldName = Object.keys(tableInfo)[Object.keys(tableInfoLowerCase).indexOf(tf)];
						output += `\t\tawait adapter.removeField("${entity.name}", "${fieldName}");\n`;
					}
				}
			}
		}

		output += "\t}\n};";

		$fs.writeFileSync($path.join(path, (new Date().getTime()).toString() + ".migration.js"), output);
	}

	/**
	 * Run migration from path
	 * @param path
	 */
	async runMigration(path) {
		path = $path.resolve(path);
		var files = $fs.readdirSync(path).filter(name => /\.migration\.js$/.test(name)).sort();

		if (files.length == 0) return;

		var migration = $path.join(path, files[files.length - 1]);

		try {
			// Run migration
			await require(migration).up(this.__adapter);

			// Remove migration file from require cache
			delete require.cache[migration];

			// Rename migration script - mark as applied
			$fs.renameSync(migration, migration.slice(0, -3) + ".applied");
		} catch (e) {
			console.log(e.stack);
		}
	}


	async dispose() {
		this.__adapter.dispose(this.__connectionInfo);
	}

	//</editor-fold>
}

module.exports = Domain;