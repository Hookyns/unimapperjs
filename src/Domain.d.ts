import { Entity } from "./Entity";
import { IAdapterStatic } from "./IAdapter";
export declare class Domain {
    /**
     * Adapter object
     */
    private __adapter;
    /**
     * Database connection string
     */
    private __connectionInfo;
    /**
     * List of created Entities (their classes)
     * @type {Function<Entity>[]}
     * @private
     */
    private __createdEntities;
    /**
     * List of entities waiting for registration.
     * @type {Function<Entity>[]}
     * @private
     */
    private __waitingEntities;
    /**
     * Domain Symbol ID
     * @protected
     */
    protected __symbol: Symbol;
    /**
     * @param {Function} adapter
     * @param {String} connectionInfo
     */
    constructor(adapter: IAdapterStatic, connectionInfo: any);
    /**
     * Create new entity schema / domain model
     * @param {String} name
     * @param {Object<Type>} properties
     * @param {Type} [idType]
     * @param {Function} [_entityClass]
     * @returns {Function}
     */
    createEntity(name: any, properties: any, idType?: any, _entityClass?: typeof Entity): typeof Entity;
    /**
     * Entity decorator registering entity
     */
    entity(): (target: Function) => void;
    /**
     * Create plain query, it shouldn't be supported by all adapters
     * @param {String} query
     * @param params
     */
    nativeQuery(query: any, ...params: any[]): Promise<any>;
    /**
     * Return entity by its name
     * @param entityName
     * @returns {*}
     */
    getEntityByName(entityName: string): typeof Entity;
    /**
     * Create migration script
     * @param {String} path
     */
    createMigration(path: any): Promise<void>;
    /**
     * Run latest migration from path
     * @param {String} path
     */
    runMigration(path: any): Promise<void>;
    /**
     * Run migrations from more paths
     * @param {Array<String>} paths
     */
    runMigrations(...paths: any[]): Promise<void>;
    /**
     * Run seeding
     * @returns {Promise<void>}
     */
    runSeeding(): Promise<void>;
    /**
     * Call dispose in adapter if needed
     */
    dispose(): Promise<void>;
    /**
     * Remove from list of waiting entities
     * @param {typeof Entity} entity
     */
    private removeFromWaiting(entity);
    /**
     * Remove removed entities
     * @private
     * @param tables
     * @param {String} output
     * @returns {String}
     */
    private removeEntities(tables, output);
    /**
     * Check for changes on existing entity
     * @private
     * @param entity
     * @param fields
     * @param fieldsLowerCase
     * @param output
     * @param foreigns
     * @returns {Promise.<*>}
     */
    private updateEntity(entity, fields, fieldsLowerCase, output, foreigns);
    /**
     * Check for changes on given entity field
     * @private
     * @param fieldsLowerCase
     * @param fieldNameLowerCase
     * @param entity
     * @param tableInfoLowerCase
     * @param output
     * @returns {*}
     */
    private static updateEntityField(fieldsLowerCase, fieldNameLowerCase, entity, tableInfoLowerCase, output);
    /**
     * Remove removed fields
     * @private
     * @param tableInfoLowerCase
     * @param notReducedFieldsLowerCase
     * @param tableInfo
     * @param output
     * @param entity
     * @returns {*}
     */
    private static removeField(tableInfoLowerCase, notReducedFieldsLowerCase, tableInfo, output, entity);
    /**
     * Add new foreign keys
     * @private
     * @param foreigns
     * @param {String} output
     * @returns {String}
     */
    private static addForeignKeys(foreigns, output);
    /**
     * Remove removed foreign keys
     * @private
     * @param tableInfo
     * @param foreigns
     * @param entity
     * @param output
     * @returns {*}
     */
    private static removeForeignKey(tableInfo, foreigns, entity, output);
    /**
     * remove foreign keys from variable foreign which has been already created
     * @param tableInfo
     * @param foreigns
     * @param entity
     */
    private static filterForeignKeys(tableInfo, foreigns, entity);
    /**
     * Remove default data, unwanted fields and find foreign keys
     * @private
     * @param entity
     * @param fields
     * @param foreigns
     * @returns {*}
     */
    private static prepareFields(entity, fields, foreigns);
    /**
     * Add extra properties to Entity
     * @private
     * @param entity
     * @param name
     * @param properties
     */
    private addEntityClassInfo(entity, name, properties);
    /**
     * Create proxy over properties which will detect changes
     * @private
     * @param properties
     * @param entity
     */
    private proxifyEntityProperties(properties, entity);
    /**
     * Return object with default property values
     * @private
     * @param properties
     * @returns {{}}
     */
    private getDefaultValues(properties);
}
