import {Query} from "./Query";
import {Type} from "./Type";
import {Domain} from "./Domain";
import {NumberType} from "./types/NumberType";

/**
 * @class
 */
export default abstract class Entity<TEntity extends Entity<any>> {

    //<editor-fold desc="Fields">

    /**
     * Entity domain - set when entity created
     */
    static domain: Domain = null;

    /**
     * Entity description - set when entity created
     */
    private static _description: { [fieldName: string]: Type<any> } = {
        id: new NumberType().primary().autoIncrement()
    };

    /**
     * Object storing entity's data
     */
    private __properties: { [key: string]: any; };

    /**
     * List of changed properties which will be saved
     */
    private __changedProperties: Array<string> = [];

    /**
     * Mark entity as deleted - just for some checks
     */
    private __deleted = false;

    //</editor-fold>

    //<editor-fold desc="Ctor">

    constructor(idType: Type<any> = null) {
        if (idType !== null) (<typeof Entity>this.constructor)._description.id = idType;

        // Set default data
        const defaultData = this.getDefaultValues();

        for (let p in defaultData) {
            if (defaultData.hasOwnProperty(p)) {
                this[p] = defaultData[p]();
            }
        }
    }

    // constructor(data: any, selected: boolean = false) {
    //     this.__properties = data || {};
    //     this.__changedProperties = !!data && !selected ? Object.keys(data) : [];
    // }

    //</editor-fold>

    //<editor-fold desc="Static Methods">

    /**
     * Add unique key created by more fields
     * @param {Array<String>} fields List of fields
     */
    static addUnique(...fields: Array<string>) {
        console.warn("Entity.addUnique() not implemented yet!");
        // return this;
    }

    /**
     * Add primary key created by more fields
     * @param {Array<String>} fields List of fields
     */
    static addPrimary(...fields: Array<string>) {
        console.warn("Entity.addPrimary() not implemented yet!");
        // return this;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Insert new entity
     * @param {Entity} entity
     * @param [connection]
     */
    static async insert<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection: any) {
        if (!(entity instanceof Entity)) {
            throw new Error("Parameter entity must be of type Entity");
        }
        if (entity.__properties.id > 0) {
            throw new Error("This entity already exists");
        }

        await (<any>this.domain).__adapter.insert(entity, entity.__properties, connection);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Remove entity
     * @param {Entity} entity Entity which should be removed
     * @param [connection]
     */
    static async remove<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection: any) {
        if (!(entity instanceof Entity)) {
            throw new Error("Parameter entity must be of type Entity");
        }
        entity.__deleted = true;
        await (<any>this.domain).__adapter.remove(this, {id: entity.__properties["id"]}, connection);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Get all records
     * @template TEntity
     * @returns {Query<TEntity>}
     */
    static getAll<TEntity extends Entity<any>>(): Query<TEntity> {
        return new Query(this);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Select record by its id
     * @param {Number | Uuid | *} id
     * @param fields
     * @template TEntity
     * @returns {TEntity}
     */
    static async getById<TEntity extends Entity<any>>(id: number | string, ...fields: Array<string>) {
        const entity = await (<any>this.domain).__adapter.select(this, fields || [],
            [{field: "id", func: "=", arg: id}]);

        if (!entity[0]) return null;

        return (<any>Reflect).construct(this, [entity[0], true]);
    }

    /**
     * Returns description of entity
     * @returns {{}}
     */
    static getDescription() {
        const description = {};
        const fields = this._description;

        for (let prop in fields) {
            if (fields.hasOwnProperty(prop)) {
                description[prop] = fields[prop].getDescription();
            }
        }

        return description;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Method for seeding. Implement this method and return data which should be seeded.
     */
    static seed(): Entity<any>[] {
        return [];
    }


    // noinspection JSUnusedGlobalSymbols
    /**
     * Reconstruct entity instance from given data. It'll not mark properties as changed.
     * @param {Object} data
     */
    static reconstructFrom(data: any): Entity<any> {
        let entity: Entity<any> = new (<any>this.constructor)();

        for (let field in data) {
            if (data.hasOwnProperty(field)) {
                entity[field] = data[field];
            }
        }

        return entity;
    }

    //</editor-fold>

    //<editor-fold desc="Public Methods">

    /**
     * Return new object with selected properties
     * @param {Array<String>} fields List of property names
     * @returns {{}}
     */
    select(...fields: Array<string>) {
        const outObj = {};

        // If no fields specified, select all
        if (!fields) {
            return (<any>Object).assign({}, this.__properties);
        }

        for (let f of fields) {
            outObj[f] = this.__properties[f];
        }

        return outObj;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Save tracked changes
     * @param [connection]
     */
    async save(connection: any) {
        if (this.__changedProperties.length === 0) {
            return;
        }

        if (!~~this.__properties["id"]) {
            throw new Error("You can't update entity without id");
        }

        const data = {};

        for (let field of this.__changedProperties) {
            data[field] = this.__properties[field];
        }

        await (<any>Entity.domain).__adapter.update(this.constructor, data, {id: this.__properties["id"]}, connection);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Map data from given Oject into current entity instance.
     * Data will me marked as changed if differ from existing values.
     * @param {Object} data
     */
    mapFrom(data: any): TEntity {
        //let entity: TEntity = new (<any>this.constructor)();

        for (let field in data) {
            if (data.hasOwnProperty(field)) {
                if (this[field] !== data[field] && field != "id") {
                    this.__changedProperties.push(field);
                }

                this[field] = data[field];
            }
        }

        return <any>this;
    }

    //</editor-fold>

    //<editor-fold desc="Private Methods">

    /**
     * Return object with default property values
     * @private
     * @returns {{}}
     */
    private getDefaultValues() {
        const ctor: typeof Entity = <any>this.constructor;
        console.log(ctor, ctor._description);

        // Check stored info on entity
        if ((<any>ctor)._defaultData) {
            return (<any>ctor)._defaultData;
        }

        const defaultData = {};
        const properties = ctor._description;

        for (let prop in properties) {
            if (properties.hasOwnProperty(prop)) {
                let defVal = properties[prop].getDescription().default;
                let defValFunc;

                if (typeof defVal !== "function") {
                    defValFunc = function () {
                        return defVal;
                    }
                } else {
                    defValFunc = defVal;
                }

                defaultData[prop] = defValFunc;
            }
        }

        return defaultData;
    }

    //</editor-fold>

}