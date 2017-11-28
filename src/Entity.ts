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
     * Entity identifier
     */
    id: any;

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

    // /**
    //  * List of changed properties which will be saved
    //  */
    // private __changedProperties: Array<string> = [];

    /**
     * List of changed properties which will be saved
     */
    private __changedProps: { [key: string]: any; };

    /**
     * Mark entity as deleted - just for some checks
     */
    private __deleted = false;

    //</editor-fold>

    //<editor-fold desc="Ctor">

    constructor(data: any, selected: boolean = false) {
        this.__properties = data || {};
        this.__changedProps = !!data && !selected ? Object.assign({}, data) : {};
        delete this.__changedProps["id"];
    }

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
    static async insert<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection?: any) {
        if (!(entity instanceof Entity)) {
            throw new Error("Parameter entity must be of type Entity");
        }
        if (entity.__properties.id > 0) {
            throw new Error("This entity already exists");
        }

        await (<any>this.domain).__adapter.insert(entity, entity.getData(), connection);

        // TODO: dořešit kaskádované uložení entit, včetně insertu a mazání; u required entit i u hasMany
        // Při editaci seznamu entit je třeba dohledat cizí klíč a ten upravit
        //      Př. přidám Employee do Enterprise.users bez toho, abych měnil enterpriseId u entity Employee, chci, aby se to změnilo samo

        let virts = entity.getChangedVirtuals();
        let proms = [];

        for (let v in virts) {
            if (virts.hasOwnProperty(v)) {
                let virt = virts[v];

                if (virt.id) {
                    proms.push(virt.save(connection));
                } else {
                    proms.push((<typeof Entity>virt.constructor).insert(virt, connection));
                }
            }
        }

        entity.storeChanges();

        await Promise.all(proms);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Remove entity
     * @param {Entity} entity Entity which should be removed
     * @param [connection]
     */
    static async remove<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection?: any) {
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
     * Return object with raw data
     * @returns {{}}
     */
    getData(): {} {
        const desc = (<typeof Entity>this.constructor)._description;
        const rtrn = {}, props = this.__properties, chp = this.__changedProps;

        for (let p in props) {
            if (props.hasOwnProperty(p) && (<any>desc[p]).description.type !== Type.Types.Virtual) {
                rtrn[p] = chp[p] || props[p];
            }
        }

        return rtrn;
    }

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
        if (Object.getOwnPropertyNames(this.__changedProps).length === 0) {
            return;
        }

        const id = this.__properties["id"];

        if (!id) {
            throw new Error("You can't update entity without id");
        }

        const changedData = this.__changedProps;

        // If nothing changed, do not continue
        if (Object.getOwnPropertyNames(changedData).length === 0) return;

        await (<any>Entity.domain).__adapter.update(this.constructor, changedData, {id: id}, connection);
        this.storeChanges();
    }

    /**
     * Copy values from changes to own properties and clear list of changed values
     */
    private storeChanges() {
        const chp = this.__changedProps;
        const props = this.__properties;

        for (let propName in chp) {
            if (chp.hasOwnProperty(propName)) {
                props[propName] = chp[propName];
            }
        }

        this.__changedProps = {};
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
                    this.__changedProps[field] = data[field];
                }

                // this[field] = data[field];
            }
        }

        return <any>this;
    }

    //</editor-fold>

    //<editor-fold desc"Private Methods">

    private getChangedVirtuals(): { [key: string]: Entity<any>} {
        const desc = (<typeof Entity>this.constructor)._description;
        const rtrn = {}, chp = this.__changedProps;

        for (let p in chp) {
            if (chp.hasOwnProperty(p) && (<any>desc[p]).description.withForeign) {
                rtrn[p] = chp[p];
            }
        }

        return rtrn;
    }

    //</editor-fold>
}