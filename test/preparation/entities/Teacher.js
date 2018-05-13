"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = require("../../../src/Entity");
const index_1 = require("../../../index");
const domain_1 = require("../domain");
/**
 * Teacher entity
 */
let Teacher = Teacher_1 = class Teacher extends Entity_1.Entity {
    /**
     * Mapping
     */
    static map(map) {
        const { Student } = require("./Student");
        map.id = index_1.type.number.primary().autoIncrement();
        map.firstName = index_1.type.string.length(50);
        map.lastName = index_1.type.string.length(50);
        map.students = index_1.type.foreign(Student.name)
            .hasMany(s => s.teacherId);
    }
    static seed() {
        return [
            new Teacher_1({ firstName: "Seed", lastName: "Test" }),
            new Teacher_1({ firstName: "Seed", lastName: "Testtwo" }),
        ];
    }
};
Teacher = Teacher_1 = __decorate([
    domain_1.domain.entity()
], Teacher);
exports.Teacher = Teacher;
var Teacher_1;
//# sourceMappingURL=Teacher.js.map