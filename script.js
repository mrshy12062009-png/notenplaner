// GradeFlow v14 - Ultra Stable
console.log("Script geladen...");

const D_KEY = 'gf_v14_data';
const C_KEY = 'gf_v14_config';

let appData = JSON.parse(localStorage.getItem(D_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    usePoints: true
};

// Diese Funktion muss als allererstes laufen
function init() {
    console.log("Initialisierung...");
    document.documentElement.style.setProperty('--accent', config.accentColor);
    showPage('list');
}

window.showPage = function(id) {
    console.log("Zeige Seite:", id);
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.style.display = 'none');
    
    const target = document.getElementById('page-' + id);
    if(target) {
        target.style.display = 'block';
    } else {
        console.error("Seite nicht gefunden: page-" + id);
    }

    if(id === 'list') renderGrid();
    if(id === 'stats') renderStats();
    if(id === 'settings') {
        const inputName = document.getElementById('set-name');
        if(inputName) inputName.value = config.userName;
    }
    
    const nameDisplay = document.getElementById('display-name');
    if(nameDisplay) nameDisplay.innerText = config.userName;
};

window.addFach = function() {
    const input = document.getElementById('f-name');
    if(!input || !input.value.trim()) return;
    
    appData.push({
        id: Date.now(),
        name: input.value.trim(),
        notes: []
    });
    
    save();
    input.value = '';
    renderGrid();
};

function renderGrid() {
    const container = document.getElementById('grid-container');
    if(!container) return;
    container.innerHTML = '';

    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
        const div = document.createElement('div');
        div.className = 'subject-card';
        div.innerHTML = `<h3>${f.name}</h3><p style="font-size:20px; font-weight:bold; color:var(--accent)">${avg}</p>`;
        div.onclick = () => openDetail(f.id);
        container.appendChild(div);
    });
}

window.openDetail = function(id) {
    window.activeFachId = id;
    const fach = appData.find(f => f.id === id);
    if(!fach) return;
    const title = document.getElementById('det-title');
    if(title) title.innerText = fach.name;
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
        input.value = '';
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
        list.innerHTML = '<h4>Verlauf</h4>';
        fach.notes.slice().reverse().forEach(n => {
            list.innerHTML += `<div class="subject-card" style="margin-bottom:8px; padding:10px">${n}</div>`;
        });
    }
}

window.saveSettings = function() {
    const newName = document.getElementById('set-name')?.value;
    if(newName) config.userName = newName;
    const system = document.getElementById('set-system')?.value;
    config.usePoints = (system === 'points');
    
    localStorage.setItem(C_KEY, JSON.stringify(config));
    alert("Gespeichert!");
    showPage('list');
};

window.changeTheme = function(color) {
    config.accentColor = color;
    document.documentElement.style.setProperty('--accent', color);
    localStorage.setItem(C_KEY, JSON.stringify(config));
};

window.resetAll = function() {
    if(confirm("Alles löschen?")) {
        localStorage.clear();
        location.reload();
    }
};

function save() {
    localStorage.setItem(D_KEY, JSON.stringify(appData));
}

// Start
init();