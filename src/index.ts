import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Book } from "./entity/Book";
import { User } from "./entity/User";
import { AppDataSource } from "./utils/database";
import { getBook, searchBook } from "./services/getBook";
import { Review } from "./entity/Review";
import { Like } from "typeorm";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import cors from "cors";
import bookRouter from "./routes/bookRouter";
import userRouter from "./routes/userRouter";
import { checkAuth } from "./controllers/authController";
import { authenticated } from "./middlewares/authenticated";
import path from "path";

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

const io = new Server(server);

// const io = new Server(server, {
//   cors: {
//     origin: "https://biblioteca-virtual-x119.onrender.com/",
//     methods: ["GET", "POST"],
//   },
// });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
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

io.on("connection", async (socket) => {
  console.log("Usuário entrou na biblioteca!");

  async function sendBooks(type: string) {
    const books = await bookRepo.find();

    if (type == "io") {
      io.emit("server:allBooks", books);
    }
    if (type == "socket") {
      socket.emit("server:allBooks", books);
    }
  }

  sendBooks("socket");

  async function sendReviews(bookID: number, type: string) {
    const book = await bookRepo.findOne({
      where: { id: bookID },
      relations: ["reviews", "reviews.user"],
    });

    const reviews = book?.reviews;

    if (type == "io") {
      io.emit("server:allReviews", reviews);
    }
    if (type == "socket") {
      socket.emit("server:allReviews", reviews);
    }
  }

  socket.on("client:searchBook", async (searchText) => {
    const books = await bookRepo.findBy({ title: Like(`%${searchText}%`) });

    socket.emit("server:searchedBooks", books);
  });

  socket.on("client:removeBook", async (bookID) => {
    const book = await bookRepo.findOne({ where: { id: bookID } });

    if (book) {
      await bookRepo.remove(book);
    }

    sendBooks("io");
  });

  socket.on("client:newReview", async ({ comment, bookID, rating }) => {
    const userAuthenticated = socket.data.user;

    if (userAuthenticated) {
      try {
        const newReview = new Review();
        newReview.comment = comment;
        newReview.rating = rating;
        newReview.book = <Book>await bookRepo.findOne({ where: { id: bookID } });
        newReview.user = <User>await userRepo.findOne({ where: { id: <number>userAuthenticated.id } });
        await reviewRepo.save(newReview);

        console.log("deu certo");
        sendReviews(bookID, "io");
        return socket.emit("server:reviewMessage", {
          message: "Avaliação enviada com sucesso!",
          type: "danger",
        });
      } catch (error) {
        return socket.emit("server:reviewMessage", {
          message: "Erro ao enviar avaliação, tente novamente.",
          type: "danger",
        });
      }
    }
  });

  socket.on("client:getReviews", async (bookID) => {
    sendReviews(bookID, "socket");
  });

  async function updateStats(bookID: number) {
    const book = await bookRepo.findOne({
      where: { id: bookID },
      relations: ["likes", "reads"],
    });

    socket.emit("server:updateStats", {
      likes: book?.likes.length,
      reads: book?.reads.length,
    });
  }

  socket.on("client:addStat", async (data) => {
    const userAuthenticated = socket.data.user;

    if (userAuthenticated) {
      const user = await userRepo.findOne({ where: { id: userAuthenticated.id } });
      const book = await bookRepo.findOne({
        where: { id: data.bookID },
        relations: ["likes", "reads"],
      });

      if (user && book) {
        const stat: string = data.stat;

        if (stat === "likes" || stat === "reads") {
          book[stat].push(user);
          await bookRepo.save(book);
        }

        updateStats(data.bookID);
      }
    }
  });

  socket.on("client:removeStat", async (data) => {
    const userAuthenticated = socket.data.user;

    if (userAuthenticated) {
      const user = await userRepo.findOne({ where: { id: userAuthenticated.id } });
      const book = await bookRepo.findOne({
        where: { id: data.bookID },
        relations: ["likes", "reads"],
      });

      if (user && book) {
        const stat: string = data.stat;

        if (stat === "likes" || stat === "reads") {
          book[stat] = book[stat].filter((user) => {
            user.id !== userAuthenticated.id;
          });
          await bookRepo.save(book);
        }

        updateStats(data.bookID);
      }
    }
  });

  // ADMIN
  socket.on("admin-client:newBook", async (id) => {
    const newBook = await getBook(id);
    if (newBook) {
      await bookRepo.save(newBook);
      socket.emit("admin-server:cleanInput");
      sendBooks("io");
    }
  });
  socket.on("admin-client:searchBook", async (query) => {
    const books = await searchBook(query);

    socket.emit("admin-server:searchedBooks", { books: books, query: query });
  });

  socket.on("disconnect", () => {
    console.log("Usuário saiu da biblioteca :(");
  });
});

app.get("/", checkAuth, async (req: any, res: any) => {
  res.render("pages/index", { user: req.user ? req.user : false });
});

app.use("/", checkAuth, [userRouter, bookRouter]);

server.listen(PORT, () => {
  console.log(`Rodando na porta ${PORT}`);
});
