import {Entity} from "../../../src/Entity";
import {type} from "../../../index";
import {domain} from "../domain";
import {Enterprise} from "../../../dev-tests/entities/Enterprise";

// @domain.entity()
// export class Teacher extends Entity<Teacher>{
//     /**
//      * Teacher ID
//      */
//     id: number;
//
//     /**
//      * First name
//      */
//     firstName: string;
//
//     /**
//      * Last name
//      * @type {string}
//      */
//     lastName: string;
//
//     // /**
//     //  * Enterprise ID
//     //  */
//     // enterpriseId: number;
//     //
//     // /**
//     //  * Enterprise accessor
//     //  */
//     // enterprise: Enterprise;
//
//     static map(map: Teacher) {
//         // const {Enterprise} = require("../../../dev-tests/entities/Enterprise");
//
//         map.id = <any>type.number.primary().autoIncrement();
//         map.firstName = <any>type.string.length(50);
//         map.lastName = <any>type.string.length(50);
//         // map.enterprise = <any>type.foreign(Enterprise.name)
//         //     .withForeign<Teacher>(e => e.enterpriseId);
//     }
//
//     // seed() {
//     //     let data = [
//     //         new Teacher({ firstName: "", lastName: "" }, true)
//     //     ];
//     //
//     //     return this.initSeed(data, )
//     // }
// }


/**
 * Teacher entity
 */
@domain.entity()
export class Teacher extends Entity<Teacher>
{
    /**
     * Teacher ID
     */
    id: number = <any>type.number.primary().autoIncrement();

    /**
     * First name
     */
    firstName: string = <any>type.string.length(50);

    /**
     * Last name
     * @type {string}
     */
    lastName: string = <any>type.string.length(50);

    map(map: Teacher) {

    }
}