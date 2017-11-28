"use strict";

const $um = require("./../index");
const type = $um.type;
const $uow = $um.UnitOfWork;

/**
 * @type {Domain}
 */
const domain = require("./domain");
const {Employee} = require("./Employee");
const {Enterprise} = require("./Enterprise");


(async function () {

	// await domain.createMigration(__dirname + "/migrations");
	// await domain.runMigration(__dirname + "/migrations");

	let e = new Enterprise();
	e.name = "Foo";
	e.created = new Date("2017-10-10");

	console.log(e);

	await Enterprise.insert(e);
	console.log(e);

	// let emp = new Employee();
	// emp.firstName = "Taylor";
	// emp.lastName = "Mendez";
	// emp.enterpriseId = e.id;




	// console.log(Enterprise.toString());
	//
	//
	// var enterprises = await Enterprise.getAll().exec();
	//
	//
	//
	// console.log(enterprises, Object.getOwnPropertyNames(enterprises[0]));

})().catch(function (e) {
	console.error(e.stack);
}).then(async function () {
	await domain.dispose();
});