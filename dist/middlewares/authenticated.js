"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticated = void 0;
const database_1 = require("../utils/database");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticated = async (token) => {
    if (!token) {
        return false;
    }
    const userVerified = jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET);
    const user = await database_1.userRepo.findOne({ where: { id: userVerified.id } });
    if (user) {
        return { id: user.id, username: user.username };
    }
    else {
        return false;
    }
};
exports.authenticated = authenticated;
