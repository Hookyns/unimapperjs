/*
 * Testing Unit of Work & transactions
 */

require("../preparation/debug"); // For debug needs
const assert = require("assert");
const {domain} = require("../preparation/domain");
const $um = require("../../index");
const {Teacher} = require("../preparation/entities/Teacher");
const {Student} = require("../preparation/entities/Student");

describe("Unit of Work & transactions", () => {

	it("Simple commit", async () => {
		await $um.immediate();// TODO: remove - just for debug

		let teacher = new Teacher({
			firstName: "John",
			lastName: "Commit"
		});

		await $um.UnitOfWork.create(async (uow) => {
			await uow.insert(teacher);
			await uow.saveChanges();
		});

		assert.equal(~~teacher.id > 0, true, "Teacher got insert Id")
	});

	it("Simple rollback", async () => {
		// Delete all teachers and students
		await Student.removeWhere(e => e.id);
		await Teacher.removeWhere(e => e.id);

		// Test if Teachers are empty
		let teachers = await Teacher.getAll().exec();
		assert.equal(teachers.length, 0, "No teacher exists in storage.");


		let teacher = new Teacher({
			firstName: "John",
			lastName: "Rollback"
		});

		await $um.UnitOfWork.create(async (uow) => {
			uow.snap(teacher); // Store state before edits

			teacher.lastName = "Rollback Wick";
			await uow.insert(teacher);

			assert.equal(teacher.lastName, "Rollback Wick", "Stored last name, before rollback, is 'Rollback Wick'.");
		});

		assert.equal(teacher.id, null, "Teacher id is null");
		assert.equal(teacher.lastName, "Rollback", "Last name changed back to 'Rollback'");

		teachers = await Teacher.getAll().exec();
		assert.equal(teachers.length, 0, "No teacher exists in storage.");
	});

	it("Simple delete commit", async () => {
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Rollback"
		});
	});

	it("Simple delete rollback", async () => {

	});

	it("Nested UoWs", async () => {

	});

	// it("assign related entity to *:1 navigation property", async () => {
	// 	// Create Teacher
	// 	let teacher = new Teacher({
	// 		firstName: "John",
	// 		lastName: "Smith"
	// 	});
	// 	await Teacher.insert(teacher);
	//
	// 	// Create student
	// 	let student = new Student({
	// 		name: "Lorem Ipsum",
	// 		teacherId: teacher.id
	// 	});
	// 	await Student.insert(student);
	//
	// 	// Create another Teacher
	// 	let teacher2 = new Teacher({
	// 		firstName: "John",
	// 		lastName: "Wick"
	// 	});
	// 	await Teacher.insert(teacher2);
	//
	// 	// Change teacher via navigation property
	//
	// 	student.teacher = teacher2;
	// 	await student.save();
	//
	// 	assert.equal(student.teacherId, teacher2.id, "Id of Teacher taken from foreign field match one from navigation property Student.teacher.id.")
	// });

	// it("access 1:N navigation property", async () => {
	// 	// Create Teacher
	// 	let teacher = new Teacher({
	// 		firstName: "John",
	// 		lastName: "Smith"
	// 	});
	// 	await Teacher.insert(teacher);
	//
	// 	let students = await teacher.students;
	// 	assert.equal(students.constructor, Array, "Array is returned from empty 1:N navigation property");
	// 	assert.equal(students.length, 0, "Empty array is returned from empty 1:N navigation property");
	//
	// 	// Create student1
	// 	let s1 = new Student({
	// 		name: "Lorem Ipsum",
	// 		teacherId: teacher.id
	// 	});
	// 	await Student.insert(s1);
	//
	// 	// Create student2
	// 	let s2 = new Student({
	// 		name: "Dolor Sit Amet",
	// 		teacherId: teacher.id
	// 	});
	// 	await Student.insert(s2);
	//
	// 	students = await teacher.students;
	// 	assert.equal(students.constructor, Array, "Array is returned from non-empty 1:N navigation property");
	// 	assert.equal(students.length, 2, "2 items are in teacher 1:N navigation property of students");
	// 	assert.equal(students[0].teacherId, teacher.id, "Teacher of student from index 0 is right teacher");
	// 	assert.equal(students[1].teacherId, teacher.id, "Teacher of student from index 1 is right teacher");
	// });
});