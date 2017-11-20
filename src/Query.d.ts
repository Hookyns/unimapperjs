import Entity from "./Entity";
export declare class Query<TEntity extends Entity<any>> {
    static numberOfCachedExpressions: number;
    private entity;
    private filters;
    private whereArgs;
    private selectFields;
    private mapResultTo;
    private limitValue;
    private skipValue;
    private conditions;
    private orders;
    constructor(entity: typeof Entity);
    exec(): Promise<number | Array<any>>;
    count(): Query<TEntity>;
    select(expression: (entity: TEntity) => any): Query<TEntity>;
    where(expression: (entity: TEntity) => boolean, ...args: any[]): Query<TEntity>;
    whereIf(expression: (entity: TEntity) => boolean, condition: boolean, ...args: any[]): Query<TEntity>;
    limit(limit: number): Query<TEntity>;
    skip(skip: number): Query<TEntity>;
    orderBy(fieldName: string): Query<TEntity>;
    orderByDescending(fieldName: any): Query<TEntity>;
}
