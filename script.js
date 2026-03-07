const S_KEY = 'gf_pro_v1';
const C_KEY = 'gf_pro_conf';

let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || { userName: 'Schüler', isPoints: true };

// Startet beim Laden
window.onload = () => {
    document.getElementById('display-name').innerText = config.userName;
    document.getElementById('set-name').value = config.userName;
    document.getElementById('set-system').value = config.isPoints ? 'points' : 'grades';
    renderDash();
};

// Seitenwechsel
window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id)?.classList.add('active');
    
    if(id === 'list') renderDash();
    if(id === 'stats') renderStats();
};

// Fach-Logik
window.addFach = function() {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [] });
    document.getElementById('f-name').value = '';
    save(); 
    renderDash();
};

function renderDash() {
    const cont = document.getElementById('grid-container');
    if(!cont) return;
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = calculateAvg(f.notes);
        cont.innerHTML += `
            <div class="subject-card" onclick="openDet(${f.id})">
                <h3 style="margin:0">${f.name}</h3>
                <p style="font-size:28px; font-weight:bold; color:var(--accent); margin:10px 0">${avg}</p>
                <small style="color:#94a3b8">${f.notes.length} Noten</small>
            </div>`;
    });
}

// Detail & Noten
window.openDet = function(id) {
    window.curId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('det-title').innerText = f.name;
    showPage('detail');
    renderDet();
};

window.addNote = function() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    if(isNaN(val)) return;
    const f = appData.find(x => x.id === window.curId);
    f.notes.push(val);
    input.value = '';
    save(); 
    renderDet();
};

function renderDet() {
    const f = appData.find(x => x.id === window.curId);
    document.getElementById('det-avg').innerText = calculateAvg(f.notes);
    const list = document.getElementById('notes-list');
    list.innerHTML = f.notes.map((n, i) => `
        <div class="note-item">
            <span>${n} ${config.isPoints ? 'Punkte' : 'Note'}</span>
            <button class="del-btn" onclick="deleteNote(${i})">Löschen</button>
        </div>`).reverse().join('');
}

window.deleteNote = function(index) {
    const f = appData.find(x => x.id === window.curId);
    // Da wir die Liste reversed anzeigen, müssen wir den richtigen Index finden
    f.notes.splice(f.notes.length - 1 - index, 1);
    save(); 
    renderDet();
};

window.deleteFach = function() {
    if(confirm("Fach wirklich löschen?")) {
        appData = appData.filter(x => x.id !== window.curId);
        save(); 
        showPage('list');
    }
};

// Einstellungen
window.saveSettings = function() {
    config.userName = document.getElementById('set-name').value;
    config.isPoints = document.getElementById('set-system').value === 'points';
    localStorage.setItem(C_KEY, JSON.stringify(config));
    document.getElementById('display-name').innerText = config.userName;
    alert("Einstellungen gespeichert!");
    showPage('list');
};

// Hilfsfunktionen
function calculateAvg(notes) {
    if(!notes.length) return '-';
    return (notes.reduce((a,b)=>a+b,0)/notes.length).toFixed(2);
}

function save() { 
    localStorage.setItem(S_KEY, JSON.stringify(appData)); 
}

function renderStats() {
    const activeSubjects = appData.filter(f => f.notes.length);
    const totalAvg = activeSubjects.length ? (activeSubjects.reduce((acc, f) => acc + parseFloat(calculateAvg(f.notes)), 0) / activeSubjects.length).toFixed(2) : '-';
    
    document.getElementById('total-avg').innerText = totalAvg;
    document.getElementById('total-count').innerText = appData.reduce((a,b) => a + b.notes.length, 0);

    const ctx = document.getElementById('myChart').getContext('2d');
    if(window.chartObj) window.chartObj.destroy();
    window.chartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: activeSubjects.map(f => f.name),
            datasets: [{
                label: 'Schnitt pro Fach',
                data: activeSubjects.map(f => calculateAvg(f.notes)),
                backgroundColor: '#5865f2',
                borderRadius: 10
            }]
        },
        options: { 
            responsive: true,
            scales: { y: { beginAtZero: true, max: config.isPoints ? 15 : 6 } } 
        }
    });
}

window.resetAll = function() { 
    if(confirm("Alles löschen?")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
};