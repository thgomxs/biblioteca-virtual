import { authenticated } from "../middlewares/authenticated";
import { userRepo } from "../utils/database";
import jwt from "jsonwebtoken";

interface Token {
  username: string;
  id: number;
}

export const checkAuth = async (req: any, res: any, next: any) => {
  const token = req.cookies.authorization;
  const user = await authenticated(token);

  if (user) {
    req.user = user;
  }
  next();
};
