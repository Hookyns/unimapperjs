const {type} = require("../../index");
const {domain} = require("../domain");
// const Entity = require("../src/Entity").default;
// cn Employee from "./Employee";

/**
 * Define Enterprise entity in domain
 * @class Enterprise
 * @extends Entity<Enterprise>
 */
exports.Enterprise = domain.createEntity("Enterprise", {
	name: type.string.length(150).default("Unknown"),
	created: type.date.now(), // .now() is shotcut for .default(() => new Date())
	deleted: type.boolean.default(false),
	users: type.foreign("Employee").hasMany("enterpriseId")
});

// class Enterprise extends Entity {
// 	constructor() {
// 		this.name = type.string.length(150).default("Unknown");
// 		this.created = type.date.now(); // .now() is shotcut for .default(() => new Date())
// 		this.deleted = type.boolean.default(false);
// 		this.users = type.foreign("Employee").hasMany("enterpriseId")
// 	}
// }
// domain.entity()(Enterprise); // decorator
//
// exports.Enterprise = Enterprise;