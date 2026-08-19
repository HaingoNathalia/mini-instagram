let currentUser = null;
let currentMode = "login";

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('insta_user');
    const savedTheme = localStorage.getItem('insta_theme');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        setupAppInterface();
    }
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

function toggleAuthView() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const btnSwitch = document.getElementById('btn-switch');
    const panelTitle = document.getElementById('panel-title');
    const panelText = document.getElementById('panel-text');

    if (currentMode === "login") {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('unactive-form');
        
        // Ajout des attributs requis pour l'inscription de façon dynamique
        document.getElementById('reg-lastname').required = true;
        document.getElementById('reg-firstname').required = true;
        document.getElementById('reg-email').required = true;
        document.getElementById('reg-password').required = true;
        document.getElementById('reg-birthdate').required = true;
        document.getElementById('reg-gender').required = true;

        panelTitle.innerText = "Déjà inscrit ?";
        panelText.innerText = "Connectez-vous pour entrer.";
        btnSwitch.innerText = "Se connecter";
        currentMode = "register";
    } else {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('unactive-form');
        
        document.getElementById('reg-lastname').required = false;
        document.getElementById('reg-firstname').required = false;
        document.getElementById('reg-email').required = false;
        document.getElementById('reg-password').required = false;
        document.getElementById('reg-birthdate').required = false;
        document.getElementById('reg-gender').required = false;

        panelTitle.innerText = "Hii, Bienvenue ";
        panelText.innerText = "Vous n'avez pas de compte ?";
        btnSwitch.innerText = "Créer un compte";
        currentMode = "login";
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const data = {
        lastname: document.getElementById('reg-lastname').value,
        firstname: document.getElementById('reg-firstname').value,
        phone: document.getElementById('reg-phone').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        birthdate: document.getElementById('reg-birthdate').value,
        gender: document.getElementById('reg-gender').value,
    };

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    
    if (result.success) {
        currentUser = result.user;
        localStorage.setItem('insta_user', JSON.stringify(currentUser));
        setupAppInterface();
    } else {
        alert(result.message);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const result = await res.json();
    
    if (result.success) {
        currentUser = result.user;
        localStorage.setItem('insta_user', JSON.stringify(currentUser));
        setupAppInterface();
    } else {
        alert("Identifiants incorrects.");
    }
}

function setupAppInterface() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('user-avatar').src = currentUser.avatar;
    document.getElementById('user-story-avatar').src = currentUser.avatar;
    document.getElementById('user-display-name').innerText = `${currentUser.firstname} ${currentUser.lastname}`;
    loadFeed();
    startMessagePolling();
}

async function loadFeed() {
    const res = await fetch('/api/feed');
    const data = await res.json();

    const storiesWrapper = document.getElementById('stories-wrapper');
    storiesWrapper.innerHTML = data.stories.map(s => `
        <div class="story-card">
            <img src="${s}">
            <span>${s.author.split(' ')}</span>
        </div>
    `).join('');

    const postsWrapper = document.getElementById('posts-wrapper');
    postsWrapper.innerHTML = data.posts.map(p => `
        <div class="post" data-content="${p.content.toLowerCase()}">
            <div class="post-header">
                <img src="${p.avatar}">
                <h4>${p.author}</h4>
            </div>
            <div class="post-content">${p.content}</div>
            <div class="post-actions">
                <div class="action-item" onclick="toggleLike(this)">
                     <span>Like</span> (<span class="l-count">${p.likes}</span>)
                </div>
                <div class="action-item" onclick="toggleAdore(this)">
                     <span>J'adore</span>
                </div>
            </div>
            <div class="comment-section-box">
                <div class="comments-list">
                    ${p.comments.map(c => `<p class="comment-item"><strong>Ami :</strong> ${c}</p>`).join('')}
                </div>
                <div class="comment-input-row">
                    <input type="text" placeholder="Ajouter un commentaire...">
                    <button type="button" onclick="addComment(this)">Publier</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function createPost() {
    const input = document.getElementById('post-text');
    if (!input.value.trim()) return;

    await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            author: `${currentUser.firstname} ${currentUser.lastname}`, 
            avatar: currentUser.avatar, 
            content: input.value 
        })
    });
    input.value = "";
    loadFeed();
}

async function createStory() {
    await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            author: `${currentUser.firstname} ${currentUser.lastname}`, 
            avatar: currentUser.avatar 
        })
    });
    alert("Votre story a été publiée avec succès !");
    loadFeed();
}

function filterHashtags() {
    const query = document.getElementById('search-hashtag').value.toLowerCase();
    const posts = document.querySelectorAll('.post');
    posts.forEach(post => {
        const text = post.getAttribute('data-content');
        if (text.includes(query)) {
            post.style.display = "block";
        } else {
            post.style.display = "none";
        }
    });
}

function toggleLike(element) {
    const countSpan = element.querySelector('.l-count');
    if (!element.classList.contains('like-active')) {
        element.classList.add('like-active');
        countSpan.innerText = parseInt(countSpan.innerText) + 1;
    } else {
        element.classList.remove('like-active');
        countSpan.innerText = parseInt(countSpan.innerText) - 1;
    }
}

function toggleAdore(element) {
    element.classList.toggle('adore-active');
}

function addComment(btn) {
    const input = btn.previousElementSibling;
    if (!input.value.trim()) return;
    const list = btn.parentElement.previousElementSibling;
    
    const newComment = document.createElement('p');
    newComment.className = 'comment-item';
    newComment.innerHTML = `<strong>${currentUser.firstname} :</strong> ${input.value}`;
    list.appendChild(newComment);
    input.value = "";
}

function toggleModal(id) {
    document.getElementById(id).classList.toggle('hidden');
    if (id === 'msg-modal') updateMessages();
}

async function sendDirectMessage() {
    const input = document.getElementById('chat-text-input');
    if (!input.value.trim()) return;

    const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: currentUser.firstname, text: input.value })
    });
    input.value = "";
    const data = await res.json();
    renderMessages(data.messages);
}

async function updateMessages() {
    if (!currentUser || document.getElementById('msg-modal').classList.contains('hidden')) return;
    const res = await fetch('/api/messages');
    const data = await res.json();
    renderMessages(data.messages);
}

function renderMessages(messages) {
    const box = document.getElementById('chat-messages');
    box.innerHTML = messages.map(m => `
        <div style="margin-bottom: 10px; text-align: ${m.sender === currentUser.firstname ? 'right' : 'left'}">
            <p style="display:inline-block; background:${m.sender === currentUser.firstname ? 'linear-gradient(45deg, #fd5949, #d6249f)' : '#e4e6eb'}; color:${m.sender === currentUser.firstname ? 'white' : 'black'}; padding:8px 12px; border-radius:12px; font-size:14px;">${m.text}</p>
        </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
}

function startMessagePolling() {
    setInterval(updateMessages, 3000);
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('insta_theme', 'dark');
    } else {
        localStorage.setItem('insta_theme', 'light');
    }
}function logout() {currentUser = null;localStorage.removeItem('insta_user');document.getElementById('app-container').classList.add('hidden');document.getElementById('auth-container').classList.remove('hidden');}