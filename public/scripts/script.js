const socket = io();

const searchContainerAdmin = document.querySelector("#admin-search-container");
const searchInputAdmin = document.querySelector("#search-input-admin");

const searchInput = document.querySelector("#search-input");
const urlForm = document.querySelector("#form");
const input = document.querySelector("#input");
const booksContainer = document.querySelector("#books");
const books = document.querySelectorAll(".book");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");

socket.on("admin-server:cleanInput", () => {
  searchInputAdmin.removeAttribute("disabled");
  searchInputAdmin.value = "";
});

socket.on("server:allBooks", (allBooks) => {
  booksContainer.innerHTML = "";

  allBooks.forEach((book) => {
    createBook(book);
  });

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltip) => {
    new bootstrap.Tooltip(tooltip);
  });
});

socket.on("server:searchedBooks", (books) => {
  booksContainer.innerHTML = "";

  if (books.length) {
    books.forEach((book) => {
      createBook(book);
    });

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltip) => {
      new bootstrap.Tooltip(tooltip);
    });
  }
});

function createBook(book) {
  booksContainer.innerHTML += `
  <div class=" book " book-id="${book.id}"  >
      <a href="/${book.id}" >
      <img src="${book.thumbnail}" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-offset="0,15" data-bs-title="${book.title}" class="book-cover rounded" alt="...">
      </a>
  </div>

`;
}
function removeBook(e) {
  let bookID = e.target.getAttribute("book-id");

  socket.emit("client:removeBook", bookID);
}

function loadAuthMessages(data) {
  authForm = document.querySelector(`#${data.auth}Form`);

  authForm.reset();
  authForm.querySelector(`#auth-message`)?.remove();

  authForm.querySelector(".modal-body").innerHTML += `<div id="auth-message" class=" text-${data.type} pt-2">
  ${data.message}
  </div>`;

  authForm.querySelector(".auth-close").onclick = () => {
    authForm.querySelector(`#auth-message`)?.remove();
  };

  if (data.auth == "login" && data.type == "success") {
    setTimeout(() => {
      location.reload();
    }, 500);
  }
}
function loginUser(e) {
  e.preventDefault();

  const user = loginForm["username"].value;
  const password = loginForm["password"].value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
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
      console.error("Erro:", error);
    });
}
function registerUser(e) {
  e.preventDefault();

  const user = registerForm["username"].value;
  const password = registerForm["password"].value;
  const confirmPassword = registerForm["confirmPassword"].value;

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
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
      console.error("Erro:", error);
    });
}

function searchBook() {
  const searchText = searchInput.value;

  socket.emit("client:searchBook", searchText);
}

// ADMIN
function searchBookAdmin() {
  const query = searchInputAdmin.value;

  if (query.trim() == "") {
    searchContainerAdmin.innerHTML = "";
  } else {
    socket.emit("admin-client:searchBook", query);
  }
}
function sendBookID(id) {
  console.log(id);

  if (searchInputAdmin.value) {
    socket.emit("admin-client:newBook", id);
    searchInputAdmin.setAttribute("disabled", "");
    searchContainerAdmin.innerHTML = "";
  }
}
socket.on("admin-server:searchedBooks", ({ books, query }) => {
  let booksElements = "";

  if (books == "Livro não encontrado") {
    searchContainerAdmin.innerHTML = '              <ul id="list-box"><span class="text-danger">Livro não encontrado</span>              </ul>';
  } else {
    books.forEach((book) => {
      booksElements += `<li onclick="sendBookID('${book.id}')" data-id="${book.id}">
                    <img src="${book.thumbnail !== "Capa não disponível" ? book.thumbnail : "./images/image-not-available.png"}" alt="Capa do livro" />
                    <span>${book.title}</span>
              </li>`;
    });

    searchContainerAdmin.innerHTML = `
              <ul id="list-box">
                ${booksElements}
                <span style="font-size: 0.8rem"> Resultados encontrados por "<span id="admin-search">${query}</span>"</span>
              </ul>
  `;
  }
});

urlForm?.addEventListener("submit", sendBookID);
loginForm?.addEventListener("submit", loginUser);
registerForm?.addEventListener("submit", registerUser);
searchInput?.addEventListener("keyup", searchBook);
searchInputAdmin?.addEventListener("keyup", searchBookAdmin);
