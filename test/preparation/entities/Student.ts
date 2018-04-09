import {Entity} from "../../../src/Entity";
import {type} from "../../../index";
import {domain} from "../domain";
import {Teacher} from "./Teacher";

@domain.entity()
export class Student extends Entity<Student>
{
    /**
     * Sudent Id
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