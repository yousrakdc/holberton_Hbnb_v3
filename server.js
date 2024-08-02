const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Secret key for JWT
const SECRET_KEY = 'your_secret_key';

// Dummy user data
const users = [
    { email: 'user@example.com', password: 'password123' }
];

const places = [
    { id: '1', name: 'Beautiful Beach House', host: 'John Doe', price: 150, location: 'Los Angeles, United States', image: 'place1.jpg', description: 'A beautiful beach house with amazing views...', amenities: ['WiFi', 'Pool', 'Air Conditioning'], reviews: [{ user: 'Beyoncé', comment: 'Great place to stay!', rating: 4 }, { user: 'Robert Brown', comment: 'Amazing location and very comfortable.', rating: 5 }] },
    { id: '2', name: 'Cozy Cabin', price: 150, location: 'Toronto, Canada', image: 'place2.jpg', description: 'Amazing cabin, extremely cosy for winter nights!', amenities: ['WiFi', 'Fireplace', 'Sauna'], reviews: [{ user: 'Ryan Reynolds', comment: 'Absolutely epic place to stay!', rating: 4 }, { user: 'James Brown', comment: 'Amazing location and very comfortable.', rating: 5 }]},
    { id: '3', name: 'Modern Apartment', price: 200, location: 'New York, United States', image: 'place3.jpg', description: 'A beautiful modern apartment in Manhattan', amenities: ['WiFi', 'Pool', 'Air Conditioning', 'Gym'], reviews: [{ user: 'Bradley Cooper', comment: 'Loved this place, well located!', rating: 4 }, { user: 'Robert Brown', comment: 'Amazing location and very comfortable.', rating: 5 }] }
];

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log('No token provided');
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log('Token verification failed', err);
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        next();
    });
}

app.get('/places', (req, res) => {
    res.json(places);
});

app.get('/places/:placeId', (req, res) => {
    const placeId = req.params.placeId;
    const place = places.find(p => p.id === placeId);

    if (place) {
        res.json(place);
    } else {
        res.status(404).json({ message: 'Place not found' });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ access_token: token });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

app.get('/places/:placeId/reviews', (req, res) => {
    const placeId = req.params.placeId;
    console.log('Fetching reviews for placeId:', placeId);

    const place = places.find(p => p.id === placeId);

    if (place) {
        console.log('Found place:', place);
        res.json(place.reviews);
    } else {
        console.log('Place not found');
        res.status(404).json({ message: 'Place not found' });
    }
});

app.post('/places/:placeId/reviews', (req, res) => {
    const placeId = req.params.placeId;
    const { review, rating } = req.body;

    // Validate input
    if (!placeId || !review || !rating) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if place exists
    const place = places.find(p => p.id === placeId);
    if (!place) {
        return res.status(404).json({ message: 'Place not found' });
    }

    // Add review to the place
    reviews[placeId].push({ review, rating });
    res.status(201).json({ message: 'Review submitted successfully' });
});

app.delete('/places/:placeId/reviews/:reviewIndex', authenticateToken, (req, res) => {
    const { placeId, reviewIndex } = req.params;
    const email = req.user.email;

    console.log('Delete review request:', { placeId, reviewIndex, email });

    const place = places.find(p => p.id === placeId);

    if (place) {
        const reviewIndexInt = parseInt(reviewIndex, 10);
        if (isNaN(reviewIndexInt) || reviewIndexInt < 0 || reviewIndexInt >= place.reviews.length) {
            return res.status(400).json({ message: 'Invalid review index' });
        }

        const review = place.reviews[reviewIndexInt];
        if (review.user !== email) {
            return res.status(403).json({ message: 'You can only delete your own reviews' });
        }

        place.reviews.splice(reviewIndexInt, 1);
        console.log('Review deleted:', review);
        res.status(200).json({ message: 'Review deleted successfully' });
    } else {
        res.status(404).json({ message: 'Place not found' });
    }
});

// Serve static files after routes
app.use(express.static(path.join(__dirname)));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login.html
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
