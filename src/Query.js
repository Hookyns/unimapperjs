/**
 * Map creating cache for expressions
 * @type {Map}
 */
const exprCacheMap = new Map();

/**
 * Split expression to groups maked by brackets
 * @param expr
 * @returns {Array}
 */
function splitByGroups(expr) {
	var parts = [];
	var bracketIndex, end, offset = 0, opening, closing, char;
	var part = expr;

	while ((bracketIndex = part.search(/(^|\||&| )\(/)) != -1) {
		// Search FIX - match symbol before bracket
		if (bracketIndex != 0 || part.charAt(0) != "(") {
			bracketIndex++;
		}

		// Count brackets -> find ending bracket
		opening = 1;
		closing = 0;
		offset = bracketIndex + 1;
		while (opening != closing && offset < part.length) {
			char = part.charAt(offset);
			if (char == "(") opening++;
			else if (char == ")") closing++;
			offset++;
		}

		if (opening != closing) {
			throw new Error("Expression has unclosed bracket");
		}

		parts.push(part.slice(0, bracketIndex).trim());
		end = offset - 1;
		// Find nested groups
		parts.push(splitByGroups(part.slice(bracketIndex + 1, end).trim()));
		part = part.slice(end + 1).trim();
	}

	if (parts.length == 0) {
		parts.push(expr);
	}
	return parts;
}

/**
 * Split part of expression by logical operators
 * @param str
 * @param entityRegExp
 * @returns {Array}
 */
function splitByLogicalOperators(str, entityRegExp) {
	var operatorIndex, parts = [], part;
	while ((operatorIndex = str.search(/(\|\|)|(&&)/)) != -1) {
		part = str.slice(0, operatorIndex).trim();
		// Check if this part is relevant for query -> contains entity variable
		// -> if it do nothing with entity, it shouldn't be in query eg. 1 == 1
		if (entityRegExp.test(part)) {
			parts.push(part);
		}
		parts.push(str.charAt(operatorIndex) == "|" ? "or" : "and");

		str = str.slice(operatorIndex + 2);
	}

	if (str.length > 0 && entityRegExp.test(str)) {
		parts.push(str);
	}

	return parts;
}

/**
 * Go through array with groups and split that groups into array by loical operators
 * @param groups
 * @param entityRegExp
 * @returns {*}
 */
function splitGroupsByLogicalOperators(groups, entityRegExp, nested = false) {
	var parts = [], tmp;

	for (let part of groups) {
		if (part.constructor == Array) {
			tmp = splitGroupsByLogicalOperators(part, entityRegExp, true);
			if (tmp.length) {
				parts.push(tmp);
			}
		} else {
			tmp = splitByLogicalOperators(part, entityRegExp);
			if (tmp) {
				parts = parts.concat(tmp);
			}
		}
	}

	// Check if there are some doubled logical operators after removing irelevant parts
	for (let i = 0; i < parts.length; i++) {
		if ((parts[i] == "and" || parts[i] == "or") && (parts[i + 1] == "and" || parts[i + 1] == "or")) {
			parts.splice(i, 1);
			i--;
		}
	}

	var last = parts[parts.length - 1];

	// Remove operators at end of group
	if (last == "or" || last == "and") {
		parts = parts.slice(0, -1);
	}

	// If it's only one part, return that part; but returned value must be always array
	if (parts.length == 1 && (nested || parts[0].constructor == Array)) {
		return parts[0];
	}

	return parts;
}

/**
 * Take groups of expression parts and create new object with parts description
 * @param {Array} parts
 * @param {RegExp} exprPartRegExp
 * @returns {Array}
 */
function describeExpressionParts(parts, exprPartRegExp) {
	var result = [], match, desc, fields, func, arg;
	for (let part of parts) {
		if (part.constructor == Array) {
			result.push(describeExpressionParts(part, exprPartRegExp));
		} else {
			if (part == "and" || part == "or") {
				result.push(part);
			} else if (match = part.match(exprPartRegExp)) {
				fields = match[1].split(".");
				func = (match[2] ? fields[fields.length - 1] : (match[3] || "exists"));

				if (func == "==") {
					func = "=";
				}

				arg = match[2] || match[4];

				if (arg && arg.charAt(0) == arg.charAt(arg.length - 1) && (arg.charAt(0) == "'" || arg.charAt(0) == '"')) {
					arg = arg.slice(1, -1);
				}

				desc = {
					field: match[2] ? fields.slice(0, -1).join(".") : fields.join("."),
					func: func.toLowerCase(),
					arg: arg
				};

				result.push(desc);
			}
		}
	}

	return result;
}

/**
 * Update expression description
 * @param desc
 * @param args
 */
function updateArgsInDescribedExpression(desc, args) {
	for (let part of desc) {
		if (part.constructor == Array) {
			updateArgsInDescribedExpression(part, args);
		} else {
			if (part.arg == "$") {
				part.arg = args.shift();
			}
		}
	}
}

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
		expr: expr.trim()
	};
}

