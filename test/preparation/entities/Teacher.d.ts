import { Entity } from "../../../src/Entity";
import { Student } from "./Student";
export declare class Teacher extends Entity<Teacher> {
    id: number;
    firstName: string;
    lastName: string;
    students: Array<Student>;
    static map(map: Teacher): void;
}
