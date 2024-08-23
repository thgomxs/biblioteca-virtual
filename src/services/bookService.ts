import { bookRepo } from "../utils/database";
import { userRepo } from "../utils/database";
import { Review } from "../entity/Review";
import { User } from "../entity/User";
import { Book } from "../entity/Book";
import { reviewRepo } from "../utils/database";

export default class BookService {
  public static async addReview(bookID: number, userID: number, comment: string, rating: string) {
    const newReview = new Review();
    newReview.comment = comment;
    newReview.rating = rating;
    newReview.book = <Book>await bookRepo.findOne({ where: { id: bookID } });
    newReview.user = <User>await userRepo.findOne({ where: { id: userID } });
    await reviewRepo.save(newReview);
  }
}
