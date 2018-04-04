const assert = require("assert");
// const {Teacher} = require("./preparation/entities/Teacher");
// const {Student} = require("./preparation/entities/Student");
const {domain} = require("../preparation/domain");
const $um = require("../../index");
const $fs = require("fs");
const $path = require("path");

const MIGRATIONS_PATH = $path.join(__dirname, "..", "migrations");

/**
 * Get list of migration files
 * @returns {string[]}
 */
function getMigrationFiles(appliedToo = false) {
	return $fs.readdirSync(MIGRATIONS_PATH)
		.filter(name =>
			name.slice(-13) === ".migration.js"
			|| (appliedToo && name.slice(-18) === ".migration.applied")
		)
		.map(name => $path.join(MIGRATIONS_PATH, name));
}

/**
 * Delete old migrations
 */
function deleteMigrations() {
	for (let migration of getMigrationFiles(true)) {
		$fs.unlinkSync(migration);
	}
}

deleteMigrations();

describe("Migration", () => {

	if (domain.__adapter.constructor.needMigrations) {
		it("Can be generated", async () => {
			// Entities are't initiated so DB will be cleared in next step (it())

			console.log(domain.__createdEntities);

			let time = new Date().getTime();
			await domain.createMigration(MIGRATIONS_PATH);

			let migrationFiles = getMigrationFiles()
				.filter(name => {
					let match = name.match(/([(0-9]+)\.migration\.js/);
					return match && parseInt(match[1]) >= time
				});

			assert.equal(migrationFiles.length, 1);
		});

		it("Can be performed", async () => {
			// replace console.error (errors are logged into it)
			let origConsoleLog = console.error;
			let loggedCharacters = 0;
			console.error = function (msg) {
				loggedCharacters += (msg || "").length;
			};

			let runMig = domain.runMigration(MIGRATIONS_PATH);

			// It returns Promise
			assert.equal(runMig instanceof Promise, true);

			// It has no return value
			assert.equal(await runMig, undefined);

			// No errors in console
			assert.equal(loggedCharacters, 0);

			// Put console log back
			console.error = origConsoleLog;
		});

		it("Is generated correctly", async () => {
			deleteMigrations();

			$um.initEntitiesFrom(__dirname + "/../preparation/entities");
			await domain.createMigration(MIGRATIONS_PATH);

			let migration = $fs.readFileSync(getMigrationFiles()[0]);
		});

		it("Is performed correctly", () => {

		});
	} else {
		// Just to show some tick inside this test if migrations aren't needed
		it("Is not needed", () => {

		});
	}
});