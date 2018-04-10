"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
const expression_1 = require("./expression");
const LOG_OPERATORS_REGEX = /(\|\|)|(&&)/;
const SPLIT_GROUP_REGEX = /(^|\||&| )\(/;
const REGEX_CACHE = {};
const exprCacheMap = new Map();
function splitByGroups(expr) {
    const parts = [];
    let bracketIndex, end, offset = 0, opening, closing, char;
    let part = expr;
    while ((bracketIndex = part.search(SPLIT_GROUP_REGEX)) != -1) {
        if (bracketIndex != 0 || part.charAt(0) != "(") {
            bracketIndex++;
        }
        opening = 1;
        closing = 0;
        offset = bracketIndex + 1;
        while (opening != closing && offset < part.length) {
            char = part.charAt(offset);
            if (char == "(") {
                opening++;
            }
            else if (char == ")")
                closing++;
            offset++;
        }
        if (opening != closing) {
            throw new Error("Expression has unclosed bracket");
        }
        parts.push(part.slice(0, bracketIndex).trim());
        end = offset - 1;
        parts.push(splitByGroups(part.slice(bracketIndex + 1, end).trim()));
        part = part.slice(end + 1).trim();
    }
    if (parts.length == 0) {
        parts.push(expr);
    }
    return parts;
}
function splitByLogicalOperators(str, entityRegExp) {
    let operatorIndex, parts = [], part;
    while ((operatorIndex = str.search(LOG_OPERATORS_REGEX)) != -1) {
        part = str.slice(0, operatorIndex).trim();
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
function splitGroupsByLogicalOperators(groups, entityRegExp, nested = false) {
    let parts = [], tmp;
    for (let part of groups) {
        if (part.constructor == Array) {
            tmp = splitGroupsByLogicalOperators(part, entityRegExp, true);
            if (tmp.length) {
                parts.push(tmp);
            }
        }
        else {
            tmp = splitByLogicalOperators(part, entityRegExp);
            if (tmp) {
                parts = parts.concat(tmp);
            }
        }
    }
    for (let i = 0; i < parts.length; i++) {
        if ((parts[i] == "and" || parts[i] == "or") && (parts[i + 1] == "and" || parts[i + 1] == "or")) {
            parts.splice(i, 1);
            i--;
        }
    }
    const last = parts[parts.length - 1];
    if (last == "or" || last == "and") {
        parts = parts.slice(0, -1);
    }
    if (parts.length == 1 && (nested || parts[0].constructor == Array)) {
        return parts[0];
    }
    return parts;
}
function describeExpressionParts(parts, exprPartRegExp) {
    let result = [], match, desc, fields, func, arg;
    for (let part of parts) {
        if (part.constructor == Array) {
            result.push(describeExpressionParts(part, exprPartRegExp));
        }
        else {
            if (part == "and" || part == "or") {
                result.push(part);
            }
            else if (match = part.match(exprPartRegExp)) {
                fields = match[1].split(".");
                func = (match[2] ? fields[fields.length - 1] : (match[3] || "exists"));
                if (func == "==" || func == "===") {
                    func = "=";
                }
                else if (func == "!==") {
                    func = "!=";
                }
                arg = match[2] || match[4];
                if (arg && arg.charAt(0) == arg.charAt(arg.length - 1) && (arg.charAt(0) == "'" || arg.charAt(0) == '"')) {
                    arg = arg.slice(1, -1);
                }
                desc = {
                    field: (match[2] ? fields.slice(0, -1) : fields).join("."),
                    func: func.toLowerCase(),
                    arg: arg
                };
                result.push(desc);
            }
        }
    }
    return result;
}
function updateArgsInDescribedExpression(desc, args) {
    for (let part of desc) {
        if (part.constructor === Array) {
            updateArgsInDescribedExpression(part, args);
        }
        else {
            if (part.field === "$") {
                part.field = args.shift();
            }
            if (part.arg === "$") {
                part.arg = args.shift();
            }
        }
    }
}
function addExprToCache(expr, data) {
    let strExpr = expr.toString();
    if (exprCacheMap.size > Query_1.Query.numberOfCachedExpressions) {
        exprCacheMap.delete(exprCacheMap.entries().next().key);
    }
    exprCacheMap.set(strExpr, data);
}
function getExprFromCache(expr) {
    return exprCacheMap.get(expr.toString());
}
function getEntityRegExps(entityName) {
    let REGEXPS = REGEX_CACHE[entityName];
    if (!REGEXPS) {
        REGEX_CACHE[entityName] = REGEXPS = {
            MATCH_ENTITY_REGEXP: new RegExp("(^|[^\\w\\d])" + entityName + "[ \\.\\)]"),
            OPERATORS_REGEX: new RegExp("(?:^|[^\\w\\d])" + entityName
                + "\\.((?:\\.?[\\w\\d_\\$]+)+)(?:\\((.*?)\\))?(?:\\s(>|<|(?:==)|(?:!=)|(?:===)|(?:!==)|(?:<=)|(?:>=)|(?:in))\\s(.*))?")
        };
    }
    return REGEXPS;
}
function convertWhereExpr(expr) {
    expr = expression_1.matchExpression(expr);
    const exprs = expr.expr;
    const { MATCH_ENTITY_REGEXP, OPERATORS_REGEX } = getEntityRegExps(expr.entity);
    const groups = splitByGroups(exprs);
    const parts = splitGroupsByLogicalOperators(groups, MATCH_ENTITY_REGEXP);
    expr.desc = describeExpressionParts(parts, OPERATORS_REGEX);
    return expr;
}
const supportedFunctions = ["startsWith", "includes", "endsWith"];
class WhereExpression {
    constructor() {
        this.conditions = [];
        this.whereArgs = [];
    }
    addExpression(expression, ...args) {
        const fromCacheMap = getExprFromCache(expression);
        if (!fromCacheMap) {
            const expr = convertWhereExpr(expression);
            if (this.conditions.length != 0) {
                expr.desc.unshift("and");
            }
            this.whereArgs = this.whereArgs.concat(args);
            this.conditions = this.conditions.concat(expr.desc);
            addExprToCache(expression, expr);
        }
        else {
            this.whereArgs = this.whereArgs.concat(args);
            this.conditions = this.conditions.concat(fromCacheMap.desc);
        }
    }
    getConditions() {
        updateArgsInDescribedExpression(this.conditions, this.whereArgs);
        return this.conditions;
    }
}
exports.WhereExpression = WhereExpression;
//# sourceMappingURL=WhereExpression.js.map