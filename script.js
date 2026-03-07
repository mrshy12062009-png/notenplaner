let appData = JSON.parse(localStorage.getItem('gf_v13_data')) || [];
let config = JSON.parse(localStorage.getItem('gf_v13_config')) || {
    userName: 'Schüler',
    accentColor: '#5865f2',
    usePoints: true
};
let activeFachId = null;
let myChart = null;

// Design laden
document.documentElement.style.setProperty('--accent', config.accentColor);

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(document.getElementById('nav-' + id)) document.getElementById('nav-' + id).classList.add('active');

    if(id === 'list') renderGrid();
    if(id === 'stats') renderStats();
    if(id === 'settings') {
        document.getElementById('set-name').value = config.userName;
        document.getElementById('set-system').value = config.usePoints ? 'points' : 'grades';
    }
    document.getElementById('user-name-display').innerText = config.userName;
}

function saveSettings() {
    config.userName = document.getElementById('set-name').value;
    config.usePoints = document.getElementById('set-system').value === 'points';
    localStorage.setItem('gf_v13_config', JSON.stringify(config));
    location.reload();
}

function changeTheme(color) {
    config.accentColor = color;
    localStorage.setItem('gf_v13_config', JSON.stringify(config));
    document.documentElement.style.setProperty('--accent', color);
}

function addFach() {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [] });
    document.getElementById('f-name').value = '';
    save(); renderGrid();
}

function openDetail(id) {
    activeFachId = id;
    showPage('detail');
    renderDetail();
}

function addNote() {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val)) return;
    const fach = appData.find(f => f.id === activeFachId);
    fach.notes.push(val);
    document.getElementById('n-val').value = '';
    save(); renderDetail();
}

function renderDetail() {
    const fach = appData.find(f => f.id === activeFachId);
    document.getElementById('det-title').innerText = fach.name;
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/fach.notes.length).toFixed(1) : '-';
    document.getElementById('det-avg').innerText = avg;
    
    const h = document.getElementById('notes-history');
    h.innerHTML = '';
    fach.notes.slice().reverse().forEach(n => {