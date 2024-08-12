const socket = io();

const searchInput = document.querySelector('#search-input');
const urlForm = document.querySelector('#form');
const input = document.querySelector('#input');
const booksContainer = document.querySelector('#books');
const books = document.querySelectorAll('.book');
const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');

socket.on('server:cleanInput', () => {
  input.removeAttribute('disabled');
  input.value = '';
});

socket.on('server:allBooks', (allBooks) => {
  booksContainer.innerHTML = '';

  allBooks.forEach((book) => {
    createBook(book);
  });

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltip) => {
    new bootstrap.Tooltip(tooltip);
  });
});

socket.on('server:searchedBooks', (books) => {
  booksContainer.innerHTML = '';

  if (books.length) {
    books.forEach((book) => {
      createBook(book);
    });

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltip) => {
      new bootstrap.Tooltip(tooltip);
    });
  }
});

socket.on('server:authMessage', (msg) => {
  if (msg.token) {
    document.cookie = `authorization=${msg.token}`;
    localStorage.setItem('token', msg.token);
    setTimeout(() => {
      location.reload();
    }, 500);
  }

  authForm = document.querySelector(`#${msg.auth}Form`);

  authForm.reset();
  authForm.querySelector(`#auth-message`)?.remove();

  authForm.querySelector(
    '.modal-body',
  ).innerHTML += `<div id="auth-message" class=" text-${msg.type} pt-2">
  ${msg.message}
  </div>`;

  authForm.querySelector('.auth-close').onclick = () => {
    authForm.querySelector(`#auth-message`)?.remove();
  };
});

function sendBookURL(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('client:newBook', input.value);
    input.setAttribute('disabled', '');
  }
}
function createBook(book) {
  booksContainer.innerHTML += `
  <div class=" book " book-id="${book.id}"  >
      <a href="/${book.id}" >
      <img src="${book.cover}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-offset="0,15" data-bs-title="${book.title}" class="book-cover rounded" alt="...">
      </a>
  </div>

`;
}
function removeBook(e) {
  let bookID = e.target.getAttribute('book-id');

  socket.emit('client:removeBook', bookID);
}

function authUser(e) {
  e.preventDefault();

  const user = loginForm['username'].value;
  const password = loginForm['password'].value;

  socket.emit('client:authUser', { user, password });
}
function newUser(e) {
  e.preventDefault();

  const user = registerForm['username'].value;
  const password = registerForm['password'].value;
  const confirmPassword = registerForm['confirmPassword'].value;

  socket.emit('client:newUser', { user, password, confirmPassword });
}

function searchBook() {
  const searchText = searchInput.value;

  socket.emit('client:searchBook', searchText);
}

urlForm?.addEventListener('submit', sendBookURL);
loginForm?.addEventListener('submit', authUser);
registerForm?.addEventListener('submit', newUser);
searchInput?.addEventListener('keyup', searchBook);
