import Entity from "./Entity";
export declare class Domain {
    private __adapter;
    private __connectionInfo;
    constructor(adapter: any, connectionInfo: any);
    createEntity(name: any, properties: any, idType?: any): typeof Entity;
    nativeQuery(query: any, ...params: any[]): Promise<any>;
    getEntityByName(entityName: string): any;
    createMigration(path: any): Promise<void>;
    runMigration(path: any): Promise<void>;
    runMigrations(...paths: any[]): Promise<void>;
    dispose(): Promise<void>;
    private static removeEntities(tables, output);
    private updateEntity(entity, fields, output, notReducedFieldsLowerCase, foreigns);
    private static updateEntityField(notReducedFieldsLowerCase, f, tableInfoLowerCase, output, entity, fields);
    private static removeField(tableInfoLowerCase, notReducedFieldsLowerCase, tableInfo, output, entity);
    private static addForeignKeys(foreigns, output);
    private static removeForeignKey(tableInfo, foreigns, entity, output);
    private static filterForeignKeys(tableInfo, foreigns, entity);
    private static prepareFields(entity, fields, foreigns);
    private extendEntity(defaultData);
    private addEntityClassInfo(entity, name, properties);
    private proxifyEntityProperties(properties, entity);
    private getDefaultValues(properties);
}
