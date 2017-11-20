/// <reference path="../src/Domain.d.ts" />
const $um = require("./../index");

/**
 * @type {Domain}
 */
module.exports = $um.createDomain(require("./../adapters/MySqlAdapter"), {
	host: '127.0.0.1',
	user: 'test',
	password: 'test',
	database: "jumbo"
});