const assert = require("assert");
const {Teacher} = require("../preparation/entities/Teacher");

describe("Entity instantion", () => {
	it("Should be created", () => {
		assert((new Teacher()) instanceof Teacher, true);
	});

	// This test just watch basic performance, not so important; can fail on lower CPUs
    it("Should be able to create 2M instances under 1 second", () => {
	    let start = new Date();
	    let inst;

	    for (let i = 0; i < 2000000; i++) {
		    inst = new Teacher();
	    }

	    let stop = new Date();
	    assert.equal(stop.getTime() - start.getTime() < 1000, true);
    });
});