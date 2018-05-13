/*
 * Testing data seeding
 */

const {Teacher} = require("../preparation/entities/Teacher");
const assert = require("assert");
const $um = require("../../index");
const {domain} = require("../preparation/domain");

describe("Seed", () => {

	it("Seed", async () => {
		$um.initEntitiesFrom(__dirname + "/../preparation/entities/");
		await domain.runSeeding();

		let seededTeachersCount = await Teacher.getAll()
			.filter(t => t.firstName === "Seed")
			.count()
			.exec();

		assert.equal(seededTeachersCount, 2, "Two teachers seeded.")
	});
});