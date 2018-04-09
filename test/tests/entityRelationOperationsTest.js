/*
 * Testing relational operations such as getting values from navigations properties
 */

require("../preparation/debug"); // For debug needs
const assert = require("assert");
const {domain} = require("../preparation/domain");
const $um = require("../../index");
const {Teacher} = require("../preparation/entities/Teacher");
const {Student} = require("../preparation/entities/Student");

describe("Relational operations", () => {

	it("access *:1 navigation property", async () => {
		await $um.immediate();// TODO: remove - just for debug

		// Create Teacher
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Smith"
		});
		await Teacher.insert(teacher);

		// Insert student
		let student = new Student({
			name: "Lorem Ipsum",
			teacherId: teacher.id
		});
		await Student.insert(student);

		let studentTeacher = await student.teacher;
		assert.equal(studentTeacher.id, teacher.id, "Id of Teacher taken from navigation property Student.teacher.id match Student.teacherId.")
	});

	it("assign related entity to *:1 navigation property", async () => {
		// Create Teacher
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Smith"
		});
		await Teacher.insert(teacher);

		// Create student
		let student = new Student({
			name: "Lorem Ipsum",
			teacherId: teacher.id
		});
		await Student.insert(student);

		// Create another Teacher
		let teacher2 = new Teacher({
			firstName: "John",
			lastName: "Wick"
		});
		await Teacher.insert(teacher2);

		// Change teacher via navigation property

		student.teacher = teacher2;
		await student.save();

		assert.equal(student.teacherId, teacher2.id, "Id of Teacher taken from foreign field match one from navigation property Student.teacher.id.")
	});

	it("access 1:N navigation property", async () => {
		// Create Teacher
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Smith"
		});
		await Teacher.insert(teacher);

		let students = await teacher.students;
		assert.equal(students.constructor, Array, "Array is returned from empty 1:N navigation property");
		assert.equal(students.length, 0, "Empty array is returned from empty 1:N navigation property");

		// Create student1
		let s1 = new Student({
			name: "Lorem Ipsum",
			teacherId: teacher.id
		});
		await Student.insert(s1);

		// Create student2
		let s2 = new Student({
			name: "Dolor Sit Amet",
			teacherId: teacher.id
		});
		await Student.insert(s2);

		students = await teacher.students;
		assert.equal(students.constructor, Array, "Array is returned from non-empty 1:N navigation property");
		assert.equal(students.length, 2, "2 items are in teacher 1:N navigation property of students");
		assert.equal(students[0].teacherId, teacher.id, "Teacher of student from index 0 is right teacher");
		assert.equal(students[1].teacherId, teacher.id, "Teacher of student from index 1 is right teacher");
	});
});