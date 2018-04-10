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

	it("Simple insert commit", async () => {
		await $um.immediate();// TODO: remove - just for debug

		let teacher = new Teacher({
			firstName: "John",
			lastName: "Commit"
		});

		await $um.UnitOfWork.create(async (uow) => {
			uow.insert(teacher);
			await uow.saveChanges();
		});

		assert.equal(teacher.id > 0, true, "Teacher got insert Id")
	});

	it("Simple insert rollback", async () => {
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
			uow.insert(teacher);

			assert.equal(teacher.lastName, "Rollback Wick", "Stored last name, before rollback, is 'Rollback Wick'.");
		});

		assert.equal(teacher.id, null, "Teacher id is null");
		assert.equal(teacher.lastName, "Rollback", "Last name changed back to 'Rollback'");

		teachers = await Teacher.getAll().exec();
		assert.equal(teachers.length, 0, "No teacher exists in storage.");
	});


	it("Simple update commit", async () => {
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Update"
		});
		await Teacher.insert(teacher);

		await $um.UnitOfWork.create(async (uow) => {
			teacher.lastName = "UpdateD";
			uow.update(teacher);

			await uow.saveChanges();
		});

		assert.equal(teacher.lastName, "UpdateD", "Teacher instance last name match.");

		teacher = await Teacher.getById(teacher.id);
		assert.equal(teacher.lastName, "UpdateD", "Teacher from storage last name match.");
	});

	it("Simple update rollback", async () => {
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Update"
		});
		await Teacher.insert(teacher);

		await $um.UnitOfWork.create(async (uow) => {
			uow.snap(teacher);
			teacher.lastName = "UpdateD";
			uow.update(teacher);
		});

		assert.equal(teacher.lastName, "Update", "Teacher instance last name match.");

		teacher = await Teacher.getById(teacher.id);
		assert.equal(teacher.lastName, "Update", "Teacher from storage last name match.");
	});

	it("Simple delete commit", async () => {
		// Insert some teacher
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Delete"
		});
		await Teacher.insert(teacher);
		assert.equal(teacher.id > 0, true, "Teacher was inserted.");

		await $um.UnitOfWork.create(async (uow) => {
			uow.remove(teacher);
			await uow.saveChanges();
		});

		let selTeacher = await Teacher.getById(teacher.id);
		assert.equal(selTeacher, null, "Selected teacher should be null");
	});

	it("Simple delete rollback", async () => {
		// Insert some teacher
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Delete"
		});
		await Teacher.insert(teacher);
		assert.equal(teacher.id > 0, true, "Teacher was inserted.");

		await $um.UnitOfWork.create(async (uow) => {
			uow.remove(teacher);
		});

		let selTeacher = await Teacher.getById(teacher.id);
		assert.equal(selTeacher.id, teacher.id, "Selected teacher should be null");
	});

	it("Unrelated nested UoWs commit", async () => {
		// Delete all teachers and students
		await Student.removeWhere(e => e.id);
		await Teacher.removeWhere(e => e.id);

		await $um.UnitOfWork.create(async (uow) => {
			// Insert some teacher
			let teacher = new Teacher({
				firstName: "John",
				lastName: "Delete"
			});

			// Not related nested UoW
			await $um.UnitOfWork.create(async (uow) => {
				uow.insert(teacher);
				await uow.saveChanges();
			});

			assert.equal(teacher.id > 0, true, "Teacher was inserted.");

			// Insert students
			let s1 = new Student({
				name: "Student no. 1",
				teacherId: teacher.id
			});
			uow.insert(s1);

			let s2 = new Student({
				name: "Student no. 1",
				teacherId: teacher.id
			});
			uow.insert(s2);

			await uow.saveChanges();
		});

		let teachers = await Teacher.getAll().exec();
		assert.equal(teachers.length, 1, "One teacher exists in storage.");

		let students = await Student.getAll().exec();
		assert.equal(students.length, 2, "Two students exist in storage.");
	});

	it("Unrelated nested UoWs rollback", async () => {
		// Delete all teachers and students
		await Student.removeWhere(e => e.id);
		await Teacher.removeWhere(e => e.id);

		await $um.UnitOfWork.create(async (uow) => {
			// Insert some teacher
			let teacher = new Teacher({
				firstName: "John",
				lastName: "Delete"
			});

			// Not related nested UoW
			let nestedUoW = await $um.UnitOfWork.create(async (uow) => {
				uow.insert(teacher);
			});

			assert.equal(nestedUoW.rolledBack, true, "Unrelated nested UoW was rolled back.");
		});

		let teachers = await Teacher.getAll().exec();
		assert.equal(teachers.length, 0, "No teacher exists in storage.");
	});

	it("Unrelated nested UoWs throw rollback", async () => {
		// Delete all teachers and students
		await Student.removeWhere(e => e.id);
		await Teacher.removeWhere(e => e.id);

		let err;
		try {
			await $um.UnitOfWork.create(async (uow) => {
				// Insert some teacher
				let teacher = new Teacher({
					firstName: "John",
					lastName: "Delete"
				});

				// Not related nested UoW
				await $um.UnitOfWork.create(async (uow) => {
					uow.insert(teacher);
					throw new Error("Some error...");
					await uow.saveChanges();
				});

				assert.equal(teacher.id > 0, true, "Teacher was inserted.");

				// Insert students
				let s1 = new Student({
					name: "Student no. 1",
					teacherId: teacher.id
				});
				uow.insert(s1);

				let s2 = new Student({
					name: "Student no. 1",
					teacherId: teacher.id
				});
				uow.insert(s2);

				await uow.saveChanges();
			});
		} catch (e) {
			err = e;
		}

		assert.equal(err.message, "Some error...", "Error has been throwed.");

		let teachers = await Teacher.getAll().exec();
		assert.equal(teachers.length, 0, "No teacher exists in storage.");

		let students = await Student.getAll().exec();
		assert.equal(students.length, 0, "No students exist in storage.");
	});

	it("Related nested UoWs commit", async () => {
		// Delete all teachers and students
		await Student.removeWhere(e => e.id);

		// Insert some teacher
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Delete"
		});
		await Teacher.insert(teacher);

		await $um.UnitOfWork.create(async (uow) => {
			let s1 = new Student({
				name: "Student no. 1",
				teacherId: teacher.id
			});
			uow.insert(s1);

			await uow.nest(async (uow) => {
				let s2 = new Student({
					name: "Student no. 2",
					teacherId: teacher.id
				});
				uow.insert(s2);

				await uow.saveChanges();
			});

			await uow.saveChanges();
		});

		let students = await Student.getAll().exec();
		assert.equal(students.length, 2, "Two students exist in storage.");
	});

	it("Related nested UoWs, nest rollback", async () => {
		// Delete all teachers and students
		await Student.removeWhere(e => e.id);

		// Insert some teacher
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Delete"
		});
		await Teacher.insert(teacher);

		let s1 = new Student({
			name: "Student no. 1",
			teacherId: teacher.id
		});

		let s2 = new Student({
			name: "Student no. 2",
			teacherId: teacher.id
		});

		await $um.UnitOfWork.create(async (uow) => {
			uow.insert(s1);

			await uow.nest(async (uow) => {
				uow.insert(s2);
				//rollback
			});

			await uow.saveChanges();
		});

		let students = await Student.getAll().exec();

		assert.equal(students.length, 1, "One students exist in storage.");
		assert.equal(s1.id, students[0].id, "Stored student is student s1");
	});

	it("Related nested UoWs, main rollback", async () => {
		// Delete all teachers and students
		await Student.removeWhere(e => e.id);

		// Insert some teacher
		let teacher = new Teacher({
			firstName: "John",
			lastName: "Delete"
		});
		await Teacher.insert(teacher);

		let s1 = new Student({
			name: "Student no. 1",
			teacherId: teacher.id
		});

		let s2 = new Student({
			name: "Student no. 2",
			teacherId: teacher.id
		});

		await $um.UnitOfWork.create(async (uow) => {
			uow.insert(s1);

			await uow.nest(async (uow) => {
				uow.insert(s2);

				await uow.saveChanges();
			});

			//rollback
		});

		let students = await Student.getAll().exec();
		assert.equal(students.length, 0, "No student exist in storage.");
	});
});