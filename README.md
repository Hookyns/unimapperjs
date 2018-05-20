# UniMapperJS
[![NPM version](https://img.shields.io/npm/v/unimapperjs.svg?colorB=green)](https://www.npmjs.com/package/unimapperjs) 
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Gitter chat](https://badges.gitter.im/UniMapperJS/Lobby.svg)](https://gitter.im/UniMapperJS/Lobby)

UniMapperJS is universal Node.js (native ES6/ES7) LINQ-like object mapper (ORM/ODM) which can map whatever you create adapter for.

!! Under DEVELOPMENT !!

See [wiki](https://github.com/Hookyns/unimapperjs/wiki)


## Main Features
- Adapters - if your database isn't supported, you can write own adapter,
- migrations - migration scripts - you can check migration script before applying,
- seeding - seed default data into storage,
- more connections across adapters (eg. take data from MongoDB or two MongoDBs and insert it into MySQL),
- unit of work - tracking changes in transactions,
- updating just changed properties - saving resources,
- quering like C# LINQ to Entities (with JS function names)


## TODO
- implement Entity.addUnique() which allow UNIQUE key over more fields
- implement Entity.addPrimary() which allow PRIMARY key over more fields
- implement bulk operations
- implement JOINs
- implement nested operations (eg. saving Enterprise should save all Employees in Enterprise.Employees collection too. Same rollbacking etc.)
- add beforeSave() method into entity class - allow some operation before saving
- add baseQuery property into entity class - it'll be used in ALL select queries (can be used for soft-delete)
- implement client-side execution (query from client will send AJAJ request to server which will handle it as normal server query; something like automatic GraphQL)
- add whereOr() and whereOrIf() into Query

## Example

#### You can clone and play with the example in [this](https://github.com/Hookyns/unimapperjs-example) repo.

### Directory structure of this example
- **entities**
- **migrations**
- domain.js
- create-migration.js
- run-migration.js

### Create domain
> domain.js
```javascript
const $um = require("unimapperjs");
const MySqlAdapter = require("unimapperjs/adapters/MySqlAdapter");

// Domain creation - connect to database via MySQL adapter
const domain = $um.createDomain(MySqlAdapter, { // connection string or object with options - specific to adapter
    host: '127.0.0.1',
    user: 'test',
    password: 'test',
    database: "test"
});
exports.domain = domain;
```

### Create entities
Then create entities in given domain.
In TypeScript you can declare entity like this one.
> etities/Student.ts
```typescript
import {type} from "unimapperjs";
import {Entity} from "unimapperjs/src/Entity";
import {domain} from "../domain";
import {Teacher} from "./Teacher";

@domain.entity()
export class Student extends Entity<Student>
{
    /**
     * Student Id
     */
    id: number;

    /**
     * Student name
     */
    name: string;

    /**
     * Student's teacher id
     */
    teacherId: number;

    /**
     * Navigation property to Teacher
     */
    teacher: Promise<Teacher>;

    static map(map: Student) {
        const {Teacher} = require("./Teacher");

        map.id = <any>type.uuid;
        map.name = <any>type.string.length(100);
        map.teacherId = <any>type.number;
        map.teacher = <any>type.foreign(Teacher.name)
            .withForeign<Student>(s => s.teacherId);
    }
}
```

> entities/Teacher.ts
```typescript
import {type} from "unimapperjs";
import {Entity} from "unimapperjs/src/Entity";
import {domain} from "../domain";
import {Student} from "./Student";

/**
 * Teacher entity
 */
@domain.entity()
export class Teacher extends Entity<Teacher>
{
    /**
     * Teacher ID
     */
    id: number;

    /**
     * First name
     */
    firstName: string;

    /**
     * Last name
     */
    lastName: string;

    /**
     * Navigations property to assigned students
     */
    students: Promise<Array<Student>>;

    /**
     * Mapping
     */
    static map(map: Teacher) {
        const {Student} = require("./Student");

        map.id = <any>type.number.primary().autoIncrement();
        map.firstName = <any>type.string.length(50);
        map.lastName = <any>type.string.length(50);
        map.students = <any>type.foreign(Student.name)
            .hasMany<Student>(s => s.teacherId);
    }
}
```

### Migrate
Now you can run migraion.

> create-migration.js
```javascript
const $umjs = require("unimapperjs");
const $path = require("path");
const {domain} = require("./domain");

// Discove all entities from given path
$umjs.initEntitiesFrom($path.resolve(__dirname, "entities"));

// Run it in next event loop iteration
setImmediate(async () => {
	await domain.createMigration($path.resolve(__dirname, "migrations"));
	await domain.dispose();
});
```

New migration script is gonna be generated in folder `./migrations` like this one.
```javascript
/**
 * Migration script
 */

module.exports = {
	up: async function up(adapter) {
		await adapter.createEntity("Student", {
			  "id": {
				  "type": "String"
				, "length": 37
				, "primary": true
			}
			, "name": {
				  "type": "String"
				, "length": 100
			}
			, "teacherId": {
				  "type": "Number"
				, "length": 11
			}
		});

		await adapter.createEntity("Teacher", {
			  "id": {
				  "type": "Number"
				, "length": 11
				, "primary": true
				, "autoIncrement": true
			}
			, "firstName": {
				  "type": "String"
				, "length": 50
			}
			, "lastName": {
				  "type": "String"
				, "length": 50
			}
		});

		await adapter.addForeignKey("Student", "teacherId", "Teacher", "fk_Student_teacherId_Teacher_id");
	}
};
```

You can run that migration script with
> run-migration.js
```javascript
const $path = require("path");
const {domain} = require("./domain");

setImmediate(async () => {
	await domain.runMigration($path.resolve(__dirname, "migrations"));
	await domain.dispose();
});
```

### Insert some data
```javascript
let teacher = new Teacher({
	firstName: "John",
	lastName: "Wick"
});
await Teacher.insert(teacher);

let teacher2 = new Teacher();
teacher2.firstName = "John";
teacher2.lastName = "Smith";
await Teacher.insert(teacher2);

let student = new Student({
	name: "Bart Simpson",
	teacherId: teacher.id
});
await Student.insert(student);

student.teacher = teacher2;
await student.save();
```

### Make some queries
```javascript
// Teachers their first name contains "u"
let teachers = await Teacher.getAll()
	.filter(t => t.firstName.includes("u"))
	.sort(t => t.firstName)
	.exec();
```
```javascript
// Students their name starts with 'P' or ends with 's'
let startsWith = "P";
let students = await Student.getAll()
	.filter(s => s.name.startsWith($) || s.name.endsWith("s"), startsWith)
	.sortDesc(s => s.name)
	.slice(3, 8) // limit 5, skip 3
	.exec();
```
```javascript
let onlyActive = true;
let activeSubjectsCount = await Subject.getAll()
	.filterIf(s => s.active === true, onlyActive) // if (onlyActive) { .filter(s => s.active === true) }
	.count()
	.exec();
```
```javascript
let subjectNames = await Subject.getAll()
	.sort(s => s.name)
	.map(s => s.name) // select only names ; in SQL SELECT name FROM Subject
	.exec();
```
```javascript
let subjectMap = await Subject.getAll()
	.sort(s => s.name)
	.map(s => ({
		id: s.id,
		name: s.name
	}))
	.exec();
```