document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    checkAuthentication();

    if (window.location.pathname.includes('place.html')) {
        const placeId = getPlaceIdFromURL();
        const token = getCookie('token');
        if (token && placeId) {
            fetchPlaceDetails(token, placeId);
        }
    } else if (window.location.pathname.includes('index.html')) {
        const token = getCookie('token');
        if (token) {
            fetchPlaces(token);
            filterPlaces();
        }
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                await loginUser(email, password);
            } catch (error) {
                displayErrorMessage(error.message);
            }
        });
    }

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const token = getCookie('token');
            const reviewText = document.getElementById('review-text').value;
            const placeId = getPlaceIdFromURL();

            if (token && placeId) {
                await submitReview(token, placeId, reviewText);
            } else {
                displayErrorMessage('You must be logged in and provide a valid place ID.');
            }
        });
    }
});

function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('placeId');
}

async function loginUser(email, password) {
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`;
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
    } catch (error) {
        displayErrorMessage(error.message);
    }
}

function displayErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerText = `Error: ${message}`;
    document.body.appendChild(errorContainer);
    setTimeout(() => errorContainer.remove(), 5000);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

async function fetchPlaces(token) {
    try {
        const response = await fetch('http://localhost:3000/places', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayPlaces(data);
        } else {
            throw new Error('Failed to fetch places');
        }
    } catch (error) {
        displayErrorMessage(error.message);
    }
}

function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    if (!placesList) return;
    placesList.innerHTML = '';
    places.forEach(place => {
      const placeDiv = document.createElement('div');
      placeDiv.className = 'place-card';
      placeDiv.innerHTML = `
        <h3>${place.name}</h3>
        <p>Price: $${place.price || 'N/A'}/night</p>
        <p>Location: ${place.location || 'Unknown'}</p>
        <button class="details-button" onclick="window.location.href='place.html?placeId=${place.id}'">View Details</button>
      `;
      placesList.appendChild(placeDiv);
    });
    populateCountryFilter(places);
    filterPlaces();
  }  


function populateCountryFilter(places) {
    const countryFilter = document.getElementById('country-filter');
    if (!countryFilter) return;
    const countries = [...new Set(places.map(place => place.location.split(', ')[1]))];
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      countryFilter.appendChild(option);
    });
  }  
  

  function filterPlaces() {
    const selectedCountry = document.getElementById('country-filter').value;
    const places = document.querySelectorAll('.place-card');
    places.forEach(place => {
      const location = place.querySelector('p:nth-child(3)').textContent.split(': ')[1];
      const country = location.split(', ')[1];
      place.style.display = (selectedCountry === '' || country === selectedCountry) ? 'block' : 'none';
    });
  }

  function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');
    const homeLink = document.getElementById('home-link');
    const userName = document.getElementById('user-name');
  
    if (token) {
      // User is authenticated
      if (loginLink) loginLink.style.display = 'block'; // Hide the login link
      if (userName) {
        userName.textContent = `Welcome, ${getUserNameFromToken(token)}`;
        userName.style.display = 'block'; // Show the user name
      }
      if (homeLink) homeLink.style.display = 'block'; // Optionally, show the home link
      if (window.location.pathname.includes('index.html')) {
        fetchPlaces(token); // Fetch places if on the index.html page
      }
    } else {
      // User is not authenticated
      if (loginLink) loginLink.style.display = 'block'; // Show the login link
      if (homeLink) homeLink.style.display = 'none'; // Optionally, hide the home link
      if (userName) userName.style.display = 'none'; // Hide the user name
    }
  }

async function fetchPlaceDetails(token, placeId) {
    try {
        const response = await fetch(`http://localhost:3000/places/${placeId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const place = await response.json();
            displayPlaceDetails(place);
        } else {
            throw new Error('Failed to fetch place details');
        }
    } catch (error) {
        displayErrorMessage(error.message);
    }
}

function displayPlaceDetails(place) {
    const placeDetails = document.getElementById('place-details');
    if (!placeDetails) return;

    placeDetails.innerHTML = `
        <h1>${place.name}</h1>
        <div class="place-image-large">
            <img src="${place.image || 'placeholder.jpg'}" alt="${place.name}">
        </div>
        <p>Host: ${place.host || 'Unknown'}</p>
        <p>Price per night: $${place.price || 'N/A'}</p>
        <p>Location: ${place.location || 'Unknown'}</p>
        <p>Description: ${place.description || 'No description available'}</p>
        <h3>Amenities:</h3>
        <ul>
            ${place.amenities.map(amenity => `<li>${amenity}</li>`).join('')}
        </ul>
        <div id="reviews-list"></div>
        <div id="review-form-container">
            <textarea id="review-text" placeholder="Write your review here..."></textarea>
            <button id="submit-review-button">Submit Review</button>
        </div>
    `;

    displayReviews(place.reviews || []);
    document.getElementById('submit-review-button').addEventListener('click', async () => {
        const reviewText = document.getElementById('review-text').value;
        const token = getCookie('token');
        if (token) {
            await submitReview(token, place.id, reviewText);
        } else {
            displayErrorMessage('You must be logged in to submit a review.');
        }
    });
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    reviewsList.innerHTML = '';

    reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-card';
        reviewDiv.innerHTML = `
            <h4>${review.user}</h4>
            <p>${review.comment}</p>
            <p>Rating: ${review.rating || 'N/A'}</p>
            <p>Date: ${review.date ? new Date(review.date).toLocaleDateString() : 'Unknown'}</p>
        `;
        reviewsList.appendChild(reviewDiv);
    });
}

async function submitReview(token, placeId, reviewText) {
    try {
        const response = await fetch(`http://localhost:3000/places/${placeId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ comment: reviewText })
        });

        if (response.ok) {
            displaySuccessMessage('Review submitted successfully!');
            document.getElementById('review').value = ''; // Clear the form
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        displayErrorMessage(error.message);
    }
}

function displaySuccessMessage(message) {
    const successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.innerText = message;
    document.body.appendChild(successContainer);
    setTimeout(() => successContainer.remove(), 5000);
}
