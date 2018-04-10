import { Entity } from "./Entity";
/**
 * @class
 */
export declare class Query<TEntity extends Entity<any>> {
    /**
     * Number of expressions which can be saved in memmory
     */
    static numberOfCachedExpressions: number;
    /**
     * Entity
     */
    private entity;
    /**
     * List of filter arguments
     * @type {Array}
     * @private
     */
    private whereArgs;
    /**
     * List of fields which shoud be selected
     * Default null -> all fields
     * @type {Array}
     * @private
     */
    private selectFields;
    /**
     * Arrow function creating new object
     * @type {Function}
     * @private
     */
    private mapResultTo;
    /**
     * @type {Number}
     * @private
     */
    private limitValue;
    /**
     * @type {Number}
     * @private
     */
    private skipValue;
    /**
     * @type {Array}
     * @private
     */
    private conditions;
    /**
     * @type {Array}
     * @private
     */
    private orders;
    /**
     * Where expression builder
     * @type {WhereExpression}
     */
    private whereExpression;
    constructor(entity: typeof Entity);
    /**
     * Execute prepared query and fetch results
     */
    exec(): Promise<number | Array<any>>;
    /**
     * Return just count
     */
    count(): Query<TEntity>;
    /**
     * Say what you want to return
     * @param expression
     */
    select(expression: (entity: TEntity) => any): Query<TEntity>;
    /**
     * Create WHERE condition in query
     * @param expression
     * @param args
     */
    where(expression: (entity: TEntity) => boolean, ...args: any[]): Query<TEntity>;
    /**
     * Apply where only if condition is true
     * @param expression
     * @param condition
     * @param args
     */
    whereIf(expression: (entity: TEntity) => boolean, condition: boolean, ...args: any[]): Query<TEntity>;
    /**
     * Limit select to given number of records
     * @param limit
     */
    limit(limit: number): Query<TEntity>;
    /**
     * Skip give number of records
     * @param skip
     */
    skip(skip: number): Query<TEntity>;
    /**
     * Add ASC ordering by given field
     * @param fieldName
     */
    orderBy(fieldName: string): Query<TEntity>;
    /**
     * Add ASC ordering by given field
     * @param fieldName
     */
    orderByDescending(fieldName: any): Query<TEntity>;
}
