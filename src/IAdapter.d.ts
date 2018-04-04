import {Entity} from "./Entity";

export declare interface IAdapterStatic extends Function
{
    new(connectionInfo: any): IAdapter;

    /**
     * True if database type need migrations (basically all SQL databases need it)
     * @type {Boolean}
     */
    needMigrations: boolean;
}

export declare interface IAdapter extends IAdapterStatic
{

    /**
     * Return connection to database
     * @returns {*}
     */
    getConnection();

    /**
     * Releas connection
     * @param connection
     * @returns {Promise<void>}
     */
    releaseConnection(connection);

    /**
     * Start transaction
     * @param connection
     */
    startTransaction(connection);

    /**
     * Rollback changes
     * @param connection
     */
    rollback(connection);

    /**
     * Commit changes
     * @param connection
     */
    commit(connection);

    /**
     * Insert new record
     * @param {Entity} entity Instance of entity
     * @param {Object} data
     * @param [connection]
     * @returns {Entity}
     */
    insert(entity, data, connection);

    /**
     * Update record
     * @param {Function<Entity>} entity Entity class
     * @param {Object} data
     * @param {Object} [where]
     * @param [connection]
     */
    update(entity, data, where, connection);

    /**
     * Remove record
     * @param {Function<Entity>} entity Entity class
     * @param {Object} [where]
     * @param [connection]
     */
    remove(entity, where, connection);

    /**
     * Select records
     * @param {typeof Entity} entity
     * @param {Array<String>} select List of fields which should be selected
     * @param [conditions]
     * @param {Array<{ field: String, order: "ASC" | "DESC"}>} [order]
     * @param [limit]
     * @param [skip]
     */
    select(entity: typeof Entity, select: string[], conditions, order: { field: string, order: "asc" | "desc" }[],
        limit: number, skip: number);

    /**
     * Dispose resources - end connection pool
     */
    dispose();
}

export declare interface IMigrationableAdapter extends IAdapter
{
    /**
     * Return list with entity names
     * @returns {Array}
     */
    getListOfEntities();

    /**
     * Return entity structure with described fields
     * @param tableName
     * @returns {Object<{type: String, nullable: Boolean, length: Number, decimals: Number, primary: Boolean, unique: Boolean, autoIncrement: Boolean}>}
     */
    getEntityStructure(tableName);

    /**
     * Create new not existing entity
     * @param {String} name
     * @param {Object<{type: String, nullable: Boolean, length: Number, decimals: Number, primary: Boolean, unique: Boolean, autoIncrement: Boolean}>} fields
     */
    createEntity(name, fields);

    /**
     * Remove existing entity from database
     * @param {String} entityName
     */
    removeEntity(entityName);

    /**
     *  Add new field to entity
     * @param {String} entityName
     * @param {String} fieldName
     * @param {{type: String, nullable: Boolean, length: Number, decimals: Number, primary: Boolean, unique: Boolean, autoIncrement: Boolean}} description
     */
    addField(entityName, fieldName, description);

    /**
     * Remove field from entity
     * @param {String} entityName
     * @param {String} fieldName
     */
    removeField(entityName, fieldName);

    /**
     * Change existing field in entity
     * @param {String} entityName
     * @param {String} fieldName
     * @param {{type: String, nullable: Boolean, length: Number, decimals: Number, primary: Boolean, unique: Boolean, autoIncrement: Boolean}} description
     */
    changeField(entityName, fieldName, description);

    /**
     *
     * @param {String} entityName
     * @param {String} fieldName
     * @param {String} foreignEntity
     * @param {String} fkName
     */
    addForeignKey(entityName, fieldName, foreignEntity, fkName);

    /**
     * Removes given foreign key from given table
     * @param {String} entityName
     * @param {String} fkName
     */
    removeForeignKey(entityName, fkName);

}