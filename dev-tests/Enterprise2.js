"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const domain = require("./domain.js");
exports.Enterprise = domain.createEntity("Enterprise", {
    name: index_1.type.string.length(150).default("Unknown"),
    created: index_1.type.date.now(),
    deleted: index_1.type.boolean.default(false),
    users: index_1.type.foreign("Employee").hasMany("enterpriseId")
});
