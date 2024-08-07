const stars = document.querySelectorAll(".star-rate");
const bookID = document.querySelector("main").getAttribute("book-id");
const rateSaveButton = document.querySelector("#btn-save-rate");
const rateModal = document.querySelector("#rate");
const reviewsContainer = document.querySelector("#view-rates").querySelector(".modal-body");
const bookDescription = document.querySelector("#book-description");

bookDescription.innerHTML = bookDescription.innerText;

socket.emit("client:getReviews", bookID);

socket.on("server:allReviews", (reviews) => {
  reviewsContainer.innerHTML = "";

  if (reviews) {
    reviews.forEach((review) => {
      reviewsContainer.innerHTML += `
                        <div class="rate-wrapper d-flex gap-3">
  
                        <img class="profile-avatar" src="https://s.ltrbxd.com/static/img/avatar80.ccc31669.png" alt="profile avatar" />
  
    
                      <div class="rate-info">
                        <p class="card-text small fs-6 fw-bold mb-2">
                          <span class="text-body-secondary fw-normal">Analise de </span>${review.user.username}
                          <span class="text-warning"> ${getStars(parseFloat(review.rating))} </span>
                        </p>
                        <p class="card-text text-break small mb-3">
                          ${review.comment}
                        </p>
                      </div>
                    </div>
  
                    <hr class="mt-1 mb-3" />
        `;
    });
  }
});

function resetStars() {
  stars.forEach((star) => {
    star.checked = false;
  });
}

function getStars(number) {
  const integer = Math.floor(number);
  const halfs = (number - integer) * 2;
  const stars = "★".repeat(integer) + "½".repeat(halfs);
  console.log(number, stars);

  return stars;
}

rateSaveButton.onclick = (e) => {
  e.preventDefault();

  const closeRateBtn = rateModal.querySelector(".btn-close");
  const comment = rateModal.querySelector("#comment").value;
  let rating = 0;
  stars.forEach((star) => {
    if (star.checked) {
      rating = star.getAttribute("data-rate");
    }
  });

  closeRateBtn.click();
  socket.emit("client:newReview", { comment, bookID, rating });
};
