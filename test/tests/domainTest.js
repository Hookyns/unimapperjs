/**
 * Testing domain, if instance of domain can be created and connection is OK.
 * Should be first before other tests.
 */

describe("Domain", () => {
	it("Can be instantiated", async () => {
		require("../preparation/domain");
	});

	it("Can create and close connection", async () => {
		const {domain} = require("../preparation/domain");
		let connection = await domain.__adapter.getConnection();
		await domain.__adapter.releaseConnection(connection);
	});
});