// GradeFlow v14.2 - Funktions-Fix
const D_KEY = 'gf_v14_final_data';
const C_KEY = 'gf_v14_final_conf';

let appData = JSON.parse(localStorage.getItem(D_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    usePoints: true
};

// Start-Sequenz
window.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    showPage('list');
});

function applyConfig() {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    const nameDisp = document.getElementById('display-name');
    if(nameDisp) nameDisp.innerText = config.userName;
}

window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + id);
    if(target) target.classList.add('active');

    if(id === 'list') renderGrid();
    if(id === 'stats') renderStats();
};

// --- FACH LOGIK ---
window.addFach = function() {
    const input = document.getElementById('f-name');
    if(!input || !input.value.trim()) return;
    
    appData.push({
        id: Date.now(),
        name: input.value.trim(),
        notes: []
    });
    
    input.value = '';
    save();
    renderGrid();
};

function renderGrid() {
    const container = document.getElementById('grid-container');
    if(!container) return;
    container.innerHTML = '';

    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `<h3>${f.name}</h3><p class="avg-display">${avg}</p>`;
        card.onclick = () => openDetail(f.id);
        container.appendChild(card);
    });
}

// --- NOTEN LOGIK ---
window.openDetail = function(id) {
    window.activeFachId = id;
    const fach = appData.find(f => f.id === id);
    if(!fach) return;
    
    document.getElementById('det-title').innerText = fach.name;
    showPage('detail');
    renderDetail();
};

window.addNote = function() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input?.value);
    if(isNaN(val)) return;

    const fach = appData.find(f => f.id === window.activeFachId);
    if(fach) {
        fach.notes.push(val);
        save();
        if(input) input.value = '';
        renderDetail();
    }
};

function renderDetail() {
    const fach = appData.find(f => f.id === window.activeFachId);
    if(!fach) return;

    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
    const avgDiv = document.getElementById('det-avg');
    if(avgDiv) avgDiv.innerText = avg;
    
    const list = document.getElementById('notes-list');
    if(list) {
        list.innerHTML = '<h4>Deine Noten</h4>';
        fach.notes.slice().reverse().forEach((n, index) => {
            list.innerHTML += `<div class="subject-card note-item">
                <span>${n} ${config.usePoints ? 'Pkt' : 'Note'}</span>
                <button onclick="deleteNote(${index})" class="delete-small">×</button>
            </div>`;
        });
    }
}

// --- STATS & DIAGRAMM ---
window.renderStats = function() {
    let total = 0, count = 0, labels = [], data = [];
    appData.forEach(f => {
        if(f.notes.length > 0) {
            const avg = f.notes.reduce((a,b)=>a+b,0)/f.notes.length;
            total += avg; count++;
            labels.push(f.name); data.push(avg.toFixed(1));
        }
    });

    if(document.getElementById('total-avg')) 
        document.getElementById('total-avg').innerText = count > 0 ? (total/count).toFixed(1) : '-';
    
    const ctx = document.getElementById('myChart')?.getContext('2d');
    if(!ctx) return;

    if(window.myChartObj) window.myChartObj.destroy();
    window.myChartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Schnitt', data: data, backgroundColor: config.accentColor }]
        },
        options: { scales: { y: { beginAtZero: true, max: config.usePoints ? 15 : 6 } } }
    });
};

// --- EINSTELLUNGEN ---
window.saveSettings = function() {
    const nameInp = document.getElementById('set-name');
    const sysInp = document.getElementById('set-system');
    
    if(nameInp) config.userName = nameInp.value;
    if(sysInp) config.usePoints = (sysInp.value === 'points');
    
    localStorage.setItem(C_KEY, JSON.stringify(config));
    applyConfig();
    alert("Einstellungen übernommen!");
};

window.changeTheme = function(color) {
    config.accentColor = color;
    applyConfig();
    localStorage.setItem(C_KEY, JSON.stringify(config));
};

function save() { localStorage.setItem(D_KEY, JSON.stringify(appData)); }
window.resetAll = function() { if(confirm("Wirklich alles löschen?")) { localStorage.clear(); location.reload(); } };