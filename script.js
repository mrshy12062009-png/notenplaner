let data = JSON.parse(localStorage.getItem('GF_CYBER_V7')) || [];
let activeId = null;
let mCb = null;

const save = () => localStorage.setItem('GF_CYBER_V7', JSON.stringify(data));

// POPUP LOGIK
function openM(msg, cb) {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('modal-overlay').classList.remove('modal-hide');
    mCb = cb;
}
function closeM() { document.getElementById('modal-overlay').classList.add('modal-hide'); }
document.getElementById('m-confirm').onclick = () => { if(mCb) mCb(); closeM(); };

// FARB LOGIK (0-15 Punkte)
function getColor(val) {
    if (val === null) return { c: '#222', t: 'Keine Daten' };
    if (val >= 13) return { c: 'var(--c-good)', t: 'Exzellent' };
    if (val >= 8) return { c: 'var(--c-mid)', t: 'Befriedigend' };
    return { c: 'var(--c-bad)', t: 'Ungenügend' };
}

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if(document.getElementById('tab-' + id)) document.getElementById('tab-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
}

function renderDash() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    let sum = 0, count = 0;

    data.forEach(s => {
        const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
        const color = getColor(avg);
        if(avg !== null) { sum += avg; count++; }
        const fill = avg !== null ? Math.min((avg / 15) * 100, 100) : 0;

        grid.innerHTML += `
            <div class="subject-card" onclick="openDet(${s.id})">
                <span class="label">${s.name}</span>
                <h2 style="color: ${color.c}; text-shadow: 0 0 20px ${color.c}44">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div class="prog-bg">
                    <div class="prog-bar" style="width: ${fill}%; background: ${color.c}; box-shadow: 0 0 15px ${color.c}aa"></div>
                </div>
            </div>`;
    });
    document.getElementById('total-avg').innerText = count > 0 ? (sum/count).toFixed(2) : '0.0';
}

function addSubject() {
    const i = document.getElementById('add-name');
    if(!i.value.trim()) return;
    data.push({ id: Date.now(), name: i.value, notes: [], target: 10 });
    i.value = ''; save(); renderDash();
}

function openDet(id) {
    activeId = id;
    const s = data.find(x => x.id === id);
    tab('det');
    const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
    const color = getColor(avg);

    document.getElementById('det-bg').style.background = `linear-gradient(180deg, ${color.c}22 0%, #000 100%)`;
    document.getElementById('det-bg').style.borderBottom = `2px solid ${color.c}`;
    document.getElementById('det-name').innerText = s.name;
    document.getElementById('det-num').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-num').style.color = color.c;
    document.getElementById('det-txt').innerText = color.t;

    const hist = document.getElementById('history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="glass-input" style="display:flex; justify-content:space-between; margin-bottom:10px; padding:20px">
            <b style="color:${getColor(n).c}">${n} Punkte</b>
            <button onclick="delGrade(${i})" style="color:#ff4444; background:none; border:none; cursor:pointer; font-weight:bold">ENTFERNEN</button>
        </div>`).reverse().join('');
}

function addGrade() {
    const i = document.getElementById('add-note');
    const v = Math.min(Math.max(parseFloat(i.value), 0), 15);
    if(isNaN(v)) return;
    data.find(x => x.id === activeId).notes.push(v);
    i.value = ''; save(); openDet(activeId);
}

function delGrade(i) {
    const s = data.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - i, 1);
    save(); openDet(activeId);
}

function askDelSubject() {
    openM("Fach wirklich löschen?", () => {
        data = data.filter(x => x.id !== activeId);
        save(); tab('list');
    });
}

function renderGoals() {
    const area = document.getElementById('goals-area');
    area.innerHTML = '';
    data.forEach(s => {
        area.innerHTML += `
            <div class="goal-item">
                <span>${s.name}</span>
                <div class="goal-input-box">
                    <span>ZIEL:</span>
                    <input type="number" min="0" max="15" value="${s.target}" onchange="updateGoal(${s.id}, this.value)">
                </div>
            </div>`;
    });
}

function updateGoal(id, val) {
    data.find(x => x.id === id).target = Math.min(Math.max(parseFloat(val), 0), 15);
    save();
}

function askReset() {
    openM("Gesamtes System löschen?", () => {
        localStorage.clear();
        location.reload();
    });
}

renderDash();