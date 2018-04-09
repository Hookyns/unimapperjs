/*
 * Testing base entity operations (INSERT, SELECT, UPDATE, DELETE)
 * Should be first before other tests.
 */

require("../preparation/debug"); // For debug needs
const assert = require("assert");
const $um = require("../../index");
const {Teacher} = require("../preparation/entities/Teacher");

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

	it("can be loaded (getAll)", async () => {
		let teacher = await Teacher.getAll().exec();

		assert.equal(teacher.length, 1, "Only 1 teacher was found.");
		assert.equal(teacher[0].firstName, "John", "First name of found entity is John.")
	});

	it("can be loaded (getById)", async () => {
		let teacher = await Teacher.getById(1);

		assert.equal(teacher instanceof Teacher, true, "Selected entity is instance of Teacher.");
		assert.equal(teacher.firstName, "John", "First name of selected entity is John.")
	});

	it("can be updated", async () => {
		let teacher = await Teacher.getById(1);
		teacher.lastName = "Wick";
		await teacher.save();

		teacher = await Teacher.getById(1);
		assert.equal(teacher instanceof Teacher, true, "Selected entity is instance of Teacher.");
		assert.equal(teacher.lastName, "Wick", "Last name of selected entity is Wick.")
	});

	it("can be deleted", async () => {
		let teacher = await Teacher.getById(1);
		await Teacher.remove(teacher);

		teacher = await Teacher.getById(1);
		assert.equal(teacher, null, "No teacher was found.");
	});
});