const {type} = require("../../../index");
const {domain} = require("../domain");

const Subject = domain.createEntity("Subject", {
    name: type.string.length(100),
    active: type.boolean
});

module.exports.Subject = Subject;