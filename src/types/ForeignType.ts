import {Type} from "../Type";
import {memberExpression} from "../member-expression";

// noinspection JSUnusedGlobalSymbols
/**
 * Class for cpecifiing foreign virtual type
 */
export class ForeignType extends Type<ForeignType> {
    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {string} entity Name of foreign Entity
     */
    constructor(entity: string) {
        super(ForeignType.Types.Virtual);

        if (typeof entity !== "string") {
            throw new Error("Parameter 'entity' must be string name of foreign Entity.");
        }

        /**
         * Name of foreign entity
         * @type {string}
         */
        this.description.foreignEntity = entity;

        /**
         * Name of property which hold foreign key (id to given entity)
         * @type {string}
         */
        this.description.withForeign = null;

        /**
         * Name of property in foreign entity which refer to this entity's id
         * @type {string}
         */
        this.description.hasMany = null;
    }

    /**
     * Setup real field on which foreign will be created.
     * It must be real existing field of type Number or Uuid.
     * @param {string} field
     * @returns {ForeignType}
     */
    withForeign<TEntity>(field: ((map: TEntity) => any) | string): ForeignType {
        if (field.constructor === Function) {
            return this.withForeign(memberExpression(field));
        }

        if (this.description.hasMany) {
            throw new Error("withForeign() cannot be used with hasMany()");
        }

        if (typeof field !== "string") {
            throw new Error("Parameter 'field' must be string name of field holding foreign key to foreign entity.");
        }

        this.description.withForeign = field;

        return this;
    }

    /**
     * Setup foreign field by which will be related entities found
     * @param {string} foreignField
     * @return {ForeignType}
     */
    hasMany<TEntity>(foreignField: ((map: TEntity) => any) | string): ForeignType {
        if (foreignField.constructor === Function) {
            return this.hasMany(memberExpression(foreignField));
        }

        if (this.description.withForeign) {
            throw new Error("hasMany cannot be used with withForeign()");
        }

        if (typeof foreignField !== "string") {
            throw new Error("Parameter 'foreignField' must be (string name of/expression pointing to) foreign entity's field holding key to this entity.");
        }

        this.description.hasMany = foreignField;

        return this;
    }
}
