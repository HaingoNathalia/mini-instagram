const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'database.json');

let dbData = {
    users: [],
    posts: [
        {id: 1, author: "Alice Martin", avatar: "", content: "Mon premier post"},
        {id: 2, author: "Jean Dupont", avatar: "https://i.pravatar.cc/150?img=3", content: "Bonjour!"}
    ],
    stories: [
        {id: 1, author: "Alice Martin", avatar: "https//i.pravatar.cc/150?img=5"},
        {id: 2, author: "Thomas B.", avatar: ""}
    ],
    messages: []
};
function readDB() {
    return dbData;
}

function writeDB(data) {
    dbData = data;
}

app.post('/api/register', (req, res) => {
    try {
        const { email, password, phone, lastname, firstname, birthdate, gender } = req.body;
        if (!email || !password || !firstname || !lastname) {
            return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });
        }
        const db = readDB();
        const userExists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            return res.status(400).json({ success: false, message: "Cet email est déjà utilisé." });
        }
        const newUser = { 
            email, password, phone, lastname, firstname, birthdate, gender, 
            avatar: `https://pravatar.cc{Math.floor(Math.random() * 70)}` 
        };
        db.users.push(newUser);
        writeDB(db);
        res.json({ success: true, user: newUser });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const db = readDB();
        const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!user) return res.status(400).json({ success: false, message: "Identifiants incorrects." });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
});

app.get('/api/feed', (req, res) => {
    res.json({ posts: readDB().posts, stories: readDB().stories });
});

app.post('/api/posts', (req, res) => {
    const { author, avatar, content } = req.body;
    const db = readDB();
    const newPost = { id: db.posts.length + 1, author, avatar, content, likes: 0, comments: [] };
    db.posts.unshift(newPost);
    writeDB(db);
    res.json({ success: true, post: newPost });
});

app.post('/api/stories', (req, res) => {
    const { author, avatar } = req.body;
    const db = readDB();
    const newStory = { id: db.stories.length + 1, author, avatar };
    db.stories.unshift(newStory);
    writeDB(db);
    res.json({ success: true, story: newStory });
});

app.post('/api/messages', (req, res) => {
    const { sender, text } = req.body;
    const db = readDB();
    const msg = { id: db.messages.length + 1, sender, text, time: new Date().toLocaleTimeString() };
    db.messages.push(msg);
    writeDB(db);
    res.json({ success: true, messages: db.messages });
});

app.get('/api/messages', (req, res) => {
    res.json({ messages: readDB().messages });
});

app.listen(PORT, () => console.log(`Serveur actif sur http://localhost:${PORT}`));

module.exports = app;