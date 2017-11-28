# UniMapperJS
UniMapper is universal Node.js (native ES6/ES7) object mapper (ORM/ODM) which can map whatever you create adapter for.

!! Early DEVELOPMENT !!

Core almost done!

See [wiki](https://github.com/Hookyns/unimapperjs/wiki)


## Main Features
- Adapters - if your database isn't supported, you can write own adapter,
- migrations - migration scripts - you can watch that before applying,
- more connections across adapters (eg. take data from MongoDB or two MongoDBs and insert it into MySQL),
- unit of work - tracking changes in transactions,
- updating just changed properties - saving resources,
- quering like C# LINQ to Entities (with JS function names)


## TODO
- implement Entity.addUnique()
- implement Entity.addPrimary()
- implement bulk operations

## Example
First you must create domain
```javascript
const $um = require("unimapperjs");
const MySqlAdapter = require("./node_modules/unimapperjs/adapters/MySqlAdapter");
const type = $um.type;

// Domain creation - connect to MySQL
const domain = $um.createDomain(MySqlAdapter, { // connection string or object with options - specific to adapter
    host: '127.0.0.1',
    user: 'test',
    password: 'test',
    database: "dbname"
});
```

Then create entities in created domain
```javascript
/**
 * Define Enterprise entity in domain
 * @class Enterprise
 * @extends UniMapperEntity
 */
const Enterprise = domain.createEntity("Enterprise", {
	name: type.string.length(150),
	created: type.date.now(), // .now() is shotcut for .default(() => new Date())
	deleted: type.boolean.default(false),
	employees: type.foreign("Employee").hasMany("enterpriseId")
});

/**
 * Define Employee entity in domain
 * @class Employee
 * @extends UniMapperEntity
 */
const Employee = domain.createEntity("Employee", {
	firstName: type.string.length(50),
	lastName: type.string.length(50),
	email: type.string.length(100).unique(),
	password: type.string.length(40),
	created: type.date.now(), // .now() is shotcut for .default(() => new Date())
	deleted: type.boolean.default(false),
	income: type.number.decimals(2).default(0),
	enterpriseId: type.number.required(),
	enterprise: type.foreign("Enterprise").withForeign("enterpriseId")
});
```

