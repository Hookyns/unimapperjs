const $um = require("./../index");
const type = $um.type;
const domain = require("./domain");
const Entity = require("../src/Entity");

/**
 * Define Employee entity in domain
 * @class Employee
 * @extends UniMapperEntity
 * @ type {Function<Entity<Employee>>}
 */
const Employee = domain.createEntity("Employee", {
	firstName: type.string.length(50),
	lastName: type.string.length(50),
	email: type.string.length(100).unique(),
	password: type.string.length(40),
	created: type.date.now(), // .now() is shotcut for .default(() => new Date())
	deleted: type.boolean.default(false),
	income: type.number.decimals(2).default(0),
	enterpriseId: type.number,
	enterprise: type.foreign("Enterprise").withForeign("enterpriseId")
});

module.exports = Employee;



//
//
// var e = new Employee();
//
//
// /**
//  *
//  * @type {Employee}
//  */
// var x = Employee.getById(1);
//
//
// var y = Employee.getAll().where((a) => a.email.includes("x"));