"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookInfo = void 0;
const cheerio_1 = __importDefault(require("cheerio"));
const axios_1 = __importDefault(require("axios"));
const Book_1 = require("../entity/Book");
const getBookInfo = async (URL) => {
    const book = new Book_1.Book();
    book.url = URL;
    await (0, axios_1.default)(URL).then((res) => {
        const body = res.data;
        var $ = cheerio_1.default.load(body);
        book.title = $("#productTitle").text().trim();
        book.author = $(".author a").first().text();
        book.cover = $("#landingImage").attr("src");
        book.description = $("#bookDescription_feature_div div div").html();
        book.price = $(".slot-price span").last().text().trim();
        book.category = $(".cat-link").first().text().trim();
    });
    return book;
};
exports.getBookInfo = getBookInfo;
