// Neue Speicher-ID um alte Fehler zu löschen
let appData = JSON.parse(localStorage.getItem('gf_v11_data')) || [];
let userName = localStorage.getItem('gf_v11_name') || 'Schüler';
let activeFachId = null;
let myChart = null;

function getStatusColor(p) {
    if (p >= 11) return '#22c55e';
    if (p >= 5) return '#eab308';
    if (p > 0) return '#ef4444';
    return '#5865f2';
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(document.getElementById('nav-' + id)) document.getElementById('nav-' + id).classList.add('active');

    if(id === 'list') renderGrid();
    if(id === 'stats') renderStats();
}

// --- LOGIK FÜR FÄCHER ---
function addFach() {
    const i = document.getElementById('f-name');
    if(!i.value.trim()) return;
    appData.push({ id: Date.now(), name: i.value, notes: [] });
    i.value = ''; save(); renderGrid();
}

function renderGrid() {
    const g = document.getElementById('grid-container'); g.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
        const c = getStatusColor(avg);
        g.innerHTML += `<div class="subject-card" onclick="openDetail(${f.id})" style="border-left-color:${c}">
            <h3>${f.name}</h3>
            <p style="color:${c}; font-size:24px; font-weight:bold;">${f.notes.length ? avg.toFixed(1) : '-'}</p>
        </div>`;
    });
}

// --- LOGIK FÜR NOTEN (FIX: Strikte ID-Trennung) ---
function openDetail(id) {
    activeFachId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('det-title').innerText = f.name;
    showPage('detail'); renderDetail();
}

function addNote() {
    const v = parseFloat(document.getElementById('n-val').value);
    if(isNaN(v) || v < 0 || v > 15) return;
    
    // Finde exakt das aktive Fach
    const fach = appData.find(x => x.id === activeFachId);
    fach.notes.push(v);
    
    document.getElementById('n-val').value = '';
    save(); renderDetail();
}

function renderDetail() {
    const f = appData.find(x => x.id === activeFachId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
    const c = getStatusColor(avg);
    
    document.getElementById('det-avg').innerText = f.notes.length ? avg.toFixed(1) : '-';
    document.getElementById('hero-banner').style.background = c;
    
    const h = document.getElementById('notes-history');
    h.innerHTML = '<h3>Notenverlauf</h3>';
    f.notes.slice().reverse().forEach(n => {
        h.innerHTML += `<div class="subject-card" style="margin-bottom:10px; border-left-color:${getStatusColor(n)}">${n} Punkte</div>`;
    });
}

// --- STATISTIKEN & TRENDS ---
function renderStats() {
    let totalPoints = 0, subCount = 0, allNotes = [];
    let labels = [], dataPoints = [], colors = [];

    appData.forEach(f => {
        if(f.notes.length > 0) {
            const avg = f.notes.reduce((a,b)=>a+b,0)/f.notes.length;
            totalPoints += avg; subCount++;
            allNotes.push(...f.notes);
            labels.push(f.name);
            dataPoints.push(avg.toFixed(1));
            colors.push(getStatusColor(avg));
        }
    });

    const final = subCount > 0 ? (totalPoints/subCount) : 0;
    document.getElementById('total-avg').innerText = subCount > 0 ? final.toFixed(1) : '-';
    document.getElementById('total-count').innerText = allNotes.length;
    document.getElementById('stats-banner').style.background = getStatusColor(final);

    // Trend-Berechnung
    const trendEl = document.getElementById('trend-indicator');
    if(allNotes.length >= 4) {
        const last3 = allNotes.slice(-3).reduce((a,b)=>a+b,0)/3;
        const before = allNotes.slice(0, -3).reduce((a,b)=>a+b,0)/(allNotes.length-3);
        if(last3 > before) trendEl.innerHTML = "↑ Verbessert";
        else if(last3 < before) trendEl.innerHTML = "↓ Verschlechtert";
        else trendEl.innerHTML = "→ Stabil";
    } else { trendEl.innerHTML = "Zu wenig Daten"; }

    // Chart
    const ctx = document.getElementById('myChart').getContext('2d');
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ data: dataPoints, backgroundColor: colors, borderRadius: 10 }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { max: 15, beginAtZero: true } } }
    });
}

function deleteFach() {
    if(confirm('Fach löschen?')) { appData = appData.filter(x => x.id !== activeFachId); save(); showPage('list'); }
}
function save() { localStorage.setItem('gf_v11_data', JSON.stringify(appData)); }
function resetAll() { if(confirm('Alles löschen?')) { localStorage.clear(); location.reload(); } }

showPage('list');