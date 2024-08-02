import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import { Book } from './entity/Book';
import { AppDataSource } from './utils/database';
import { getBookInfo } from './services/getBook';

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(express.static('public'));




io.on('connection', async (socket) => {
  console.log('Uusário entrou na biblioteca!');

  const bookRepo = AppDataSource.getRepository(Book);
  if (bookRepo) {
    const books = await bookRepo.find();
    socket.emit('allBooks', books);
  }

  async function sendBooks(){
    const books = await bookRepo.find();
    io.emit('allBooks', books)
  }

  socket.on('book:Create', async (url) => {
    const newBook = await getBookInfo(url)
    await bookRepo.save(newBook);

    sendBooks()
  });

  socket.on('book:Remove', async(bookID)=>{
    const book = await bookRepo.find({where: {id: bookID}})
    
    if (book){
      await bookRepo.remove(book)
    }

    sendBooks()
  })

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
