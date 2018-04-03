const $um = require("../../index");
const MySQL = require("../../adapters/MySqlAdapter");

module.exports.domain = $um.createDomain(MySQL, {
	host: '127.0.0.1',
	user: 'test',
	password: 'test',
	database: "test"
});