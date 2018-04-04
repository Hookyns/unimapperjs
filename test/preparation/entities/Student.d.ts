import { Entity } from "../../../src/Entity";
import { Teacher } from "./Teacher";
export declare class Student extends Entity<Student> {
    id: number;
    name: string;
    teacherId: number;
    teacher: Teacher;
    static map(map: Student): void;
}
