/*
 * Create global fuctions describe() and it() for debug needs
 */

if (!global.describe && !global.it) {
	let itQueue = [];

	function it(_, cb) {
		itQueue.push(cb);
	}

	async function describe(_, cb) {
		cb();

		for (let cb of itQueue) {
			try {
				let a = cb();
				if (a instanceof Promise) {
					await a;
				}
			}
			catch (e) {
				console.error(e);
			}
		}
	}

	global.it = it;
	global.describe = describe;
}