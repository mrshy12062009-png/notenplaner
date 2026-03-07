// GradeFlow v14.4 - Final Stable Build
const STORAGE_KEY = 'gradeflow_v14_data';
const CONFIG_KEY = 'gradeflow_v14_config';

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    isPoints: true
};

// 1. INITIALISIERUNG
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
    const nameDisp = document.getElementById('display-name');
    if (nameDisp) nameDisp.innerText = config.userName;
}

// 2. NAVIGATION
window.showPage = function(pageId) {
    // Alle Seiten verstecken
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    // Zielseite zeigen
    const target = document.getElementById('page-' + pageId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // Daten für die jeweilige Seite laden
    if (pageId === 'list') renderDashboard();
    if (pageId === 'stats') renderStats();
};

// 3. DASHBOARD (Fächer hinzufügen & anzeigen)
window.addFach = function() {
    const input = document.getElementById('f-name');
    if (!input || !input.value.trim()) return;
    
    const newFach = {
        id: Date.now().toString(),
        name: input.value.trim(),
        notes: []
    };
    
    appData.push(newFach);
    save();
    input.value = '';
    renderDashboard();
};

function renderDashboard() {
    const container = document.getElementById('grid-container');
    if (!container) return;
    container.innerHTML = '';

    appData.forEach(f => {
        const avg = calculateAvg(f.notes);
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <h3>${f.name}</h3>
            <p class="avg-display" style="font-size: 24px; font-weight: bold; color: var(--accent)">${avg}</p>
            <small>${f.notes.length} Noten eingetragen</small>
        `;
        card.onclick = () => openDetail(f.id);
        container.appendChild(card);
    });
}

// 4. DETAIL-ANSICHT (Noten verwalten)
window.openDetail = function(id) {
    window.currentFachId = id;
    const fach = appData.find(f => f.id === id);
    if (!fach) return;

    document.getElementById('det-title').innerText = fach.name;
    showPage('detail');
    renderDetail();
};

window.addNote = function() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    
    // Validierung (Anti-Quatsch)
    if (isNaN(val)) return;
    if (config.isPoints && (val < 0 || val > 15)) {
        alert("Punkte müssen zwischen 0 und 15 liegen!");
        return;
    }
    if (!config.isPoints && (val < 1 || val > 6)) {
        alert("Noten müssen zwischen 1 und 6 liegen!");
        return;
    }

    const fach = appData.find(f => f.id === window.currentFachId);
    if (fach) {
        fach.notes.push(val);
        save();
        input.value = '';
        renderDetail();
    }
};

function renderDetail() {
    const fach = appData.find(f => f.id === window.currentFachId);
    if (!fach) return;

    document.getElementById('det-avg').innerText = calculateAvg(fach.notes);
    const list = document.getElementById('notes-list');
    list.innerHTML = '<h4>Notenverlauf</h4>';
    
    fach.notes.slice().reverse().forEach((n, idx) => {
        const realIdx = fach.notes.length - 1 - idx;
        list.innerHTML += `
            <div class="subject-card" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span>${n} ${config.isPoints ? 'Punkte' : 'Note'}</span>
                <button onclick="deleteNote(${realIdx})" style="background: none; border: none; color: #ef4444; cursor: pointer;">Löschen</button>
            </div>`;
    });
}

window.deleteNote = function(index) {
    const fach = appData.find(f => f.id === window.currentFachId);
    if (fach) {
        fach.notes.splice(index, 1);
        save();
        renderDetail();
    }
};

window.deleteFach = function() {
    if (confirm("Dieses Fach und alle Noten unwiderruflich löschen?")) {
        appData = appData.filter(f => f.id !== window.currentFachId);
        save();
        showPage('list');
    }
};

// 5. STATISTIKEN
function renderStats() {
    let totalSum = 0, fachCount = 0, labels = [], chartData = [];

    appData.forEach(f => {
        if (f.notes.length > 0) {
            const avg = parseFloat(calculateAvg(f.notes));
            totalSum += avg;
            fachCount++;
            labels.push(f.name);
            chartData.push(avg);
        }
    });

    const avgEl = document.getElementById('total-avg');
    const countEl = document.getElementById('total-count');
    
    if (avgEl) avgEl.innerText = fachCount > 0 ? (totalSum / fachCount).toFixed(2) : '-';
    if (countEl) countEl.innerText = appData.reduce((sum, f) => sum + f.notes.length, 0);

    const ctx = document.getElementById('myChart');
    if (!ctx) return;

    if (window.chartObj) window.chartObj.destroy();
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

// 6. HILFSFUNKTIONEN & EINSTELLUNGEN
function calculateAvg(notes) {
    if (!notes || notes.length === 0) return '-';
    const sum = notes.reduce((a, b) => a + b, 0);
    return (sum / notes.length).toFixed(2);
}

window.saveSettings = function() {
    const nameInp = document.getElementById('set-name');
    const sysInp = document.getElementById('set-system');
    
    if (nameInp) config.userName = nameInp.value || 'Schüler';
    if (sysInp) config.isPoints = (sysInp.value === 'points');
    
    save();
    updateTheme();
    alert("Einstellungen gespeichert!");
    showPage('list');
};

window.changeTheme = function(color) {
    config.accentColor = color;
    save();
    updateTheme();
};

window.resetAll = function() {
    if (confirm("Wirklich ALLES löschen? Deine Daten sind dann weg.")) {
        localStorage.clear();
        location.reload();
    }
};