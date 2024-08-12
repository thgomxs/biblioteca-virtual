import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Book } from './entity/Book';
import { User } from './entity/User';
import { AppDataSource } from './utils/database';
import { getBookInfo } from './services/getBook';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Review } from './entity/Review';
import { Like } from 'typeorm';
import cookieParser from 'cookie-parser';
import cookie from 'cookie';

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(cookieParser());

interface Token {
  username: string;
  id: number;
}

const bookRepo = AppDataSource.getRepository(Book);
const userRepo = AppDataSource.getRepository(User);
const reviewRepo = AppDataSource.getRepository(Review);

async function checkAuth(token: string) {
  if (token) {
    const userVerified = <Token>jwt.verify(token, process.env.TOKEN_SECRET!);
    const user = await userRepo.findOne({ where: { id: userVerified.id } });

    if (user) {
      return { id: user.id, username: user.username };
    } else {
      return false;
    }
  } else {
    return false;
  }
}

io.on('connection', async (socket) => {
  console.log('Uusário entrou na biblioteca!');

  let token: string;
  const cookief = socket.handshake.headers.cookie;
  if (cookief) {
    const cookies = cookie.parse(cookief);

    token = cookies.authorization;
  }

  async function sendBooks(type: string) {
    const books = await bookRepo.find();

    if (type == 'io') {
      io.emit('server:allBooks', books);
    }
    if (type == 'socket') {
      socket.emit('server:allBooks', books);
    }
  }

  async function sendReviews(bookID: number, type: string) {
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

  sendBooks('socket');

  socket.on('client:authUser', async (data) => {
    const user = await userRepo.findOne({ where: { username: data.user } });

    if (user && bcrypt.compareSync(data.password, user.password)) {
      console.log(process.env.TOKEN_SECRET);

      const token = jwt.sign(
        { username: user.username, id: user.id },
        process.env.TOKEN_SECRET!,
      );
      return socket.emit('server:authMessage', {
        message: 'Usuário logado!',
        auth: 'login',
        type: 'success',
        token: token,
      });
    } else {
      return socket.emit('server:authMessage', {
        message: 'Usuário ou senha incorretos!',
        auth: 'login',
        type: 'danger',
      });
    }
  });

  socket.on('client:newUser', async (data) => {
    if (data.password !== data.confirmPassword) {
      return socket.emit('server:authMessage', {
        message: 'Senhas divergem.',
        auth: 'register',
        type: 'danger',
      });
    }

    try {
      let newUser = new User();
      newUser.username = data.user;
      newUser.password = bcrypt.hashSync(data.password);

      await userRepo.save(newUser);
      return socket.emit('server:authMessage', {
        message: 'Registrado com sucesso!.',
        auth: 'register',
        type: 'success',
      });
    } catch (error) {
      return socket.emit('server:authMessage', {
        message: 'Usuário existente.',
        auth: 'register',
        type: 'danger',
      });
    }
  });

  socket.on('client:newBook', async (url) => {
    const newBook = await getBookInfo(url);
    await bookRepo.save(newBook);

    socket.emit('server:cleanInput');
    sendBooks('io');
  });

  socket.on('client:searchBook', async (searchText) => {
    const books = await bookRepo.findBy({ title: Like(`%${searchText}%`) });

    socket.emit('server:searchedBooks', books);
  });

  socket.on('client:removeBook', async (bookID) => {
    const book = await bookRepo.findOne({ where: { id: bookID } });

    if (book) {
      await bookRepo.remove(book);
    }

    sendBooks('io');
  });

  socket.on('client:newReview', async ({ comment, bookID, rating }) => {
    const userAuthenticated = await checkAuth(token);
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

        console.log('deu certo');
        sendReviews(bookID, 'io');
        return socket.emit('server:reviewMessage', {
          message: 'Avaliação enviada com sucesso!',
          type: 'danger',
        });
      } catch (error) {
        return socket.emit('server:reviewMessage', {
          message: 'Erro ao enviar avaliação, tente novamente.',
          type: 'danger',
        });
      }
    }
  });

  socket.on('client:getReviews', async (bookID) => {
    sendReviews(bookID, 'socket');
  });

  async function updateStats(bookID: number) {
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
    const userAuthenticated = await checkAuth(token);

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
    const userAuthenticated = await checkAuth(token);

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

app.get('/', async (req: any, res: any) => {
  const authorization = req.cookies.authorization;
  const user = await checkAuth(authorization);

  res.render('pages/index', { user: user ? user : false });
});

app.get('/logout', (req, res) => {
  res.clearCookie('authorization');
  res.redirect('/');
});

app.get('/:id', async (req: any, res: any) => {
  const authorization = req.cookies.authorization;
  const userAuthenticated = await checkAuth(authorization);
  var bookLiked = false;
  var bookRead = false;

  const book = await bookRepo.findOne({
    where: { id: req.params.id },
    relations: ['likes', 'reads'],
  });

  if (book && userAuthenticated) {
    book.likes.forEach((user) => {
      if (user.id == userAuthenticated.id) {
        bookLiked = true;
      }
    });
    book.reads.forEach((user) => {
      if (user.id == userAuthenticated.id) {
        bookRead = true;
      }
    });
  }

  if (book) {
    res.render('pages/book', {
      book: book,
      user: userAuthenticated ? userAuthenticated : false,
      liked: bookLiked,
      read: bookRead,
    });
  } else {
    res.redirect('/');
  }
});

server.listen(PORT, () => {
  console.log(`Rodando na porta ${PORT}`);
});
