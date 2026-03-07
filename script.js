const S_KEY = 'gf_final_v21';
const C_KEY = 'gf_conf_v21';

let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || { target: 11, accentColor: '#5865f2' };

window.onload = () => {
    document.getElementById('goal-input').value = config.target;
    showPage('list');
};

window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id)?.classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
};

function getStatus(avg, subjectGoal) {
    if (!avg) return { color: 'neutral', class: '', label: 'KEINE DATEN' };
    const goal = subjectGoal || config.target;
    if (avg >= goal) return { color: 'success', class: 'bg-success', label: 'GUT' };
    if (avg >= goal - 2) return { color: 'warning', class: 'bg-warning', label: 'MITTEL' };
    return { color: 'danger', class: 'bg-danger', label: 'SCHLECHT' };
}

window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [], customGoal: null });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.renderDash = () => {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    let total = 0, count = 0;
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg, f.customGoal);
        if(avg) { total += avg; count++; }
        cont.innerHTML += `
            <div class="subject-card border-${status.color}" onclick="openDet(${f.id})">
                <small>${f.name}</small>
                <h2 class="text-${status.color}">${avg ? avg.toFixed(1) : '-'}</h2>
                <small>Ziel: ${f.customGoal || config.target}</small>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (total/count).toFixed(1) : '-';
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getStatus(avg, f.customGoal);
    
    // Header Färben!
    const header = document.getElementById('det-header');
    header.className = `detail-header ${status.class || 'bg-accent'}`;
    if (!status.class) header.style.backgroundColor = 'var(--accent)'; else header.style.backgroundColor = '';

    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg ? avg.toFixed(1) : '-';
    document.getElementById('det-status-label').innerText = status.label;
    
    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="input-card" style="display:flex; justify-content:space-between">
            <span>Note: ${n}</span>
            <button class="btn-danger" onclick="deleteNote(${i})">X</button>
        </div>`).reverse().join('');
};

window.addNote = () => {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val)) return;
    appData.find(x => x.id === window.curId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); openDet(window.curId);
};

window.renderGoals = () => {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg, f.customGoal);
        cont.innerHTML += `
            <div class="goal-row" onclick="openGoalModal(${f.id})">
                <span><b>${f.name}</b><br><small>Ziel: ${f.customGoal || config.target}</small></span>
                <span class="text-${status.color}">${avg ? avg.toFixed(1) : '-'}</span>
            </div>`;
    });
};

window.openGoalModal = (id) => {
    window.modalId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('modal-title').innerText = `Ziel für ${f.name}`;
    document.getElementById('modal-goal-input').value = f.customGoal || '';
    document.getElementById('goal-modal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('goal-modal').style.display = 'none';

window.saveSubjectGoal = () => {
    const val = parseFloat(document.getElementById('modal-goal-input').value);
    appData.find(x => x.id === window.modalId).customGoal = isNaN(val) ? null : val;
    save(); closeModal(); renderGoals();
};

window.updateGlobalGoal = (v) => { config.target = parseFloat(v) || 0; save(); };
window.deleteNote = (i) => {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); openDet(window.curId);
};
window.deleteFach = () => { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); };
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); localStorage.setItem(C_KEY, JSON.stringify(config)); }