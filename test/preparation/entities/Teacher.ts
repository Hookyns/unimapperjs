import {Entity} from "../../../src/Entity";
import {type} from "../../../index";
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
	static map(map: Teacher)
	{
		const {Student} = require("./Student");

		map.id = <any>type.number.primary().autoIncrement();
		map.firstName = <any>type.string.length(50);
		map.lastName = <any>type.string.length(50);
		map.students = <any>type.foreign(Student.name)
			.hasMany<Student>(s => s.teacherId);
	}

	static seed(): Array<Teacher>
	{
		return [
			new Teacher({firstName: "Seed", lastName: "Test"}),
			new Teacher({firstName: "Seed", lastName: "Testtwo"}),
		];
	}
}