"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const Book_1 = require("./entity/Book");
const User_1 = require("./entity/User");
const database_1 = require("./utils/database");
const getBook_1 = require("./services/getBook");
const Review_1 = require("./entity/Review");
const typeorm_1 = require("typeorm");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cookie_1 = __importDefault(require("cookie"));
const cors_1 = __importDefault(require("cors"));
const bookRouter_1 = __importDefault(require("./routes/bookRouter"));
const userRouter_1 = __importDefault(require("./routes/userRouter"));
const authController_1 = require("./controllers/authController");
const authenticated_1 = require("./middlewares/authenticated");
const path_1 = __importDefault(require("path"));
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
const server = (0, node_http_1.createServer)(app);
const io = new socket_io_1.Server(server);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
app.use((0, cookie_parser_1.default)());
const bookRepo = database_1.AppDataSource.getRepository(Book_1.Book);
const userRepo = database_1.AppDataSource.getRepository(User_1.User);
const reviewRepo = database_1.AppDataSource.getRepository(Review_1.Review);
io.use(async (socket, next) => {
    let token;
    const cookief = socket.handshake.headers.cookie;
    if (cookief) {
        const cookies = cookie_1.default.parse(cookief);
        token = cookies.authorization;
        const user = await (0, authenticated_1.authenticated)(token);
        if (user) {
            socket.data.user = user;
        }
    }
    next();
});
io.on("connection", async (socket) => {
    console.log("Usuário entrou na biblioteca!");
    async function sendBooks(type) {
        const books = await bookRepo.find();
        if (type == "io") {
            io.emit("server:allBooks", books);
        }
        if (type == "socket") {
            socket.emit("server:allBooks", books);
        }
    }
    sendBooks("socket");
    async function sendReviews(bookID, type) {
        const book = await bookRepo.findOne({
            where: { id: bookID },
            relations: ["reviews", "reviews.user"],
        });
        const reviews = book === null || book === void 0 ? void 0 : book.reviews;
        if (type == "io") {
            io.emit("server:allReviews", reviews);
        }
        if (type == "socket") {
            socket.emit("server:allReviews", reviews);
        }
    }
    socket.on("client:newBook", async (url) => {
        const newBook = await (0, getBook_1.getBookInfo)(url);
        await bookRepo.save(newBook);
        socket.emit("server:cleanInput");
        sendBooks("io");
    });
    socket.on("client:searchBook", async (searchText) => {
        const books = await bookRepo.findBy({ title: (0, typeorm_1.Like)(`%${searchText}%`) });
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
                const newReview = new Review_1.Review();
                newReview.comment = comment;
                newReview.rating = rating;
                newReview.book = await bookRepo.findOne({ where: { id: bookID } });
                newReview.user = await userRepo.findOne({ where: { id: userAuthenticated.id } });
                await reviewRepo.save(newReview);
                console.log("deu certo");
                sendReviews(bookID, "io");
                return socket.emit("server:reviewMessage", {
                    message: "Avaliação enviada com sucesso!",
                    type: "danger",
                });
            }
            catch (error) {
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
    async function updateStats(bookID) {
        const book = await bookRepo.findOne({
            where: { id: bookID },
            relations: ["likes", "reads"],
        });
        socket.emit("server:updateStats", {
            likes: book === null || book === void 0 ? void 0 : book.likes.length,
            reads: book === null || book === void 0 ? void 0 : book.reads.length,
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
                const stat = data.stat;
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
                const stat = data.stat;
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
    socket.on("disconnect", () => {
        console.log("Usuário saiu da biblioteca :(");
    });
});
app.get("/", authController_1.checkAuth, async (req, res) => {
    res.render("pages/index", { user: req.user ? req.user : false });
});
app.use("/", authController_1.checkAuth, [userRouter_1.default, bookRouter_1.default]);
server.listen(PORT, () => {
    console.log(`Rodando na porta ${PORT}`);
});
