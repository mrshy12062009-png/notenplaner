let subjects = JSON.parse(localStorage.getItem('GF_PURE_V10')) || [];
let activeSubjectId = null;
let currentCallback = null;

const db = () => localStorage.setItem('GF_PURE_V10', JSON.stringify(subjects));

function getTone(val) {
    if (val === null) return { color: '#222', text: 'Keine Daten' };
    if (val >= 13) return { color: 'var(--c-high)', text: 'Exzellent' };
    if (val >= 8) return { color: 'var(--c-mid)', text: 'Stabil' };
    return { color: 'var(--c-low)', text: 'Kritisch' };
}

function switchTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'dash') renderDash();
    if(id === 'goals') renderGoals();
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = '';
    let globalSum = 0, count = 0;

    subjects.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
        const tone = getTone(avg);
        if(avg !== null) { globalSum += avg; count++; }

        grid.innerHTML += `
            <div class="card" onclick="openSubject(${s.id})">
                <div class="sub">${s.name}</div>
                <h2 style="color: ${tone.color}; text-shadow: 0 0 30px ${tone.color}33">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div style="font-size:12px; font-weight:800; color:${tone.color}">${tone.text}</div>
            </div>`;
    });
    document.getElementById('global-avg').innerText = count > 0 ? (globalSum/count).toFixed(2) : '0.0';
}

function addSubject() {
    const input = document.getElementById('subject-name');
    if(!input.value.trim()) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [], target: 10 });
    input.value = ''; db(); renderDash();
}

function openSubject(id) {
    activeSubjectId = id;
    const s = subjects.find(x => x.id === id);
    switchTab('det');
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
    const tone = getTone(avg);

    const hero = document.getElementById('subject-hero');
    hero.style.background = `linear-gradient(180deg, ${tone.color}15 0%, transparent 100%)`;
    hero.style.borderBottom = `2px solid ${tone.color}`;
    
    document.getElementById('det-title').innerText = s.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-avg').style.color = tone.color;
    document.getElementById('det-label').innerText = tone.text;

    const stack = document.getElementById('history-stack');
    stack.innerHTML = s.notes.map((n, i) => `
        <div class="hist-item" style="border-left-color: ${getTone(n).color}">
            <span style="font-weight:800">${n} Punkte</span>
            <button onclick="deleteGrade(${i})" style="background:none; border:none; color:#444; cursor:pointer">Löschen</button>
        </div>`).reverse().join('');
}

function saveGrade() {
    const val = parseFloat(document.getElementById('new-grade').value);
    if(isNaN(val) || val < 0 || val > 15) return;
    subjects.find(x => x.id === activeSubjectId).notes.push(val);
    document.getElementById('new-grade').value = '';
    db(); openSubject(activeSubjectId);
}

function deleteGrade(idx) {
    const s = subjects.find(x => x.id === activeSubjectId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    db(); openSubject(activeSubjectId);
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    subjects.forEach(s => {
        list.innerHTML += `
            <div class="goal-row">
                <span style="font-weight:800; font-size:18px">${s.name}</span>
                <div class="goal-val">ZIEL: ${s.target}</div>
            </div>`;
    });
}

function askDeleteSubject() {
    openModal("Dieses Fach wirklich löschen?", () => {
        subjects = subjects.filter(x => x.id !== activeSubjectId);
        db(); switchTab('dash');
    });
}

function askReset() {
    openModal("Alle Daten löschen?", () => {
        localStorage.clear();
        location.reload();
    });
}

function openModal(text, cb) {
    document.getElementById('modal-title').innerText = text;
    document.getElementById('modal').classList.remove('hidden');
    currentCallback = cb;
}
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
document.getElementById('confirm-btn').onclick = () => { if(currentCallback) currentCallback(); closeModal(); };

renderDash();