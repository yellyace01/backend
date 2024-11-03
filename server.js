const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
    host: 'bkcddm8l2mmddro5bvyt-mysql.services.clever-cloud.com',
    user: 'uprucnqbu62znzyz',
    password: 'im0StjwEpktIDqJ0ZmJ3',
    database: 'bkcddm8l2mmddro5bvyt',
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('SUCCESSFULLY CONNECTED TO DATABASE!');
});

app.post('/reset-password', (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    console.log("Received data:", req.body);


    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Email, new password, and confirm password are required.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Validate email exists in the database
    db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            console.log('Email not found:', email);
            return res.status(404).json({ error: 'Email not found' });
        }
        // Update password
        db.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, email], (updateError) => {
            if (updateError) {
                console.error('Error updating password:', updateError);
                return res.status(500).json({ error: 'Error updating password' });
            }
            console.log('Password updated successfully for:', email);
            res.status(200).json({ message: 'Password updated successfully' });
        });
    });
});


// Registration endpoint
app.post('/register', (req, res) => {
    const { username, password, email, role, name } = req.body;

    if (!username || !password || !email || !role || !name) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const query = 'INSERT INTO users (username, password, email, role, name) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [username, password, email, role, name], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error saving user to database' });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});


// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;


    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Server error' });
        }
        if (results.length > 0) {
            const user = results[0];
            res.status(200).json({ role: user.role });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});


// Endpoint to get all announcements
app.get('/announcements', (req, res) => {
    const query = 'SELECT * FROM announcements ORDER BY date DESC';
    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error retrieving announcements' });
        }
        res.status(200).json(results);
    });
});

app.post('/announcements', (req, res) => {
    const { title, content } = req.body;


    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
    }

    const query = 'INSERT INTO announcements (title, content, date) VALUES (?, ?, ?)';
    const date = new Date();

    db.query(query, [title, content, date], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error saving announcement' });
        }
        res.status(201).json({ message: 'Announcement added successfully', id: results.insertId });
    });
});

app.delete('/announcements/:id', (req, res) => {
    const announcementId = req.params.id;

    const query = 'DELETE FROM announcements WHERE id = ?';

    db.query(query, [announcementId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error deleting announcement' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.status(200).json({ message: 'Announcement deleted successfully' });
    });
});


//feedback
app.post('/feedback', (req, res) => {
    const { rating, feedback } = req.body;


    console.log('Received Feedback:', req.body);

    if (rating === undefined || !feedback) {
        return res.status(400).json({ message: 'Rating and feedback are required.' });
    }

    const query = 'INSERT INTO feedback (rating, feedback) VALUES (?, ?)';
    db.query(query, [rating, feedback], (error, results) => {
        if (error) {
            console.error('Error saving feedback:', error);
            return res.status(500).json({ message: 'Error saving feedback', error: error.message });
        }

        console.log('Feedback saved:', results);
        res.status(201).json({ message: 'Feedback submitted successfully' });
    });
});


// Get all budgets
app.get('/get-budgets', (req, res) => {
    db.query('SELECT * FROM budgets', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Add a budget
app.post('/add-budget', (req, res) => {
    const { description, amount } = req.body;
    db.query('INSERT INTO budgets (description, amount) VALUES (?, ?)', [description, amount], (err, result) => {
        if (err) throw err;
        db.query('INSERT INTO transactions (type, description, amount) VALUES (?, ?, ?)', ['budget', description, amount]);
        res.json({ message: 'Budget added successfully' });
    });
});

// Delete a budget
app.delete('/delete-budget/:id', (req, res) => {
    db.query('DELETE FROM budgets WHERE id = ?', [req.params.id], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Budget deleted successfully' });
    });
});

// Get all donations
app.get('/get-donations', (req, res) => {
    db.query('SELECT * FROM donations', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Add a donation
app.post('/add-donation', (req, res) => {
    const { description, amount } = req.body;
    db.query('INSERT INTO donations (description, amount) VALUES (?, ?)', [description, amount], (err, result) => {
        if (err) throw err;
        db.query('INSERT INTO transactions (type, description, amount) VALUES (?, ?, ?)', ['donation', description, amount]);
        res.json({ message: 'Donation added successfully' });
    });
});

// Delete a donation
app.delete('/delete-donation/:id', (req, res) => {
    db.query('DELETE FROM donations WHERE id = ?', [req.params.id], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Donation deleted successfully' });
    });
});



// Fetch projects
app.get('/projects', (req, res) => {
    const query = 'SELECT * FROM projects ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Add new project
app.post('/projects', (req, res) => {
    const { name, description } = req.body;
    const date = new Date().toISOString().slice(0, 10);
    const query = 'INSERT INTO projects (name, description, date) VALUES (?, ?, ?)';

    db.query(query, [name, description, date], (err, results) => {
        if (err) throw err;
        res.status(200).send();
    });
});

// Delete project
app.delete('/projects/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM projects WHERE id = ?';

    db.query(query, [id], (err, results) => {
        if (err) throw err;
        res.status(200).send();
    });
});


// Get total fund
app.get('/api/total-fund', (req, res) => {
    db.query('SELECT total_amount FROM financials LIMIT 1', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ totalFund: results[0].total_amount });
    });
});

// Update total fund
app.post('/api/update-fund', (req, res) => {
    const { newTotalFund } = req.body;

    db.query('UPDATE financials SET total_amount = ? WHERE id = 1', [newTotalFund], (error) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to update total amount' });
        }
        res.json({ success: true, totalFund: newTotalFund });
    });
});

