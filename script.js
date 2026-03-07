let subjects = JSON.parse(localStorage.getItem('GF_ELITE_FINAL')) || [];
let activeId = null;

const save = () => localStorage.setItem('GF_ELITE_FINAL', JSON.stringify(subjects));

// Dynamische Farbpalette für Noten (0-15)
const getDynamicColor = (p) => {
    if (p >= 13) return '#10b981'; // Grün
    if (p >= 10) return '#84cc16'; // Hellgrün
    if (p >= 7) return '#f59e0b';  // Orange
    if (p >= 5) return '#f97316';  // Dunkelorange
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
        const color = avg === '-' ? '#fff' : getDynamicColor(avg);
        return `
            <div class="glass-card subject-card" onclick="openSub(${s.id})">
                <label>${s.name}</label>
                <h2 style="color:${color}">${avg}</h2>
                <div style="font-size:13px; color:var(--text-secondary)">${s.notes.length} Einzelnoten</div>
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
    updateDetail();
}

function addGrade() {
    const i = document.getElementById('grade-in');
    const v = parseFloat(i.value);
    if(isNaN(v) || v < 0 || v > 15) return;
    subjects.find(x => x.id === activeId).notes.push(v);
    i.value = ''; save(); updateDetail();
}

function updateDetail() {
    const s = subjects.find(x => x.id === activeId);
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '0.0';
    const display = document.getElementById('det-avg');
    display.innerText = avg;
    display.style.color = getDynamicColor(avg);

    document.getElementById('history').innerHTML = s.notes.map((n, idx) => `
        <div class="grade-entry">
            <div class="grade-info"><span style="color:${getDynamicColor(n)}">${n}</span> <small style="font-size:12px; color:var(--text-secondary)">Pkt</small></div>
            <button class="btn-del-mini" onclick="delGrade(${idx})">Löschen</button>
        </div>
    `).reverse().join('');
}

function renderStats() {
    const chart = document.getElementById('bar-chart');
    chart.innerHTML = '';
    const distribution = new Array(16).fill(0);
    let all = [];

    subjects.forEach(s => s.notes.forEach(n => {
        distribution[Math.floor(n)]++;
        all.push(n);
    }));

    const max = Math.max(...distribution) || 1;

    distribution.forEach((count, pkt) => {
        const height = (count / max) * 100;
        const color = getDynamicColor(pkt);
        const bar = document.createElement('div');
        bar.className = 'bar-obj';
        bar.style.height = `${Math.max(height, 2)}%`;
        bar.style.backgroundColor = color;
        bar.style.boxShadow = `0 0 15px ${color}44`;
        bar.title = `${count} Mal ${pkt} Punkte`;
        chart.appendChild(bar);
    });

    document.getElementById('st-avg').innerText = all.length ? (all.reduce((a,b)=>a+b,0)/all.length).toFixed(2) : '0.00';
    document.getElementById('st-best').innerText = all.length ? Math.max(...all) + " Pkt" : "-";
}

function delGrade(idx) {
    const s = subjects.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    save(); updateDetail();
}

function delSub() { subjects = subjects.filter(x => x.id !== activeId); save(); tab('dash'); }

// RESET MODAL LOGIC
function openReset() { document.getElementById('modal-reset').classList.add('open'); }
function closeReset() { document.getElementById('modal-reset').classList.remove('open'); }
function executeReset() { localStorage.clear(); location.reload(); }

tab('dash');