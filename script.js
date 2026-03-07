const DB_VERSION = 'gf_pro_v8_final';
let appData = JSON.parse(localStorage.getItem(DB_VERSION)) || [];

window.onload = () => { renderDash(); };

function getColor(avg, target) {
    if (avg === null) return { grad: 'var(--grad-empty)', label: 'KEINE DATEN', hex: '#334155' };
    const goal = target || 15;
    if (avg >= goal) return { grad: 'var(--grad-green)', label: 'ZIEL ERREICHT', hex: '#10b981' };
    if (avg >= goal * 0.7) return { grad: 'var(--grad-yellow)', label: 'KNAPP DRAN', hex: '#f59e0b' };
    return { grad: 'var(--grad-red)', label: 'UNTER ZIEL', hex: '#ef4444' };
}

window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id)?.classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
};

window.renderDash = () => {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    let totalAvg = 0, count = 0;

    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const style = getColor(avg, f.target);
        if(avg !== null) { totalAvg += avg; count++; }

        cont.innerHTML += `
            <div class="subject-card" style="background: ${style.grad}" onclick="openDet(${f.id})">
                <h3>${f.name}</h3>
                <div class="score">${avg !== null ? avg.toFixed(1) : '-'}</div>
                <div style="font-weight:bold; opacity:0.8">Ziel: ${f.target || 15}</div>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (totalAvg/count).toFixed(2) : '-';
};

window.renderGoals = () => {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : 0;
        const target = f.target || 15;
        const percent = Math.min((avg / target) * 100, 100);
        const style = getColor(avg, target);

        cont.innerHTML += `
            <div class="goal-card-huge">
                <div class="goal-header-flex">
                    <div>
                        <div class="goal-title">${f.name}</div>
                        <div style="color: #94a3b8">Schnitt: ${avg.toFixed(1)} / Ziel: ${target}</div>
                    </div>
                    <div style="font-size: 40px; font-weight: 900">${Math.round(percent)}%</div>
                </div>
                <div class="progress-track-massive">
                    <div class="progress-bar-massive" style="width:${percent}%; background:${style.grad}; box-shadow: 0 0 20px ${style.hex}"></div>
                </div>
            </div>`;
    });
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const style = getColor(avg, f.target);

    const header = document.getElementById('det-header');
    header.style.background = style.grad;
    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = style.label;
    document.getElementById('f-target-input').value = f.target || 15;

    const list = document.getElementById('notes-list');
    list.innerHTML = f.notes.map((n, i) => `
        <div class="glass-input-card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:20px">
            <span style="font-size:20px; font-weight:bold">Note: ${n}</span>
            <button onclick="deleteNote(${i})" style="color:#ef4444; background:none; border:none; cursor:pointer; font-weight:bold">ENTFERNEN</button>
        </div>`).reverse().join('');
};

window.addFach = () => {
    const n = document.getElementById('f-name').value;
    if(!n) return;
    appData.push({ id: Date.now(), name: n, notes: [], target: 15 });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.saveFachTarget = () => {
    const f = appData.find(x => x.id === window.curId);
    f.target = parseFloat(document.getElementById('f-target-input').value) || 0;
    save(); openDet(f.id);
};

window.addNote = () => {
    const v = parseFloat(document.getElementById('n-val').value);
    if(isNaN(v)) return;
    appData.find(x => x.id === window.curId).notes.push(v);
    document.getElementById('n-val').value = '';
    save(); openDet(window.curId);
};

window.deleteNote = (i) => {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); openDet(window.curId);
};

window.deleteFach = () => { if(confirm("Löschen?")) { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); } };
function save() { localStorage.setItem(DB_VERSION, JSON.stringify(appData)); }
window.resetAll = () => { localStorage.clear(); location.reload(); };