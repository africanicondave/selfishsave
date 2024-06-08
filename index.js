const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const { Parser } = require('json2csv');

app.use(express.static('public'));
app.use(bodyParser.json());

let users = []; // In-memory store for users
let transactions = []; // In-memory store for transactions
let budget = 0; // In-memory store for budget

// Basic route to serve the homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// User sign-up route
app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    if (users.find(user => user.email === email)) {
        res.status(400).send({ message: 'User already exists' });
    } else {
        users.push({ email, password, profile: {} });
        res.send({ message: 'Signup successful' });
    }
});

// User login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        res.send({ message: 'Login successful', profile: user.profile });
    } else {
        res.status(401).send({ message: 'Invalid email or password' });
    }
});

// Add transaction route
app.post('/add-transaction', (req, res) => {
    const { description, amount, category } = req.body;
    const transaction = { id: transactions.length, description, amount: parseFloat(amount), category };
    transactions.push(transaction);
    res.send({ message: 'Transaction added', transaction });
});

// Get transactions route
app.get('/transactions', (req, res) => {
    res.send({ transactions });
});

// Add budget route
app.post('/set-budget', (req, res) => {
    const { amount } = req.body;
    budget = parseFloat(amount);
    res.send({ message: 'Budget set successfully', budget });
});

// Get budget route
app.get('/budget', (req, res) => {
    res.send({ budget });
});

// Edit transaction route
app.post('/edit-transaction', (req, res) => {
    const { id, description, amount, category } = req.body;
    const transaction = transactions.find(transaction => transaction.id === id);
    if (transaction) {
        transaction.description = description;
        transaction.amount = parseFloat(amount);
        transaction.category = category;
        res.send({ message: 'Transaction edited', transaction });
    } else {
        res.status(404).send({ message: 'Transaction not found' });
    }
});

// Delete transaction route
app.post('/delete-transaction', (req, res) => {
    const { id } = req.body;
    const index = transactions.findIndex(transaction => transaction.id === id);
    if (index !== -1) {
        transactions.splice(index, 1);
        res.send({ message: 'Transaction deleted' });
    } else {
        res.status(404).send({ message: 'Transaction not found' });
    }
});

// Export transactions route
app.get('/export-transactions', (req, res) => {
    const fields = ['id', 'description', 'amount', 'category'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transactions);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    res.send(csv);
});

// Update user profile route
app.post('/update-profile', (req, res) => {
    const { email, profile } = req.body;
    const user = users.find(user => user.email === email);
    if (user) {
        user.profile = profile;
        res.send({ message: 'Profile updated successfully', profile: user.profile });
    } else {
        res.status(404).send({ message: 'User not found' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
