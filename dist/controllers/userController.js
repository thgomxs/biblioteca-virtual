"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.register = exports.login = void 0;
const database_1 = require("../utils/database");
const User_1 = require("../entity/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res) => {
    const user = await database_1.userRepo.findOne({ where: { username: req.body.username } });
    if (user && bcryptjs_1.default.compareSync(req.body.password, user.password)) {
        const token = jsonwebtoken_1.default.sign({ username: user.username, id: user.id }, process.env.TOKEN_SECRET);
        res.cookie("authorization", token, { httpOnly: true });
        res.json({ message: "Usuário logado!", auth: "login", type: "success" });
    }
    else {
        res.json({ message: "Usuário ou senha incorretos!", auth: "login", type: "danger" });
    }
};
exports.login = login;
const register = async (req, res) => {
    if (req.body.password !== req.body.confirmPassword) {
        res.json({ message: "Senhas divergem.", auth: "register", type: "danger" });
    }
    else {
        try {
            let newUser = new User_1.User();
            newUser.username = req.body.username;
            newUser.password = bcryptjs_1.default.hashSync(req.body.password);
            await database_1.userRepo.save(newUser);
            res.json({ message: "Registrado com sucesso!.", auth: "register", type: "success" });
        }
        catch (error) {
            res.json({ message: "Usuário existente.", auth: "register", type: "danger" });
        }
    }
};
exports.register = register;
const logout = async (req, res) => {
    res.clearCookie("authorization");
    res.redirect("/");
};
exports.logout = logout;
