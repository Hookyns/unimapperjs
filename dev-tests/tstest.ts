"use strict";

import * as $um from "../index";
const type = $um.type;
const $uow = $um.UnitOfWork;

/**
 * @type {Domain}
 */
import {domain} from "./domain";
import {Employee} from "./entities/Employee";
import {User} from "./entities/User";
import {Enterprise} from "./entities/Enterprise";

(async function () {
    console.log("Creating migration...");
    $um.initEntitiesFrom(__dirname + "/entities");
    await domain.createMigration(__dirname + "/migrations");
    console.log("Migration created.");


    // TODO: udělat migraci a spustit ji; vyzkoušet propojení Enterprise a Employee

    // let user = new User();
    // console.log(new User(), new Enterprise());

    //region Enterprise

    // // await domain.createMigration(__dirname + "/migrations");
    // // await domain.runMigration(__dirname + "/migrations");
    // //let allEnterprises = await Enterprise.getAll().exec();
    //
    // let propName = "id";
    // let all = Enterprise.getAll();
    //
    // // let where = all.where(x => x.id === $ && (x.User.name.startsWith($) || x.User.lastname.endsWith($)), 1, "R", "n");
    //
    // // let where = all.where(x =>
    // // 	x.id === $
    // // 	|| (
    // // 		x.name.startsWith($)
    // // 		&& x.name.endsWith($)
    // // 	), 1, "R", "n");
    //
    // // let where = all.where((x, filter) =>
    // // 	x[filter.sortBy] === filter[0]
    // // 	|| (
    // // 		x.name.startsWith(filter[1])
    // // 		&& x.name.endsWith(filter[3])
    // // 	), [1, "R", "n"]);
    //
    // all.where(x => x.$ === $, propName, 1);
    //
    // all.select(e => ({
    //     enterpriseName: e.name
    // }));
    //
    // let exec = await all.exec();
    //
    // // console.log(all, exec);
    //
    // console.log("new Enterprise", new Enterprise());
    // // let e = new Enterprise();
    // // e.name = "Foo";
    // // e.created = new Date("2017-10-10");
    // //
    // // console.log(e);
    // //
    // // await Enterprise.insert(e);
    // // console.log(e);
    //
    // // let emp = new Employee();
    // // emp.firstName = "Taylor";
    // // emp.lastName = "Mendez";
    // // emp.enterpriseId = e.id;
    //
    //
    // // console.log(Enterprise.toString());
    // //
    // //
    // // var enterprises = await Enterprise.getAll().exec();
    // //
    // //
    // //
    // // console.log(enterprises, Object.getOwnPropertyNames(enterprises[0]));

    //endregion

})().catch(function (e) {
    console.error(e.stack);
}).then(async function () {
    await domain.dispose();
});