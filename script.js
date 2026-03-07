let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let currentFachId = null;

window.onload = () => {
    renderGrid();
    initCalendar();
};

// --- SEITENWECHSEL ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page-' + pageId).classList.add('active');
    document.getElementById('btn-' + pageId)?.classList.add('active');
}

// --- FÄCHER-LOGIK (VERBESSERT) ---
function addFach() {
    const input = document.getElementById('f-in');
    if(!input.value) return;
    db.push({ id: Date.now(), name: input.value, notes: [], goal: 10 });
    input.value = '';
    save();
    renderGrid();
}

function renderGrid() {
    const container = document.getElementById('grid');
    container.innerHTML = '';
    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '--';
        const card = document.createElement('div');
        card.className = 'card';
        // Wir nutzen ein direktes Event-Binding
        card.addEventListener('click', () => openDetail(f.id));
        card.innerHTML = `<h3>${f.name}</h3><p style="font-size:24px;">${avg}</p>`;
        container.appendChild(card);
    });
}

function openDetail(id) {
    currentFachId = id;
    const fach = db.find(f => f.id === id);
    document.getElementById('d-title').innerText = fach.name;
    renderNotes();
    showPage('detail');
}

function addNote() {
    const input = document.getElementById('n-in');
    const val = parseInt(input.value);
    if(isNaN(val)) return;
    const fach = db.find(f => f.id === currentFachId);
    fach.notes.push(val);
    input.value = '';
    save();
    renderNotes();
}

function renderNotes() {
    const fach = db.find(f => f.id === currentFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '0.0';
    document.getElementById('d-avg').innerText = `Schnitt: ${avg}`;
    document.getElementById('n-list').innerHTML = fach.notes.map(n => `<div style="background:#161b22; padding:10px; margin-top:5px; border-radius:5px;">${n} Punkte</div>`).reverse().join('');
}

// --- AUTOMATISCHER KALENDER ---
async function initCalendar() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const today = now.getDate();

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    document.getElementById('month-name').innerText = `${monthNames[month]} ${year}`;

    // Daten von API laden
    const bl = document.getElementById('bundesland').value;
    let events = {};
    try {
        const res = await fetch(`https://feiertage-api.de/api/?jahr=${year}&nur_land=${bl}`);
        events = await res.json();
    } catch(e) { console.log("Offline-Mode oder API Fehler"); }

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // Erster Tag des Monats
    const firstDay = new Date(year, month, 1).getDay();
    const shift = firstDay === 0 ? 6 : firstDay - 1; // Anpassung auf Montag als Wochenstart

    // Leere Felder davor
    for(let i=0; i < shift; i++) {
        grid.innerHTML += `<div class="day" style="opacity:0.2;"></div>`;
    }

    // Tage des Monats
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for(let d=1; d <= daysInMonth; d++) {
        const isToday = d === today ? 'today' : '';
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        let dayContent = '';
        for(let e in events) {
            if(events[e].datum === dateStr) {
                dayContent += `<span class="event-tag">${e}</span>`;
            }
        }

        grid.innerHTML += `<div class="day ${isToday}"><strong>${d}</strong>${dayContent}</div>`;
    }
}

function save() { localStorage.setItem('gf_data', JSON.stringify(db)); }
function saveBundesland() { initCalendar(); }