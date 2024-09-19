"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBook = void 0;
const database_1 = require("../utils/database");
const getBook = async (req, res) => {
    var bookLiked = false;
    var bookRead = false;
    var bookRate = null;
    var reviewCount = 0;
    var reviewTotal = 0;
    const book = await database_1.bookRepo.findOne({
        where: { id: req.params.id },
        relations: ["likes", "reads", "reviews"],
    });
    if (book && req.user) {
        book.likes.forEach((user) => {
            if (user.id == req.user.id)
                bookLiked = true;
        });
        book.reads.forEach((user) => {
            if (user.id == req.user.id)
                bookRead = true;
        });
        book.reviews.forEach((review) => {
            reviewCount++;
            reviewTotal += parseFloat(review.rating);
        });
        bookRate = (reviewTotal / reviewCount).toFixed(1);
    }
    if (book) {
        res.render("pages/book", {
            book: book,
            user: req.user ? req.user : false,
            liked: bookLiked,
            read: bookRead,
            rate: bookRate,
        });
    }
    else {
        res.redirect("/");
    }
};
exports.getBook = getBook;
