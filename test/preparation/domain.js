const $um = require("../../index");
const MySQL = require("../../adapters/MySqlAdapter");

module.exports.domain = $um.createDomain(MySQL, require("./connection"));