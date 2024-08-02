document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    handlePageLoad();

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
});

async function loginUser(email, password) {
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            setCookie('token', data.access_token, 1); // Store token in a cookie for 1 day
            console.log('Token set:', getCookie('token')); // Debugging statement
            window.location.href = '/index.html';
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
    } catch (error) {
        displayErrorMessage(error.message);
    }
}

async function handlePageLoad() {
    const token = getCookie('token');
    console.log('Token from cookie:', token); // Debugging statement

    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        if (token) {
            if (window.location.pathname === '/') {
                window.location.href = '/index.html';
                return;
            }
            fetchPlaces();
        } else {
            fetchPlacesLandingPage();
        }
    } else if (window.location.pathname.includes('place.html')) {
        const placeId = getPlaceIdFromURL();
        if (placeId) {
            fetchPlaceDetails(token, placeId);
        }
    } else if (window.location.pathname.includes('add-review.html')) {
        setupReviewForm();
    }
}

async function fetchPlacesLandingPage() {
    try {
        const response = await fetch('http://localhost:3000/places', {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            displayPlacesLandingPage(data);
        } else {
            throw new Error('Failed to fetch places');
        }
    } catch (error) {
        displayErrorMessage(error.message);
    }
}

function displayPlacesLandingPage(places) {
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
}

async function fetchPlaces() {
    try {
        const response = await fetch('http://localhost:3000/places', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${getCookie('token') || ''}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayPlaces(data);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch places');
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

async function fetchPlaceDetails(token, placeId) {
    try {
        const response = await fetch(`http://localhost:3000/places/${placeId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token || ''}` }
        });

        if (response.ok) {
            const place = await response.json();
            displayPlaceDetails(place);
            await fetchPlaceReviews(token, placeId);
        } else {
            throw new Error('Failed to fetch place details');
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        displayErrorMessage(error.message);
    }
}

async function fetchPlaceReviews(token, placeId) {
    try {
        const response = await fetch(`http://localhost:3000/places/${placeId}/reviews`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token || ''}` }
        });

        if (response.ok) {
            const reviews = await response.json();
            displayReviews(reviews);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch reviews');
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
        displayErrorMessage('Failed to fetch reviews. Please try again later.');
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
            <div id="rating">
                <input type="radio" id="star5" name="rating" value="5">
                <label for="star5"><i class="fa fa-star"></i></label>
                <input type="radio" id="star4" name="rating" value="4">
                <label for="star4"><i class="fa fa-star"></i></label>
                <input type="radio" id="star3" name="rating" value="3">
                <label for="star3"><i class="fa fa-star"></i></label>
                <input type="radio" id="star2" name="rating" value="2">
                <label for="star2"><i class="fa fa-star"></i></label>
                <input type="radio" id="star1" name="rating" value="1">
                <label for="star1"><i class="fa fa-star"></i></label>
            </div>
            <button id="submit-review-button">Submit Review</button>
        </div>
    `;

    const token = getCookie('token');
    if (token) {
        document.getElementById('submit-review-button').addEventListener('click', async () => {
            const reviewText = document.getElementById('review-text').value.trim();
            const rating = document.querySelector('input[name="rating"]:checked')?.value;
            if (token && rating) {
                await submitReview(place.id, reviewText, rating);
            } else {
                displayErrorMessage('You must select a rating to submit a review.');
            }
        });
    } else {
        document.getElementById('review-form-container').style.display = 'none'; // Hide review form for unauthenticated users
        displayErrorMessage('You must be logged in to submit a review.');
    }
}

async function submitReview(placeId, reviewText, rating) {
    console.log('Submitting review for placeId:', placeId); // Debugging statement
    const token = getCookie('token'); // Get the token from cookie

    if (!token) {
        console.error('No token found');
        displayErrorMessage('You must be logged in to submit a review.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/places/${placeId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ review: reviewText, rating: rating })
        });

        if (response.ok) {
            const newReview = await response.json();
            console.log('Review submitted successfully:', newReview);
            displaySuccessMessage('Review submitted successfully.');
            // Optionally, refresh reviews or update UI
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('Error in submitReview:', error);
        displayErrorMessage('Failed to submit review. Please try again.');
    }
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    reviewsList.innerHTML = '';

    reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-card';

        reviewDiv.innerHTML = `
            <h4>${review.user || 'Anonymous'}</h4>
            <p>${review.comment || 'No comment'}</p>
            <p>Rating: ${'★'.repeat(review.rating) || 'N/A'}</p>
        `;

        reviewsList.appendChild(reviewDiv);
    });
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value}${expires}; path=/`;
}

function displayErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerText = `Error: ${message}`;
    document.body.appendChild(errorContainer);
    setTimeout(() => errorContainer.remove(), 5000);
}

function displaySuccessMessage(message) {
    const successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.innerText = message;
    document.body.appendChild(successContainer);
    setTimeout(() => successContainer.remove(), 5000);
}

function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('placeId');
}
