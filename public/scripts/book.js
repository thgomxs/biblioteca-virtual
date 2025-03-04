const stars = document.querySelectorAll('.star-rate');
const bookID = document.querySelector('main').getAttribute('book-id');
const rateSendButton = document.querySelector('#btn-send-rate');
const rateModal = document.querySelector('#rate');
const reviewsContainer = document
  .querySelector('#view-rates')
  .querySelector('.modal-body');
const bookDescription = document.querySelector('#book-description');
const likeButton = document.querySelector('.heart-like');
const readButton = document.querySelector('.book-read');
const rateForm = document.querySelector('#rate-form');
const rateWarning = document.querySelector('#rate-warning');

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

bookDescription.innerHTML = bookDescription.innerText;

socket.emit('client:getReviews', bookID);

socket.on('server:allReviews', (reviews) => {
  reviewsContainer.innerHTML = '';

  if (reviews) {
    reviews.forEach((review) => {
      reviewsContainer.innerHTML += `
                        <div class="rate-wrapper d-flex gap-3">
  
                        <img class="profile-avatar" src="${
                          review.user.picture
                        }" alt="profile avatar" />
  
    
                      <div class="rate-info">
                        <p class="card-text small fs-6 fw-bold mb-2">
                          <span class="text-body-secondary fw-normal">Analise de </span>${
                            review.user.username
                          }
                          <span class="text-warning"> ${getStars(
                            parseFloat(review.rating),
                          )} </span>
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

socket.on('server:updateStats', ({ likes, reads }) => {
  document.querySelector('#likes').innerHTML = likes;
  document.querySelector('#reads').innerHTML = reads;
});

function resetStars() {
  stars.forEach((star) => {
    star.checked = false;
  });
}

function getStars(number) {
  const integer = Math.floor(number);
  const halfs = (number - integer) * 2;
  const stars = '★'.repeat(integer) + '½'.repeat(halfs);
  console.log(number, stars);

  return stars;
}

rateForm.onsubmit = async (e) => {
  e.preventDefault();
  const closeRateBtn = rateModal.querySelector('.btn-close');
  const comment = rateModal.querySelector('#comment').value;

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
    socket.emit('client:newReview', { comment, bookID, rating });
    setTimeout(() => {
      rateForm.reset();
    }, 1000);
  }
};

function addStat(stat) {
  socket.emit('client:addStat', { bookID: bookID, stat: stat });
}

function removeStat(stat) {
  socket.emit('client:removeStat', { bookID: bookID, stat: stat });
}

likeButton.addEventListener('click', () => {
  if (likeButton.classList.contains('active')) {
    likeButton.classList.remove('active');
    removeStat('likes');
  } else {
    likeButton.classList.add('active');
    addStat('likes');
  }
});

readButton.addEventListener('click', () => {
  if (readButton.classList.contains('active')) {
    readButton.classList.remove('active');
    removeStat('reads');
  } else {
    readButton.classList.add('active');
    addStat('reads');
  }
});
