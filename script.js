// Speicher-Schlüssel für v13 (löscht alte Konflikte)
const DATA_KEY = 'gf_v13_data';
const CONF_KEY = 'gf_v13_conf';

let appData = JSON.parse(localStorage.getItem(DATA_KEY)) || [];
let config = JSON.parse(localStorage.getItem(CONF_KEY)) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    usePoints: true
};

let activeFachId = null;
let myChart = null;

// Initialisierung: Farben und Name beim Start setzen
document.documentElement.style.setProperty('--accent', config.accentColor);

function showPage(id) {
    // 1. Alle Seiten verstecken
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // 2. Zielseite zeigen
    const target = document.getElementById('page-' + id);
    if(target) target.classList.add('active');

    // 3. UI Updates je nach Seite
    document.getElementById('display-name').innerText = config.userName;

    if(id === 'list') renderGrid();
    if(id === 'stats') renderStats();
    if(id === 'settings') {
        document.getElementById('set-name').value = config.userName;
        document.getElementById('set-system').value = config.usePoints ? 'points' : 'grades';
    }
}

// --- DASHBOARD ---
function addFach() {
    const input = document.getElementById('f-name');
    if(!input.value.trim()) return;
    
    appData.push({
        id: Date.now(),
        name: input.value.trim(),
        notes: []
    });
    
    input.value = '';
    save();
    renderGrid();
}

function renderGrid() {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';

    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
        container.innerHTML += `
            <div class="subject-card" onclick="openDetail(${f.id})">
                <h3>${f.name}</h3>
                <p style="font-size: 20px; font-weight: bold; color: var(--accent)">${avg}</p>
            </div>`;
    });
}

// --- DETAIL ANSICHT ---
function openDetail(id) {
    activeFachId = id;
    const fach = appData.find(f => f.id === id);
    document.getElementById('det-title').innerText = fach.name;
    showPage('detail');
    renderDetail();
}

function addNote() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    
    if(isNaN(val)) return;

    const fach = appData.find(f => f.id === activeFachId);
    fach.notes.push(val);
    
    input.value = '';
    save();
    renderDetail();
}

function renderDetail() {
    const fach = appData.find(f => f.id === activeFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/fach.notes.length).toFixed(1) : '-';
    
    document.getElementById('det-avg').innerText = avg;
    const list = document.getElementById('notes-list');
    list.innerHTML = '<h3>Notenverlauf</h3>';

    fach.notes.slice().reverse().forEach(n => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom: 10px;">${n} ${config.usePoints ? 'Punkte' : 'Note'}</div>`;
    });
}

// --- STATISTIKEN (CHART) ---
function renderStats() {
    let total = 0, count = 0, labels = [], dataPoints = [];

    appData.forEach(f => {
        if(f.notes.length > 0) {
            const avg = f.notes.reduce((a,b)=>a+b,0)/f.notes.length;
            total += avg;
            count++;
            labels.push(f.name);
            dataPoints.push(avg.toFixed(1));
        }
    });

    document.getElementById('total-avg').innerText = count > 0 ? (total/count).toFixed(1) : '-';
    document.getElementById('total-count').innerText = appData.reduce((a,b) => a + b.notes.length, 0);

    const ctx = document.getElementById('myChart').getContext('2d');
    if(myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Schnitt',
                data: dataPoints,
                backgroundColor: config.accentColor,
                borderRadius: 5
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: config.usePoints ? 15 : 6 } }
        }
    });
}

// --- EINSTELLUNGEN ---
function saveSettings() {
    config.userName = document.getElementById('set-name').value || 'Schüler';
    config.usePoints = document.getElementById('set-system').value === 'points';
    localStorage.setItem(CONF_KEY, JSON.stringify(config));
    alert("Gespeichert!");
    showPage('list');
}

function changeTheme(color) {
    config.accentColor = color;
    document.documentElement.style.setProperty('--accent', color);
    localStorage.setItem(CONF_KEY, JSON.stringify(config));
}

function deleteFach() {
    if(confirm('Fach wirklich löschen?')) {
        appData = appData.filter(f => f.id !== activeFachId);
        save();
        showPage('list');
    }
}

function resetAll() {
    if(confirm('ACHTUNG: Alle Noten und Fächer werden gelöscht!')) {
        localStorage.clear();
        location.reload();
    }
}

function save() {
    localStorage.setItem(DATA_KEY, JSON.stringify(appData));
}

// Start der App
showPage('list');