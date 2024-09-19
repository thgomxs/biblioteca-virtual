"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = void 0;
const authenticated_1 = require("../middlewares/authenticated");
const checkAuth = async (req, res, next) => {
    const token = req.cookies.authorization;
    const user = await (0, authenticated_1.authenticated)(token);
    if (user) {
        req.user = user;
    }
    next();
};
exports.checkAuth = checkAuth;
