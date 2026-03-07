let appData = JSON.parse(localStorage.getItem('gf_v6_data')) || [];
let userName = localStorage.getItem('gf_v6_name') || 'Schüler';
let activeFachId = null;

function getStatusColor(points) {
    if (points >= 11) return '#22c55e';
    if (points >= 5) return '#eab308';
    if (points > 0) return '#ef4444';
    return '#5865f2';
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    
    // Aktiver Button in Sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(id === 'list' ? 'dash' : id));
    });

    document.getElementById('user-name-display').innerText = userName;
    if (id === 'list') renderGrid();
    if (id === 'stats') renderStats();
}

function renderStats() {
    let totalPoints = 0;
    let count = 0;
    const statsContainer = document.getElementById('stats-details');
    statsContainer.innerHTML = '';

    appData.forEach(f => {
        if(f.notes.length > 0) {
            const avg = f.notes.reduce((a,b)=>a+b,0) / f.notes.length;
            totalPoints += avg;
            count++;
            statsContainer.innerHTML += `
                <div class="subject-card" style="border-left-color: ${getStatusColor(avg)}">
                    <h4>${f.name}</h4>
                    <p>${avg.toFixed(2)} Punkte</p>
                </div>`;
        }
    });

    const finalAvg = count > 0 ? (totalPoints / count) : 0;
    document.getElementById('total-avg').innerText = count > 0 ? finalAvg.toFixed(1) : '-';
    document.getElementById('stats-banner').style.background = getStatusColor(finalAvg);
}

function saveSettings() {
    const val = document.getElementById('set-name').value;
    if(val) { userName = val; localStorage.setItem('gf_v6_name', userName); showPage('list'); }
}

function addFach() {
    const name = document.getElementById('f-name').value;
    if (!name) return;
    appData.push({ id: Date.now(), name: name, notes: [] });
    document.getElementById('f-name').value = '';
    save(); renderGrid();
}

function deleteFach() {
    if(confirm('Fach löschen?')) { appData = appData.filter(x => x.id !== activeFachId); save(); showPage('list'); }
}

function resetAll() {
    if(confirm('Alles löschen?')) { localStorage.clear(); location.reload(); }
}

function renderGrid() {
    const grid = document.getElementById('grid-container');
    grid.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
        const color = getStatusColor(avg);
        grid.innerHTML += `<div class="subject-card" onclick="openDetail(${f.id})" style="border-left-color: ${color}">
            <h3>${f.name}</h3>
            <div style="font-size:32px; font-weight:900; color:${color}">${f.notes.length ? avg.toFixed(1) : '-'}</div>
        </div>`;
    });
}

function openDetail(id) {
    activeFachId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('det-title').innerText = f.name;
    showPage('detail');
    renderDetail();
}

function addNote() {
    const val = parseFloat(document.getElementById('n-val').value);
    if (isNaN(val) || val < 0 || val > 15) return;
    appData.find(x => x.id === activeFachId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); renderDetail();
}

function renderDetail() {
    const f = appData.find(x => x.id === activeFachId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
    const color = getStatusColor(avg);
    document.getElementById('det-avg').innerText = f.notes.length ? avg.toFixed(1) : '-';
    document.getElementById('hero-banner').style.background = `linear-gradient(135deg, ${color}, #080a12)`;
    const list = document.getElementById('notes-history');
    list.innerHTML = '<h2>Verlauf</h2>';
    f.notes.slice().reverse().forEach(n => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom:10px; padding:15px; border-left-color:${getStatusColor(n)}">${n} Punkte</div>`;
    });
}

function save() { localStorage.setItem('gf_v6_data', JSON.stringify(appData)); }
renderGrid();