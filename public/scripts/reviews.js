const userID = document.querySelector('main').getAttribute('user-id');
const reviewsContainer = document.querySelector('#reviews-container');
const editRateForm = document.querySelector('#edit-rate-form');
const rateModal = document.querySelector('#rate');
const rateWarning = document.querySelector('#rate-warning');
const stars = document.querySelectorAll('.star-rate');

// Fetch all the forms we want to apply custom Bootstrap validation styles to
var forms = document.querySelectorAll('.needs-validation');

// Loop over them and prevent submission
Array.prototype.slice.call(forms).forEach(function (form) {
  form.addEventListener(
    'submit',
    function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }

      form.classList.add('was-validated');
    },
    false,
  );
});

socket.on('server:userReviews', (reviews) => {
  reviewsContainer.innerHTML = '';

  reviews.forEach((review) => {
    createReview(review);
  });

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltip) => {
    new bootstrap.Tooltip(tooltip);
  });

  document.querySelectorAll('.edit-rate-btn').forEach((button) => {
    button.onclick = () => {
      const reviewID = button.parentElement.getAttribute('review-id');
      socket.emit('client:getReview', reviewID);
      rateModal.setAttribute('review-id', reviewID);
    };
  });

  document.querySelectorAll('.delete-rate-btn').forEach((button) => {
    button.onclick = () => {
      console.log('clicado');

      const reviewID = button.parentElement.getAttribute('review-id');
      socket.emit('client:deleteReview', reviewID);
    };
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
        <div class="review-buttons" review-id="${review.id}">
          <button data-bs-toggle="modal" data-bs-target="#rate" class="btn btn-sm btn-primary edit-rate-btn">Editar</button>
          <button class="btn btn-sm btn-danger delete-rate-btn">Excluir</button>  
        </div>
      </div>

  </div>

`;
}

editRateForm.onsubmit = async (e) => {
  e.preventDefault();
  const closeRateBtn = rateModal.querySelector('.btn-close');
  const comment = rateModal.querySelector('#comment').value;
  const reviewID = rateModal.getAttribute('review-id');

  let rating = 0;
  stars.forEach((star) => {
    if (star.checked) {
      rating = star.getAttribute('data-rate');
    }
  });

  if (!rating) {
    rateWarning.style.opacity = '100%';

    setTimeout(() => {
      rateWarning.style.opacity = '0%';
    }, 1500);
  }

  if (comment !== '' && rating) {
    rateWarning.style.opacity = 0;
    closeRateBtn.click();
    socket.emit('client:editReview', { comment, reviewID, rating });
    setTimeout(() => {
      editRateForm.reset();
    }, 1000);
  }
};

socket.on('server:getReview', (review) => {
  const rateImage = rateModal.querySelector('#rate-image');
  const rateTitle = rateModal.querySelector('#rate-title');
  const comment = rateModal.querySelector('#comment');

  stars.forEach((star) => {
    const rating = star.getAttribute('data-rate');
    if (rating == Number(review.rating)) {
      star.checked = true;
    }
  });

  rateTitle.innerHTML = review.book.title;
  rateImage.src = review.book.thumbnail;
  comment.innerHTML = review.comment;
});
