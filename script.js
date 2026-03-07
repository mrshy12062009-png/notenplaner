let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let viewDate = new Date(); 
let currentFachId = null;

// Standard-Termine (Die wir von "Google" haben)
const defaultEvents = {
    "2026-04-21": "MSA Deutsch",
    "2026-04-29": "MSA Mathe",
    "2026-05-05": "MSA Englisch (Schriftlich)",
    "2026-03-09": "Start: Englisch Mündlich",
    "2026-01-12": "Start: Präsentationsprüfung"
};

// Lädt entweder deine gespeicherten Termine oder die Standard-Termine
let userEvents = JSON.parse(localStorage.getItem('gf_events')) || defaultEvents;

window.onload = () => {
    renderGrid();
    initCalendar();
};

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
}

// FÄCHER LOGIK
function renderGrid() {
    const g = document.getElementById('grid');
    if(!g) return;
    g.innerHTML = '';
    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '--';
        const card = document.createElement('div');
        card.className = 'card';
        card.addEventListener('click', () => openDetail(f.id));
        card.innerHTML = `<h3>${f.name}</h3><p style="font-size:24px; font-weight:bold; color:#5865f2;">${avg}</p>`;
        g.appendChild(card);
    });
}

function openDetail(id) {
    currentFachId = id;
    const fach = db.find(f => f.id === id);
    if(!fach) return;
    document.getElementById('d-title').innerText = fach.name;
    renderNotes();
    showPage('detail');
}

// KALENDER LOGIK
function initCalendar() {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const today = new Date();
    today.setHours(0,0,0,0);

    document.getElementById('month-name').innerText = 
        new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(viewDate);

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0 ? 6 : firstDay - 1); 

    for(let i=0; i < shift; i++) grid.innerHTML += `<div class="day" style="opacity:0;"></div>`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for(let d=1; d <= daysInMonth; d++) {
        const curr = new Date(year, month, d);
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        let classes = ['day'];
        if (curr < today) classes.push('past');
        if (curr.getTime() === today.getTime()) classes.push('today');

        let content = userEvents[dateStr] ? `<span class="event-tag">${userEvents[dateStr]}</span>` : '';
        grid.innerHTML += `<div class="${classes.join(' ')}"><strong>${d}</strong>${content}</div>`;
    }
}

function changeMonth(offset) {
    viewDate.setMonth(viewDate.getMonth() + offset);
    initCalendar();
}

// NEUEN TERMIN HINZUFÜGEN
function addUserEvent() {
    const dateInput = document.getElementById('event-date').value;
    const textInput = document.getElementById('event-text').value;
    
    if(!dateInput || !textInput) return alert("Bitte Datum und Text eingeben!");
    
    userEvents[dateInput] = textInput;
    localStorage.setItem('gf_events', JSON.stringify(userEvents));
    
    document.getElementById('event-text').value = "";
    initCalendar();
}

function clearAllEvents() {
    if(confirm("Alle Termine löschen und auf Standard zurücksetzen?")) {
        userEvents = defaultEvents;
        localStorage.removeItem('gf_events');
        initCalendar();
    }
}

// RESTLICHE FUNKTIONEN (Noten & Fächer)
function addFach() {
    const input = document.getElementById('f-in');
    if(!input.value.trim()) return;
    db.push({ id: Date.now(), name: input.value, notes: [] });
    input.value = '';
    save();
    renderGrid();
}

function save() { localStorage.setItem('gf_data', JSON.stringify(db)); }

function addNote() {
    const val = parseInt(document.getElementById('n-in').value);
    if(isNaN(val)) return;
    db.find(f => f.id === currentFachId).notes.push(val);
    document.getElementById('n-in').value = '';
    save();
    renderNotes();
}

function renderNotes() {
    const fach = db.find(f => f.id === currentFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '0.0';
    document.getElementById('d-avg').innerText = `Schnitt: ${avg}`;
    document.getElementById('n-list').innerHTML = fach.notes.map(n => `<div class="note-item">${n} Punkte</div>`).reverse().join('');
}