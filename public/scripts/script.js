const socket = io();
const form = document.querySelector('#form');
const input = document.querySelector('#input');
const messages = document.querySelector('#messages');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('new book', input.value);
    input.value = '';
  }
});

function createLine(text) {
  const item = document.createElement('li');
  item.textContent = text;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}

socket.on('chat message', (msg) => {
  createLine(msg);
});

socket.on('allBooks', (books) => {
  messages.innerHTML = '';
  books.forEach((book) => {
    createLine(book.title);
  });
});
