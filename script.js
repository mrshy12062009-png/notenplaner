let appData = JSON.parse(localStorage.getItem('GF_PRO_STABLE_V6')) || [];
let currentSubjectId = null;
let modalCallback = null;

const save = () => localStorage.setItem('GF_PRO_STABLE_V6', JSON.stringify(appData));

// WEBSITE POPUP LOGIK (Kein Chrome mehr)
function openM(msg, callback) {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('modal-overlay').classList.remove('modal-hide');
    modalCallback = callback;
}
function closeM() { document.getElementById('modal-overlay').classList.add('modal-hide'); }
document.getElementById('m-confirm').onclick = () => { if(modalCallback) modalCallback(); closeM(); };

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if(document.getElementById('tab-' + id)) document.getElementById('tab-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
}

function getStat(avg, target) {
    if (avg === null) return { g: 'var(--card)', t: 'KEINE DATEN' };
    return avg >= (target || 10) ? { g: 'var(--blue)', t: 'IM ZIEL' } : { g: 'var(--red)', t: 'DRUNTER' };
}

function renderDash() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    let totalAvg = 0, count = 0;

    appData.forEach(s => {
        const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
        const stat = getStat(avg, s.target);
        if(avg !== null) { totalAvg += avg; count++; }
        const fill = avg !== null ? Math.min((avg / 15) * 100, 100) : 0;

        grid.innerHTML += `
            <div class="subject-card" onclick="openDet(${s.id})">
                <span class="name-label">${s.name}</span>
                <h2 style="color: ${avg !== null ? '#fff' : '#222'}">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div class="prog-bar">
                    <div class="prog-fill" style="width: ${fill}%; background: ${stat.g}"></div>
                </div>
            </div>`;
    });
    document.getElementById('total-avg').innerText = count > 0 ? (totalAvg/count).toFixed(2) : '0.0';
}

function addSubject() {
    const input = document.getElementById('add-name');
    if(!input.value.trim()) return;
    appData.push({ id: Date.now(), name: input.value, notes: [], target: 10 });
    input.value = ''; save(); renderDash();
}

function openDet(id) {
    currentSubjectId = id;
    const s = appData.find(x => x.id === id);
    tab('det');
    const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
    const stat = getStat(avg, s.target);

    document.getElementById('det-bg').style.background = stat.g;
    document.getElementById('det-name').innerText = s.name;
    document.getElementById('det-num').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-txt').innerText = stat.t;

    const hist = document.getElementById('history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="card-input" style="display:flex; justify-content:space-between; margin-bottom:10px; padding:15px">
            <b>${n} Punkte</b>
            <button onclick="delGrade(${i})" style="color:#f43f5e; background:none; border:none; cursor:pointer; font-weight:bold">Löschen</button>
        </div>`).reverse().join('');
}

function addGrade() {
    const input = document.getElementById('add-note');
    const val = Math.min(Math.max(parseFloat(input.value), 0), 15);
    if(isNaN(val)) return;
    appData.find(x => x.id === currentSubjectId).notes.push(val);
    input.value = ''; save(); openDet(currentSubjectId);
}

function delGrade(i) {
    const s = appData.find(x => x.id === currentSubjectId);
    s.notes.splice(s.notes.length - 1 - i, 1);
    save(); openDet(currentSubjectId);
}

function askDelSubject() {
    openM("Dieses Fach wirklich löschen?", () => {
        appData = appData.filter(x => x.id !== currentSubjectId);
        save(); tab('list');
    });
}

function renderGoals() {
    const area = document.getElementById('goals-area');
    area.innerHTML = '';
    appData.forEach(s => {
        area.innerHTML += `
            <div class="goal-item">
                <span style="font-weight:900; font-size:18px">${s.name}</span>
                <input type="number" min="0" max="15" value="${s.target}" onchange="updateGoal(${s.id}, this.value)">
            </div>`;
    });
}

function updateGoal(id, val) {
    appData.find(x => x.id === id).target = Math.min(Math.max(parseFloat(val), 0), 15);
    save();
}

function askReset() {
    openM("Wirklich alle Daten löschen?", () => {
        localStorage.clear();
        location.reload();
    });
}

renderDash();