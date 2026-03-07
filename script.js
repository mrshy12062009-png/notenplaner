let subjects = JSON.parse(localStorage.getItem('GF_DATA')) || [];
let activeId = null;

function save() {
    localStorage.setItem('GF_DATA', JSON.stringify(subjects));
}

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('nav-active'));
    if(id !== 'det') document.getElementById('t-' + id).classList.add('nav-active');

    if(id === 'dash') renderDash();
    if(id === 'goals') renderGoals();
}

function renderDash() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    let sum = 0, count = 0;

    subjects.forEach(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : null;
        if(avg !== null) { sum += avg; count++; }

        grid.innerHTML += `
            <div class="card-sub" onclick="openSub(${s.id})">
                <small>${s.name.toUpperCase()}</small>
                <h2>${avg !== null ? avg.toFixed(1) : '-'}</h2>
            </div>`;
    });
    document.getElementById('total-avg').innerText = count > 0 ? (sum/count).toFixed(2) : '0.0';
}

function addSub() {
    const input = document.getElementById('sub-in');
    if(!input.value.trim()) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [], target: 10 });
    input.value = '';
    save(); renderDash();
}

function openSub(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    tab('det');
    
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length) : 0;
    document.getElementById('det-name').innerText = s.name;
    document.getElementById('det-avg').innerText = avg > 0 ? avg.toFixed(1) : '0.0';

    const hist = document.getElementById('history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="hist-item">
            <span>${n} Punkte</span>
            <button onclick="delGrade(${i})" style="color:red; background:none; border:none;">X</button>
        </div>`).reverse().join('');
}

function addGrade() {
    const input = document.getElementById('grade-in');
    const val = parseFloat(input.value);
    if(isNaN(val) || val < 0 || val > 15) return;
    
    subjects.find(x => x.id === activeId).notes.push(val);
    input.value = '';
    save(); openSub(activeId);
}

function delGrade(idx) {
    const s = subjects.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - idx, 1);
    save(); openSub(activeId);
}

function delSub() {
    subjects = subjects.filter(x => x.id !== activeId);
    save(); tab('dash');
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = subjects.map(s => `
        <div class="card" style="display:flex; justify-content:space-between;">
            <span>${s.name}</span>
            <b>Ziel: ${s.target} Pkt</b>
        </div>`).join('');
}

// Start
renderDash();