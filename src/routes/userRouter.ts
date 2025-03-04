import express from 'express';
import { login, register, logout, renderReviews } from '../controllers/userController';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/reviews', renderReviews);
router.get('/logout', logout);

export default router;
