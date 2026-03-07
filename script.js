let appState = JSON.parse(localStorage.getItem('GF_ULTRA_V11')) || [];
let activeID = null;
let currentModalAction = null;

const sync = () => localStorage.setItem('GF_ULTRA_V11', JSON.stringify(appState));

// Logik für Farbdynamik
const getVisuals = (val) => {
    if (val === null) return { g: 'var(--panel)', t: 'Warten...', c: '#333' };
    if (val >= 13) return { g: 'var(--grad-blue)', t: 'Exzellent', c: '#00d2ff' };
    if (val >= 8) return { g: 'var(--grad-gold)', t: 'Stabil', c: '#f1c40f' };
    return { g: 'var(--grad-red)', t: 'Kritisch', c: '#f85032' };
};

function changeTab(id) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    if(document.getElementById('tab-btn-' + id)) document.getElementById('tab-btn-' + id).classList.add('active');
    if(id === 'dash') renderDash();
    if(id === 'goals') renderGoals();
}

function renderDash() {
    const grid = document.getElementById('subject-grid');
    grid.innerHTML = '';
    let sum = 0, count = 0;

    appState.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
        const vis = getVisuals(avg);
        if(avg !== null) { sum += avg; count++; }

        grid.innerHTML += `
            <div class="subject-card" onclick="openSubject(${s.id})">
                <div class="label">${s.name}</div>
                <h2 style="color: ${avg !== null ? vis.c : '#222'}; text-shadow: ${avg !== null ? '0 0 40px ' + vis.c + '44' : 'none'}">
                    ${avg !== null ? avg.toFixed(1) : '-'}
                </h2>
                <div style="font-size:12px; font-weight:800; color:${vis.c}">${vis.t}</div>
            </div>`;
    });
    document.getElementById('main-avg').innerText = count > 0 ? (sum/count).toFixed(2) : '0.0';
}

function addSubject() {
    const el = document.getElementById('subject-input');
    if(!el.value.trim()) return;
    appState.push({ id: Date.now(), name: el.value, notes: [], target: 10 });
    el.value = ''; sync(); renderDash();
}

function openSubject(id) {
    activeID = id;
    const s = appState.find(x => x.id === id);
    changeTab('details');
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
    const vis = getVisuals(avg);

    const hero = document.getElementById('hero-card');
    hero.style.background = vis.g;
    document.getElementById('hero-title').innerText = s.name;
    document.getElementById('hero-avg').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('hero-status').innerText = vis.t;

    const hist = document.getElementById('grade-history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="history-item">
            <b style="font-size:20px; color:${getVisuals(n).c}">${n} Pkt</b>
            <button onclick="deleteGrade(${i})" style="background:none; border:none; color:#333; cursor:pointer; font-weight:800">Löschen</button>
        </div>`).reverse().join('');
}

function saveGrade() {
    const val = parseFloat(document.getElementById('grade-input').value);
    if(isNaN(val) || val < 0 || val > 15) return;
    appState.find(x => x.id === activeID).notes.push(val);
    document.getElementById('grade-input').value = '';
    sync(); openSubject(activeID);
}

function deleteGrade(idx) {
    const s = appState.find(x => x.id === activeID);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    sync(); openSubject(activeID);
}

function renderGoals() {
    const container = document.getElementById('goals-container');
    container.innerHTML = '';
    appState.forEach(s => {
        container.innerHTML += `
            <div class="goal-card">
                <div class="title">${s.name}</div>
                <div style="display:flex; align-items:center; gap:20px">
                    <span style="color:#444; font-weight:800">ZIEL</span>
                    <input type="number" min="0" max="15" value="${s.target}" onchange="updateTarget(${s.id}, this.value)">
                </div>
            </div>`;
    });
}

function updateTarget(id, val) {
    appState.find(x => x.id === id).target = Math.min(Math.max(parseFloat(val), 0), 15);
    sync();
}

function triggerDeleteSubject() {
    openModal("Fach wirklich löschen?", () => {
        appState = appState.filter(x => x.id !== activeID);
        sync(); changeTab('dash');
    });
}

function triggerReset() {
    openModal("Alle Daten unwiderruflich löschen?", () => {
        localStorage.clear();
        location.reload();
    });
}

function openModal(text, cb) {
    document.getElementById('modal-title').innerText = text;
    document.getElementById('modal-overlay').classList.remove('hidden');
    currentModalAction = cb;
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
document.getElementById('modal-confirm').onclick = () => { if(currentModalAction) currentModalAction(); closeModal(); };

renderDash();