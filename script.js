// 1. DATEN-SETUP
let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let viewDate = new Date(); // Das Datum für die Kalender-Ansicht
let currentFachId = null;

// Startet die App, sobald die Seite geladen ist
window.onload = () => {
    renderGrid();
    initCalendar();
};

// 2. NAVIGATION & SEITENWECHSEL
function showPage(pageId) {
    // Alle Sektionen verstecken
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Zielseite anzeigen
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    // Sidebar-Buttons optisch aktualisieren
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Sucht den Button, der die Funktion showPage(pageId) aufruft
    const activeBtn = document.querySelector(`button[onclick*="'${pageId}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// 3. FÄCHER-LOGIK (DER FIX)
function renderGrid() {
    const g = document.getElementById('grid');
    if (!g) return;
    g.innerHTML = '';
    
    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '--';
        
        const card = document.createElement('div');
        card.className = 'card';
        // Sicherer Klick-Event für Mobilgeräte und Desktop
        card.addEventListener('click', () => openDetail(f.id));
        
        card.innerHTML = `
            <h3>${f.name}</h3>
            <p style="font-size: 24px; font-weight: bold; color: var(--accent); margin-top: 10px;">${avg}</p>
        `;
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

// 4. AUTOMATISCHER KALENDER & TERMINE
function changeMonth(offset) {
    viewDate.setMonth(viewDate.getMonth() + offset);
    initCalendar();
}

async function initCalendar() {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const today = new Date();
    today.setHours(0,0,0,0);

    // Header aktualisieren
    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    document.getElementById('month-name').innerText = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    grid.innerHTML = '';

    // Wochentage berechnen (Montag als Start)
    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0 ? 6 : firstDay - 1); 

    // Leere Felder für den Vormonat
    for(let i=0; i < shift; i++) {
        grid.innerHTML += `<div class="day" style="opacity:0;"></div>`;
    }

    // MSA Termine 2026 (Beispiel - hier könnte man später eine API anbinden)
    const msaTermine = {
        "2026-01-19": "Start Präsentationsprüfung",
        "2026-01-30": "Ende Präsentationsprüfung",
        "2026-03-23": "MSA Englisch (Mündlich)",
        "2026-05-12": "MSA Mathe",
        "2026-05-19": "MSA Deutsch",
        "2026-05-21": "MSA Englisch (Schriftlich)"
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for(let d=1; d <= daysInMonth; d++) {
        const currDate = new Date(year, month, d);
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        let classes = ['day'];
        // 1. Markierung: Heute
        if (currDate.getTime() === today.getTime()) classes.push('today');
        // 2. Markierung: Vergangenheit ausgrauen
        if (currDate < today) classes.push('past');

        let content = msaTermine[dateStr] ? `<span class="event-tag">${msaTermine[dateStr]}</span>` : '';
        
        grid.innerHTML += `
            <div class="${classes.join(' ')}">
                <strong>${d}</strong>
                ${content}
            </div>`;
    }
}

// 5. DATEN-VERWALTUNG
function addFach() {
    const input = document.getElementById('f-in');
    if(!input.value.trim()) return;
    db.push({ id: Date.now(), name: input.value, notes: [] });
    input.value = '';
    save();
    renderGrid();
}

function addNote() {
    const val = parseInt(document.getElementById('n-in').value);
    if(isNaN(val)) return;
    const fach = db.find(f => f.id === currentFachId);
    if(fach) {
        fach.notes.push(val);
        save();
        renderNotes();
    }
}

function renderNotes() {
    const fach = db.find(f => f.id === currentFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/fach.notes.length).toFixed(1) : '0.0';
    document.getElementById('d-avg').innerText = `Schnitt: ${avg}`;
    document.getElementById('n-list').innerHTML = fach.notes.map(n => `
        <div style="background: var(--sidebar); padding: 10px; margin-top: 5px; border-radius: 6px; border: 1px solid var(--border);">
            ${n} Punkte
        </div>
    `).reverse().join('');
}

function save() {
    localStorage.setItem('gf_data', JSON.stringify(db));
}