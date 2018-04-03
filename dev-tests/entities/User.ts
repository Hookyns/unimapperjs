import {type} from "../../index";
import {domain} from "../domain";
import {Entity} from "../../src/Entity";

@domain.entity()
export class User extends Entity<User> {
    /**
     * User ID
     * @type {number}
     */
    public id: number = <any>type.number.primary().autoIncrement();

    /**
     * Username
     * @type {string}
     */
    public username: string = <any>type.string.length(50);

    /**
     * Password
     * @type {string}
     */
    public password: string = <any>type.string.length(40);
}