/**
 * MySQL adapter for UniMapperJS
 *
 * @author Roman Jámbor
 * @licence MIT
 *
 * For sure, set lower-case-table-names to 2 on Windows or to 0 on Unix systems in MySQL conniguration my.ini
 * to enable upper case table and column names or use lower case entity and field names in code.
 */

"use strict";

const mysql = require("mysql2");
const Types = require("../src/Type").Types;
const escapeSqlString = mysql.escape;
const escapeIdSqlString = mysql.escapeId;

/**
 * Return MySQL type by code type
 * @param field
 * @returns {String}
 */
function getDbType(field) {
	switch (field.type) {
		case Types.String:
			if (!field.length || field.length > 255) return "text";
			return `varchar(${field.length})`;
		case Types.Boolean:
			return "tinyint(1)";
		case Types.Date:
			return "datetime";
		case Types.Number:
			if (field.decimals > 0) return "decimal(" + field.length + ", " + field.decimals + ")";

			if (field.length < 5) {
				return "tinyint";
			}

			if (field.length < 7) {
				return "smallint";
			}

			if (field.length < 10) {
				return "mediumint";
			}

			if (field.length < 12) {
				return "int";
			}

			return "bigint";
	}
}

/**
 * Get code type description by MySQL type
 * @param dbDesc
 * @returns {Object}
 */
