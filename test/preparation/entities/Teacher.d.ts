import { Entity } from "../../../src/Entity";
export declare class Teacher extends Entity<Teacher> {
    id: number;
    firstName: string;
    lastName: string;
    map(map: Teacher): void;
}
