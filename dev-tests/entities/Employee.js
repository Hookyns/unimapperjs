const {type} = require("../../index");
const {domain} = require("../domain");
// const Entity = require("../src/Entity");

/**
 * Define Employee entity in domain
 * @class Employee
 * @ type {Function<Entity<Employee>>}
 */
exports.Employee = domain.createEntity("Employee", {
	firstName: type.string.length(50),
	lastName: type.string.length(50),
	email: type.string.length(100).unique(),
	password: type.string.length(40),
	created: type.date.now(), // .now() is shotcut for .default(() => new Date())
	deleted: type.boolean.default(false),
	income: type.number.decimals(2).default(0),
	enterpriseId: type.number.nullable(),
	enterprise: type.foreign("Enterprise").withForeign("enterpriseId")/*.with...*/ //TODO: vytvořit metodu pro označení property v cizí entitě pro vazbu 1:1 => nutné kvůli aktualizaci souvisejících entit
});



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