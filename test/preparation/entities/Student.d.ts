import { Entity } from "../../../src/Entity";
import { Teacher } from "./Teacher";
export declare class Student extends Entity<Student> {
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
    static map(map: Student): void;
}
