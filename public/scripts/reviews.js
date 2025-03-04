const userID = document.querySelector('main').getAttribute('user-id');
const reviewsContainer = document.querySelector('#reviews-container');

socket.on('server:userReviews', (reviews) => {
  reviewsContainer.innerHTML = '';

  reviews.forEach((review) => {
    createReview(review);
  });

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltip) => {
    new bootstrap.Tooltip(tooltip);
  });
});

function getStars(number) {
  const integer = Math.floor(number);
  const halfs = (number - integer) * 2;
  const stars = '★'.repeat(integer) + '½'.repeat(halfs);
  console.log(number, stars);

  return stars;
}

function createReview(review) {
  reviewsContainer.innerHTML += `
  <div class="review" review-id="${review.id}"  >
      <img src="${
        review.book.thumbnail
      }" data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip" data-bs-offset="0,15" data-bs-title="${
    review.book.title
  }" class="review-cover rounded" alt="...">
      <div class="review-info">
        <a href="/${review.book.id}">${review.book.title}</a>
        <span class="text-warning"> ${getStars(parseFloat(review.rating))} </span>
        <span class="review-comment">${review.comment}</span>
        <div class="review-buttons">
          <button class="btn btn-sm btn-primary">Editar</button>
          <button class="btn btn-sm btn-danger">Excluir</button>  
        </div>
      </div>

  </div>

`;
}
