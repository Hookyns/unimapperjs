"use strict";

const $um = require("./../index");
const type = $um.type;
const $uow = $um.UnitOfWork;

const domain = $um.createDomain(require("./../adapters/MySqlAdapter"), {
	host: '127.0.0.1',
	user: 'test',
	password: 'test',
	database: "jumbo"
});

/**
 * @class Article
 * @extends UniMapperEntity
 */
const Article = domain.createEntity("Article", {
	name: type.string.length(100).default("Anonym"),
	email: type.string.length(100).unique(),
	password: type.string.length(40),
	created: type.date.now(),
	deleted: type.boolean.default(false),
	price: type.number.decimals(2)
});

/**
 * @class Comment
 * @extends UniMapperEntity
 */
const Comment = domain.createEntity("Comment", {
	title: type.string.length(100),
	text: type.string.length(null),
	author: type.string.length(30),
	created: type.date.now()
}, type.uuid);


(async function () {

	var valsIn = [1, 2, 3];

	// Some filter from client eg.
	var filter = {
		created: new Date(),
		startWith: "T",
		greaterThen: 5,
		lessThen: -5,
		inValues: [1, 2, 3],
		endWith: "r",
		findLipsum: true
	};

	filter.created.setFullYear(2016);

	var comments = await Comment.getAll()
	.where(e => e.created > $ && e.text && (e.author.endsWith($) || e.author.startsWith($))
		, filter.created, filter.endWith, filter.startWith)
	.whereIf(e => e.text.includes("ipsum"), filter.findLipsum)
	.orderBy("author")
	.limit(10)
	.skip(0)
	// .select(e => e.author)
	.exec();

	console.log(domain.__adapter.executedQueries);
	console.log("Comments:\n", comments);


	// var comment = await Comment.getById("129aa0c0-29c1-11e7-9bed-ad64d70c0265");
	// console.log(comment);
	// await Comment.remove(comment);
	// console.log(domain.__adapter.executedQueries);

	// var article = await Article.getAll().where(e => e.name.indexOf($) != -1 && (e.foo > $ || e.foo < $) || e.foo in $,
	// 	filter.name, filter.greaterThen, filter.lessThen, filter.inValues
	// ).exec();
	//
	// console.log(domain.__adapter.executedQueries);
	// console.log("Aticle", article);

	// article = await Article.getAll().where(e => e.name.indexOf($) != -1 && (e.foo > $ || e.foo < $) || e.foo in $,
	// 	filter.name, filter.greaterThen, filter.lessThen, filter.inValues
	// ).select(e => e.name).exec();
	//
	// var x = [
	// 	{ field: "name", func: "icludes", arg: "o" },
	// 	"and",
	// 	[
	// 		{ field: "foo", func: ">", arg: 5 },
	// 		"or",
	// 		{ field: "foo", func: "<", arg: -5 },
	// 	],
	// 	"or",
	// 	{ field: "foo", func: "in", arg: [1,2,3] }
	// ];
	//
	// console.log("Aticle", article);


	// repository.getAll.where(e => e.name == $ && (e.foo > $ || e.foo < $) || e.foo in $,
	// 	filter.name, filter.greaterThen, filter.lessThen, filter.inValues
	// );

	// Což by po překladu na SQL bylo
	// SELECT * FROM somewhere WHERE name = 'Test' AND (foo > 5 OR foo < -5) OR foo IN (1,2,3)


	// var x = {
	// 	$and: [
	//
	// 	]
	// };


	// console.log(await domain.nativeQuery("SELECT * FROM users JOIN roles ON users.roles_id = roles.roles_id"));


	// console.log(foo == true && bar > 5 || baz > 5);


	// await domain.createMigration(__dirname + "/migrations");
	// await domain.runMigration(__dirname + "/migrations");

	// var comment = new Comment({
	// 	title: "Foo 12121 insert rewrite",
	// 	text: "Lorem ipsum dolor sit amet dolor",
	// 	author: "Mike"
	// });
	//
	// Comment.insert(comment);
	//
	// await new Promise((s, c) => {
	// 	setTimeout(() => { s(); }, 10000);
	// });
	//
	// comment.author = "Taylor Mendez";
	// await comment.save();


	// try {
	//
	// 	await $uow.create(async uow => {
	//
	// 		var comment = new Comment({
	// 			title: "Foo Bar Baz 12121",
	// 			text: "Lorem ipsum dolor sit amet",
	// 			author: "Taylor"
	// 		});
	//
	// 		await uow.insert(comment);
	//
	// 		await new Promise((s, c) => {
	// 			setTimeout(() => { s(); }, 1000);
	// 		});
	//
	// 		// var article = new Article({
	// 		// 	name: "John",
	// 		// 	email: "johny.vest@gmail.com",
	// 		// 	password: "4dasf9a84dh54i84sd6fg4s4f6gs4d",
	// 		// 	price: 5.58798
	// 		// });
	// 		//
	// 		// await uow.insert(article);
	//
	// 		uow.saveChanges();
	// 	});
	// } catch (e) {
	// 	console.error(e);
	// }

})().catch(function (e) {
	console.error(e.stack);
}).then(function () {
	domain.dispose();
});