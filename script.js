let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let viewDate = new Date(); 
let currentFachId = null;

// Neu: Speicher für Kalender-Termine (wird auch im LocalStorage gespeichert)
let customEvents = JSON.parse(localStorage.getItem('gf_events')) || {
    "2026-04-21": "MSA Deutsch",
    "2026-04-29": "MSA Mathe",
    "2026-05-05": "MSA Englisch (Schriftlich)",
    "2026-03-09": "Start: Englisch Mündlich",
    "2026-01-12": "Start: Präsentationsprüfung"
};

window.onload = () => {
    renderGrid();
    initCalendar();
};

// --- NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick*="'${pageId}'"]`);
    if(activeBtn) activeBtn.classList.add('active');
}

// --- FÄCHER LOGIK (Dein Fix) ---
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
    if(!g) return;
    g.innerHTML = '';
    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '--';
        const card = document.createElement('div');
        card.className = 'card';
        card.addEventListener('click', () => openDetail(f.id));
        card.innerHTML = `<h3>${f.name}</h3><p style="font-size:24px; font-weight:bold; color:var(--accent);">${avg}</p>`;
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

// --- KALENDER LOGIK ---
function changeMonth(offset) {
    viewDate.setMonth(viewDate.getMonth() + offset);
    initCalendar();
}

function initCalendar() {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const today = new Date();
    today.setHours(0,0,0,0);

    document.getElementById('month-name').innerText = 
        new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(viewDate);

    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
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

        // Nutzt die customEvents (entweder Standard 2026 oder deine eigenen)
        let content = customEvents[dateStr] ? `<span class="event-tag">${customEvents[dateStr]}</span>` : '';
        grid.innerHTML += `<div class="${classes.join(' ')}"><strong>${d}</strong>${content}</div>`;
    }
}

// --- FUNKTION: TERMINE AKTUALISIEREN ---
// Diese Funktion könntest du über die Konsole oder einen Button aufrufen
function addCustomEvent(date, text) {
    customEvents[date] = text;
    localStorage.setItem('gf_events', JSON.stringify(customEvents));
    initCalendar();
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
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/fach.notes.length).toFixed(1) : '0.0';
    document.getElementById('d-avg').innerText = `Schnitt: ${avg}`;
    document.getElementById('n-list').innerHTML = fach.notes.map(n => `<div class="note-item">${n} Punkte</div>`).reverse().join('');
}