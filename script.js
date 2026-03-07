// GradeFlow v14.1 - Fix Build
const DATA_KEY = 'gf_v14_data';
const CONF_KEY = 'gf_v14_config';

let appData = JSON.parse(localStorage.getItem(DATA_KEY)) || [];
let config = JSON.parse(localStorage.getItem(CONF_KEY)) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    usePoints: true
};

// Startet die App
window.onload = () => {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    showPage('list');
};

window.showPage = function(id) {
    // Verstecke alle Seiten
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    // Zeige Zielseite
    const target = document.getElementById('page-' + id);
    if (target) target.style.display = 'block';

    // Update UI
    if (document.getElementById('display-name')) {
        document.getElementById('display-name').innerText = config.userName;
    }

    if (id === 'list') renderGrid();
    if (id === 'stats') renderStats();
};

window.addFach = function() {
    const input = document.getElementById('f-name');
    if (!input || !input.value.trim()) return;
    
    appData.push({ id: Date.now(), name: input.value.trim(), notes: [] });
    save();
    input.value = '';
    renderGrid();
};

function renderGrid() {
    const container = document.getElementById('grid-container');
    if (!container) return;
    container.innerHTML = '';

    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a, b) => a + b, 0) / f.notes.length).toFixed(1) : '-';
        const div = document.createElement('div');
        div.className = 'subject-card';
        div.innerHTML = `<h3>${f.name}</h3><p style="font-size:24px; color:var(--accent)">${avg}</p>`;
        div.onclick = () => openDetail(f.id);
        container.appendChild(div);
    });
}

window.openDetail = function(id) {
    window.activeFachId = id;
    const fach = appData.find(f => f.id === id);
    if (!fach) return;
    document.getElementById('det-title').innerText = fach.name;
    showPage('detail');
    renderDetail();
};

window.addNote = function() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    if (isNaN(val)) return;

    const fach = appData.find(f => f.id === window.activeFachId);
    if (fach) {
        fach.notes.push(val);
        save();
        input.value = '';
        renderDetail();
    }
};

function renderDetail() {
    const fach = appData.find(f => f.id === window.activeFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a, b) => a + b, 0) / fach.notes.length).toFixed(1) : '-';
    document.getElementById('det-avg').innerText = avg;
    
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    fach.notes.slice().reverse().forEach(n => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom:10px">${n} Punkte</div>`;
    });
}

function save() {
    localStorage.setItem(DATA_KEY, JSON.stringify(appData));
}

// Einstellungen
window.saveSettings = function() {
    config.userName = document.getElementById('set-name').value;
    config.usePoints = document.getElementById('set-system').value === 'points';
    localStorage.setItem(CONF_KEY, JSON.stringify(config));
    alert("Gespeichert!");
    showPage('list');
};

window.resetAll = function() {
    if (confirm("Alles löschen?")) {
        localStorage.clear();
        location.reload();
    }
};