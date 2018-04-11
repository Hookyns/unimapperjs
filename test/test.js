/*
	Test in right order as should be run
 */


// If tests fail, process will still run because domain is not disposed
let disposeTimeout = setTimeout(async () => {
	const {domain} = require("./preparation/domain");
	await domain.dispose();
}, 10 * 1000);

// Testing domain first
require("./tests/domainTest");

// Test migrations then
require("./tests/migrateTest")(() => { // Must be before any test with entities

	require("./tests/entityOperationsTest");
	require("./tests/entityRelationOperationsTest");
	require("./tests/unitOfWorkTest");
	require("./tests/selectionTest");

	require("./tests/entityInstanceCreationTest");
	require("./tests/domainDisposeTest"); // Should be last - dispose domain

	clearTimeout(disposeTimeout);
});