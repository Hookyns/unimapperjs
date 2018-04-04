/*
	Test in right order as should be run
 */

require("./tests/domainTest");
require("./tests/migrateTest"); // Should be before any test with entities

// Must be after
require("./tests/entityInstanceCreationTest");


require("./tests/domainDisposeTest"); // Should be last - dispose domain