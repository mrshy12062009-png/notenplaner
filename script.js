// Daten laden oder neu anlegen
let db = JSON.parse(localStorage.getItem('gradeflow_data')) || [];
let selectedBundesland = localStorage.getItem('gradeflow_bl') || 'BE';
let currentFachId = null;

// Initialisierung beim Laden
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('bundesland').value = selectedBundesland;
    renderGrid();
});

function save() {
    localStorage.setItem('gradeflow_data', JSON.stringify(db));
    renderGrid();
}

function saveBundesland() {
    selectedBundesland = document.getElementById('bundesland').value;
    localStorage.setItem('gradeflow_bl', selectedBundesland);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page-' + pageId).classList.add('active');
    document.getElementById('btn-' + pageId)?.classList.add('active');
}

function addFach() {
    const input = document.getElementById('f-in');
    if (!input.value.trim()) return;

    db.push({
        id: Date.now(),
        name: input.value,
        notes: [],
        goal: 10
    });

    input.value = '';
    save();
}

function getColorClass(points) {
    if (points >= 11) return 'grade-good';
    if (points >= 5) return 'grade-mid';
    return 'grade-bad';
}

function renderGrid() {
    const g = document.getElementById('grid');
    g.innerHTML = '';
    
    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : null;
        const colorClass = avg !== null ? getColorClass(avg) : '';
        
        g.innerHTML += `
            <div class="card" onclick="openDetail(${f.id})">
                <h3>${f.name}</h3>
                <p class="${colorClass}" style="font-size: 28px; font-weight: bold;">
                    ${avg !== null ? avg.toFixed(1) : '--'}
                </p>
                <small>Ziel: ${f.goal}</small>
            </div>`;
    });
}

function openDetail(id) {
    currentFachId = id;
    const fach = db.find(f => f.id === id);
    document.getElementById('d-title').innerText = fach.name;
    document.getElementById('goal-in').value = fach.goal;
    renderNotes();
    showPage('detail');
}

function addNote() {
    const input = document.getElementById('n-in');
    const val = parseInt(input.value);
    if (isNaN(val) || val < 0 || val > 15) return;

    const fach = db.find(f => f.id === currentFachId);
    fach.notes.push(val);
    input.value = '';
    renderNotes();
    save();
}

function updateGoal() {
    const fach = db.find(f => f.id === currentFachId);
    fach.goal = parseInt(document.getElementById('goal-in').value);
    renderNotes();
    save();
}

function renderNotes() {
    const fach = db.find(f => f.id === currentFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
    
    document.getElementById('d-avg').innerText = `Schnitt: ${avg.toFixed(1)}`;
    
    // Status-Berechnung
    const diff = (fach.goal - avg).toFixed(1);
    const statusEl = document.getElementById('goal-status');
    if (avg >= fach.goal) {
        statusEl.innerHTML = `<span class="grade-good">Ziel erreicht! 🎉</span>`;
    } else {
        statusEl.innerHTML = `Noch <b>${diff} Punkte</b> bis zum Ziel.`;
    }

    document.getElementById('n-list').innerHTML = fach.notes.map((n, i) => `
        <div class="note-item">
            Note ${i+1}: <b>${n} Punkte</b>
        </div>
    `).reverse().join('');
}