"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WhereExpression_1 = require("./WhereExpression");
const expression_1 = require("./expression");
const member_expression_1 = require("./member-expression");
/**
 * @class
 */
class Query {
    //endregion
    //region Ctor
    constructor(entity) {
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
     * @alias map
     * @param expression
     */
    select(expression) {
        const expr = expression_1.matchExpression(expression);
        this.mapResultTo = expression;
        this.selectFields = expr.selectFields;
        return this;
    }
    /**
     * Say what you want to return
     * @alias select
     * @param expression
     */
    map(expression) {
        return this.select(expression);
    }
    /**
     * Create WHERE condition in query
     * @alias filter
     * @param {(entity: TEntity) => boolean} expression
     * @param args
     */
    where(expression, ...args) {
        this.whereExpression.addExpression(expression, ...args);
        return this;
    }
    /**
     * Create WHERE condition in query
     * @alias where
     * @param {(entity: TEntity) => boolean} expression
     * @param args
     */
    filter(expression, ...args) {
        return this.where(expression, ...args);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Apply where only if condition is true
     * @alias filterIf
     * @param {(entity: TEntity) => boolean} expression
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
     * Apply where only if condition is true
     * @alias whereIf
     * @param {(entity: TEntity) => boolean} expression
     * @param condition
     * @param args
     */
    filterIf(expression, condition, ...args) {
        return this.whereIf(expression, condition, ...args);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Limit select to given number of records
     * @param limit
     */
    limit(limit) {
        limit = ~~limit;
        if (limit <= 0) {
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
        if (skip < 0) {
            throw new Error("Negative values are not allowed.");
        }
        this.skipValue = skip === 0 ? null : skip;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Slice data collection by given range
     * @param {number} from
     * @param {number} to
     */
    slice(from, to = null) {
        if (from) {
            this.skip(from);
        }
        if (to) {
            this.limit(to - from);
        }
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Add ASC ordering by given field
     * @alias sort
     * @param {(entity: TEntity) => any} fieldExpression
     */
    orderBy(fieldExpression) {
        this.orders.push({ field: member_expression_1.memberExpression(fieldExpression), order: "asc" });
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Add ASC ordering by given field
     * @param {(entity: TEntity) => any} fieldExpression
     */
    sort(fieldExpression) {
        return this.orderBy(fieldExpression);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Add DESC ordering by given field
     * @alias sortDesc
     * @param {(entity: TEntity) => any} fieldExpression
     */
    orderByDescending(fieldExpression) {
        this.orders.push({ field: member_expression_1.memberExpression(fieldExpression), order: "desc" });
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Add DESC ordering by given field
     * @param {(entity: TEntity) => any} fieldExpression
     */
    sortDesc(fieldExpression) {
        return this.orderByDescending(fieldExpression);
    }
}
//region Fields
/**
 * Number of expressions which can be saved in memmory
 */
Query.numberOfCachedExpressions = 100;
exports.Query = Query;
//# sourceMappingURL=Query.js.map