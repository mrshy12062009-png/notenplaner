let subjects = JSON.parse(localStorage.getItem('GF_INTEL_V1')) || [];
let activeId = null;

// GLOBAL ENTER LISTENER
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (document.activeElement.id === 'sub-in') addSub();
        if (document.activeElement.id === 'grade-in') addGrade();
    }
});

const save = () => localStorage.setItem('GF_INTEL_V1', JSON.stringify(subjects));

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
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = subjects.map(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '-';
        return `
        <div class="card" onclick="openSub(${s.id})">
            <div class="label">${s.name}</div>
            <div class="val" style="color:${avg >= 10 ? '#8b5cf6' : '#fff'}">${avg}</div>
            <div style="font-size:11px; color:#444">${s.notes.length} Einträge</div>
        </div>`;
    }).join('');
}

function addSub() {
    const input = document.getElementById('sub-in');
    if (!input.value.trim()) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [], target: 12 });
    input.value = ''; save(); renderDash();
}

function openSub(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    tab('det');
    document.getElementById('det-name').innerText = s.name;
    updateDet();
}

function addGrade() {
    const input = document.getElementById('grade-in');
    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0 || val > 15) return;
    subjects.find(x => x.id === activeId).notes.push(val);
    input.value = ''; save(); updateDet();
}

function updateDet() {
    const s = subjects.find(x => x.id === activeId);
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '0.0';
    document.getElementById('det-avg').innerText = avg;
    document.getElementById('history').innerHTML = s.notes.map((n, i) => `
        <div class="h-row"><b>${n} Pkt</b><button onclick="delGrade(${i})" style="color:red; background:none; padding:0">Löschen</button></div>
    `).reverse().join('');
}

function renderGoals() {
    const grid = document.getElementById('goals-grid');
    grid.innerHTML = subjects.map(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : 0;
        const perc = Math.min((avg / s.target) * 100, 100);
        return `
        <div class="card">
            <div class="label">${s.name}</div>
            <div class="val">${avg.toFixed(1)} <span style="font-size:14px; color:#333">/ ${s.target}</span></div>
            <div class="progress-ring"><div class="progress-fill" style="width:${perc}%"></div></div>
        </div>`;
    }).join('');
}

function renderStats() {
    const chart = document.getElementById('dist-chart');
    chart.innerHTML = '';
    const distribution = new Array(16).fill(0);
    let allNotes = [];
    
    subjects.forEach(s => s.notes.forEach(n => {
        distribution[Math.floor(n)]++;
        allNotes.push(n);
    }));

    const max = Math.max(...distribution) || 1;
    distribution.forEach((count, i) => {
        const h = (count / max) * 100;
        chart.innerHTML += `<div class="bar-item" style="height:${h}%" title="${i} Punkte: ${count}x"></div>`;
    });

    const totalAvg = allNotes.length ? (allNotes.reduce((a,b)=>a+b,0)/allNotes.length).toFixed(2) : '0.0';
    document.getElementById('s-avg').innerText = totalAvg;
    document.getElementById('s-best').innerText = allNotes.length ? Math.max(...allNotes) : '-';
}

function delGrade(idx) {
    subjects.find(x => x.id === activeId).notes.splice(subjects.find(x => x.id === activeId).notes.length - 1 - idx, 1);
    save(); updateDet();
}

function fullReset() { if(confirm('Sicher?')) { localStorage.clear(); location.reload(); } }

tab('dash');