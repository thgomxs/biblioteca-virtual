import { bookRepo } from "../utils/database";

export default class BookController {
  public static async getBook(req: any, res: any) {
    var bookLiked = false;
    var bookRead = false;
    var bookRate = null;
    var reviewCount = 0;
    var reviewTotal = 0;

    const book = await bookRepo.findOne({
      where: { id: req.params.id },
      relations: ["likes", "reads", "reviews"],
    });

    if (book && req.user) {
      book.likes.forEach((user) => {
        if (user.id == req.user.id) bookLiked = true;
      });
      book.reads.forEach((user) => {
        if (user.id == req.user.id) bookRead = true;
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
    } else {
      res.redirect("/");
    }
  }
}
