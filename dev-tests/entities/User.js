"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const domain_1 = require("../domain");
const Entity_1 = require("../../src/Entity");
let User = class User extends Entity_1.Entity {
    constructor() {
        super(...arguments);
        this.id = index_1.type.number.primary().autoIncrement();
        this.username = index_1.type.string.length(50);
        this.password = index_1.type.string.length(40);
    }
};
User = __decorate([
    domain_1.domain.entity()
], User);
exports.User = User;
//# sourceMappingURL=User.js.map