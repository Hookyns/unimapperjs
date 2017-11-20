import {Type} from "../Type";

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

        this.description.foreignEntity = entity;
        this.description.withForeign = null;
        this.description.hasMany = null;
    }

    /**
     * Setup real field on which foreign will be created.
     * It must be real existing field of type Number or Uuid.
     * @param {string} field
     * @returns {ForeignType}
     */
    withForeign(field: string): ForeignType {
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
    hasMany(foreignField: string): ForeignType {
        if (this.description.withForeign) {
            throw new Error("hasMany cannot be used with withForeign()");
        }

        if (typeof foreignField !== "string") {
            throw new Error("Parameter 'foreignField' must be string name of foreign entity's field holding key to this entity.");
        }

        this.description.hasMany = foreignField;

        return this;
    }
}