function getCodeTypeDesc(dbDesc) {
	var dbType = dbDesc['Type'];
	var type;

	if (/(char)|(text)/.test(dbType)) {
		type = Types.String;
	} else if (dbType == "tinyint(1)") {
		type = Types.Boolean;
	} else if (/(tinyint)|(smallint)|(mediumint)|(int)|(bigint)|(numeric)|(float)|(double)|(decimal)/.test(dbType)) {
		type = Types.Number;
	} else if (dbType == "datetime") {
		type = Types.Date;
	}

	if (type) {
		let lengthMatch = dbDesc['Type'].match(/\(([0-9]+)/);
		let decimalMatch = dbDesc['Type'].match(/\([0-9]+,([0-9]+)/);

		return {
			type: type,
			nullable: dbDesc['Null'] == "YES",
			length: /*type != Types.Boolean && */lengthMatch ? ~~lengthMatch[1] : null,
			primary: dbDesc['Key'] == "PRI",
			unique: dbDesc['Key'] == "UNI"/* || dbDesc['Key'] == "PRI"*/,
			autoIncrement: !!(dbDesc['Extra'] && dbDesc['Extra'].indexOf("auto_increment") != -1),
			decimals: decimalMatch ? ~~decimalMatch[1] : null,
			"default": dbDesc['Default']
		}
	}

	return null;
}

/**
 * Return MySQL column description for column create
 * @param name
 * @param description
 * @returns {String}
 */
function fieldDesc(name, description) {
	return `${name} ${getDbType(description)} ${!description.nullable ? "NOT NULL" : ""} ${description.autoIncrement
		? "AUTO_INCREMENT" : ""}`;

	// Default values are handled by Entity
	// ${
	// 	f.default != null && (
	// 		typeof f.default == "string" || typeof f.default == "number" || typeof f.default == "boolean"
	// 	)
	// 		? "DEFAULT '" + (typeof f.default == "string" ? f.default : ~~f.default) + "'" : ""}
}

/**
 * Create SQL WHERE condition
 * @param {Array} conditions
 * @returns {string}
 */
function buildWhereCondition(conditions) {
	var query = "";

	for (var c = 0; c < conditions.length; c++) {
		let cond = conditions[c];

		if (cond.constructor == Object) {
			if (cond.func == "=") {
				query += cond.field + ` = ${escapeSqlString(cond.arg)}`;
			} else if (cond.func == "!=") {
				query += cond.field + ` != ${escapeSqlString(cond.arg)}`;
			} else if (cond.func == ">") {
				query += cond.field + ` > ${escapeSqlString(cond.arg)}`;
			} else if (cond.func == ">=") {
				query += cond.field + ` >= ${escapeSqlString(cond.arg)}`;
			} else if (cond.func == "<") {
				query += cond.field + ` < ${escapeSqlString(cond.arg)}`;
			} else if (cond.func == "<=") {
				query += cond.field + ` <= ${escapeSqlString(cond.arg)}`;
			} else if (cond.func == "includes") {
				query += cond.field + ` LIKE ${escapeSqlString("%" + cond.arg + "%")}`;
			} else if (cond.func == "startswith") {
				query += cond.field + ` LIKE ${escapeSqlString(cond.arg + "%")}`;
			} else if (cond.func == "endswith") {
				query += cond.field + ` LIKE ${escapeSqlString("%" + cond.arg)}`;
			} else if (cond.func == "exists") {
				query += cond.field + " IS NOT NULL";
			} else {
				throw new Error(`Unsupported function operator '${cond.func}' found in query`);
			}
		} else if (cond.constructor == Array) {
			query += "(" + buildWhereCondition(cond) + ")";
		} else if (cond.constructor == String) {
			if (cond == "and") {
				query += " AND ";
			} else if (cond == "or") {
				query += " OR ";
			} else {
				throw new Error(`Unsupported logical operator '${cond}' found in query`);
			}
		}
	}

	return query;
}


class MySqlAdapter {

	//<editor-fold desc="Static Properties">

	/**
	 * True if database type need migrations (basically all SQL databases need it)
	 * @type {Boolean}
	 */
	static get needMigrations() {
		return true;
	}

	//</editor-fold>

	//<editor-fold desc="Ctor">

	/**
	 * @param connInfo
	 */
	constructor(connInfo) {
		/**
		 * Connection string or Object with settings
		 * @type {String | Object}
		 */
		this.connInfo = connInfo;

		/**
		 * Connection pool - created after first getConnection() call
		 * @type {null}
		 */
		this.pool = null;

		/**
		 * List of executed queries allowing to show what adapter did
		 * @type {Array<{ sql: String, data: Object }>}
		 */
		this.executedQueries = [];
	}

	//</editor-fold>

	//<editor-fold desc="Required Methods">

	/**
	 * Return connection to database
	 * @returns {*}
	 */
	async getConnection() {
		if (!this.pool) {
			this.pool = await mysql.createPoolPromise(this.connInfo);
		}

		return await this.pool.getConnection();
	}

	/**
	 * Start transaction
	 * @param connection
	 */
	async startTransaction(connection) {
		await connection.query("START TRANSACTION;");
	}

	/**
	 * Rollback changes
	 * @param connection
	 */
	async rollback(connection) {
		await connection.query("ROLLBACK;")
	}

	/**
	 * Commit changes
	 * @param connection
	 */
	async commit(connection) {
		await connection.query("COMMIT;")
	}

	/**
	 * Insert new record
	 * @param {Entity} entity Instance of entity
	 * @param {Object} data
	 * @param [connection]
	 * @returns {UniMapperEntity}
	 */
	async insert(entity, data, connection) {
		var conn = connection || await this.getConnection();

		var query = "INSERT INTO " + entity.constructor.name + " (";

		var keys = Object.keys(data);
		var args = [];
		var vals = "";

		for (var i = 0; i < keys.length; i++) {
			// Column
			query += keys[i];

			// Values
			vals += "?";
			args.push(data[keys[i]]);

			if (i < keys.length - 1) {
				vals += ", ";
				query += ", ";
			}
		}

		query += ") VALUES (" + vals + ");";

		var preResult;
		var result = await (preResult = conn.query(query, args));

		this.logQuery(result[2].sql, null);

		var idDescription = entity.constructor.getDescription().id;
		if (idDescription.type == Types.Number && idDescription.autoIncrement && result[0]) {
			// Add id directly to __propeties - avoid marking ID as changed
			entity.__properties.id = result[0].insertId;
		}

		if (!connection) await conn.release();

		return entity;
	}

	/**
	 * Update record
	 * @param {Entity} entity
	 * @param {Object} data
	 * @param {Object} [where]
	 * @param [connection]
	 */
	async update(entity, data, where = {}, connection) {
		var conn = connection || await this.getConnection();
		var result = await conn.query(`UPDATE ${entity.name} SET ? WHERE ?;`, [data, where]);
		this.logQuery(result[2].sql, null);
		if (!connection) await conn.release();
	}

	/**
	 * Remove record
	 * @param entity
	 * @param {Object} [where]
	 * @param [connection]
	 */
	async remove(entity, where = {}, connection) {
		var conn = connection || await this.getConnection();
		var result = await conn.query(`DELETE FROM ${entity.name} WHERE ?;`, [where]);
		this.logQuery(result[2].sql, null);
		if (!connection) await conn.release();
	}

	/**
	 * Select records
	 * @param {Function<UniMapperEntity>} entity
	 * @param {Array<String>} select List of fields which should be selected
	 * @param [conditions]
	 * @param {Array<{ field: String, order: "ASC" | "DESC"}>} [order]
	 * @param [limit]
	 * @param [skip]
	 */
	async select(entity, select, conditions, order, limit, skip) {
		// EG. e => e.name.includes("o") && (e.foo > 5 || e.foo < -5) || e.foo in [1, 2, 3]
		// [
		// 	{ field: "name", func: "icludes", arg: "o" },
		// 	"and",
		// 	[
		// 		{ field: "foo", func: ">", arg: 5 },
		// 		"or",
		// 		{ field: "foo", func: "<", arg: -5 },
		// 	],
		// 	"or",
		// 	{ field: "foo", func: "in", arg: [1,2,3] }
		// ] => name LIKE '%o%' AND (foo > 5 OR foo < -5) OR doo IN (1,2,3)

		if (!select) {
			select = [];
		}

		if (!order) {
			order = [];
		}

		var conn = await this.getConnection();

		var sel = "";
		if (select.length > 0) {
			for (var s = 0; s < select.length; s++) {
				if (s != 0) sel += ", ";

				if (select[s].constructor == Object) {
					let obj = select[s];

					if (obj.func == "count") {
						sel += `COUNT(${obj.arg || "*"}) AS count`;
					} else {
						throw new Error(`Unsupported function '${obj.func}' found in query`);
					}
				} else {
					sel += select[s];
				}
			}
		} else {
			sel = "*";
		}

		var query = `SELECT ${sel} FROM ${entity.name}`;

		if (conditions.length > 0) {
			query += " WHERE " + buildWhereCondition(conditions);
		}

		if (order.length > 0) {
			query += " ORDER BY ";

			for (let or = 0; or < order.length; or++) {
				// escapeSqlString() just for sure if somebody take field from client
				query += (or != 0 ? ", " : "") + escapeIdSqlString(order[or].field) + " "
					+ (order[or].order == "desc" ? "DESC" : "ASC");
			}
		}

		if (limit) {
			query += " LIMIT " + parseInt(limit);
		}

		if (skip) {
			query += " OFFSET " + parseInt(skip);
		}

		query += ";";

		// console.log(query);

		var result = await conn.query(query);
		this.logQuery(result[2].sql, null);
		await conn.release();
		return result[0];
	}

	/**
	 * Dispose resources - end connection pool
	 */
	async dispose() {
		if (this.pool) {
			await this.pool.end();
			this.pool = null;
		}
	}

	//</editor-fold>


	////////////////////////////////////////////////////////////////////////////////////////////////////////
	//                                                                                                    //
	//                                             MIGRATIONS                                             //
	//                                                                                                    //
	////////////////////////////////////////////////////////////////////////////////////////////////////////

	//<editor-fold desc="Migrating Methods">

	/**
	 * Return list with entity names
	 * @returns {Array}
	 */
	async getListOfEntities() {
		try {
			var conn = await this.getConnection();
			var result = await conn.query("SHOW TABLES;");
			var nameIndex = Object.keys(result[0][0])[0];
			var out = [];

			for (let row of result[0]) {
				out.push(row[nameIndex]);
			}

			await conn.release();

			return out;
		} catch (e) {
			console.error(e.stack);
		}
	}

	/**
	 * Return entity structure with described fields
	 * @param tableName
	 * @returns {Object<{type: String, nullable: Boolean, length: Number, decimals: Number, primary: Boolean, unique: Boolean, autoIncrement: Boolean}>}
	 */
	async getEntityStructure(tableName) {
		/*
		 * {
		 *      fieldName: {
		 *          type: Type,
		 *          nullable: Boolean,
		 *          length: Number | null,
		 *          primary: Boolean,
		 *          unique: Boolean,
		 *          autoIncrement: Boolean,
		 *          decimals: Number | null
		 *      }
		 * }
		 */

		try {
			var conn = await this.getConnection();
			var result = await conn.query("DESCRIBE ??", [tableName]);
			var out = {};

			for (let row of result[0]) {
				out[row['Field']] = getCodeTypeDesc(row);
			}

			await conn.release();

			return out;
		} catch (e) {
			console.error(e.stack);
		}
	}

	/**
	 * Create new not existing entity
	 * @param {String} name
	 * @param {Object<{type: String, nullable: Boolean, length: Number, decimals: Number, primary: Boolean, unique: Boolean, autoIncrement: Boolean}>} fields
	 */
	async createEntity(name, fields) {
		try {
			var conn = await this.getConnection();
			var query = "CREATE TABLE `" + name + "` (\n";
			var toEnd = [];
			var f;

			for (let field in fields) {
				if (fields.hasOwnProperty(field)) {
					f = fields[field];
					query += `\t${fieldDesc(field, f)},\n`;

					if (f.primary) toEnd.push("PRIMARY KEY (" + field + ")");
					if (f.unique) toEnd.push(`UNIQUE KEY unique_index_${name}_${field} (${field})`);
				}
			}

			if (query[query.length - 1] == ",") {
				query = query.slice(0, query.length - 2);
			}

			query += "\t" + toEnd.join(", ") + "\n) ENGINE=InnoDB;";

			console.log("Executing SQL: ", query);

			await conn.query(query);
			await conn.release();
		} catch (e) {
			console.error(e.stack);
		}
	}

	/**
	 * Remove existing entity from database
	 * @param {String} entityName
	 */
	async removeEntity(entityName) {
		try {
			var conn = await this.getConnection();
			var query = `DROP TABLE ${entityName};`;

			console.log("Executing SQL: ", query);

			await conn.query(query);
			await conn.release();
		} catch (e) {
			console.error(e.stack);
		}
	}

	/**
	 *  Add new field to entity
	 * @param {String} entityName
	 * @param {String} fieldName
	 * @param {{type: String, nullable: Boolean, length: Number, decimals: Number, primary: Boolean, unique: Boolean, autoIncrement: Boolean}} description
	 */
	async addField(entityName, fieldName, description) {
		try {
			var conn = await this.getConnection();
			var query = `ALTER TABLE ${entityName} ADD ${fieldDesc(fieldName, description)} ${description.unique
				? `, ADD UNIQUE KEY unique_index_${entityName}_${fieldName} (${fieldName})` : ""} ${description.primary
				? `, ADD PRIMARY KEY (${fieldName})` : ""};`;

			console.log("Executing SQL: ", query);

			await conn.query(query);
			await conn.release();
		} catch (e) {
			console.error(e.stack);
		}
	}

	/**
	 * Remove field from entity
	 * @param {String} entityName
	 * @param {String} fieldName
	 */
	async removeField(entityName, fieldName) {
		try {
			var conn = await this.getConnection();
			var query = `ALTER TABLE ${entityName} DROP COLUMN ${fieldName};`;

			console.log("Executing SQL: ", query);

			await conn.query(query);
			await conn.release();
		} catch (e) {
			console.error(e.stack);
		}
	}

	/**
	 * Cange existing field in entity
	 * @param {String} entityName
	 * @param {String} fieldName
	 * @param {{type: String, nullable: Boolean, length: Number, decimals: Number, primary: Boolean, unique: Boolean, autoIncrement: Boolean}} description
	 */
	async changeField(entityName, fieldName, description) {
		try {
			var conn = await this.getConnection();
			var mod = "";

			if (description.type != undefined || description.decimals != undefined || description.length != undefined
				|| description.nullable != undefined || description.autoIncrement != undefined
			) {
				mod = "MODIFY " + fieldDesc(fieldName, description) + ", ";
			}

			var query = `ALTER TABLE ${entityName} ${mod} ${description.unique
				? `ADD UNIQUE KEY unique_index_${entityName}_${fieldName} (${fieldName}), ` : ""} ${description.primary
				? `ADD PRIMARY KEY (${fieldName})` : ""}`.trim();

			if (query.slice(-1) == ",") {
				query = query.slice(0, -1);
			}

			query += ";";

			console.log("Executing SQL: ", query);

			await conn.query(query);
			await conn.release();
		} catch (e) {
			console.error(e.stack);
		}
	}

	//</editor-fold>

	//<editor-fold desc="Aditional Adapter Features">

	/**
	 * Execute native SQL query
	 * @param query
	 * @param [params]
	 * @param [connection]
	 */
	async query(query, params = [], connection) {
		var conn = connection || await this.getConnection();
		var result = await conn.query(query, params);
		this.logQuery(result[2].sql, null);
		if (!connection) await conn.release();
		return result[0];
	}

	// </editor-fold>

	//<editor-fold desc="Private Methods">
	/**
	 * Add query to list
	 * @param {String} query
	 * @param {Object} data
	 */
	logQuery(query, data) {
		if (this.executedQueries.length >= MySqlAdapter.numberOfStoredQueries) {
			this.executedQueries.shift();
		}

		this.executedQueries.push({sql: query, data: data});
	}

	//</editor-fold>

}

/**
 * Change how many queries should be stored in memory
 * @type {number}
 */
MySqlAdapter.numberOfStoredQueries = 20;

module.exports = MySqlAdapter;