let subjects = JSON.parse(localStorage.getItem('GF_NEON_V12')) || [];
let activeId = null;
let mAction = null;

const sync = () => localStorage.setItem('GF_NEON_V12', JSON.stringify(subjects));

// Farblogik für Neon-Effekte
function getStyle(avg) {
    if (avg === null) return { c: '#333', t: 'Keine Daten', glow: 'rgba(51,51,51,0.3)' };
    if (avg >= 13) return { c: 'var(--neon-blue)', t: 'Exzellent', glow: 'rgba(0, 242, 254, 0.4)' };
    if (avg >= 8) return { c: 'var(--neon-gold)', t: 'Stabil', glow: 'rgba(255, 204, 0, 0.3)' };
    return { c: 'var(--neon-red)', t: 'Kritisch', glow: 'rgba(255, 0, 85, 0.4)' };
}

function tab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'dash') renderDash();
    if(id === 'goals') renderGoals();
}

function renderDash() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    let sum = 0, count = 0;

    subjects.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
        const style = getStyle(avg);
        if(avg !== null) { sum += avg; count++; }

        grid.innerHTML += `
            <div class="n-card" onclick="openSubject(${s.id})" style="box-shadow: 0 10px 30px ${style.glow}">
                <div class="label">${s.name}</div>
                <h2 style="color: ${style.c}; text-shadow: 0 0 20px ${style.c}">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div style="font-size:12px; font-weight:800; color:${style.c}">${style.t}</div>
            </div>`;
    });
    document.getElementById('total-avg').innerText = count > 0 ? (sum/count).toFixed(2) : '0.0';
}

function addSubject() {
    const input = document.getElementById('in-subject');
    if(!input.value.trim()) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [], target: 10 });
    input.value = ''; sync(); renderDash();
}

function openSubject(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    tab('det');
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
    const style = getStyle(avg);

    const hero = document.getElementById('det-hero');
    hero.style.background = `linear-gradient(180deg, ${style.c}22 0%, transparent 100%)`;
    hero.style.borderColor = style.c;
    
    document.getElementById('det-name').innerText = s.name;
    document.getElementById('det-num').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-num').style.color = style.c;
    document.getElementById('det-num').style.textShadow = `0 0 30px ${style.c}`;
    document.getElementById('det-status').innerText = style.t;

    const hist = document.getElementById('history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="hist-item" style="border-left: 4px solid ${getStyle(n).c}">
            <b style="font-size:20px; color:${getStyle(n).c}">${n} Pkt</b>
            <button onclick="delGrade(${i})" style="background:none; border:none; color:#444; cursor:pointer; font-weight:800">Löschen</button>
        </div>`).reverse().join('');
}

function addGrade() {
    const input = document.getElementById('in-grade');
    const val = parseFloat(input.value);
    if(isNaN(val) || val < 0 || val > 15) return;
    subjects.find(x => x.id === activeId).notes.push(val);
    input.value = ''; sync(); openSubject(activeId);
}

function delGrade(idx) {
    const s = subjects.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    sync(); openSubject(activeId);
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    subjects.forEach(s => {
        list.innerHTML += `
            <div class="goal-row">
                <span class="name">${s.name}</span>
                <div style="display:flex; align-items:center; gap:15px">
                    <span style="color:#444; font-size:12px; font-weight:800">ZIEL</span>
                    <input type="number" min="0" max="15" value="${s.target}" onchange="updateTarget(${s.id}, this.value)">
                </div>
            </div>`;
    });
}

function updateTarget(id, val) {
    subjects.find(x => x.id === id).target = Math.min(Math.max(parseFloat(val), 0), 15);
    sync();
}

function askDeleteSubject() {
    openModal("Fach wirklich löschen?", () => {
        subjects = subjects.filter(x => x.id !== activeId);
        sync(); tab('dash');
    });
}

function askReset() {
    openModal("ALLES LÖSCHEN?", () => {
        localStorage.clear();
        location.reload();
    });
}

function openModal(txt, cb) {
    document.getElementById('modal-title').innerText = txt;
    document.getElementById('modal-overlay').classList.remove('hidden');
    mAction = cb;
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
document.getElementById('modal-confirm').onclick = () => { if(mAction) mAction(); closeModal(); };

renderDash();