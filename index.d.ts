import {StringType} from "./src/types/StringType";
import {NumberType} from "./src/types/NumberType";
import {BooleanType} from "./src/types/BooleanType";
import {DateType} from "./src/types/DateType";
import {UuidType} from "./src/types/UuidType";
import {ForeignType} from "./src/types/ForeignType";
import {Domain} from "./src/Domain";
import * as uow from "./src/UnitOfWork";

export declare const type: {
    string: StringType;
    number: NumberType;
    boolean: BooleanType,
    date: DateType,
    uuid: UuidType,
    foreign: (foreignEntityName: string) => ForeignType
};

/**
 * Create new domain context
 * @param adapter
 * @param connectionInfo
 * @returns {Domain}
 */
export function createDomain(adapter: any, connectionInfo: any): Domain;

/**
 * Unit of Work class
 */
export const UnitOfWork: uow.UnitOfWork;

/**
 * Initialize all entities; needed especially for migrations
 * @param {string} path
 */
export function initEntitiesFrom(path: string);