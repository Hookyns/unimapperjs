/*
 * Testing query selection
 */

require("../preparation/debug"); // For debug needs
const assert = require("assert");
const $um = require("../../index");
const {Teacher} = require("../preparation/entities/Teacher");
const {Student} = require("../preparation/entities/Student");
const {Subject} = require("../preparation/entities/Subject");

function createTeacher(n) {
	let [f, l] = n.split(" ");
	return new Teacher({
		firstName: f,
		lastName: l
	});
}

function createStudent(n, t) {
	return new Student({
		name: n,
		teacherId: t
	});
}

function createSubject(n, a) {
	return new Subject({
		name: n,
		active: a
	});
}

async function insertTestData() {
	// Delete all teachers and students
	await Student.removeWhere(e => e.id);
	await Teacher.removeWhere(e => e.id);
	await Subject.removeWhere(e => e.id);

	let promises = [];

	// Insert some subjects
	promises.push(Subject.insert(createSubject("Math", true)));
	promises.push(Subject.insert(createSubject("English", true)));
	promises.push(Subject.insert(createSubject("Physics", false)));

	await Promise.all(promises);
	promises = [];

	// Insert some teachers
	let t1 = createTeacher("Ubiquitous Teacher");
	promises.push(Teacher.insert(t1));
	let t2 = createTeacher("Spasmodic Teacher");
	promises.push(Teacher.insert(t2));
	let t3 = createTeacher("Ubiquitous Ukulele");
	promises.push(Teacher.insert(t3));
	let t4 = createTeacher("Sartorial Potato");
	promises.push(Teacher.insert(t4));
	let t5 = createTeacher("Luminous Chair");
	promises.push(Teacher.insert(t5));

	await Promise.all(promises);
	promises = [];

	// Insert some students
	promises.push(Student.insert(createStudent("Recalcitant Ukulele", t1.id)));
	promises.push(Student.insert(createStudent("Mannered Bushes", t1.id)));
	promises.push(Student.insert(createStudent("Withering Locomotive", t1.id)));
	promises.push(Student.insert(createStudent("Platitudinous Cookies", t1.id)));
	promises.push(Student.insert(createStudent("Petulant Designer", t2.id)));
	promises.push(Student.insert(createStudent("Concomitant Apples", t2.id)));
	promises.push(Student.insert(createStudent("Lachrymose Soaper", t2.id)));
	promises.push(Student.insert(createStudent("Inveterate Flatter", t2.id)));
	promises.push(Student.insert(createStudent("Contumacious Beets", t2.id)));
	promises.push(Student.insert(createStudent("Jocular Rainbows", t2.id)));
	promises.push(Student.insert(createStudent("Noxious Bushes", t3.id)));
	promises.push(Student.insert(createStudent("Animistic Inker", t3.id)));
	promises.push(Student.insert(createStudent("Tremulous Model", t3.id)));
	promises.push(Student.insert(createStudent("Voluble Carrot", t4.id)));
	promises.push(Student.insert(createStudent("Minatory Circus", t4.id)));
	promises.push(Student.insert(createStudent("Pendulous Producer", t4.id)));
	promises.push(Student.insert(createStudent("Pervasive Shop foreman", t4.id)));
	promises.push(Student.insert(createStudent("Defamatory Circus", t4.id)));

	await Promise.all(promises);
}

describe("Query selection", () => {

	it("insert test data", async () => {
		await $um.immediate();// TODO: remove - just for debug

		// Prepare test data
		await insertTestData();

		assert.equal((await Subject.getAll().exec()).length, 3, "3 subjects exist");
		assert.equal((await Teacher.getAll().exec()).length, 5, "5 teachers exist");
		assert.equal((await Student.getAll().exec()).length, 18, "18 students exist");
	});

	it("select - sort, filter includes", async () => {
		// Teachers their first name contains "u"
		let teachers = await Teacher.getAll()
			.filter(t => t.firstName.includes("u"))
			.sort(t => t.firstName)
			.exec();

		assert.equal(teachers.length, 3, "3 teachers match query");
		assert.equal(teachers[0].lastName, "Chair", "Name of 1st teacher is 'Chair'");
		assert.equal(teachers[1].lastName, "Teacher", "Name of 2nd teacher is 'Teacher'");
		assert.equal(teachers[2].lastName, "Ukulele", "Name of 3rd teacher is 'Ukulele'");
	});

	it("select - sortDesc; filter: startsWith, endsWith; slice; variable parameter", async () => {
		// Students their name starts with 'P' or ends with 's'
		let startsWith = "P";
		let students = await Student.getAll()
			.filter(s => s.name.startsWith($) || s.name.endsWith("s"), startsWith)
			.sortDesc(s => s.name)
			.slice(3, 8) // limit 5, skip 3
			.exec();

		assert.equal(students.length, 5, "5 students match query");
		assert.equal(students[0].name, "Pendulous Producer", "Name of first student is 'Pendulous Producer'");
		assert.equal(students[4].name, "Jocular Rainbows", "Name of last student is 'Jocular Rainbows'");
	});

	it("select - count", async () => {
		let onlyActive = true;
		let activeSubjectsCount = await Subject.getAll()
			.filterIf(s => s.active === true, onlyActive) // if (onlyActive) { .filter(s => s.active === true) }
			.count()
			.exec();

		assert.equal(activeSubjectsCount, 2, "2 active subjects exists");
	});

	it("select - map; sort", async () => {
		let subjectNames = await Subject.getAll()
			.sort(s => s.name)
			.map(s => s.name) // select only names ; in SQL SELECT name FROM Subject
			.exec();

		assert.equal(subjectNames.length, 3, "3 subjects exists");
		assert.equal(subjectNames[0], "English", "1st subject is 'English'");
		assert.equal(subjectNames[1], "Math", "2nd subject is 'Math'");
		assert.equal(subjectNames[2], "Physics", "3rd subject is 'Physics'");
	});

	it("select - map to new object; sort", async () => {
		let subjectNames = await Subject.getAll()
			.sort(s => s.name)
			.map(s => ({
				id: s.id,
				name: s.name
			}))
			.exec();

		assert.equal(subjectNames.length, 3, "3 subjects exists");
		assert.equal(subjectNames[0].name, "English", "1st subject is 'English'");
		assert.equal(subjectNames[1].name, "Math", "2nd subject is 'Math'");
		assert.equal(subjectNames[2].name, "Physics", "3rd subject is 'Physics'");
	});
});