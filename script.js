let subjects = JSON.parse(localStorage.getItem('GF_ELITE')) || [];
let activeId = null;

// ENTER-KEY LOGIK
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (document.activeElement.id === 'sub-in') addSub();
        if (document.activeElement.id === 'grade-in') addGrade();
    }
});

function save() { localStorage.setItem('GF_ELITE', JSON.stringify(subjects)); }

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    document.getElementById('t-' + id).classList.add('active');
    
    if (id === 'dash') renderDash();
    if (id === 'goals') renderGoals();
    if (id === 'stats') renderStats();
}

function renderDash() {
    const grid = document.getElementById('grid');
    grid.innerHTML = subjects.map(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '-';
        return `
        <div class="bento-card" onclick="openSub(${s.id})">
            <h3>${s.name}</h3>
            <div class="val">${avg}</div>
            <small style="color:#444">${s.notes.length} Noten</small>
        </div>`;
    }).join('');
}

function addSub() {
    const input = document.getElementById('sub-in');
    if (!input.value) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [], target: 12 });
    input.value = ''; save(); renderDash();
}

function openSub(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    tab('det');
    document.getElementById('det-name').innerText = s.name;
    updateDetView();
}

function addGrade() {
    const input = document.getElementById('grade-in');
    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0 || val > 15) return;
    subjects.find(x => x.id === activeId).notes.push(val);
    input.value = ''; save(); updateDetView();
}

function updateDetView() {
    const s = subjects.find(x => x.id === activeId);
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '0.0';
    document.getElementById('det-avg').innerText = avg;
    document.getElementById('history').innerHTML = s.notes.map((n, i) => `
        <div class="h-item"><span>${n} Punkte</span><button onclick="delGrade(${i})">X</button></div>
    `).reverse().join('');
}

function renderGoals() {
    const grid = document.getElementById('goals-grid');
    grid.innerHTML = subjects.map(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : 0;
        const perc = Math.min((avg / s.target) * 100, 100);
        return `
        <div class="bento-card">
            <h3>${s.name}</h3>
            <div class="val">${avg.toFixed(1)} <span style="font-size:14px; color:#444">/ ${s.target}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${perc}%"></div></div>
        </div>`;
    }).join('');
}

function renderStats() {
    let totalGrades = 0;
    subjects.forEach(s => totalGrades += s.notes.length);
    document.getElementById('total-count').innerText = totalGrades;
    
    // Einfache Logik für Bestes Fach
    let best = { name: '-', avg: 0 };
    subjects.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : 0;
        if(avg > best.avg) best = { name: s.name, avg: avg };
    });
    document.getElementById('best-sub').innerText = best.name;
}

function delGrade(idx) {
    subjects.find(x => x.id === activeId).notes.splice(subjects.find(x => x.id === activeId).notes.length - 1 - idx, 1);
    save(); updateDetView();
}

function clearAll() { if(confirm('Alles löschen?')) { localStorage.clear(); location.reload(); } }

tab('dash');