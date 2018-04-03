const assert = require("assert");
const {Teacher} = require("./preparation/entities/Teacher");

describe("Entity instance creation performance", () => {
    it("Should be able to create 2M instances under 1 second", () => {
	    let start = new Date();
	    let inst;

	    for (let i = 0; i < 2000000; i++) {
		    inst = new Teacher();
	    }

	    let stop = new Date();

	    console.log("2M entity instances created in", stop.getTime() - start.getTime());

	    assert.equal(stop.getTime() - start.getTime() < 1000, true);
    });
});