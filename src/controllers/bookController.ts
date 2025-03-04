import { bookRepo } from '../utils/database';
import { getBookAPI } from '../services/getBook';

export const getBook = async (req: any, res: any) => {
  var bookLiked = false;
  var bookRead = false;
  var bookRate = null;
  var reviewCount = 0;
  var reviewTotal = 0;

  console.log(req.params.id);
  const newBook = await getBookAPI(req.params.id);
  console.log(newBook);

  if (newBook) {
    const book = await bookRepo.findOne({
      where: { id: req.params.id },
      relations: ['likes', 'reads', 'reviews'],
    });

    console.log(book, 'livro já existia!');

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
      res.render('pages/book', {
        book: book,
        user: req.user ? req.user : false,
        liked: bookLiked,
        read: bookRead,
        rate: bookRate,
      });
    }

    if (!book) {
      await bookRepo.save(newBook);

      const book = await bookRepo.findOne({
        where: { id: req.params.id },
        relations: ['likes', 'reads', 'reviews'],
      });
      console.log(book, 'livro que não existia foi criado!');

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
        res.render('pages/book', {
          book: book,
          user: req.user ? req.user : false,
          liked: bookLiked,
          read: bookRead,
          rate: bookRate,
        });
      }
    }
  } else {
    res.redirect('/');
  }
};
