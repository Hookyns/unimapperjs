describe("Domain", () => {
	it("Can be disposed", async () => {
		const {domain} = require("../preparation/domain");
		await domain.dispose();
	});
});