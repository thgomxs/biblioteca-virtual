import { userRepo } from "../utils/database";
import jwt from "jsonwebtoken";

interface Token {
  username: string;
  id: number;
}

export const authenticated = async (token: string) => {
  if (!token) {
    return false;
  }
  const userVerified = <Token>jwt.verify(token, process.env.TOKEN_SECRET!);
  const user = await userRepo.findOne({ where: { id: userVerified.id } });

  if (user) {
    return { id: user.id, username: user.username };
  } else {
    return false;
  }
};
