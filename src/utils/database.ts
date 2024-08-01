import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Book } from '../entity/Book';

// Crie uma instância do DataSource com a configuração
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  synchronize: true,
  logging: true,
  entities: [Book],
});

AppDataSource.initialize()
  .then(() => {
    console.log('Banco e TypeORM inicializado!');
  })
  .catch((err) => {
    console.error('Erro durante inicialização do banco com TypeORM', err);
  });
