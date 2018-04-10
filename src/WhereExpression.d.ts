export declare class WhereExpression {
    private conditions;
    private whereArgs;
    addExpression(expression: (entity) => boolean, ...args: any[]): void;
    getConditions(): any[];
}
