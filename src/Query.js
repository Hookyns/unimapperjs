"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WhereExpression_1 = require("./WhereExpression");
const expression_1 = require("./expression");
/**
 * @class
 */
class Query {
    //endregion
    //region Ctor
    constructor(entity) {
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
        /**
         * Where expression builder
         * @type {WhereExpression}
         */
        this.whereExpression = new WhereExpression_1.WhereExpression();
        this.entity = entity;
        this.mapResultTo = e => new entity(e, false);
    }
    //endregion
    //region Methods
    // noinspection JSUnusedGlobalSymbols
    /**
     * Execute prepared query and fetch results
     */
    async exec() {
        let conditions = this.whereExpression.getConditions();
        const fetch = await this.entity.domain.__adapter.select(this.entity, this.selectFields, conditions, this.orders, this.limitValue, this.skipValue);
        // It's COUNT
        if (this.selectFields && this.selectFields.length === 1 && this.selectFields[0].func === "count") {
            return fetch[0].count;
        }
        return fetch.map(this.mapResultTo);
    }
    /**
     * Return just count
     */
    count() {
        this.selectFields = [{ func: "count", arg: null }];
        // this.mapResultTo = e => e.count;
        return this;
    }
    /**
     * Say what you want to return
     * @param expression
     */
    select(expression) {
        const expr = expression_1.matchExpression(expression);
        this.mapResultTo = expression;
        this.selectFields = expr.selectFields;
        return this;
    }
    /**
     * Create WHERE condition in query
     * @param expression
     * @param args
     */
    where(expression, ...args) {
        this.whereExpression.addExpression(expression, ...args);
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Apply where only if condition is true
     * @param expression
     * @param condition
     * @param args
     */
    whereIf(expression, condition, ...args) {
        if (condition) {
            return this.where(expression, ...args);
        }
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
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
    // noinspection JSUnusedGlobalSymbols
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
    // noinspection JSUnusedGlobalSymbols
    /**
     * Add ASC ordering by given field
     * @param fieldName
     */
    orderBy(fieldName) {
        this.orders.push({ field: fieldName, order: "asc" });
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Add ASC ordering by given field
     * @param fieldName
     */
    orderByDescending(fieldName) {
        this.orders.push({ field: fieldName, order: "desc" });
        return this;
    }
}
//region Fields
/**
 * Number of expressions which can be saved in memmory
 */
Query.numberOfCachedExpressions = 100;
exports.Query = Query;
//# sourceMappingURL=Query.js.map