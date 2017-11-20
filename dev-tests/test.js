"use strict";

const $um = require("./../index");
const type = $um.type;
// const $uow = $um.UnitOfWork;

/**
 * @type {Domain}
 */
const domain = require("./domain");
// const Employee = require("./Employee");
const {Enterprise} = require("./Enterprise");


(async function () {

	// class A {
	// 	constructor(a) {
	// 		this.a = a;
	// 	}
	// }
	//
	// class B extends A {
	// 	constructor() {
	// 		super("b");
	// 	}
	// }
	//
	// function ctor() {
	// 	A.call(this, "ctor");
	// }
	//
	// B.constructor = ctor;
	// B.prototype.constructor = ctor;
	//
	// console.log(new B);

	// await domain.createMigration(__dirname + "/migrations");
	// await domain.runMigration(__dirname + "/migrations");

	let e = new Enterprise();
	// console.log(e);

	e.created = new Date("2017-10-10");

	// console.log(e);


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