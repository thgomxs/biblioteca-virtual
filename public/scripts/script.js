const socket = io();
const form = document.querySelector('#form');
const input = document.querySelector('#input');
const books = document.querySelector('#books');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('book:Create', input.value);
    input.value = '';
  }
});

function createBook(book) {
  books.innerHTML += `
  <div class="book border m-2 d-flex align-items-center justify-content-center gap-2">
    <img src="${book.cover}" height="50" alt="">
    <p class="book-title mb-0">${book.title}</p>
    <input type="button" class="btn btn-danger" book-id="${book.id}" value="Remover"  onclick="removeBook(event)">
  </div>`
  window.scrollTo(0, document.body.scrollHeight);
}

function removeBook(e){
  let bookID = e.target.getAttribute('book-id')

  socket.emit('book:Remove', bookID)
}

socket.on('allBooks', (allBooks) => {
  books.innerHTML = '';

  allBooks.forEach((book) => {
    createBook(book);
  });
});
