"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepo = exports.bookRepo = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Book_1 = require("../entity/Book");
const Review_1 = require("../entity/Review");
const User_1 = require("../entity/User");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "sqlite",
    database: "./database.sqlite",
    synchronize: true,
    logging: true,
    entities: [Book_1.Book, Review_1.Review, User_1.User],
});
exports.AppDataSource.initialize()
    .then(() => {
    console.log("Banco e TypeORM inicializado!");
})
    .catch((err) => {
    console.error("Erro durante inicialização do banco com TypeORM", err);
});
exports.bookRepo = exports.AppDataSource.getRepository(Book_1.Book);
exports.userRepo = exports.AppDataSource.getRepository(User_1.User);
