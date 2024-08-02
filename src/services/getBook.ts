import cheerio from 'cheerio';
import axios from 'axios';
import { Book } from '../entity/Book';

export const getBookInfo = async (URL: string) => {
  const book = new Book;

  book.url = URL;

  await axios(URL).then((res) => {
    const body = res.data;

    var $ = cheerio.load(body);

    book.title = <string>$('#productTitle').text().trim();

    book.cover = <string>$('#landingImage').attr('src')

    book.price =  <string>$('.slot-price span').last().text().trim();

    book.category = <string>$('a.a-link-normal.a-color-tertiary').first().text().trim();
  });

  return book;
};

// export const getBookPrices = async (URLs) => {
//   let newBookPrices = [];

//   for (let URL of URLs) {
//     await axios(URL).then((res) => {
//       const body = res.data;

//       var $ = cheerio.load(body);

//       newBookPrices.push($('span.a-color-base .a-size-base.a-color-price').text().trim());
//     });
//   }

//   console.log(newBookPrices);
//   return newBookPrices;
// };