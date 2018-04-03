import {Entity} from "../../src/Entity";
import {Enterprise} from "./Enterprise";

export class Employee extends Entity<Employee> {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    created: Date;
    deleted: Date;
    income: number;
    enterpriseId: number;
    enterprise: Promise<Enterprise>;
}