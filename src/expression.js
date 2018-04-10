const MATCH_EXPR_REGEX = /^([\w\d$_]+?)\s*=>((?:\{\sreturn\s)?[\s\S]*(?:\})?)/;

/**
 * Map creating cache for expressions
 * @type {Map}
 */
const exprCacheMap/*: Map<string, any>*/ = new Map();

/**
 * Match parts of expression
 * @param {Function} expr
 * @returns {{ entity: String, expr: String, selectFields: String[]}}
 */
module.exports.matchExpression = function matchExpression(expr) {
	let cachedExpr = exprCacheMap.get(expr);

	if (!cachedExpr) {
		const str = expr.toString();

		// if (str[str.length - 1] == "}") {
		// 	throw new Error("Parameter expr must be simple arrow function.")
		// }

		if (str[0] === "(") {
			throw new Error("Use arrow function without brackets around parameter.");
		}

		const match = str.match(MATCH_EXPR_REGEX);

		if (!match) {
			throw new Error("Invalid expression");
		}

		const entity = match[1];
		let exprStr = match[2];

		const fields = [];
		exprStr.replace(new RegExp(entity + "\\.([\\w_]+)", "g"), function (_, field) {
			fields.push(field);
		});

		cachedExpr = {
			entity: entity,
			expr: exprStr.trim(),
			selectFields: fields
		};

		exprCacheMap.set(expr, cachedExpr);
	}

	return cachedExpr;
};