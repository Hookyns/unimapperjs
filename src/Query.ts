import {Entity} from "./Entity";
import {WhereExpression} from "./WhereExpression";
import {matchExpression} from "./expression";
import {memberExpression} from "./member-expression";

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
     * @alias map
     * @param expression
     */
    select(expression: (entity: TEntity) => any): Query<TEntity> {
        const expr = matchExpression(expression);

        this.mapResultTo = expression;
        this.selectFields = expr.selectFields;

        return this;
    }

	/**
	 * Say what you want to return
	 * @alias select
	 * @param expression
	 */
	map(expression: (entity: TEntity) => any): Query<TEntity> {
		return this.select(expression);
	}

    /**
     * Create WHERE condition in query
     * @alias filter
     * @param {(entity: TEntity) => boolean} expression
     * @param args
     */
    where(expression: (entity: TEntity) => boolean, ...args): Query<TEntity> {
        this.whereExpression.addExpression(expression, ...args);
        return this;
    }

	/**
	 * Create WHERE condition in query
	 * @alias where
	 * @param {(entity: TEntity) => boolean} expression
	 * @param args
	 */
	filter(expression: (entity: TEntity) => boolean, ...args): Query<TEntity> {
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
    whereIf(expression: (entity: TEntity) => boolean, condition: boolean, ...args): Query<TEntity> {
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
	filterIf(expression: (entity: TEntity) => boolean, condition: boolean, ...args): Query<TEntity> {
		return this.whereIf(expression, condition, ...args);
	}

    // noinspection JSUnusedGlobalSymbols
    /**
     * Limit select to given number of records
     * @param limit
     */
    limit(limit: number): Query<TEntity> {
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
    skip(skip: number): Query<TEntity> {
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
	slice(from: number, to: number = null): Query<TEntity>  {
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
    orderBy(fieldExpression: (entity: TEntity) => any): Query<TEntity> {
        this.orders.push({field: memberExpression(fieldExpression), order: "asc"});
        return this;
    }

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Add ASC ordering by given field
	 * @param {(entity: TEntity) => any} fieldExpression
	 */
	sort(fieldExpression: (entity: TEntity) => any): Query<TEntity> {
		return this.orderBy(fieldExpression);
	}

    // noinspection JSUnusedGlobalSymbols
	/**
	 * Add DESC ordering by given field
	 * @alias sortDesc
	 * @param {(entity: TEntity) => any} fieldExpression
	 */
	orderByDescending(fieldExpression: (entity: TEntity) => any): Query<TEntity> {
		this.orders.push({field: memberExpression(fieldExpression), order: "desc"});
		return this;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Add DESC ordering by given field
	 * @param {(entity: TEntity) => any} fieldExpression
	 */
	sortDesc(fieldExpression: (entity: TEntity) => any): Query<TEntity> {
		return this.orderByDescending(fieldExpression);
	}

    //endregion
}