// Add expense
app.post('/api/add-expense', (req, res) => {
    const { description, amount } = req.body;

    db.query('INSERT INTO expenses (description, amount) VALUES (?, ?)', [description, amount], (error) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to add expense' });
        }
        res.json({ success: true });
    });
});

// Get all transactions
app.get('/get-transactions', (req, res) => {
    db.query('SELECT * FROM transactions', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.delete('/delete-transaction/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM transactions WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting transaction:', err);
            return res.status(500).json({ error: 'Failed to delete transaction' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    });
});


// Route for blotter
app.post('/blotter_report', (req, res) => {
    const { complainant_name, respondent_name, details, date_reported } = req.body;

    const sql = 'INSERT INTO blotter_report (complainant_name, respondent_name, details, date_reported) VALUES (?, ?, ?, ?)';
    db.query(sql, [complainant_name, respondent_name, details, date_reported], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Report submitted successfully!' });
    });
});


// Route for all blotter report
app.get('/blotter_reports', (req, res) => {
    const sql = 'SELECT * FROM blotter_report';
    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Route to update blotter report status
app.patch('/blotter_report/:id', (req, res) => {
    const reportId = req.params.id;
    const { status } = req.body;

    const sql = 'UPDATE blotter_report SET status = ? WHERE id = ?';
    db.query(sql, [status, reportId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Status updated successfully!' });
    });
});

// Route for delete blotte
app.delete('/blotter_report/:id', (req, res) => {
    const reportId = req.params.id;
    const sql = 'DELETE FROM blotter_report WHERE id = ?';
    db.query(sql, [reportId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Report deleted successfully!' });
    });
});



// Get all residents
app.get('/residents', (req, res) => {
    db.query('SELECT * FROM residents', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Add a resident
app.post('/residents', (req, res) => {
    const { first_name, last_name, address, birthdate, contact_number } = req.body;
    db.query('INSERT INTO residents (first_name, last_name, address, birthdate, contact_number) VALUES (?, ?, ?, ?, ?)',
        [first_name, last_name, address, birthdate, contact_number], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(201).send({ id: results.insertId });
        });
});

// Delete a resident
app.delete('/residents/:id', (req, res) => {
    const residentId = req.params.id;
    db.query('DELETE FROM residents WHERE resident_id = ?', [residentId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.sendStatus(200);
    });
});


/// Endpoint para sa pag-submit ng request
app.post('/request', (req, res) => {
    const { documentType, reason, name, purok, address } = req.body;
    console.log('Received data:', { documentType, reason, name, purok, address }); // Log incoming data
    const sql = 'INSERT INTO requests (documentType, reason, name, purok, address, status) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [documentType, reason, name, purok, address, 'Pending'], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ id: result.insertId, documentType, reason, name, purok, address, status: 'Pending' });
    });
});


// Endpoint para sa pagkuha ng mga request
app.get('/api/requests', (req, res) => {
    const sql = 'SELECT * FROM requests';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// Endpoint para sa pag-update ng request status
app.put('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const sql = 'UPDATE requests SET status = ? WHERE id = ?';

    db.query(sql, [status, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(200).json({ id: id, status: status });
    });
});

app.delete('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM requests WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(200).json({ message: 'Request deleted successfully' });
    });
});



// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
