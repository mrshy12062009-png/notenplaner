let data = JSON.parse(localStorage.getItem('GF_V15')) || [];
let activeId = null;
let mCb = null;

const save = () => localStorage.setItem('GF_V15', JSON.stringify(data));

function getStyle(avg) {
    if (avg === null) return { g: '#111', c: '#444', t: 'Keine Noten' };
    if (avg >= 13) return { g: 'var(--grad-good)', c: '#00f2fe', t: 'Sehr Gut' };
    if (avg >= 8) return { g: 'var(--grad-mid)', c: '#f9d423', t: 'Befriedigend' };
    return { g: 'var(--grad-bad)', c: '#f85032', t: 'Ungenügend' };
}

function show(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'dash') renderDash();
    if(id === 'goals') renderGoals();
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = '';
    let sum = 0, count = 0;

    data.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
        const style = getStyle(avg);
        if(avg !== null) { sum += avg; count++; }

        grid.innerHTML += `
            <div class="card" onclick="openSub(${s.id})">
                <small style="color:#666; font-weight:800; text-transform:uppercase">${s.name}</small>
                <h2 style="color:${style.c}">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div style="font-size:12px; font-weight:800; color:${style.c}">${style.t}</div>
            </div>`;
    });
    document.getElementById('total-avg').innerText = count > 0 ? (sum/count).toFixed(2) : '0.0';
}

function addSub() {
    const i = document.getElementById('add-sub-input');
    if(!i.value.trim()) return;
    data.push({ id: Date.now(), name: i.value, notes: [], target: 10 });
    i.value = ''; save(); renderDash();
}

function openSub(id) {
    activeId = id;
    const s = data.find(x => x.id === id);
    show('det');
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
    const style = getStyle(avg);

    document.getElementById('det-hero').style.background = style.g;
    document.getElementById('det-title').innerText = s.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-tag').innerText = style.t;

    const hist = document.getElementById('grade-history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="hist-item">
            <b style="color:${getStyle(n).c}; font-size:20px">${n} Pkt</b>
            <button onclick="delGrade(${i})" style="background:none; border:none; color:#444; cursor:pointer">Löschen</button>
        </div>`).reverse().join('');
}

function addGrade() {
    const i = document.getElementById('add-grade-input');
    const v = parseFloat(i.value);
    if(isNaN(v) || v < 0 || v > 15) return;
    data.find(x => x.id === activeId).notes.push(v);
    i.value = ''; save(); openSub(activeId);
}

function delGrade(idx) {
    const s = data.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    save(); openSub(activeId);
}

function renderGoals() {
    const area = document.getElementById('goals-list');
    area.innerHTML = data.map(s => `
        <div class="hist-item" style="padding:25px; border-radius:25px">
            <span style="font-weight:800; font-size:18px">${s.name}</span>
            <input type="number" value="${s.target}" onchange="updGoal(${s.id}, this.value)" style="width:70px; background:#000; border:1px solid #222; color:#fff; padding:10px; border-radius:10px; text-align:center">
        </div>`).join('');
}

function updGoal(id, v) {
    data.find(x => x.id === id).target = v;
    save();
}

function fullReset() { openM("ALLES LÖSCHEN?", () => { localStorage.clear(); location.reload(); }); }
function delSubTrigger() { openM("Fach löschen?", () => { data = data.filter(x => x.id !== activeId); save(); show('dash'); }); }

function openM(m, cb) { 
    document.getElementById('modal-msg').innerText = m; 
    document.getElementById('modal-overlay').classList.remove('hidden'); 
    mCb = cb; 
}
function closeM() { document.getElementById('modal-overlay').classList.add('hidden'); }
document.getElementById('modal-confirm').onclick = () => { if(mCb) mCb(); closeM(); };

renderDash();