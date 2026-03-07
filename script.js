let subjects = JSON.parse(localStorage.getItem('gf_data')) || [];
let activeId = null;

// Berechnet die Farbe basierend auf den Punkten (0-15 System)
function getStatusColor(points) {
    if (points >= 11) return '#22c55e'; // Grün
    if (points >= 5) return '#eab308';  // Gelb
    if (points > 0) return '#ef4444';   // Rot
    return '#5865f2';                   // Standard Blau
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    
    if(pageId === 'list') renderGrid();
}

function addFach() {
    const input = document.getElementById('f-name');
    if(!input.value.trim()) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [] });
    input.value = '';
    save();
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('grid-container');
    if(!grid) return;
    grid.innerHTML = '';
    
    subjects.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : 0;
        const color = getStatusColor(avg);
        
        grid.innerHTML += `
            <div class="subject-card" onclick="openDetail(${s.id})" style="border-left-color: ${color}">
                <h3>${s.name}</h3>
                <div style="font-size: 24px; font-weight: bold; color: ${color}">
                    ${s.notes.length ? avg.toFixed(1) : 'Keine Noten'}
                </div>
            </div>`;
    });
}

function openDetail(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    document.getElementById('det-title').innerText = s.name;
    showPage('detail');
    renderDetail();
}

function addNote() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    if(isNaN(val) || val < 0 || val > 15) return;
    
    const s = subjects.find(x => x.id === activeId);
    s.notes.push(val);
    input.value = '';
    save();
    renderDetail();
}

function renderDetail() {
    const s = subjects.find(x => x.id === activeId);
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : 0;
    const color = getStatusColor(avg);
    
    document.getElementById('det-avg').innerText = s.notes.length ? avg.toFixed(1) : '-';
    document.getElementById('hero-banner').style.background = `linear-gradient(135deg, ${color}, #080a12)`;
    
    const list = document.getElementById('notes-history');
    list.innerHTML = '<h2>Verlauf</h2>';
    s.notes.slice().reverse().forEach(n => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom:10px; padding:15px;">${n} Punkte</div>`;
    });
}

function save() { localStorage.setItem('gf_data', JSON.stringify(subjects)); }

// Initialer Start
renderGrid();