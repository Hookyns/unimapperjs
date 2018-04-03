import {Entity} from "./Entity";

const LOG_OPERATORS_REGEX = /(\|\|)|(&&)/;
const SPLIT_GROUP_REGEX = /(^|\||&| )\(/;

const REGEX_CACHE = {};

/**
 * Map creating cache for expressions
 * @type {Map}
 */
const exprCacheMap: Map<string, any> = new Map();

/**
 * Split expression to groups maked by brackets
 * @param expr
 * @returns {Array}
 */
function splitByGroups(expr) {
    const parts = [];
    let bracketIndex, end, offset = 0, opening, closing, char;
    let part = expr;

    while ((bracketIndex = part.search(SPLIT_GROUP_REGEX)) != -1) {
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
    let operatorIndex, parts = [], part;
    while ((operatorIndex = str.search(LOG_OPERATORS_REGEX)) != -1) {
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
 * @param nested
 * @returns {*}
 */
function splitGroupsByLogicalOperators(groups, entityRegExp, nested = false) {
    let parts = [], tmp;

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

    const last = parts[parts.length - 1];

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
    let result = [], match, desc, fields, func, arg;
    for (let part of parts) {
        if (part.constructor == Array) {
            result.push(describeExpressionParts(part, exprPartRegExp));
        } else {
            if (part == "and" || part == "or") {
                result.push(part);
            } else if (match = part.match(exprPartRegExp)) {
                fields = match[1].split(".");
                func = (match[2] ? fields[fields.length - 1] : (match[3] || "exists"));

                if (func == "==" || func == "===") {
                    func = "=";
                } else if (func == "!==") {
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

/**
 * Update expression description
 * @param desc
 * @param args
 */
function updateArgsInDescribedExpression(desc, args) {
    for (let part of desc) {
        if (part.constructor === Array) {
            updateArgsInDescribedExpression(part, args);
        } else {
            if (part.field === "$") {
                part.field = args.shift();
            }
            if (part.arg === "$") {
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
function addExprToCache(expr: Function, data) {
    let strExpr: string = expr.toString();

    if (exprCacheMap.size > Query.numberOfCachedExpressions) {
        exprCacheMap.delete((<any>exprCacheMap.entries().next()).key);
    }

    exprCacheMap.set(strExpr, data);
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
    const str = expr.toString();

    // if (str[str.length - 1] == "}") {
    // 	throw new Error("Parameter expr must be simple arrow function.")
    // }

    if (str[0] == "(") {
        throw new Error("Use arrow function without brackets around parameter.");
    }

    const match = str.match(/^([\w\d$_]+?)\s*=>((?:\{\sreturn\s)?[\s\S]*(?:\})?)/);

    if (!match) {
        throw new Error("Invalid expression");
    }

    const entity = match[1];
    expr = match[2];

    return {
        entity: entity,
        expr: expr.trim()
    };
}

/**
 * Return cached RegExps for given entity
 * @param entityName
 * @returns {{MATCH_ENTITY_REGEXP: RegExp, OPERATORS_REGEX: RegExp}}
 */
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

/**
 * Create WHERE descriptive object
 * @param expr
 * @returns {{entity: String, expr: String, desc: Array}}
 */
function convertWhereExpr(expr) {
    expr = matchExpr(expr);
    const exprs = expr.expr;
    const {MATCH_ENTITY_REGEXP, OPERATORS_REGEX} = getEntityRegExps(expr.entity);

    const groups = splitByGroups(exprs);
    const parts = splitGroupsByLogicalOperators(groups, MATCH_ENTITY_REGEXP);
    expr.desc = describeExpressionParts(parts, OPERATORS_REGEX);

    return expr;
}

// noinspection JSUnusedLocalSymbols
/**
 * List of supported function/methods
 * @type {string[]}
 */
const supportedFunctions: Array<string> = ["startsWith", "includes", "endsWith"];

/**
 * @class
 */
export class Query<TEntity extends Entity<any>> {

    /**
     * Number of expressions which can be saved in memmory
     */
    static numberOfCachedExpressions: number = 100;


    /**
     * Entity
     */
    private entity: typeof Entity;

    /**
     * List of JS arrow functions for last JS filtering
     * @type {Array<Function>}
     * @private
     */
    private filters: Array<Function> = [];

    /**
     * List of filter arguments
     * @type {Array}
     * @private
     */
    private whereArgs = [];

    /**
     * List of fields which shoud be selected
     * Default null -> all fields
     * @type {Array}
     * @private
     */
    private selectFields = null;

    /**
     * Arrow function creating new object
     * @type {Function}
     * @private
     */
    private mapResultTo: Function;

    /**
     * @type {Number}
     * @private
     */
    private limitValue = null;

    /**
     * @type {Number}
     * @private
     */
    private skipValue = null;

    /**
     * @type {Array}
     * @private
     */
    private conditions = [];

    /**
     * @type {Array}
     * @private
     */
    private orders = [];

    constructor(entity: typeof Entity) {
        this.entity = <any>entity;
        this.mapResultTo = e => new (<any>entity)(e, true);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Execute prepared query and fetch results
     */
    async exec(): Promise<number | Array<any>> {
        // Put actual WHERE arguments to conditions
        updateArgsInDescribedExpression(this.conditions, this.whereArgs);

        const fetch = await (<any>this.entity.domain).__adapter.select(this.entity, this.selectFields,
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
     */
    count(): Query<TEntity> {
        this.selectFields = [{func: "count", arg: null}];
        // this.mapResultTo = e => e.count;
        return this;
    }

    /**
     * Say what you want to return
     * @param expression
     */
    select(expression: (entity: TEntity) => any): Query<TEntity> {
        const fromCacheMap = getExprFromCache(expression);

        this.mapResultTo = expression;

        if (fromCacheMap) {
            this.selectFields = fromCacheMap.selectFields;
        } else {
            let expr = matchExpr(expression);
            const fields = [];

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
     */
    where(expression: (entity: TEntity) => boolean, ...args): Query<TEntity> {
        const fromCacheMap = getExprFromCache(expression);

        if (!fromCacheMap) {
            const expr = convertWhereExpr(expression);
            const exprs = expr.expr;

            // If some coditions already exists, add this WHERE as AND
            if (this.conditions.length != 0) {
                expr.desc.unshift("and");
            }

            // let $i = this.whereArgs.length - 1;
            // let filter = "return " + expr.entity + " => " + exprs.replace(/([^\\]|^)(\$)/g, function (_, before) {
            //     $i++;
            //     if (before == ".") return before + args[$i]; // Place value directly if it's behind dot (it should be property)
            //     return before + `args[${$i}]`;
            // }) + ";";
            // let func = new Function("args", filter);

            // this.filters.push(func);
            this.whereArgs = this.whereArgs.concat(args);
            this.conditions = this.conditions.concat(expr.desc);

            addExprToCache(expression, {/*filter: func, */conditions: expr});
        } else {
            // this.filters.push(fromCacheMap.filter);
            this.whereArgs = this.whereArgs.concat(args);
            this.conditions = this.conditions.concat(fromCacheMap.conditions);
        }
        // ---

        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Apply where only if condition is true
     * @param expression
     * @param condition
     * @param args
     */
    whereIf(expression: (entity: TEntity) => boolean, condition: boolean, ...args): Query<TEntity> {
        if (condition) {
            return this.where(expression, args);
        }

        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Limit select to given number of records
     * @param limit
     */
    limit(limit: number): Query<TEntity> {
        limit = ~~limit;

        if (!limit) {
            throw new Error("Invalid limit value");
        }

        this.limitValue = limit;

        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Skip give number of records
     * @param skip
     */
    skip(skip: number): Query<TEntity> {
        skip = ~~skip;

        if (!skip && skip !== 0) {
            throw new Error("Invalid skip value");
        }

        this.skipValue = skip;

        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Add ASC ordering by given field
     * @param fieldName
     */
    orderBy(fieldName: string): Query<TEntity> {
        this.orders.push({field: fieldName, order: "asc"});
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Add ASC ordering by given field
     * @param fieldName
     */
    orderByDescending(fieldName): Query<TEntity> {
        this.orders.push({field: fieldName, order: "desc"});
        return this;
    }

}