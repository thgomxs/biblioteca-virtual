import express from "express";
import { getBook } from "../controllers/bookController";
const router = express.Router();

router.get("/:id", getBook);

export default router;
