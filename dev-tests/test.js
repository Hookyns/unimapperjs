const $um = require("./../index");
const type = $um.type;
const $uow = require("../src/UnitOfWork");

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
	name: type.string.length(100).default("kokot co nevyplnil jméno"),
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
	// await domain.createMigration(__dirname + "/migrations");
	// await domain.runMigration(__dirname + "/migrations");

	try {

		await $uow.create(async uow => {

			var comment = new Comment({
				title: "Foo Bar Baz 12121",
				text: "Lorem ipsum dolor sit amet",
				author: "Taylor"
			});

			await uow.insert(comment);

			await new Promise((s, c) => {
				setTimeout(() => { s(); }, 1000);
			});

			// var article = new Article({
			// 	name: "John",
			// 	email: "johny.vest@gmail.com",
			// 	password: "4dasf9a84dh54i84sd6fg4s4f6gs4d",
			// 	price: 5.58798
			// });
			//
			// await uow.insert(article);

			uow.saveChanges();
		});
	} catch (e) {
		console.error(e);
	}

})().then(function () {
	domain.dispose();
});