import {type} from "../index";
/** @type Domain */
import * as domain from "./domain.js";
import Entity from "../src/Entity";
import Employee from "./Employee";
// import Employee from "./Employee.js";

// const Employee = require("./Employee.js");

// export class Enterprise extends Entity<Enterprise> {
//
//     /**
// 	 * Name of enterprise
//      * @type {string}
//      */
// 	name: string = <any>type.string.length(150);
//
//     /**
// 	 * Date and time when entity were created
//      * @type {Date}
//      */
//     created: Date = <any>type.date.now(); // .now() is shotcut for .default(() => new Date())
//
//     /**
// 	 * Date and time when entity were deleted
//      * @type {Date}
//      */
//     deleted: Date = <any>type.boolean.default(false);
//
//     // /**
// 	 // * List of users
//     //  * @type {Array<Employee>}
//     //  */
//     // users: Array<Employee> = <any>type.foreign("Employee").hasMany("enterpriseId")
//
// 	constructor() {
// 		super(type.number);
// 	}
//
// 	static seed() {
// 		return [
// 			new Enterprise().mapFrom({ name: "Fukushima", created: new Date("2017-10-10") })
// 		];
// 	}
// }
//
// domain.registerEntity(Enterprise);

// let e = new Enterprise2();
//
// // console.log(Object.getOwnPropertyNames(new Enterprise2()));
// // console.log((class Test { constructor() {} }).prototype.constructor.name );
//
// Object.defineProperty(Enterprise2.prototype, "name", {
// 	enumerable: true,
// 	get: function () {
// 		// noinspection JSAccessibilityCheck
// 		return this.__properties["name"];
// 	},
// 	set: function (value) {
// 		// Change value
// 		// noinspection JSAccessibilityCheck
// 		this.__properties["name"] = value;
// 		// Mark change
// 		// noinspection JSAccessibilityCheck
// 		this.__changedProperties.push("name");
// 	}
// });
//
// e.name = "Taylor Mendez";
//
// console.log(e);
//

export interface IEnterprise {
	name: string;
	created: Date;
	deleted: Date;
	users: Array<Employee>;
}

/**
 * Define Enterprise entity in domain
 * @class Enterprise
 * @extends Entity<Enterprise>
 */
export const Enterprise: IEnterprise = domain.createEntity("Enterprise", {
	name: type.string.length(150).default("Unknown"),
	created: type.date.now(), // .now() is shotcut for .default(() => new Date())
	deleted: type.boolean.default(false),
	users: type.foreign("Employee").hasMany("enterpriseId")
});

//module.exports = Enterprise;