import Employee from "./Employee";
export interface IEnterprise {
    name: string;
    created: Date;
    deleted: Date;
    users: Array<Employee>;
}
export declare const Enterprise: IEnterprise;
