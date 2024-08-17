import "reflect-metadata";
import { DataSource } from "typeorm";
import { Book } from "../entity/Book";
import { Review } from "../entity/Review";
import { User } from "../entity/User";

// Crie uma instância do DataSource com a configuração
export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "./database.sqlite",
  synchronize: true,
  logging: true,
  entities: [Book, Review, User],
});

AppDataSource.initialize()
  .then(() => {
    console.log("Banco e TypeORM inicializado!");
  })
  .catch((err) => {
    console.error("Erro durante inicialização do banco com TypeORM", err);
  });

export const bookRepo = AppDataSource.getRepository(Book);
export const userRepo = AppDataSource.getRepository(User);
