import {Entity} from "../../../src/Entity";
import {type} from "../../../index";
import {domain} from "../domain";
import {Teacher} from "./Teacher";

@domain.entity()
export class Student extends Entity<Student>
{
    id: number = <any>type.uuid;
    name: string = <any>type.string.length(100);
    teacherId: number = <any>type.number;
    teacher: Teacher;

    static map(map: Student) {
        const {Teacher} = require("./Teacher");
        map.teacher = <any>type.foreign(Teacher.name).withForeign<Student>(s => s.teacherId);
    }
}