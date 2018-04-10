"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WhereExpression_1 = require("./WhereExpression");
const expression_1 = require("./expression");
class Query {
    constructor(entity) {
        this.whereArgs = [];
        this.selectFields = null;
        this.limitValue = null;
        this.skipValue = null;
        this.conditions = [];
        this.orders = [];
        this.whereExpression = new WhereExpression_1.WhereExpression();
        this.entity = entity;
        this.mapResultTo = e => new entity(e, false);
    }
    async exec() {
        let conditions = this.whereExpression.getConditions();
        const fetch = await this.entity.domain.__adapter.select(this.entity, this.selectFields, conditions, this.orders, this.limitValue, this.skipValue);
        if (this.selectFields && this.selectFields.length === 1 && this.selectFields[0].func === "count") {
            return fetch[0].count;
        }
        return fetch.map(this.mapResultTo);
    }
    count() {
        this.selectFields = [{ func: "count", arg: null }];
        return this;
    }
    select(expression) {
        const expr = expression_1.matchExpression(expression);
        this.mapResultTo = expression;
        this.selectFields = expr.selectFields;
        return this;
    }
    where(expression, ...args) {
        this.whereExpression.addExpression(expression, ...args);
        return this;
    }
    whereIf(expression, condition, ...args) {
        if (condition) {
            return this.where(expression, ...args);
        }
        return this;
    }
    limit(limit) {
        limit = ~~limit;
        if (!limit) {
            throw new Error("Invalid limit value");
        }
        this.limitValue = limit;
        return this;
    }
    skip(skip) {
        skip = ~~skip;
        if (!skip && skip !== 0) {
            throw new Error("Invalid skip value");
        }
        this.skipValue = skip;
        return this;
    }
    orderBy(fieldName) {
        this.orders.push({ field: fieldName, order: "asc" });
        return this;
    }
    orderByDescending(fieldName) {
        this.orders.push({ field: fieldName, order: "desc" });
        return this;
    }
}
Query.numberOfCachedExpressions = 100;
exports.Query = Query;
//# sourceMappingURL=Query.js.map