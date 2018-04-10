import {Entity} from "./Entity";
import {WhereExpression} from "./WhereExpression";
import {matchExpression} from "./expression";

/**
 * @class
 */
export class Query<TEntity extends Entity<any>> {

    //region Fields

    /**
     * Number of expressions which can be saved in memmory
     */
    static numberOfCachedExpressions: number = 100;


    /**
     * Entity
     */
    private entity: typeof Entity;

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
    private selectFields: Array<any> = null;

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

	/**
     * Where expression builder
	 * @type {WhereExpression}
	 */
	private whereExpression = new WhereExpression();

	//endregion

    //region Ctor

    constructor(entity: typeof Entity) {
        this.entity = <any>entity;
        this.mapResultTo = e => new (<any>entity)(e, false);
    }

    //endregion

    //region Methods

    // noinspection JSUnusedGlobalSymbols
    /**
     * Execute prepared query and fetch results
     */
    async exec(): Promise<number | Array<any>> {
        let conditions = this.whereExpression.getConditions();

        const fetch = await (<any>this.entity.domain).__adapter.select(this.entity, this.selectFields,
	        conditions, this.orders, this.limitValue, this.skipValue);

        // It's COUNT
        if (this.selectFields && this.selectFields.length === 1 && this.selectFields[0].func === "count") {
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
        const expr = matchExpression(expression);

        this.mapResultTo = expression;
        this.selectFields = expr.selectFields;

        return this;
    }

    /**
     * Create WHERE condition in query
     * @param expression
     * @param args
     */
    where(expression: (entity: TEntity) => boolean, ...args): Query<TEntity> {
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
    whereIf(expression: (entity: TEntity) => boolean, condition: boolean, ...args): Query<TEntity> {
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

    //endregion
}