const S_KEY = 'gf_pro_v25';
const C_KEY = 'gf_conf_v25';

let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || { target: 11, accentColor: '#5865f2' };

window.onload = () => {
    document.getElementById('goal-input').value = config.target;
    showPage('list');
};

function getStatus(avg, subjectGoal) {
    if (!avg) return { color: 'neutral', class: '', label: 'Keine Noten' };
    const goal = subjectGoal || config.target;
    if (avg >= goal) return { color: 'success', class: 'bg-success', label: 'Ziel erreicht' };
    if (avg >= goal - 2) return { color: 'warning', class: 'bg-warning', label: 'Knapp darunter' };
    return { color: 'danger', class: 'bg-danger', label: 'Handlungsbedarf' };
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
    let totalSum = 0, count = 0;

    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg, f.customGoal);
        if(avg) { totalSum += avg; count++; }

        cont.innerHTML += `
            <div class="subject-card" style="border-left-color: var(--${status.color})" onclick="openDet(${f.id})">
                <small style="opacity:0.5">${f.name}</small>
                <h2 class="text-${status.color}" style="margin:5px 0">${avg ? avg.toFixed(1) : '-'}</h2>
                <div style="font-size:11px">Ziel: ${f.customGoal || config.target}</div>
            </div>`;
    });

    // Gesamtanalyse im Dashboard
    const totalAvg = count > 0 ? (totalSum / count) : 0;
    const globalStatus = getStatus(totalAvg);
    const analysisEl = document.getElementById('global-analysis-dash');
    
    document.getElementById('dash-total').innerText = totalAvg.toFixed(2);
    analysisEl.className = `total-status-card text-${globalStatus.color}`;
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getStatus(avg, f.customGoal);
    const goal = f.customGoal || config.target;

    // HEADER FÄRBEN
    const header = document.getElementById('det-header');
    header.className = `detail-hero ${status.class || ''}`;
    if(!status.class) header.style.background = 'var(--card)'; else header.style.background = '';

    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = status.label;

    // Analyse Text
    const diff = avg ? (avg - goal).toFixed(1) : 0;
    document.getElementById('det-analysis-text').innerHTML = avg ? 
        `Dein Schnitt ist <b>${avg.toFixed(1)}</b>. Dein Ziel liegt bei <b>${goal}</b>. <br><br> 
        <span class="text-${status.color}">${diff >= 0 ? '✅ Du bist ' + diff + ' über dem Ziel!' : '❌ Dir fehlen ' + Math.abs(diff) + ' zum Ziel.'}</span>` : 
        "Noch keine Noten eingetragen.";

    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="input-card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
            <span>Note: <b>${n}</b></span>
            <button class="btn-danger" onclick="deleteNote(${i})" style="padding:5px 10px">Löschen</button>
        </div>`).reverse().join('');
};

window.renderGoals = () => {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    let totalSum = 0, count = 0;

    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg, f.customGoal);
        if(avg) { totalSum += avg; count++; }

        cont.innerHTML += `
            <div class="input-card" style="display:flex; justify-content:space-between; cursor:pointer" onclick="openGoalModal(${f.id})">
                <span><b>${f.name}</b><br><small>Ziel: ${f.customGoal || config.target}</small></span>
                <span class="text-${status.color}" style="font-weight:bold">${avg ? avg.toFixed(1) : '-'}</span>
            </div>`;
    });

    const totalAvg = count > 0 ? (totalSum / count) : 0;
    const globalStatus = getStatus(totalAvg);
    const feedback = document.getElementById('total-goal-feedback');
    feedback.innerText = `Gesamtschnitt: ${totalAvg.toFixed(2)} (${globalStatus.label})`;
    feedback.className = `text-${globalStatus.color}`;
};

// ... Restliche Standard-Funktionen (addFach, addNote, save, etc.)
window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [], customGoal: null });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.addNote = () => {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val)) return;
    appData.find(x => x.id === window.curId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); openDet(window.curId);
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

window.updateGlobalGoal = (v) => { config.target = parseFloat(v) || 0; save(); renderGoals(); };
window.deleteNote = (i) => {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); openDet(window.curId);
};
window.deleteFach = () => { if(confirm("Löschen?")) { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); } };
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); localStorage.setItem(C_KEY, JSON.stringify(config)); }