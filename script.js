let subjects = JSON.parse(localStorage.getItem('GF_DATA_V9')) || [];
let currentSubjectId = null;

const save = () => localStorage.setItem('GF_DATA_V9', JSON.stringify(subjects));

// Farblogik
function getGradeStyle(points) {
    if (points === null || isNaN(points)) return { color: '#444', label: 'Keine Noten' };
    if (points >= 13) return { color: 'var(--c-high)', label: 'Sehr Gut' };
    if (points >= 8) return { color: 'var(--c-mid)', label: 'Befriedigend' };
    return { color: 'var(--c-low)', label: 'Ungenügend' };
}

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if(document.getElementById('tab-' + id)) document.getElementById('tab-' + id).classList.add('active');
    
    if(id === 'list') renderDashboard();
    if(id === 'goals') renderGoals();
}

function renderDashboard() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    let totalPoints = 0;
    let count = 0;

    subjects.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
        const style = getGradeStyle(avg);
        if(avg !== null) { totalPoints += avg; count++; }

        grid.innerHTML += `
            <div class="subject-card" onclick="openSubject(${s.id})">
                <small style="color: #666; font-weight: 800; text-transform: uppercase">${s.name}</small>
                <h2 style="color: ${style.color}">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div style="font-size: 12px; color: ${style.color}">${style.label}</div>
            </div>`;
    });
    document.getElementById('total-avg').innerText = count > 0 ? (totalPoints/count).toFixed(2) : '0.00';
}

function addSubject() {
    const input = document.getElementById('add-name');
    if(!input.value.trim()) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [], target: 10 });
    input.value = '';
    save(); renderDashboard();
}

function openSubject(id) {
    currentSubjectId = id;
    const s = subjects.find(x => x.id === id);
    tab('det');
    
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
    const style = getGradeStyle(avg);

    document.getElementById('det-header').style.background = `linear-gradient(180deg, ${style.color}22 0%, transparent 100%)`;
    document.getElementById('det-name').innerText = s.name;
    document.getElementById('det-num').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-num').style.color = style.color;
    document.getElementById('det-txt').innerText = style.label;
    document.getElementById('edit-target').value = s.target;

    const hist = document.getElementById('history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="history-item" style="border-left-color: ${getGradeStyle(n).color}">
            <span style="font-weight: 900; font-size: 18px">${n} Punkte</span>
            <button onclick="delGrade(${i})" style="background:none; border:none; color:#444; cursor:pointer">Löschen</button>
        </div>`).reverse().join('');
}

function addGrade() {
    const val = parseFloat(document.getElementById('add-note').value);
    if(isNaN(val) || val < 0 || val > 15) return;
    subjects.find(x => x.id === currentSubjectId).notes.push(val);
    document.getElementById('add-note').value = '';
    save(); openSubject(currentSubjectId);
}

function delGrade(index) {
    const s = subjects.find(x => x.id === currentSubjectId);
    s.notes.splice(s.notes.length - 1 - index, 1);
    save(); openSubject(currentSubjectId);
}

function updateTarget() {
    const val = parseFloat(document.getElementById('edit-target').value);
    subjects.find(x => x.id === currentSubjectId).target = val;
    save();
}

function renderGoals() {
    const area = document.getElementById('goals-area');
    area.innerHTML = '';
    subjects.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : 0;
        const progress = Math.min((avg / s.target) * 100, 100);
        area.innerHTML += `
            <div class="goal-item">
                <div>
                    <div style="font-weight: 900; font-size: 18px">${s.name}</div>
                    <div style="font-size: 12px; color: #555">Ziel: ${s.target} Pkt | Aktuell: ${avg.toFixed(1)}</div>
                </div>
                <div class="goal-badge" style="color: ${getGradeStyle(avg).color}">${progress.toFixed(0)}%</div>
            </div>`;
    });
}

function askDelSubject() {
    openM("Dieses Fach unwiderruflich löschen?", () => {
        subjects = subjects.filter(x => x.id !== currentSubjectId);
        save(); tab('list');
    });
}

function askReset() {
    openM("Alle Daten löschen?", () => {
        localStorage.clear();
        location.reload();
    });
}

function openM(msg, cb) {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('modal-overlay').classList.remove('modal-hide');
    document.getElementById('m-confirm').onclick = () => { cb(); closeM(); };
}
function closeM() { document.getElementById('modal-overlay').classList.add('modal-hide'); }

renderDashboard();