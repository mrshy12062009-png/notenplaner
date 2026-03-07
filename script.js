// GradeFlow v14.3 - Full Logic Fix
alert("Script v14.3 wurde geladen!");
const STORAGE_KEY = 'gradeflow_v14_data';
const CONFIG_KEY = 'gradeflow_v14_config';

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    isPoints: true
};

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    updateTheme();
    showPage('list');
});

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function updateTheme() {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    if(document.getElementById('display-name')) 
        document.getElementById('display-name').innerText = config.userName;
}

// Navigation
window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById('page-' + pageId);
    if(target) target.style.display = 'block';

    if(pageId === 'list') renderDashboard();
    if(pageId === 'stats') renderStats();
};

// Dashboard Logik
window.addFach = function() {
    const input = document.getElementById('f-name');
    if(!input || !input.value.trim()) return;
    
    appData.push({ id: Date.now().toString(), name: input.value.trim(), notes: [] });
    input.value = '';
    save();
    renderDashboard();
};

function renderDashboard() {
    const container = document.getElementById('grid-container');
    if(!container) return;
    container.innerHTML = '';

    appData.forEach(f => {
        const avg = calculateAvg(f.notes);
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `<h3>${f.name}</h3><p class="avg-display">${avg}</p><small>${f.notes.length} Noten</small>`;
        card.onclick = () => openDetail(f.id);
        container.appendChild(card);
    });
}

// Detail & Noten Logik
window.openDetail = function(id) {
    window.currentFachId = id;
    const fach = appData.find(f => f.id === id);
    if(!fach) return;

    document.getElementById('det-title').innerText = fach.name;
    showPage('detail');
    renderDetail();
};

window.addNote = function() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    
    if(isNaN(val)) return;

    const fach = appData.find(f => f.id === window.currentFachId);
    if(fach) {
        fach.notes.push(val);
        save();
        input.value = '';
        renderDetail();
    }
};

function renderDetail() {
    const fach = appData.find(f => f.id === window.currentFachId);
    if(!fach) return;

    document.getElementById('det-avg').innerText = calculateAvg(fach.notes);
    const list = document.getElementById('notes-list');
    list.innerHTML = '<h4>Verlauf</h4>';
    
    fach.notes.slice().reverse().forEach((n, idx) => {
        list.innerHTML += `<div class="subject-card note-item">
            <span>${n} ${config.isPoints ? 'Punkte' : 'Note'}</span>
            <button onclick="deleteNote(${fach.notes.length - 1 - idx})" class="btn-link" style="color:#ef4444">Löschen</button>
        </div>`;
    });
}

window.deleteNote = function(index) {
    const fach = appData.find(f => f.id === window.currentFachId);
    if(fach) {
        fach.notes.splice(index, 1);
        save();
        renderDetail();
    }
};

window.deleteFach = function() {
    if(confirm("Fach wirklich löschen?")) {
        appData = appData.filter(f => f.id !== window.currentFachId);
        save();
        showPage('list');
    }
};

// Statistik & Chart
function renderStats() {
    let totalSum = 0, fachCount = 0, labels = [], chartData = [];

    appData.forEach(f => {
        if(f.notes.length > 0) {
            const avg = parseFloat(calculateAvg(f.notes));
            totalSum += avg;
            fachCount++;
            labels.push(f.name);
            chartData.push(avg);
        }
    });

    document.getElementById('total-avg').innerText = fachCount > 0 ? (totalSum / fachCount).toFixed(1) : '-';
    document.getElementById('total-count').innerText = appData.reduce((sum, f) => sum + f.notes.length, 0);

    const ctx = document.getElementById('myChart');
    if(!ctx) return;

    if(window.chartObj) window.chartObj.destroy();
    window.chartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: config.isPoints ? 'Punkte' : 'Schnitt',
                data: chartData,
                backgroundColor: config.accentColor,
                borderRadius: 8
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: config.isPoints ? 15 : 6 } }
        }
    });
}

// Hilfsfunktionen
function calculateAvg(notes) {
    if(!notes || notes.length === 0) return '-';
    return (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1);
}

window.saveSettings = function() {
    config.userName = document.getElementById('set-name').value || 'Schüler';
    config.isPoints = document.getElementById('set-system').value === 'points';
    save();
    updateTheme();
    alert("Einstellungen gespeichert!");
};

window.changeTheme = function(color) {
    config.accentColor = color;
    save();
    updateTheme();
};

window.resetAll = function() {
    if(confirm("Alle Daten unwiderruflich löschen?")) {
        localStorage.clear();
        location.reload();
    }
};