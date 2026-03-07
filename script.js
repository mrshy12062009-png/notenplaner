// Daten-Speicher
let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let viewDate = new Date(); // Das aktuell angezeigte Datum im Kalender
let currentFachId = null;

// Beim Start ausführen
window.onload = () => {
    renderGrid();
    initCalendar();
};

// --- NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick*="'${pageId}'"]`);
    if(activeBtn) activeBtn.classList.add('active');
}

// --- FÄCHER-LOGIK (Fix für das Öffnen) ---
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
        // Der entscheidende Fix: EventListener statt einfacher onclick-String
        card.addEventListener('click', () => openDetail(f.id));
        card.innerHTML = `<h3>${f.name}</h3><p style="font-size:24px; color:var(--accent); font-weight:bold;">${avg}</p>`;
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

// --- KALENDER-LOGIK ---
function changeMonth(offset) {
    viewDate.setMonth(viewDate.getMonth() + offset);
    initCalendar();
}

function initCalendar() {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const today = new Date();
    today.setHours(0,0,0,0);

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    document.getElementById('month-name').innerText = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    grid.innerHTML = '';

    // Termine & Ferien 2026 (Fest im Code, damit immer verfügbar)
    const events = {
        "2026-01-19": "Start: Präsentationsprüfung",
        "2026-01-30": "Ende: Präsentationsprüfung",
        "2026-03-23": "MSA Englisch Mündlich",
        "2026-05-12": "MSA Mathe",
        "2026-05-19": "MSA Deutsch",
        "2026-05-21": "MSA Englisch Schriftlich",
        "2026-03-30": "Osterferien", "2026-04-10": "Osterferien Ende",
        "2026-07-09": "Sommerferien Beginn"
    };

    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0 ? 6 : firstDay - 1); 

    for(let i=0; i < shift; i++) grid.innerHTML += `<div class="day past" style="opacity:0;"></div>`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for(let d=1; d <= daysInMonth; d++) {
        const curr = new Date(year, month, d);
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        let classes = ['day'];
        if (curr < today) classes.push('past');
        if (curr.getTime() === today.getTime()) classes.push('today');

        let content = events[dateStr] ? `<span class="event-tag">${events[dateStr]}</span>` : '';
        grid.innerHTML += `<div class="${classes.join(' ')}"><strong>${d}</strong>${content}</div>`;
    }
}

// --- NOTEN & SPEICHERN ---
function addNote() {
    const val = parseInt(document.getElementById('n-in').value);
    if(isNaN(val)) return;
    const fach = db.find(f => f.id === currentFachId);
    fach.notes.push(val);
    document.getElementById('n-in').value = '';
    save();
    renderNotes();
}

function renderNotes() {
    const fach = db.find(f => f.id === currentFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/fach.notes.length).toFixed(1) : '0.0';
    document.getElementById('d-avg').innerText = `Schnitt: ${avg}`;
    document.getElementById('n-list').innerHTML = fach.notes.map(n => `<div style="background:#161b22; padding:10px; margin-top:5px; border-radius:5px; border:1px solid #30363d;">${n} Punkte</div>`).reverse().join('');
}

function save() { localStorage.setItem('gf_data', JSON.stringify(db)); }