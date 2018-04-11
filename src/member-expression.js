const MEMBER_REGEX = /\.([a-zA-Z0-9_]+)$/;

/**
 * Map creating cache for expressions
 * @type {Map}
 */
const exprCacheMap/*: Map<string, any>*/ = new Map();

exports.memberExpression = function memberExpression(expr) {
	if (!expr) {
		throw new Error("Invalid expression argument.");
	}

	let cachedExpr = exprCacheMap.get(expr);

	if (!cachedExpr) {
		let exprStr = expr.toString().trim();

		cachedExpr = exprStr.match(MEMBER_REGEX)[1];
		exprCacheMap.set(expr, cachedExpr);
	}

	return cachedExpr;
};