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

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // If no token, unauthorized

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
}

// Routes
app.get('/places/:placeId', (req, res) => {
    const placeId = req.params.placeId;
    const place = places.find(p => p.id === placeId);

    if (place) {
        res.json(place);
    } else {
        res.status(404).json({ message: 'Place not found' });
    }
});

app.get('/places', authenticateToken, (req, res) => {
    res.json(places);
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

// Serve scripts.js
app.get('/scripts.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts.js'));
});

// Serve styles.css
app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
