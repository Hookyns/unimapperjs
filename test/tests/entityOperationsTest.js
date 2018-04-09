/*
 * Testing base entity operations (INSERT, SELECT, UPDATE, DELETE)
 * Should be first before other tests.
 */

require("../preparation/debug"); // For debug needs
const assert = require("assert");
const $um = require("../../index");
const {Teacher} = require("../preparation/entities/Teacher");
const {Student} = require("../preparation/entities/Student");

describe("Entity", () => {
	it("can be stored", async () => {
		await $um.immediate();

		/*
		let teacher = new Teacher();
		teacher.firstName = "John";
		teacher.lastName = "Smith";
		               |
		.. is same as \|/
		*/
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Smith"
		});

		// Insert into storage
		await Teacher.insert(teacher);

		// Id should be filled after insert
		assert.equal(teacher.id >= 1, true);
	});

	it("can be loaded", async () => {
		let teacher = await Teacher.getAll().exec();

		assert.equal(teacher.length, 1);
		assert.equal(teacher[0].firstName, "John")
	});
});