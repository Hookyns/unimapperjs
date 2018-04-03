import {Entity} from "../../src/Entity";
import {Employee} from "./Employee";

export class Enterprise extends Entity<Enterprise> {
    /**
	 * Name of enterprise
     * @type {string}
     */
	name: string;

    /**
	 * Date and time when entity were created
     * @type {Date}
     */
    created: Date;

    /**
	 * Date and time when entity were deleted
     * @type {Date}
     */
    deleted: Date;

    /**
	 * List of users
     * @type {Array<Employee>}
     */
    users: Array<Employee>;
}