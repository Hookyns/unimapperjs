import { Entity } from "./Entity";
import { IAdapterStatic } from "./IAdapter";
export declare class Domain {
    private __adapter;
    private __connectionInfo;
    private __createdEntities;
    constructor(adapter: IAdapterStatic, connectionInfo: any);
    createEntity(name: any, properties: any, idType?: any, _entityClass?: typeof Entity): typeof Entity;
    entity(): (target: Function) => void;
    nativeQuery(query: any, ...params: any[]): Promise<any>;
    getEntityByName(entityName: string): typeof Entity;
    createMigration(path: any): Promise<void>;
    runMigration(path: any): Promise<void>;
    runMigrations(...paths: any[]): Promise<void>;
    dispose(): Promise<void>;
    private removeEntities(tables, output);
    private updateEntity(entity, fields, fieldsLowerCase, output, foreigns);
    private static updateEntityField(fieldsLowerCase, fieldNameLowerCase, entity, tableInfoLowerCase, output);
    private static removeField(tableInfoLowerCase, notReducedFieldsLowerCase, tableInfo, output, entity);
    private static addForeignKeys(foreigns, output);
    private static removeForeignKey(tableInfo, foreigns, entity, output);
    private static filterForeignKeys(tableInfo, foreigns, entity);
    private static prepareFields(entity, fields, foreigns);
    private addEntityClassInfo(entity, name, properties);
    private proxifyEntityProperties(properties, entity);
    private getDefaultValues(properties);
}
