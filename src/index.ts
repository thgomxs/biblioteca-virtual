import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Book } from './entity/Book';
import { User } from './entity/User';
import { AppDataSource } from './utils/database';
import { getBookAPI, searchBook } from './services/getBook';
import { Review } from './entity/Review';
import { Like } from 'typeorm';
import cookieParser from 'cookie-parser';
import cookie from 'cookie';
import cors from 'cors';
import bookRouter from './routes/bookRouter';
import userRouter from './routes/userRouter';
import { checkAuth } from './controllers/authController';
import { authenticated } from './middlewares/authenticated';
import path from 'path';
import { update } from './controllers/userController';

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

const io = new Server(server);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(cookieParser());

interface Token {
  username: string;
  id: number;
}

const bookRepo = AppDataSource.getRepository(Book);
const userRepo = AppDataSource.getRepository(User);
const reviewRepo = AppDataSource.getRepository(Review);

io.use(async (socket, next) => {
  let token: string;
  const cookief = socket.handshake.headers.cookie;

  if (cookief) {
    const cookies = cookie.parse(cookief);

    token = cookies.authorization;

    const user = await authenticated(token);

    if (user) {
      socket.data.user = user;
    }
  }

  next();
});

io.on('connection', async (socket) => {
  let route = '';
  const url = socket.handshake.headers.referer || socket.handshake.headers.origin;
  if (url) {
    const pathname = new URL(url).pathname;
    route = pathname.substring(1);
  }

  console.log('Usuário entrou na biblioteca!');

  async function sendBooks() {
    const books = await searchBook('');
    socket.emit('server:allBooks', books);
  }

  async function getUserReviews() {
    const user = await userRepo.findOne({
      where: { username: socket.data.user.username },
    });

    if (user) {
      const reviews = await reviewRepo.find({
        where: { user: user },
        relations: ['book'],
      });
      return socket.emit('server:userReviews', reviews);
    }

    return socket.emit('server:redirect', '/');
  }

  if (!route) {
    sendBooks();
  }

  if (route == 'reviews') {
    getUserReviews();
  }

  async function sendReviews(bookID: string, type: string) {
    const book = await bookRepo.findOne({
      where: { id: bookID },
      relations: ['reviews', 'reviews.user'],
    });

    const reviews = book?.reviews;

    if (type == 'io') {
      io.emit('server:allReviews', reviews);
    }
    if (type == 'socket') {
      socket.emit('server:allReviews', reviews);
    }
  }

  socket.on('client:updateProfile', async ({ username, picture }) => {
    const updatedProfile = await update(username, picture);

    if (updatedProfile) {
      socket.emit('server:updatedProfile', updatedProfile);

      socket.emit('server:toastMessage', {
        message: 'Foto alterada com sucesso!',
        type: 'success',
      });
    }

    if (!updatedProfile) {
      socket.emit('server:toastMessage', {
        message: 'Erro ao atualizar foto!',
        type: 'danger',
      });
    }
  });

  socket.on('client:searchBook', async (searchText) => {
    const books = await searchBook(searchText);

    socket.emit('server:searchedBooks', books);
  });

  socket.on('client:newReview', async ({ comment, bookID, rating }) => {
    const userAuthenticated = socket.data.user;

    if (userAuthenticated) {
      try {
        const newReview = new Review();
        newReview.comment = comment;
        newReview.rating = rating;
        newReview.book = <Book>await bookRepo.findOne({ where: { id: bookID } });
        newReview.user = <User>(
          await userRepo.findOne({ where: { id: <number>userAuthenticated.id } })
        );
        await reviewRepo.save(newReview);

        sendReviews(bookID, 'io');
        return socket.emit('server:toastMessage', {
          message: 'Avaliação enviada com sucesso!',
          type: 'success',
        });
      } catch (error) {
        return socket.emit('server:toastMessage', {
          message: 'Erro ao enviar avaliação, tente novamente.',
          type: 'danger',
        });
      }
    }
  });

  socket.on('client:getReviews', async (bookID) => {
    sendReviews(bookID, 'socket');
  });

  socket.on('client:editReview', async ({ comment, reviewID, rating }) => {
    const review = await reviewRepo.findOne({
      where: { id: reviewID },
    });

    if (review) {
      review.comment = comment;
      review.rating = rating;
      await reviewRepo.save(review);
      getUserReviews();
      return;
    }

    return socket.emit('server:toastMessage', {
      message: 'Essa análise não existe mais!',
      type: 'danger',
    });
  });

  socket.on('client:deleteReview', async (reviewID) => {
    const review = await reviewRepo.findOne({
      where: { id: reviewID },
    });

    if (review) {
      await reviewRepo.delete(reviewID);
      getUserReviews();
      return;
    }

    return socket.emit('server:toastMessage', {
      message: 'Essa análise não existe mais!',
      type: 'danger',
    });
  });

  socket.on('client:getReview', async (reviewID) => {
    const review = await reviewRepo.findOne({
      where: { id: reviewID },
      relations: ['book'],
    });

    if (review) {
      return socket.emit('server:getReview', review);
    }

    return socket.emit('server:toastMessage', {
      message: 'Essa análise não existe mais!',
      type: 'danger',
    });
  });

  async function updateStats(bookID: string) {
    const book = await bookRepo.findOne({
      where: { id: bookID },
      relations: ['likes', 'reads'],
    });

    socket.emit('server:updateStats', {
      likes: book?.likes.length,
      reads: book?.reads.length,
    });
  }

  socket.on('client:addStat', async (data) => {
    const userAuthenticated = socket.data.user;

    if (userAuthenticated) {
      const user = await userRepo.findOne({ where: { id: userAuthenticated.id } });
      const book = await bookRepo.findOne({
        where: { id: data.bookID },
        relations: ['likes', 'reads'],
      });

      if (user && book) {
        const stat: string = data.stat;

        if (stat === 'likes' || stat === 'reads') {
          book[stat].push(user);
          await bookRepo.save(book);
        }

        updateStats(data.bookID);
      }
    }
  });

  socket.on('client:removeStat', async (data) => {
    const userAuthenticated = socket.data.user;

    if (userAuthenticated) {
      const user = await userRepo.findOne({ where: { id: userAuthenticated.id } });
      const book = await bookRepo.findOne({
        where: { id: data.bookID },
        relations: ['likes', 'reads'],
      });

      if (user && book) {
        const stat: string = data.stat;

        if (stat === 'likes' || stat === 'reads') {
          book[stat] = book[stat].filter((user) => {
            user.id !== userAuthenticated.id;
          });
          await bookRepo.save(book);
        }

        updateStats(data.bookID);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário saiu da biblioteca :(');
  });
});

app.get('/', checkAuth, async (req: any, res: any) => {
  res.render('pages/index', { user: req.user ? req.user : false });
});

app.use('/', checkAuth, [userRouter, bookRouter]);

server.listen(PORT, () => {
  console.log(`Rodando na porta ${PORT}`);
});
