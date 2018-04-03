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
	//let allEnterprises = await Enterprise.getAll().exec();

	let propName = "id";
	let all = Enterprise.getAll();

	// let where = all.where(x => x.id === $ && (x.User.name.startsWith($) || x.User.lastname.endsWith($)), 1, "R", "n");

	// let where = all.where(x =>
	// 	x.id === $
	// 	|| (
	// 		x.name.startsWith($)
	// 		&& x.name.endsWith($)
	// 	), 1, "R", "n");

	// let where = all.where((x, filter) =>
	// 	x[filter.sortBy] === filter[0]
	// 	|| (
	// 		x.name.startsWith(filter[1])
	// 		&& x.name.endsWith(filter[3])
	// 	), [1, "R", "n"]);

	let where = all.where(x => x.$ === $, propName, 1);

	where.select(e => ({
		enterpriseName: e.name
	}));

	let exec = await where.exec();

	console.log(all, where, exec);
	// let e = new Enterprise();
	// e.name = "Foo";
	// e.created = new Date("2017-10-10");
	//
	// console.log(e);
	//
	// await Enterprise.insert(e);
	// console.log(e);

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