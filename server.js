const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Dummy user data
const users = [
    { email: 'user@example.com', password: 'password123' }
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

// Serve login.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve scripts.js
app.get('/scripts.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts.js'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
