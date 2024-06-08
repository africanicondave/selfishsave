console.log("JavaScript Loaded");

let transactions = [];
let budget = 0;
let userProfile = {};

if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}

document.getElementById('login-button').addEventListener('click', function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        alert(data.message);
        if (data.message === 'Login successful') {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            userProfile = data.profile || {};
            document.getElementById('profile-name').value = userProfile.name || '';
            if (userProfile.profilePicture) {
                document.getElementById('profile-image').src = userProfile.profilePicture;
                document.getElementById('profile-image').style.display = 'block';
            }
            fetch('/transactions')
                .then(response => response.json())
                .then(data => {
                    transactions = data.transactions;
                    displayTransactions();
                });
            fetch('/budget')
                .then(response => response.json())
                .then(data => {
                    budget = data.budget;
                    document.getElementById('current-budget').textContent = budget.toFixed(2);
                });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Login failed');
    });
});

document.getElementById('signup-button').addEventListener('click', function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        alert(data.message);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Signup failed');
    });
});

document.getElementById('add-transaction').addEventListener('click', function() {
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    if (description && amount) {
        fetch('/add-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description, amount, category })
        })
        .then(response => response.json())
        .then(data => {
            transactions.push(data.transaction);
            displayTransactions();
            checkBudget();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to add transaction');
        });
    } else {
        alert('Please fill in all fields');
    }
});

document.getElementById('set-budget').addEventListener('click', function() {
    const budgetAmount = document.getElementById('budget-amount').value;
    if (budgetAmount) {
        fetch('/set-budget', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: budgetAmount })
        })
        .then(response => response.json())
        .then(data => {
            budget = data.budget;
            document.getElementById('current-budget').textContent = budget.toFixed(2);
            alert('Budget set successfully');
            sendNotification('Budget Set', `Your budget of $${budget} has been set successfully.`);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to set budget');
        });
    } else {
        alert('Please enter a budget amount');
    }
});

document.getElementById('update-profile').addEventListener('click', function() {
    const profile = {
        name: document.getElementById('profile-name').value,
        profilePicture: userProfile.profilePicture || ''
    };
    fetch('/update-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: document.getElementById('email').value, profile })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message === 'Profile updated successfully') {
            userProfile = data.profile;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update profile');
    });
});

document.getElementById('profile-picture').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-image').src = e.target.result;
            document.getElementById('profile-image').style.display = 'block';
            userProfile.profilePicture = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('export-transactions').addEventListener('click', function() {
    fetch('/export-transactions')
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'transactions.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to export transactions');
        });
});

function sendNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

function checkBudget() {
    const totalSpent = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
    if (totalSpent > budget * 0.9) {
        sendNotification('Budget Alert', `You have spent 90% of your budget.`);
    }
}

function displayTransactions() {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';
    transactions.forEach((transaction, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `${transaction.description} (${transaction.category}): $${transaction.amount} 
            <button onclick="editTransaction(${index})">Edit</button> 
            <button onclick="deleteTransaction(${index})">Delete</button>`;
        transactionList.appendChild(listItem);
    });
    updateMonthlySummaryChart();
}

function updateMonthlySummaryChart() {
    const ctx = document.getElementById('monthly-summary-chart').getContext('2d');
    const categories = transactions.map(t => t.category);
    const amounts = transactions.map(t => t.amount);

    const categorySums = categories.reduce((acc, category, index) => {
        acc[category] = (acc[category] || 0) + amounts[index];
        return acc;
    }, {});

    const chartData = {
        labels: Object.keys(categorySums),
        datasets: [{
            label: 'Monthly Summary',
            data: Object.values(categorySums),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function editTransaction(index) {
    const transaction = transactions[index];
    const description = prompt("Edit Description", transaction.description);
    const amount = prompt("Edit Amount", transaction.amount);
    const category = prompt("Edit Category", transaction.category);
    if (description && amount && category) {
        fetch('/edit-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: transaction.id, description, amount, category })
        })
        .then(response => response.json())
        .then(data => {
            transactions[index] = data.transaction;
            displayTransactions();
            checkBudget();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to edit transaction');
        });
    }
}

function deleteTransaction(index) {
    fetch('/delete-transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: transactions[index].id })
    })
    .then(response => response.json())
    .then(data => {
        transactions.splice(index, 1);
        displayTransactions();
        checkBudget();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to delete transaction');
    });
}
