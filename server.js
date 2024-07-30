const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000', // Specify the correct origin if necessary
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allow credentials (cookies)
}));
app.use(express.static(path.join(__dirname))); // Serve static files from the root directory

// Dummy user data
const users = [
    { email: 'user@example.com', password: 'password123' }
];

// Dummy places data
const places = [
    { id: 1, name: 'Beautiful Beach House', price: 100, location: 'Miami, United States', image: 'place1.jpg' },
    { id: 2, name: 'Cozy Cabin', price: 150, location: 'Toronto, Canada', image: 'place2.jpg' },
    { id: 3, name: 'Modern Apartment', price: 200, location: 'New York, United States', image: 'place3.jpg' }
];

// Secret key for JWT
const SECRET_KEY = 'your_secret_key';

// Login endpoint
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

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Fetch places endpoint (authenticated)
app.get('/places', authenticateToken, (req, res) => {
    res.json(places);
});

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
