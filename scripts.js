document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    checkAuthentication();

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
            document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`;
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        displayErrorMessage(error.message);
    }
}

function displayErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerText = `Login failed: ${message}`;
    document.body.appendChild(errorContainer);
    setTimeout(() => {
        errorContainer.remove();
    }, 5000);
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
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayPlaces(data);
            populateCountryFilter(data);
        } else {
            console.error('Failed to fetch places:', response.statusText);
            displayErrorMessage('Failed to fetch places: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error fetching places:', error);
        displayErrorMessage('Error fetching places: ' + error.message);
    }
}

function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = '';

    places.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.className = 'place-card';
        placeDiv.innerHTML = `
            <div class="place-image-container">
                <img src="${place.image || 'placeholder.jpg'}" alt="${place.name}" class="place-image">
            </div>
            <h3>${place.name}</h3>
            <p>Price: $${place.price || 'N/A'}/night</p>
            <p>Location: ${place.location || 'Unknown'}</p>
            <button class="details-button">View Details</button>
        `;
        placesList.appendChild(placeDiv);
    });

    filterPlaces();
}

function populateCountryFilter(places) {
    const countryFilter = document.getElementById('country-filter');
    const countries = [...new Set(places.map(place => place.location.split(', ')[1]))];

    countryFilter.innerHTML = '<option value="">All</option>';

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
        const location = place.querySelector('p').textContent.split(': ')[1].split(', ')[1];
        if (!selectedCountry || location === selectedCountry) {
            place.style.display = 'block';
        } else {
            place.style.display = 'none';
        }
    });
}

function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');

    console.log('Checking authentication...');
    console.log('Token:', token);

    if (token) {
        loginLink.style.display = 'none';
        fetchPlaces(token);
    } else {
        loginLink.style.display = 'block';
    }
}
