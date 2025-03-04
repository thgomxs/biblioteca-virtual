const socket = io();

const searchInput = document.querySelector('#search-input');
const urlForm = document.querySelector('#form');
const input = document.querySelector('#input');
const booksContainer = document.querySelector('#books');
const books = document.querySelectorAll('.book');
const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const profileForm = document.querySelector('#profileForm');
const profilePhoto = document.querySelector('#profile-photo');
const profileAvatar = document.querySelector('#profile-avatar');

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

socket.on('server:updatedProfile', (user) => {
  profilePhoto.src = user.picture;
  profileAvatar.src = user.picture;
});

socket.on('server:updatedProfile', (user) => {
  profilePhoto.src = user.picture;
  profileAvatar.src = user.picture;
});

socket.on('server:redirect', (destination) => {
  window.location.href = destination;
});

function createBook(book) {
  booksContainer.innerHTML += `
  <div class="book" book-id="${book.id}"  >
      <a href="/${book.id}" >
      <img src="${book.thumbnail}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-offset="0,15" data-bs-title="${book.title}" class="book-cover rounded" alt="...">
      </a>
  </div>

`;
}

function loadAuthMessages(data) {
  authForm = document.querySelector(`#${data.auth}Form`);

  authForm.reset();
  authForm.querySelector(`#auth-message`)?.remove();

  authForm.querySelector(
    '.modal-body',
  ).innerHTML += `<div id="auth-message" class=" text-${data.type} pt-2">
  ${data.message}
  </div>`;

  authForm.querySelector('.auth-close').onclick = () => {
    authForm.querySelector(`#auth-message`)?.remove();
  };

  if (data.auth == 'login' && data.type == 'success') {
    setTimeout(() => {
      location.reload();
    }, 500);
  }
}
function loginUser(e) {
  e.preventDefault();

  const user = loginForm['username'].value;
  const password = loginForm['password'].value;

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      username: user,
      password: password,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      loadAuthMessages(data);
    })
    .catch((error) => {
      console.error('Erro:', error);
    });
}
function registerUser(e) {
  e.preventDefault();

  const user = registerForm['username'].value;
  const password = registerForm['password'].value;
  const confirmPassword = registerForm['confirmPassword'].value;

  fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      username: user,
      password: password,
      confirmPassword: confirmPassword,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      loadAuthMessages(data);
    })
    .catch((error) => {
      console.error('Erro:', error);
    });
}

function searchBook() {
  const searchText = searchInput.value;

  socket.emit('client:searchBook', searchText);
}

socket.on('server:toastMessage', async ({ message, type }) => {
  const toastMessages = document.querySelector('#toastMessages');
  if (type == 'danger') {
    toastMessages.style.backgroundColor = '#dc3545';
  }
  if (type == 'success') {
    toastMessages.style.backgroundColor = '#198754';
  }

  toastMessages.querySelector('.toast-body').innerHTML = message;

  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastMessages);
  toastBootstrap.show();
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

async function updateProfile(e) {
  e.preventDefault();

  const picture = profileForm['picture'].files[0];
  const username = profileForm['username'].value;
  const picture_base64 = await toBase64(picture);

  console.log(picture_base64);

  socket.emit('client:updateProfile', { username: username, picture: picture_base64 });

  // fetch('/update', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   credentials: 'same-origin',
  //   body: JSON.stringify({ username: username, picture: picture_base64 }),
  // })
  //   .then((response) => {
  //     return response.json();
  //   })
  //   .then((data) => {
  //     console.log(data);
  //   })
  //   .catch((error) => {
  //     console.error('Erro:', error);
  //   });
}

urlForm?.addEventListener('submit', sendBookID);
loginForm?.addEventListener('submit', loginUser);
registerForm?.addEventListener('submit', registerUser);
profileForm?.addEventListener('submit', updateProfile);
searchInput?.addEventListener('keyup', searchBook);
