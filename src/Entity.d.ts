import { Query } from "./Query";
import { Domain } from "./Domain";
export declare abstract class Entity<TEntity extends Entity<any>> {
    abstract id: any;
    static domain: Domain;
    private static _description;
    private __properties;
    private __changedProps;
    private __deleted;
    private static __defaultData;
    protected __snaps: {
        [uowKey: string]: {
            [key: string]: any;
        };
    };
    protected __symbol: Symbol;
    constructor(data?: any, markDataAsChangedProperties?: boolean);
    static addUnique(...fields: Array<string>): void;
    static addPrimary(...fields: Array<string>): void;
    static insert<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection?: any): Promise<void>;
    static remove<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection?: any): Promise<void>;
    static getAll<TEntity extends Entity<any>>(): Query<TEntity>;
    static getById<TEntity extends Entity<any>>(id: number | string, ...fields: Array<string>): Promise<any>;
    static getDescription(): {};
    static seed(): Entity<any>[];
    static map(map: Entity<any>): void;
    static reconstructFrom(data: any): Entity<any>;
    getData(): {};
    getChangedData(): {};
    select(...fields: Array<string>): any;
    save(connection: any): Promise<void>;
    mapFrom(data: any): TEntity;
    private storeChanges();
    private saveRelatedVirtuals(connection);
    private saveRelatedManyVirtuals(desc, promises, connection);
    private saveSimpleRelatedVirtuals(desc, promises, connection);
    private getChangedVirtuals(desc);
    private getManyVirtuals(desc);
}
