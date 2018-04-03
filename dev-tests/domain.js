const $um = require("./../index");

/**
 * @type {Domain}
 */
module.exports.domain = $um.createDomain(require("./../adapters/MySqlAdapter"), {
	host: '127.0.0.1',
	user: 'test',
	password: 'test',
	database: "jumbo"
});