let subjects = JSON.parse(localStorage.getItem('GF_V3')) || [];
let activeId = null;

const save = () => localStorage.setItem('GF_V3', JSON.stringify(subjects));
const getC = (n) => n >= 13 ? 'var(--g)' : n >= 7 ? 'var(--y)' : 'var(--r)';

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if(id !== 'det') document.getElementById('t-' + id).classList.add('active');
    if(id === 'dash') renderDash();
    if(id === 'stats') renderStats();
}

function renderDash() {
    const g = document.getElementById('dash-grid');
    g.innerHTML = subjects.map(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '-';
        return `<div class="card" onclick="openSub(${s.id})"><small style="color:var(--muted)">${s.name}</small><h2 style="color:${avg==='-'?'#fff':getC(avg)}">${avg}</h2></div>`;
    }).join('');
}

function addSub() {
    const i = document.getElementById('sub-in');
    if(!i.value) return;
    subjects.push({ id: Date.now(), name: i.value, notes: [] });
    i.value = ''; save(); renderDash();
}

function openSub(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    tab('det');
    document.getElementById('det-name').innerText = s.name;
    updateDet();
}

function addGrade() {
    const i = document.getElementById('grade-in');
    const v = parseFloat(i.value);
    if(isNaN(v) || v<0 || v>15) return;
    subjects.find(x => x.id === activeId).notes.push(v);
    i.value = ''; save(); updateDet();
}

function updateDet() {
    const s = subjects.find(x => x.id === activeId);
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '0.0';
    document.getElementById('det-avg').innerText = avg;
    document.getElementById('det-avg').style.color = getC(avg);
    document.getElementById('history').innerHTML = s.notes.map((n, idx) => `
        <div class="h-item">
            <b style="color:${getC(n)}">${n} Punkte</b>
            <button class="del-g" onclick="delG(${idx})">Löschen</button>
        </div>`).reverse().join('');
}

function renderStats() {
    const chart = document.getElementById('bar-chart');
    chart.innerHTML = '';
    const dist = new Array(16).fill(0);
    let all = [];
    subjects.forEach(s => s.notes.forEach(n => { dist[Math.floor(n)]++; all.push(n); }));
    const max = Math.max(...dist) || 1;
    dist.forEach((v, i) => {
        const h = (v / max) * 100;
        chart.innerHTML += `<div class="bar" style="height:${h}%; background:${getC(i)}"></div>`;
    });
    document.getElementById('st-avg').innerText = all.length ? (all.reduce((a,b)=>a+b,0)/all.length).toFixed(2) : '0.0';
    document.getElementById('st-best').innerText = all.length ? Math.max(...all) : '-';
}

function delG(idx) {
    const s = subjects.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    save(); updateDet();
}

function delSub() { subjects = subjects.filter(x => x.id !== activeId); save(); tab('dash'); }
function fullReset() { if(confirm('Alles löschen?')) { localStorage.clear(); location.reload(); } }

tab('dash');