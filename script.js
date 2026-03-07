// Wir nutzen eine neue ID, um sauber neu zu starten
let appData = JSON.parse(localStorage.getItem('gf_v12_stable')) || [];
let userName = localStorage.getItem('gf_v12_name') || 'Schüler';
let activeFachId = null;
let myChart = null;

function getStatusColor(p) {
    if (p >= 11) return '#22c55e';
    if (p >= 5) return '#eab308';
    if (p > 0) return '#ef4444';
    return '#5865f2';
}

// NAVIGATION FIX
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + id);
    if(targetPage) targetPage.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('nav-' + id);
    if(btn) btn.classList.add('active');

    if(id === 'list') renderGrid();
    if(id === 'stats') renderStats();
}

// FÄCHER LOGIK
function addFach() {
    const i = document.getElementById('f-name');
    if(!i.value.trim()) return;
    const newFach = {
        id: Date.now(), // Eindeutige ID für dieses Fach
        name: i.value.trim(),
        notes: [] // Eigener Noten-Speicher!
    };
    appData.push(newFach);
    i.value = '';
    save(); renderGrid();
}

function renderGrid() {
    const g = document.getElementById('grid-container');
    g.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
        const c = getStatusColor(avg);
        g.innerHTML += `
            <div class="subject-card" onclick="openDetail(${f.id})" style="border-left-color:${c}">
                <h3>${f.name}</h3>
                <p style="color:${c}; font-size:24px; font-weight:bold;">${f.notes.length ? avg.toFixed(1) : '-'}</p>
                <small>${f.notes.length} Noten</small>
            </div>`;
    });
}

// NOTEN LOGIK (DER ENTSCHEIDENDE FIX)
function openDetail(id) {
    activeFachId = id; // Hier merken wir uns, welches Fach offen ist
    const f = appData.find(x => x.id === id);
    if(!f) return;
    
    document.getElementById('det-title').innerText = f.name;
    showPage('detail');
    renderDetail();
}

function addNote() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    
    if(isNaN(val) || val < 0 || val > 15) {
        alert("Bitte eine Punktzahl zwischen 0 und 15 eingeben!");
        return;
    }
    
    // Wir suchen das Fach im appData Array anhand der activeFachId
    const index = appData.findIndex(x => x.id === activeFachId);
    if(index !== -1) {
        appData[index].notes.push(val); // Note wird NUR in dieses Fach geschoben
        input.value = '';
        save();
        renderDetail();
    }
}

function renderDetail() {
    const f = appData.find(x => x.id === activeFachId);
    if(!f) return;

    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
    const c = getStatusColor(avg);
    
    document.getElementById('det-avg').innerText = f.notes.length ? avg.toFixed(1) : '-';
    document.getElementById('hero-banner').style.background = `linear-gradient(135deg, ${c}, #080a12)`;
    
    const h = document.getElementById('notes-history');
    h.innerHTML = '<h3>Verlauf</h3>';
    
    // Wir zeigen nur die Noten DIESES Fachs an
    f.notes.slice().reverse().forEach(n => {
        h.innerHTML += `
            <div class="subject-card" style="margin-bottom:10px; padding:15px; border-left-color:${getStatusColor(n)}">
                <strong>${n} Punkte</strong>
            </div>`;
    });
}

// STATS LOGIK (MEHR DETAILS)
function renderStats() {
    let totalPointsSum = 0;
    let subjectWithNotes = 0;
    let totalNotesCount = 0;
    
    let chartLabels = [];
    let chartData = [];
    let chartColors = [];

    const details = document.getElementById('stats-details');
    details.innerHTML = '';

    appData.forEach(f => {
        if(f.notes.length > 0) {
            const avg = f.notes.reduce((a,b)=>a+b,0) / f.notes.length;
            totalPointsSum += avg;
            subjectWithNotes++;
            totalNotesCount += f.notes.length;

            chartLabels.push(f.name);
            chartData.push(avg.toFixed(2));
            chartColors.push(getStatusColor(avg));

            details.innerHTML += `
                <div class="subject-card" style="border-left-color:${getStatusColor(avg)}">
                    <h4>${f.name}</h4>
                    <p>Schnitt: ${avg.toFixed(2)}</p>
                    <small>${f.notes.length} Noten eingetragen</small>
                </div>`;
        }
    });

    const finalAvg = subjectWithNotes > 0 ? (totalPointsSum / subjectWithNotes) : 0;
    document.getElementById('total-avg').innerText = subjectWithNotes > 0 ? finalAvg.toFixed(1) : '-';
    document.getElementById('total-count').innerText = totalNotesCount;
    document.getElementById('stats-banner').style.background = getStatusColor(finalAvg);

    // Chart.js Diagramm
    const ctx = document.getElementById('myChart').getContext('2d');
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Punkte',
                data: chartData,
                backgroundColor: chartColors,
                borderRadius: 5
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: 15 } },
            plugins: { legend: { display: false } }
        }
    });
}

function save() { localStorage.setItem('gf_v12_stable', JSON.stringify(appData)); }
function saveSettings() {
    const n = document.getElementById('set-name').value;
    if(n) { userName = n; localStorage.setItem('gf_v12_name', n); showPage('list'); }
}
function resetAll() { if(confirm('Sicher? Alle Noten werden gelöscht!')) { localStorage.clear(); location.reload(); } }
function deleteFach() {
    if(confirm('Fach löschen?')) { appData = appData.filter(x => x.id !== activeFachId); save(); showPage('list'); }
}

// Start
showPage('list');