import cheerio from "cheerio";
import axios from "axios";
import { Book } from "../entity/Book";

export const getBookInfo = async (URL: string) => {
  const book = new Book();

  book.url = URL;

  await axios(URL).then((res) => {
    const body = res.data;

    var $ = cheerio.load(body);

    book.title = <string>$("#productTitle").text().trim();

    book.author = <string>$(".author a").first().text();

    book.cover = <string>$("#landingImage").attr("src");

    book.description = <string>$("#bookDescription_feature_div div div").html();

    book.price = <string>$(".slot-price span").last().text().trim();

    book.category = <string>$(".cat-link").first().text().trim();
  });

  return book;
};
