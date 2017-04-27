/**
 * Map creating cache for expressions
 * @type {Map}
 */
const exprCacheMap = new Map();

/**
 * Add expression to cache
 * @param {Function} expr
 * @param {Object} data
 */
function addExprToCache(expr, data) {
	expr = expr.toString();

	if (exprCacheMap.size > Query.numberOfCachedExpressions) {
		exprCacheMap.delete(exprCacheMap.entries().next().key);
	}

	exprCacheMap.set(expr, data);
}

/**
 * Get stored expression
 * @param {Function} expr
 * @returns {Object}
 */
function getExprFromCache(expr) {
	return exprCacheMap.get(expr.toString());
}

/**
 * Match parts of expression
 * @param {Function} expr
 * @returns {{ entity: String, expr: String}}
 */
function matchExpr(expr) {
	var str = expr.toString();

	// if (str[str.length - 1] == "}") {
	// 	throw new Error("Parameter expr must be simple arrow function.")
	// }

	if (str[0] == "(") {
		throw new Error("Use arrow function without brackets around parameter.");
	}

	var match = str.match(/^([\w\d$_]+?)\s*=>((?:\{\sreturn\s)?[\s\S]*(?:\})?)/);

	if (!match) {
		throw new Error("Invalid expression");
	}

	var entity = match[1];
	expr = match[2];

	return {
		entity: entity,
		expr: expr
	};
}

function convertWhereExpr(expr) {
	expr = matchExpr(expr);

	return expr;
}

/**
 * List of supported function/methods
 * @type {string[]}
 */
const supportedFunctions = ["startsWith", "includes", "endsWith"];


class Query {

	constructor(entity) {
		/**
		 * @type {Function<Entity>}
		 * @private
		 */
		this.entity = entity;

		/**
		 * List of JS arrow functions for last JS filtering
		 * @type {Array<String>}
		 * @private
		 */
		this.filters = [];

		/**
		 * List of filter arguments
		 * @type {Array}
		 * @private
		 */
		this.whereArgs = [];

		/**
		 * List of fields which shoud be selected
		 * Default null -> all fields
		 * @type {Array}
		 * @private
		 */
		this.selectFields = null;

		/**
		 * Arrow function creating new object
		 * @type {Function}
		 * @private
		 */
		this.mapResultTo = e => new entity(e, true);

		/**
		 * @type {Number}
		 * @private
		 */
		this.limitValue = null;

		/**
		 * @type {Number}
		 * @private
		 */
		this.skipValue = null;

		/**
		 * @type {Array}
		 * @private
		 */
		this.conditions = [];

		/**
		 * @type {Array}
		 * @private
		 */
		this.orders = [];
	}

	/**
	 * Execute prepared query and fetch results
	 * @returns {*|{}|Array}
	 */
	async exec() {
		var fetch = await this.entity.domain.__adapter.select(this.entity, this.selectFields,
			this.conditions, this.orders, this.limitValue, this.skipValue);


		for (let filter of this.filters) {
			fetch = fetch.filter(filter(this.whereArgs));
		}

		// It's COUNT
		if (fetch.length == 1 && fetch[0].count) {
			return fetch[0].count;
		}

		return fetch.map(this.mapResultTo);
	}

	/**
	 * Return just count
	 * @returns {Query}
	 */
	count() {
		this.selectFields = [{ func: "count", arg: null }];
		// this.mapResultTo = e => e.count;
		return this;
	}

	/**
	 * Say what you want to return
	 * @param {Function} expression
	 * @returns {Query}
	 */
	select(expression) {
		var fromCacheMap = getExprFromCache(expression);

		this.mapResultTo = expression;

		if (fromCacheMap) {
			this.selectFields = fromCacheMap.selectFields;
		} else {
			let expr = matchExpr(expression);
			var fields = [];

			expr.expr.replace(new RegExp(expr.entity + "\\.([\\w_]+)", "g"), function(_, field) {
				fields.push(field);
			});

			this.selectFields = fields;
			addExprToCache(expression, { selectedFields: fields });
		}

		return this;
	}

	where(expression, ...args) {
		var expr = convertWhereExpr(expression);

		// console.log(expr);


		// Save as JS filter function
		var fromCacheMap = getExprFromCache(expression);
		if (!fromCacheMap) {
			let $i = this.whereArgs - 1;
			let filter = "return " + expr.entity + " => " + expr.expr.replace(/([^\\]|^)(\$)/g, function (_, before) {
					$i++;
					return before + `args[${$i}]`;
				}) + ";";
			let func = new Function("args", filter);
			this.filters.push(func);
			this.whereArgs = this.whereArgs.concat(args);
			addExprToCache(expression, { filter: func });
		} else {
			this.filters.push(fromCacheMap.filter);
			this.whereArgs = this.whereArgs.concat(args);
		}
		// ---

		return this;
	}

	/**
	 * Limit select to given number of records
	 * @param limit
	 */
	limit(limit) {
		limit = ~~limit;

		if (!limit) {
			throw new Error("Invalid limit value");
		}

		this.limitValue = limit;

		return this;
	}

	/**
	 * Skip give number of records
	 * @param skip
	 */
	skip(skip) {
		skip = ~~skip;

		if (!skip) {
			throw new Error("Invalid skip value");
		}

		this.skipValue = skip;

		return this;
	}

	/**
	 * Add ASC ordering by given field
	 * @param fieldName
	 */
	orderBy(fieldName) {
		this.orders.push({ field: fieldName, order: "asc" });
		return this;
	}

	/**
	 * Add ASC ordering by given field
	 * @param fieldName
	 */
	orderByDescending(fieldName) {
		this.orders.push({ field: fieldName, order: "desc" });
		return this;
	}

}

Query.numberOfCachedExpressions = 100;

module.exports = Query;