/**
 * Create WHERE descriptive object
 * @param expr
 * @returns {{entity: String, expr: String, desc: Array}}
 */
function convertWhereExpr(expr) {
	expr = matchExpr(expr);
	var exprs = expr.expr;

	var groups = splitByGroups(exprs);
	var parts = splitGroupsByLogicalOperators(groups, new RegExp("(^|[^\\w\\d])" + expr.entity + "[ \\.\\)]"));
	expr.desc = describeExpressionParts(parts,
		new RegExp("(?:^|[^\\w\\d])" + expr.entity
			+ "\\.((?:\\.?[\\w\\d]+)+)(?:\\((.*?)\\))?(?:\\s(>|<|(?:==)|(?:!=)|(?:<=)|(?:>=)|(?:in))\\s(.*))?"));

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
		// Put actual WHERE arguments to conditions
		updateArgsInDescribedExpression(this.conditions, this.whereArgs);

		var fetch = await this.entity.domain.__adapter.select(this.entity, this.selectFields,
			this.conditions, this.orders, this.limitValue, this.skipValue);

		// for (let filter of this.filters) {
		// 	// console.log(filter.toString());
		// 	fetch = fetch.filter(filter(this.whereArgs));
		// }

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
		this.selectFields = [{func: "count", arg: null}];
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

			expr.expr.replace(new RegExp(expr.entity + "\\.([\\w_]+)", "g"), function (_, field) {
				fields.push(field);
			});

			this.selectFields = fields;
			addExprToCache(expression, {selectedFields: fields});
		}

		return this;
	}

	/**
	 * Create WHERE condition in query
	 * @param expression
	 * @param args
	 * @returns {Query}
	 */
	where(expression, ...args) {
		var fromCacheMap = getExprFromCache(expression);

		if (!fromCacheMap) {
			var expr = convertWhereExpr(expression);
			var exprs = expr.expr;

			// If some coditions already exists, add this WHERE as AND
			if (this.conditions.length != 0) {
				expr.desc.unshift("and");
			}

			let $i = this.whereArgs - 1;
			let filter = "return " + expr.entity + " => " + exprs.replace(/([^\\]|^)(\$)/g, function (_, before) {
					$i++;
					return before + `args[${$i}]`;
				}) + ";";
			let func = new Function("args", filter);

			this.filters.push(func);
			this.whereArgs = this.whereArgs.concat(args);
			this.conditions = this.conditions.concat(expr.desc);

			addExprToCache(expression, {filter: func, conditions: expr});
		} else {
			this.filters.push(fromCacheMap.filter);
			this.whereArgs = this.whereArgs.concat(args);
			this.conditions = this.conditions.concat(fromCacheMap.conditions);
		}
		// ---

		return this;
	}

	/**
	 * Apply where only if condition is true
	 * @param expression
	 * @param {Boolean} condition
	 * @param args
	 * @returns {Query}
	 */
	whereIf(expression, condition, ...args) {
		if (condition) {
			return this.where(expression, args);
		}

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

		if (!skip && skip !== 0) {
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
		this.orders.push({field: fieldName, order: "asc"});
		return this;
	}

	/**
	 * Add ASC ordering by given field
	 * @param fieldName
	 */
	orderByDescending(fieldName) {
		this.orders.push({field: fieldName, order: "desc"});
		return this;
	}

}

Query.numberOfCachedExpressions = 100;

module.exports = Query;