let subjects = JSON.parse(localStorage.getItem('GF_ULTRA_V5')) || [];
let activeId = null;

const save = () => localStorage.setItem('GF_ULTRA_V5', JSON.stringify(subjects));

// Farblogik für Notenpunkte
const getScoreColor = (p) => {
    if (p >= 13) return '#10b981'; // Grün
    if (p >= 10) return '#84cc16'; // Hellgrün
    if (p >= 7) return '#f59e0b';  // Gelb
    if (p >= 5) return '#f97316';  // Orange
    return '#ef4444';              // Rot
};

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById('view-' + id).classList.add('active');
    if(id !== 'det') document.getElementById('t-' + id).classList.add('active');
    
    if(id === 'dash') renderDash();
    if(id === 'stats') renderStats();
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = subjects.map(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '-';
        return `
            <div class="glass subject-card" onclick="openSub(${s.id})">
                <label>${s.name}</label>
                <h2 style="color:${avg === '-' ? '#fff' : getScoreColor(avg)}">${avg}</h2>
                <div style="font-size:12px; color:var(--text-muted)">${s.notes.length} Einzelnoten</div>
            </div>
        `;
    }).join('');
}

function addSub() {
    const i = document.getElementById('sub-in');
    if(!i.value.trim()) return;
    subjects.push({ id: Date.now(), name: i.value, notes: [] });
    i.value = ''; save(); renderDash();
}

function openSub(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    tab('det');
    document.getElementById('det-name').innerText = s.name;
    updateDetailView();
}

function addGrade() {
    const i = document.getElementById('grade-in');
    const v = parseFloat(i.value);
    if(isNaN(v) || v < 0 || v > 15) return;
    subjects.find(x => x.id === activeId).notes.push(v);
    i.value = ''; save(); updateDetailView();
}

function updateDetailView() {
    const s = subjects.find(x => x.id === activeId);
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '0.0';
    const display = document.getElementById('det-avg');
    display.innerText = avg;
    display.parentElement.style.borderColor = getScoreColor(avg);

    document.getElementById('history').innerHTML = s.notes.map((n, i) => `
        <div class="history-item">
            <div class="h-val"><span style="color:${getScoreColor(n)}">${n}</span> <small>Pkt</small></div>
            <button class="btn-del-mini" onclick="delGrade(${i})">Entfernen</button>
        </div>
    `).reverse().join('');
}

function renderStats() {
    const chart = document.getElementById('bar-chart');
    chart.innerHTML = '';
    const distribution = new Array(16).fill(0);
    let allGrades = [];

    subjects.forEach(s => s.notes.forEach(n => {
        distribution[Math.floor(n)]++;
        allGrades.push(n);
    }));

    const maxOccurence = Math.max(...distribution) || 1;

    distribution.forEach((count, pkt) => {
        const height = (count / maxOccurence) * 100;
        const bar = document.createElement('div');
        bar.className = 'bar-unit';
        bar.style.height = `${Math.max(height, 2)}%`;
        bar.style.backgroundColor = getScoreColor(pkt);
        bar.title = `${pkt} Punkte: ${count} mal`;
        chart.appendChild(bar);
    });

    document.getElementById('st-avg').innerText = allGrades.length ? (allGrades.reduce((a,b)=>a+b,0)/allGrades.length).toFixed(2) : '0.00';
    document.getElementById('st-best').innerText = allGrades.length ? Math.max(...allGrades) : "-";
}

function delGrade(idx) {
    const s = subjects.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    save(); updateDetailView();
}

function delSub() { subjects = subjects.filter(x => x.id !== activeId); save(); tab('dash'); }

// MODAL CONTROLS
function openResetModal() { document.getElementById('modal-reset').classList.add('open'); }
function closeResetModal() { document.getElementById('modal-reset').classList.remove('open'); }
function executeReset() { localStorage.clear(); location.reload(); }

tab('dash');