import {StringType} from "./src/types/StringType";
import {NumberType} from "./src/types/NumberType";
import {BooleanType} from "./src/types/BooleanType";
import {DateType} from "./src/types/DateType";
import {UuidType} from "./src/types/UuidType";
import {ForeignType} from "./src/types/ForeignType";
import {Domain} from "./src/Domain";

export declare const type: {
    string: StringType;
    number: NumberType;
    boolean: BooleanType,
    date: DateType,
    uuid: UuidType,
    foreign: (foreignEntityName: string) => ForeignType
};

export function createDomain(adapter: any, connectionInfo: any): Domain;

// export module UniMapperJS {
//     export declare var type: {
//
//     };
//         // /**
//         //  * @type {UnitOfWork}
//         //  */
//         // UnitOfWork: require("./src/UnitOfWork"),
//
//     export function createDomain(adapter: any, connectionInfo: any);
// }