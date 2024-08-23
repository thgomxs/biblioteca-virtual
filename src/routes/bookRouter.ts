import express from "express";
import BookController from "../controllers/bookController";
const router = express.Router();

router.get("/:id", BookController.getBook);

export default router;
