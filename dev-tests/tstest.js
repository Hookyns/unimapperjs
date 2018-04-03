"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $um = require("../index");
const type = $um.type;
const $uow = $um.UnitOfWork;
const domain_1 = require("./domain");
(async function () {
    console.log("Creating migration...");
    $um.initEntitiesFrom(__dirname + "/entities");
    await domain_1.domain.createMigration(__dirname + "/migrations");
    console.log("Migration created.");
})().catch(function (e) {
    console.error(e.stack);
}).then(async function () {
    await domain_1.domain.dispose();
});
//# sourceMappingURL=tstest.js.map