import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import { Book } from './entity/Book';
import { AppDataSource } from './utils/database';

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(express.static('public'));

io.on('connection', async (socket) => {
  console.log('Uusário entrou na biblioteca!');

  socket.emit('chat message', 'Lista de livros:');

  const bookRepo = AppDataSource.getRepository(Book);
  if (bookRepo) {
    const books = await bookRepo.find();

    socket.emit('allBooks', books);
  }

  socket.on('new book', async (msg) => {
    const newBook = bookRepo.create({ title: `${msg}` });
    await bookRepo.save(newBook);

    const books = await bookRepo.find();
    io.emit('allBooks', books);
  });

  socket.on('disconnect', () => {
    console.log('Usuário saiu da biblioteca :(');
  });
});

app.get('/', (req: any, res: any) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

server.listen(PORT, () => {
  console.log(`Rodando na porta ${PORT}`);
});
