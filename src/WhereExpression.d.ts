/**
 * Where expression condition builder
 */
export declare class WhereExpression {
    /**
     * List of conditions
     * @private
     */
    private conditions;
    /**
     * List of filter arguments
     * @private
     */
    private whereArgs;
    /**
     * Add expression to builder
     * @param {(entity) => boolean} expression
     * @param args
     */
    addExpression(expression: (entity) => boolean, ...args: any[]): void;
    /**
     * Return object with conditions
     * @returns {{}[]}
     */
    getConditions(): any[];
}
