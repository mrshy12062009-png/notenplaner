// Daten laden
let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let viewDate = new Date(); // Aktueller Monat für den Kalender
let currentFachId = null;

// Start-Funktion
window.onload = () => {
    renderGrid();
    initCalendar();
};

// SEITEN WECHSELN
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetPage = document.getElementById('page-' + pageId);
    if(targetPage) targetPage.classList.add('active');
    
    const targetBtn = document.getElementById('btn-' + pageId);
    if(targetBtn) targetBtn.classList.add('active');
}

// FÄCHER ÖFFNEN FIX
function renderGrid() {
    const container = document.getElementById('grid');
    container.innerHTML = '';
    
    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '--';
        const card = document.createElement('div');
        card.className = 'card';
        // Absolut sicherer Klick-Event
        card.onclick = () => openDetail(f.id);
        card.innerHTML = `<h3>${f.name}</h3><p style="font-size:26px; margin-top:10px;">${avg}</p>`;
        container.appendChild(card);
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

// KALENDER LOGIK (Navigation & Ausgrauen)
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
    grid.innerHTML = '';

    // Erster Tag im Monat berechnen
    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0 ? 6 : firstDay - 1); // Montag als Wochenstart

    for(let i=0; i < shift; i++) {
        grid.innerHTML += `<div class="day" style="opacity:0;"></div>`;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for(let d=1; d <= daysInMonth; d++) {
        const currentDate = new Date(year, month, d);
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        let classes = ['day'];
        if (currentDate < today) classes.push('past'); // Vergangen -> Ausgrauen
        if (currentDate.getTime() === today.getTime()) classes.push('today');

        // Beispiel Termine
        let content = "";
        if(dateStr === "2026-05-12") content = `<span class="event-tag">MSA Mathe</span>`;

        grid.innerHTML += `<div class="${classes.join(' ')}"><strong>${d}</strong>${content}</div>`;
    }
}

// DATEN SPEICHERN
function addFach() {
    const input = document.getElementById('f-in');
    if(!input.value) return;
    db.push({ id: Date.now(), name: input.value, notes: [], goal: 10 });
    input.value = '';
    save();
    renderGrid();
}

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
    document.getElementById('n-list').innerHTML = fach.notes.map(n => `<div style="background:#161b22; padding:10px; margin-top:5px; border-radius:5px;">${n} Punkte</div>`).reverse().join('');
}

function save() { localStorage.setItem('gf_data', JSON.stringify(db)); }
function changeBundesland() { initCalendar(); }