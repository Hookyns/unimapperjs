const MEMBER_REGEX = /\.([a-zA-Z0-9_]+)$/;

exports.memberExression = function memberExression(expr) {
	let exprStr = expr.toString().trim();
	return exprStr.match(MEMBER_REGEX)[1];
};