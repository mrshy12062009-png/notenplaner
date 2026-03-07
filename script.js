let appData = JSON.parse(localStorage.getItem('GF_PRO_V14')) || [];
let activeSubjectId = null;
let modalAction = null;

const commit = () => localStorage.setItem('GF_PRO_V14', JSON.stringify(appData));

function getTone(avg) {
    if (avg === null) return { g: 'var(--card)', c: '#222', t: 'Keine Daten' };
    if (avg >= 13) return { g: 'var(--good)', c: '#22c55e', t: 'Herausragend' };
    if (avg >= 8) return { g: 'var(--mid)', c: '#eab308', t: 'Befriedigend' };
    return { g: 'var(--bad)', c: '#ef4444', t: 'Handlungsbedarf' };
}

function view(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'dash') renderDashboard();
    if(id === 'goals') renderGoals();
}

function renderDashboard() {
    const grid = document.getElementById('subject-grid');
    grid.innerHTML = '';
    let totalSum = 0, count = 0;

    appData.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
        const tone = getTone(avg);
        if(avg !== null) { totalSum += avg; count++; }

        grid.innerHTML += `
            <div class="subject-card" onclick="openSubject(${s.id})">
                <div style="font-size:11px; font-weight:800; color:#444; text-transform:uppercase">${s.name}</div>
                <h2 style="color: ${avg !== null ? tone.c : '#1a1a1a'}">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div style="font-size:12px; font-weight:800; color:${tone.c}">${tone.t}</div>
            </div>`;
    });
    document.getElementById('total-avg').innerText = count > 0 ? (totalSum/count).toFixed(2) : '0.0';
}

function addSubject() {
    const input = document.getElementById('subject-in');
    if(!input.value.trim()) return;
    appData.push({ id: Date.now(), name: input.value, notes: [], target: 10 });
    input.value = ''; commit(); renderDashboard();
}

function openSubject(id) {
    activeSubjectId = id;
    const s = appData.find(x => x.id === id);
    view('det');
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
    const tone = getTone(avg);

    const hero = document.getElementById('det-card');
    hero.style.background = tone.g;
    document.getElementById('det-name').innerText = s.name;
    document.getElementById('det-num').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-status').innerText = tone.t;

    const hist = document.getElementById('history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="history-row" style="border-left-color: ${getTone(n).c}">
            <span style="font-weight:800; font-size:18px">${n} Punkte</span>
            <button onclick="deleteGrade(${i})" style="background:none; border:none; color:#333; cursor:pointer; font-weight:800">Löschen</button>
        </div>`).reverse().join('');
}

function addGrade() {
    const input = document.getElementById('grade-in');
    const val = parseFloat(input.value);
    if(isNaN(val) || val < 0 || val > 15) return;
    appData.find(x => x.id === activeSubjectId).notes.push(val);
    input.value = ''; commit(); openSubject(activeSubjectId);
}

function deleteGrade(idx) {
    const s = appData.find(x => x.id === activeSubjectId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    commit(); openSubject(activeSubjectId);
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    appData.forEach(s => {
        list.innerHTML += `
            <div class="goal-item">
                <span style="font-weight:800; font-size:20px">${s.name}</span>
                <div style="display:flex; align-items:center; gap:15px">
                    <span style="color:#444; font-size:11px; font-weight:800">ZIEL-PUNKTE</span>
                    <input type="number" min="0" max="15" value="${s.target}" onchange="updateGoal(${s.id}, this.value)">
                </div>
            </div>`;
    });
}

function updateGoal(id, val) {
    appData.find(x => x.id === id).target = Math.min(Math.max(parseFloat(val), 0), 15);
    commit();
}

function deleteSubjectTrigger() {
    showModal("Dieses Fach wirklich löschen?", () => {
        appData = appData.filter(x => x.id !== activeSubjectId);
        commit(); view('dash');
    });
}

function fullReset() {
    showModal("KOMPLETTER RESET?", () => {
        localStorage.clear();
        location.reload();
    });
}

function showModal(msg, action) {
    document.getElementById('modal-title').innerText = msg;
    document.getElementById('modal-overlay').classList.remove('hidden');
    modalAction = action;
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
document.getElementById('modal-confirm').onclick = () => { if(modalAction) modalAction(); closeModal(); };

renderDashboard();