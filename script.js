// GradeFlow v15 - Advanced Visuals
const STORAGE_KEY = 'gf_v15_data';
const CONFIG_KEY = 'gf_v15_config';

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    isPoints: true,
    targetGrade: 11
};

document.addEventListener('DOMContentLoaded', () => {
    applySettings();
    showPage('list');
});

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function applySettings() {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    document.getElementById('display-name').innerText = config.userName;
    // UI-Felder füllen
    document.getElementById('set-name').value = config.userName;
    document.getElementById('set-target').value = config.targetGrade;
    document.getElementById('set-system').value = config.isPoints ? 'points' : 'grades';
}

window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('page-' + id).style.display = 'block';
    
    // Sidebar active state
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event?.target?.classList?.add('active');

    if (id === 'list') renderDashboard();
    if (id === 'stats') renderStats();
};

window.addFach = function() {
    const input = document.getElementById('f-name');
    if (!input.value.trim()) return;
    appData.push({ id: Date.now().toString(), name: input.value.trim(), notes: [] });
    input.value = '';
    save();
    renderDashboard();
};

function renderDashboard() {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';

    appData.forEach(f => {
        const avg = calculateAvg(f.notes);
        const isUnderTarget = avg !== '-' && parseFloat(avg) < config.targetGrade;
        
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.borderLeft = `6px solid ${isUnderTarget ? 'var(--danger)' : 'var(--accent)'}`;
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center">
                <h3>${f.name}</h3>
                <span style="color:${isUnderTarget ? 'var(--danger)' : 'var(--success)'}; font-weight:bold">${avg}</span>
            </div>
            <p style="font-size:12px; color:#94a3b8">${f.notes.length} Noten • ${isUnderTarget ? 'Unter Ziel' : 'Im Ziel'}</p>
        `;
        card.onclick = () => openDetail(f.id);
        container.appendChild(card);
    });
}

window.openDetail = function(id) {
    window.currentFachId = id;
    const fach = appData.find(f => f.id === id);
    document.getElementById('det-title').innerText = fach.name;
    showPage('detail');
    renderDetail();
};

window.addNote = function() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    if (isNaN(val) || (config.isPoints && (val < 0 || val > 15))) return;

    const fach = appData.find(f => f.id === window.currentFachId);
    fach.notes.push(val);
    save();
    input.value = '';
    renderDetail();
};

function renderDetail() {
    const fach = appData.find(f => f.id === window.currentFachId);
    document.getElementById('det-avg').innerText = calculateAvg(fach.notes);
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    fach.notes.slice().reverse().forEach((n, i) => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom:10px; padding:15px">${n} Punkte</div>`;
    });
}

// NEU: Erweiterte Einstellungen speichern
window.saveSettings = function() {
    config.userName = document.getElementById('set-name').value;
    config.targetGrade = parseFloat(document.getElementById('set-target').value);
    config.isPoints = document.getElementById('set-system').value === 'points';
    save();
    applySettings();
    alert("Einstellungen optimiert!");
};

window.changeTheme = function(color) {
    config.accentColor = color;
    applySettings();
    save();
};

function calculateAvg(notes) {
    if (!notes.length) return '-';
    return (notes.reduce((a,b) => a+b, 0) / notes.length).toFixed(1);
}

window.resetAll = function() { if(confirm("ALLES LÖSCHEN?")) { localStorage.clear(); location.reload(); } };