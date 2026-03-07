let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let currentFachId = null;
let viewDate = new Date(); // Das Datum, das der Kalender gerade anzeigt

window.onload = () => {
    renderGrid();
    initCalendar();
};

// --- NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    document.getElementById('btn-' + pageId)?.classList.add('active');
}

// --- FÄCHER (Korrektur: Event Delegation) ---
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
        card.innerHTML = `<h3>${f.name}</h3><p style="font-size:24px;">${avg}</p>`;
        // Direkter Event-Listener löst das Problem mit dem Öffnen
        card.addEventListener('click', () => openDetail(f.id));
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

// --- KALENDER LOGIK ---
function changeMonth(offset) {
    viewDate.setMonth(viewDate.getMonth() + offset);
    initCalendar();
}

async function initCalendar() {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const today = new Date();
    today.setHours(0,0,0,0);

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    document.getElementById('month-name').innerText = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const shift = (firstDay === 0 ? 6 : firstDay - 1);

    // Platzhalter für vorherigen Monat
    for(let i=0; i < shift; i++) {
        grid.innerHTML += `<div class="day" style="opacity:0;"></div>`;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Ferien/Feiertage laden (Beispiel-Events für 2026)
    const holidays = {
        "2026-01-01": "Neujahr",
        "2026-04-03": "Karfreitag",
        "2026-05-01": "Tag der Arbeit",
        "2026-05-14": "Himmelfahrt"
    };

    for(let d=1; d <= daysInMonth; d++) {
        const currentDate = new Date(year, month, d);
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        let classes = ['day'];
        if (currentDate < today) classes.push('past');
        if (currentDate.getTime() === today.getTime()) classes.push('today');

        let content = holidays[dateStr] ? `<span class="event-tag">${holidays[dateStr]}</span>` : '';
        
        // MSA/BBR Beispiel-Termine hinzufügen
        if(dateStr === "2026-05-12") content += `<span class="event-tag" style="background:#f85149">MSA Mathe</span>`;

        grid.innerHTML += `<div class="${classes.join(' ')}"><strong>${d}</strong>${content}</div>`;
    }
}

function save() { localStorage.setItem('gf_data', JSON.stringify(db)); }
function changeBundesland() { initCalendar(); }

// --- NOTEN ---
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
    document.getElementById('d-avg').innerText = `Schnitt: ${(fach.notes.reduce((a,b)=>a+b,0)/fach.notes.length || 0).toFixed(1)}`;
    document.getElementById('n-list').innerHTML = fach.notes.map(n => `<div class="note-item">${n} Punkte</div>`).reverse().join('');
}