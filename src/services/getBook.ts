import axios from "axios";
import { Book } from "../entity/Book";

export const getBook = async (id: string) => {
  const book = new Book();
  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`);
    const data = response.data;

    book.url = data.volumeInfo.infoLink;
    book.title = data.volumeInfo.title || "Título não disponível";
    book.author = data.volumeInfo.authors ? data.volumeInfo.authors.join(", ") : "Autor não disponível";
    book.thumbnail = data.volumeInfo.imageLinks?.thumbnail || "Capa não disponível";
    book.description = data.volumeInfo.description || "Descrição não disponível";
    book.category = data.volumeInfo.categories ? data.volumeInfo.categories.join(", ") : "Categoria não disponível";

    return book;
  } catch (error) {
    console.log("Erro ao encontrar livro com esse ID! ", error);
  }
  return null;
};

export const searchBook = async (query: string) => {
  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/?q=intitle:${query}&maxResults=5`);
    const books = response.data.items;

    if (!books) {
      return "Livro não encontrado";
    } else {
      return books.map((book: any) => ({
        id: book.id,
        title: book.volumeInfo.title || "Título não disponível",
        thumbnail: book.volumeInfo.imageLinks?.thumbnail || "Capa não disponível",
      }));
    }
  } catch (error) {
    console.log("Erro ao encontrar livros com esse nome! ", error);
  }
  return null;
};
