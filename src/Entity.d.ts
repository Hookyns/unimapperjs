import { Query } from "./Query";
import { Domain } from "./Domain";
/**
 * @class
 */
export declare abstract class Entity<TEntity extends Entity<any>> {
    /**
     * Entity identifier
     * @see ID_FIELD_NAME
     */
    abstract id: any;
    /**
     * Entity domain - set when entity created
     */
    static domain: Domain;
    /**
     * Entity description - set when entity created
     */
    private static _description;
    /**
     * Object storing entity's data
     */
    private __properties;
    /**
     * List of changed properties which will be saved
     */
    private __changedProps;
    /**
     * Entity default data
     * @private
     */
    private static __defaultData;
    /**
     * Entity states - used from UnitOfWork
     * @type {{}}
     * @private
     */
    protected __snaps: {
        [uowKey: string]: {
            __changedProps: {
                [key: string]: any;
            };
            __properties: {
                [key: string]: any;
            };
        };
    };
    /**
     * Entity Symbol ID
     * @private
     */
    protected __symbol: Symbol;
    /**
     * Delete state flag
     * @protected
     */
    protected __isRemoved: boolean;
    /**
     * Insert state flag
     * @protected
     */
    protected __isNew: boolean;
    /**
     * Update state flag
     * @protected
     */
    protected __isDirty: boolean;
    /**
     * @param [data]
     * @param {boolean} [markDataAsChangedProperties]
     */
    constructor(data?: any, markDataAsChangedProperties?: boolean);
    /**
     * Add unique key created by more fields
     * @param {Array<String>} fields List of fields
     */
    static addUnique(...fields: Array<string>): void;
    /**
     * Add primary key created by more fields
     * @param {Array<String>} fields List of fields
     */
    static addPrimary(...fields: Array<string>): void;
    /**
     * Insert new entity
     * @param {Entity} entity
     * @param [connection]
     */
    static insert<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection?: any): Promise<void>;
    /**
     * Remove entity
     * @param {Entity} entity Entity which should be removed
     * @param [connection]
     */
    static remove<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection?: any): Promise<void>;
    /**
     * Remove entities matching given query where expression
     * @param {(entity: TEntity) => boolean} expression
     * @param args
     * @returns {Promise<void>}
     */
    static removeWhere<TEntity extends Entity<any>>(expression: (entity: TEntity) => boolean, ...args: any[]): Promise<void>;
    /**
     * Get all records
     * @template TEntity
     * @returns {Query<TEntity>}
     */
    static getAll<TEntity extends Entity<any>>(): Query<TEntity>;
    /**
     * Select record by its id
     * @param {Number | Uuid | *} id
     * @param fields
     * @template TEntity
     * @returns {TEntity}
     */
    static getById<TEntity extends Entity<any>>(id: number | string, ...fields: Array<string>): Promise<any>;
    /**
     * Returns description of entity
     * @returns {{}}
     */
    static getDescription(): {};
    /**
     * Method for seeding. Implement this method and return data which should be seeded.
     */
    static seed(): Promise<Entity<any>[]>;
    /**
     * Entity mapping. Implement this method.
     * @param {Entity} map
     */
    static map(map: Entity<any>): void;
    /**
     * Reconstruct entity instance from given data. It'll not mark properties as changed.
     * @param {Object} data
     */
    static reconstructFrom(data: any): Entity<any>;
    /**
     * Return object with raw data
     * @returns {{}}
     */
    getData(): {};
    /**
     * Return object with raw data but just that changed
     * @returns {{}}
     */
    getChangedData(): {};
    /**
     * Return new object with selected properties
     * @param {Array<String>} fields List of property names
     * @returns {{}}
     */
    select(...fields: Array<string>): any;
    /**
     * Save tracked changes
     * @param [connection]
     */
    save(connection: any): Promise<void>;
    /**
     * Remove changes on this entity instance
     */
    rollbackChanges(): void;
    /**
     * Map data from given Object into current entity instance.
     * Data will me marked as changed if differ from existing values.
     * @param {Object} data
     */
    mapFrom(data: any): TEntity;
    /**
     * Reset state flags
     */
    private resetFlags();
    /**
     * Copy values from changes to own properties and clear list of changed values
     */
    private storeChanges();
    /**
     * Update changed related entities and go through many relations and update it's foreign key's
     * @param {{}} connection
     * @returns {Promise<void>}
     */
    private saveRelatedVirtuals(connection);
    /**
     * Go through virtual collections of related entities and save them
     * @param {{}} desc
     * @param {{}[]} promises
     * @param {{}} connection
     */
    private saveRelatedManyVirtuals(desc, promises, connection);
    /**
     * Save directly related virtual properties/entities
     * @param {{}} desc
     * @param {Promise[]} promises
     * @param {{}} connection
     */
    private saveSimpleRelatedVirtuals(desc, promises, connection);
    /**
     * Get object with changed virtual properties
     * @param {{}} desc
     * @returns {{}}
     */
    private getChangedVirtuals(desc);
    /**
     * Return object with hasMany virtual properties
     * @param {{}} desc
     * @returns {{}}
     */
    private getManyVirtuals(desc);
}
