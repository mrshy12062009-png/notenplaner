// Daten-Speicher (Noten & Fächer)
let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let viewDate = new Date(); 
let currentFachId = null;

// MSA Termine 2026
const defaultEvents = {
    "2026-04-21": "MSA Deutsch",
    "2026-04-29": "MSA Mathe",
    "2026-05-05": "MSA Englisch (Schriftlich)",
    "2026-03-09": "Start: Englisch Mündlich",
    "2026-01-12": "Start: Präsentationsprüfung"
};
let userEvents = JSON.parse(localStorage.getItem('gf_events')) || defaultEvents;

window.onload = () => {
    renderGrid();
    initCalendar();
};

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(pageId === 'list') document.getElementById('btn-list').classList.add('active');
    if(pageId === 'calendar') document.getElementById('btn-calendar').classList.add('active');
}

// --- FÄCHER-LOGIK ---
function addFach() {
    const input = document.getElementById('f-in');
    if(!input.value.trim()) return;
    db.push({ id: Date.now(), name: input.value, notes: [] });
    input.value = '';
    save();
    renderGrid();
}

function renderGrid() {
    const g = document.getElementById('grid');
    g.innerHTML = '';
    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '--';
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openDetail(f.id); // Hier wird die Reaktion repariert
        card.innerHTML = `<h3>${f.name}</h3><p class="grade-text">${avg}</p>`;
        g.appendChild(card);
    });
}

function openDetail(id) {
    currentFachId = id;
    const fach = db.find(f => f.id === id);
    document.getElementById('d-title').innerText = fach.name;
    renderNotes();
    showPage('detail');
}

// --- KALENDER-LOGIK ---
function initCalendar() {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const grid = document.getElementById('calendar-grid');
    document.getElementById('month-name').innerText = new Intl.DateTimeFormat('de-DE', {month:'long', year:'numeric'}).format(viewDate);
    
    grid.innerHTML = '';
    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0 ? 6 : firstDay - 1); 

    for(let i=0; i<shift; i++) grid.innerHTML += `<div class="day empty"></div>`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        let event = userEvents[dateStr] ? `<span class="event-tag">${userEvents[dateStr]}</span>` : '';
        grid.innerHTML += `<div class="day"><strong>${d}</strong>${event}</div>`;
    }
}

function changeMonth(offset) {
    viewDate.setMonth(viewDate.getMonth() + offset);
    initCalendar();
}

function addUserEvent() {
    const d = document.getElementById('event-date').value;
    const t = document.getElementById('event-text').value;
    if(d && t) {
        userEvents[d] = t;
        localStorage.setItem('gf_events', JSON.stringify(userEvents));
        initCalendar();
    }
}

function addNote() {
    const val = parseInt(document.getElementById('n-in').value);
    if(isNaN(val)) return;
    db.find(f => f.id === currentFachId).notes.push(val);
    save();
    renderNotes();
    renderGrid();
}

function renderNotes() {
    const fach = db.find(f => f.id === currentFachId);
    document.getElementById('n-list').innerHTML = fach.notes.map(n => `<div class="note-item">${n} Punkte</div>`).join('');
}

function save() { localStorage.setItem('gf_data', JSON.stringify(db)); }