import { Entity } from "../../../src/Entity";
import { Student } from "./Student";
/**
 * Teacher entity
 */
export declare class Teacher extends Entity<Teacher> {
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
    students: Array<Student>;
    /**
     * Mapping
     */
    static map(map: Teacher): void;
}
