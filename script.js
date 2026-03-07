let subjects = JSON.parse(localStorage.getItem('GF_ULTRA_V4')) || [];
let activeId = null;

const save = () => localStorage.setItem('GF_ULTRA_V4', JSON.stringify(subjects));

// Farblogik für die dynamischen Elemente
const getPktColor = (p) => {
    if (p >= 13) return '#10b981'; // Grün
    if (p >= 7) return '#f59e0b';  // Gelb
    return '#ef4444';              // Rot
};

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('view-' + id).classList.add('active');
    if(id !== 'det') document.getElementById('t-' + id).classList.add('active');
    
    if(id === 'dash') renderDash();
    if(id === 'stats') renderStats();
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = subjects.map(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '-';
        const color = avg === '-' ? '#fff' : getPktColor(avg);
        return `
            <div class="glass-card subject-card" onclick="openSub(${s.id})">
                <label>${s.name}</label>
                <div class="avg-val" style="color:${color}">${avg}</div>
                <div style="font-size:12px; color:#52525b">${s.notes.length} Einträge</div>
            </div>
        `;
    }).join('');
}

function addSub() {
    const input = document.getElementById('sub-in');
    if(!input.value.trim()) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [] });
    input.value = '';
    save();
    renderDash();
}

function openSub(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    tab('det');
    document.getElementById('det-name').innerText = s.name;
    updateDetailView();
}

function addGrade() {
    const input = document.getElementById('grade-in');
    const val = parseFloat(input.value);
    if(isNaN(val) || val < 0 || val > 15) return;
    subjects.find(x => x.id === activeId).notes.push(val);
    input.value = '';
    save();
    updateDetailView();
}

function updateDetailView() {
    const s = subjects.find(x => x.id === activeId);
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '0.0';
    const display = document.getElementById('det-avg');
    display.innerText = avg;
    display.style.color = getPktColor(avg);

    document.getElementById('history').innerHTML = s.notes.map((n, i) => `
        <div class="grade-item">
            <div class="grade-val"><span style="color:${getPktColor(n)}">${n}</span> <small>Punkte</small></div>
            <button class="btn-del-grade" onclick="delGrade(${i})">Löschen</button>
        </div>
    `).reverse().join('');
}

function renderStats() {
    const container = document.getElementById('bar-chart');
    container.innerHTML = '';
    const distribution = new Array(16).fill(0);
    let allGrades = [];

    subjects.forEach(s => s.notes.forEach(n => {
        distribution[Math.floor(n)]++;
        allGrades.push(n);
    }));

    const maxVal = Math.max(...distribution) || 1;

    distribution.forEach((count, pkt) => {
        const height = (count / maxVal) * 100;
        const color = getPktColor(pkt);
        const bar = document.createElement('div');
        bar.className = 'chart-bar-item';
        bar.style.height = `${Math.max(height, 2)}%`; // Mindesthöhe für Sichtbarkeit
        bar.style.backgroundColor = color;
        bar.style.boxShadow = `0 0 20px ${color}33`;
        bar.title = `${pkt} Punkte: ${count}x`;
        container.appendChild(bar);
    });

    const totalAvg = allGrades.length ? (allGrades.reduce((a,b)=>a+b,0)/allGrades.length).toFixed(2) : '0.00';
    document.getElementById('st-avg').innerText = totalAvg;
    document.getElementById('st-best').innerText = allGrades.length ? Math.max(...allGrades) : "-";
}

function delGrade(idx) {
    const s = subjects.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    save();
    updateDetailView();
}

function delSub() {
    subjects = subjects.filter(x => x.id !== activeId);
    save();
    tab('dash');
}

function fullReset() {
    if(confirm("Alle Daten löschen?")) {
        localStorage.clear();
        location.reload();
    }
}

// Enter-Key Event Listener
document.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        if(document.activeElement.id === 'sub-in') addSub();
        if(document.activeElement.id === 'grade-in') addGrade();
    }
});

tab('dash');