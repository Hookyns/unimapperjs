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
    id: number = <any>type.number.primary().autoIncrement();

    /**
     * First name
     */
    firstName: string = <any>type.string.length(50);

    /**
     * Last name
     */
    lastName: string = <any>type.string.length(50);

    /**
     * Navigations property to assigned students
     */
    students: Array<Student>;

    /**
     * Mapping
     */
    static map(map: Teacher) {
        const {Student} = require("./Student");

        map.students = <any>type.foreign(Student.name)
            .hasMany<Student>(s => s.teacherId);
    }
}