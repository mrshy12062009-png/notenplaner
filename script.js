// GradeFlow v13 - Stable Build
const DATA_KEY = 'gf_data_v13';
const CONF_KEY = 'gf_conf_v13';

let appData = JSON.parse(localStorage.getItem(DATA_KEY)) || [];
let config = JSON.parse(localStorage.getItem(CONF_KEY)) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    usePoints: true
};

let activeFachId = null;
let myChart = null;

// Initialisierung
document.documentElement.style.setProperty('--accent', config.accentColor);

function showPage(id) {
    console.log("Wechsle zu Seite:", id); // Hilft beim Debuggen in der Konsole (F12)
    
    // Alle Seiten ausblenden
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    // Zielseite einblenden
    const target = document.getElementById('page-' + id);
    if (target) {
        target.classList.add('active');
    }

    // UI-Elemente füllen
    const nameDisplay = document.getElementById('display-name');
    if (nameDisplay) nameDisplay.innerText = config.userName;

    if (id === 'list') renderGrid();
    if (id === 'stats') renderStats();
    if (id === 'settings') {
        document.getElementById('set-name').value = config.userName;
        document.getElementById('set-system').value = config.usePoints ? 'points' : 'grades';
    }
}

function addFach() {
    const input = document.getElementById('f-name');
    if (!input || !input.value.trim()) return;
    
    const newFach = {
        id: Date.now(),
        name: input.value.trim(),
        notes: []
    };
    
    appData.push(newFach);
    save();
    input.value = '';
    renderGrid();
}

function renderGrid() {
    const container = document.getElementById('grid-container');
    if (!container) return;
    container.innerHTML = '';

    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a, b) => a + b, 0) / f.notes.length).toFixed(1) : '-';
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.onclick = () => openDetail(f.id);
        card.innerHTML = `<h3>${f.name}</h3><p style="font-size: 20px; font-weight: bold; color: var(--accent)">${avg}</p>`;
        container.appendChild(card);
    });
}

function openDetail(id) {
    activeFachId = id;
    const fach = appData.find(f => f.id === id);
    if (!fach) return;
    
    document.getElementById('det-title').innerText = fach.name;
    showPage('detail');
    renderDetail();
}

function addNote() {
    const input = document.getElementById('n-val');
    if (!input) return;
    const val = parseFloat(input.value);
    
    if (isNaN(val)) return;

    const fach = appData.find(f => f.id === activeFachId);
    if (fach) {
        fach.notes.push(val);
        save();
        input.value = '';
        renderDetail();
    }
}

function renderDetail() {
    const fach = appData.find(f => f.id === activeFachId);
    if (!fach) return;

    const avg = fach.notes.length ? (fach.notes.reduce((a, b) => a + b, 0) / fach.notes.length).toFixed(1) : '-';
    document.getElementById('det-avg').innerText = avg;
    
    const list = document.getElementById('notes-list');
    list.innerHTML = '<h3>Notenverlauf</h3>';

    fach.notes.slice().reverse().forEach(n => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom: 10px;">${n} ${config.usePoints ? 'Punkte' : 'Note'}</div>`;
    });
}

function renderStats() {
    let total = 0, count = 0, labels = [], dataPoints = [];

    appData.forEach(f => {
        if (f.notes.length > 0) {
            const avg = f.notes.reduce((a, b) => a + b, 0) / f.notes.length;
            total += avg;
            count++;
            labels.push(f.name);
            dataPoints.push(avg.toFixed(1));
        }
    });

    const avgDisplay = document.getElementById('total-avg');
    const countDisplay = document.getElementById('total-count');
    
    if (avgDisplay) avgDisplay.innerText = count > 0 ? (total / count).toFixed(1) : '-';
    if (countDisplay) countDisplay.innerText = appData.reduce((a, b) => a + b.notes.length, 0);

    const canvas = document.getElementById('myChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (myChart) myChart.destroy();
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

function saveSettings() {
    config.userName = document.getElementById('set-name').value || 'Schüler';
    config.usePoints = document.getElementById('set-system').value === 'points';
    localStorage.setItem(CONF_KEY, JSON.stringify(config));
    alert("Einstellungen gespeichert!");
    showPage('list');
}

function changeTheme(color) {
    config.accentColor = color;
    document.documentElement.style.setProperty('--accent', color);
    localStorage.setItem(CONF_KEY, JSON.stringify(config));
}

function deleteFach() {
    if (confirm('Fach wirklich löschen?')) {
        appData = appData.filter(f => f.id !== activeFachId);
        save();
        showPage('list');
    }
}

function resetAll() {
    if (confirm('Wirklich ALLES löschen?')) {
        localStorage.clear();
        location.reload();
    }
}

function save() {
    localStorage.setItem(DATA_KEY, JSON.stringify(appData));
}

// App starten
window.onload = () => {
    showPage('list');
};