import { Query } from "./Query";
import { Type } from "./Type";
import { Domain } from "./Domain";
export default abstract class Entity<TEntity extends Entity<any>> {
    static domain: Domain;
    private static _description;
    private __properties;
    private __changedProperties;
    private __deleted;
    constructor(idType?: Type<any>);
    static addUnique(...fields: Array<string>): void;
    static addPrimary(...fields: Array<string>): void;
    static insert<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection: any): Promise<void>;
    static remove<TEntity extends Entity<any>>(entity: Entity<TEntity>, connection: any): Promise<void>;
    static getAll<TEntity extends Entity<any>>(): Query<TEntity>;
    static getById<TEntity extends Entity<any>>(id: number | string, ...fields: Array<string>): Promise<any>;
    static getDescription(): {};
    static seed(): Entity<any>[];
    static reconstructFrom(data: any): Entity<any>;
    select(...fields: Array<string>): any;
    save(connection: any): Promise<void>;
    mapFrom(data: any): TEntity;
    private getDefaultValues();
}
