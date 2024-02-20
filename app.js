const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// ejs stuff
app.set('view engine', 'ejs');

const crypto = require('crypto');

// Generate a unique ID based on current time using MD5 hash
function generateUniqueId() {
    const timestamp = Date.now().toString(); // Get current timestamp as string
    const hash = crypto.createHash('md5').update(timestamp).digest('hex'); // Create MD5 hash
    return hash;
}

// Example usage:
const uniqueId = generateUniqueId();
//console.log(uniqueId); // Output the generated unique ID


// Set up multer for file uploads
const upload = multer({ dest: 'public/uploads/' });

// Create database connection
const db = new sqlite3.Database('./database.db');

// Create table for profiles if not exists
// Create table for profiles if not exists
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        boyID 
        full_name TEXT,
        picture TEXT,
        bio TEXT
    )`);
});




// Express middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route to serve admin.html for the /admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Route to create a new profile (admin panel)
app.post('/createProfile', upload.single('picture'), (req, res) => {
    const { full_name, bio } = req.body;
    const picture = req.file ? req.file.filename : null;

    db.run(`INSERT INTO profiles (full_name, picture, bio) VALUES (?, ?, ?)`, [full_name, picture, bio], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/');
    });
});

// -- start


// --- END

// Route to update profile and read messages (boy panel)
app.put('/updateProfile/:id', (req, res) => {
    const boyId = req.params.id;
    const { full_name, bio } = req.body;

    db.run(`UPDATE profiles SET full_name = ?, bio = ? WHERE id = ?`, [full_name, bio, boyId], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect(`/boy.html?id=${boyId}`);
    });
});

// Route to view profiles
app.get('/profiles', (req, res) => {
    db.all(`SELECT * FROM profiles ORDER BY id DESC LIMIT 3`, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (rows.length === 0) {
            return res.send('<pre>:-&#92;</pre>');
        }
        res.json(rows);
    });
});

// Route to serve boy.html for the /boy route
app.get('/boy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'boy.html'));
});

// Route to fetch profile data based on id
app.get('/profiles/:id', (req, res) => {
    const profileId = req.params.id;

    db.get('SELECT * FROM profiles WHERE id = ?', [profileId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(row);
    });
});


// Route to send message to a boy
app.post('/sendMessage/:id', (req, res) => {
    const boyId = req.params.id;
    const { message } = req.body;

    db.run(`INSERT INTO messages (boy_id, message) VALUES (?, ?)`, [boyId, message], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Message sent successfully!' });
    });
});

// Route to fetch messages for a boy based on their ID
app.get('/messages/boy', (req, res) => {
    const boyId = req.query.id;

    db.all(`SELECT message FROM messages WHERE boy_id = ?`, [boyId], (err, messages) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.render('messages', { messages }); // Render messages.ejs with messages data
    });
});




// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

