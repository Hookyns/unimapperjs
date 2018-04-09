# UniMapperJS
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
- implement nested operations (eg. saving Enterprise should save all Employees in Enterprise.Employees collection too. Same rollbacking etc.)

## Example
Taken from tests.

First you must create domain. 
> domain.js
```javascript
const $um = require("unimapperjs");
const MySqlAdapter = require("unimapperjs/adapters/MySqlAdapter");
const type = $um.type;

// Domain creation - connect to database via MySQL adapter
const domain = $um.createDomain(MySqlAdapter, { // connection string or object with options - specific to adapter
    host: '127.0.0.1',
    user: 'test',
    password: 'test',
    database: "test"
});
```

Then create entities in given domain.
> Subject.js
```javascript
const {type} = require("unimapperjs");
const {domain} = require("./domain");

const Subject = domain.createEntity("Subject", {
    name: type.string.length(100),
    active: type.boolean
});

module.exports.Subject = Subject;
```
It's simple basic method of entity declaration via domain.createEntity().

In TypeScript you can declare entity like this one.
> Student.ts
```typescript
import {type} from "unimapperjs";
import {Entity} from "unimapperjs/src/Entity";
import {domain} from "./domain";
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
    teacher: Teacher;

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

Or same class-like style but with just JS.
> Teacher.js
```javascript
const {type} = require("unimapperjs");
const {Entity} = require("unimapperjs/src/Entity");
const {domain} = require("./domain");

const Teacher = class Teacher extends Entity {
    constructor() {
        super();
	    /**
         * Teacher Id
	     * @type {number}
	     */
	    this.id = null;

	    /**
         * Teacher first name
	     * @type {string}
	     */
	    this.firstName = null;

	    /**
         * Teacher last name
	     * @type {string}
	     */
	    this.lastName = null;

	    /**
         * Teacher's students - navigation property
	     * @type {Promise<Array<Student>>}
	     */
	    this.students = null;
    }

    static map(map) {
        const { Student } = require("./Student");
        map.id = type.number.primary().autoIncrement();
        map.firstName = type.string.length(50);
        map.lastName = type.string.length(50);
        map.students = type.foreign(Student.name)
            .hasMany(s => s.teacherId);
    }
};

// Register entity with TS decorator function manually
domain.entity()(Teacher);

// export
module.exports.Teacher = Teacher;
```

In JS class-like declaration style you can omit constructor declaration, 
only map() method is important, but if you do so, you'll lose IDE completions.

##### Why is map() important?
Teacher navigate to Student and Student navigate to Teacher. 
There is cycle dependency which must be resolved. Method map() is async,
it init map() method and rest of work is in process.nextTick, giving chance to node
to resolve modules.

Because of that async behavior, you should not work with entities in same event-loop
iteration in which you declare your entities. 

See this example.
> example.js
```javascript
const {Student} = require("./Student");

// Create new Student
let newStudent = new Student();
newStudent.name = "John Smith";

Student.insert(newStudent);
```

If this is first time when Student is required, class Student in declared 
and domain.entity()(Student) will be called. But how I've said before, it is async
and it's going to be finished in process.nextTick(). You can use setImmediate() for example, 
if you run some simple scripts, which has no async behavior, like this.
But in most cases, after require() you wait eg. for connection, so it will not be necessary.
