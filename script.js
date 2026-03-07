let appData = JSON.parse(localStorage.getItem('gf_final_v8')) || [];
let userName = localStorage.getItem('gf_userName') || 'Schüler';
let activeFachId = null;

// Farben-Logik (0-15 Punkte)
function getStatusColor(points) {
    if (points >= 11) return '#22c55e'; // Grün
    if (points >= 5) return '#eab308';  // Gelb
    if (points > 0) return '#ef4444';   // Rot
    return '#5865f2';                   // Blau (Standard)
}

function showPage(pageId) {
    // 1. Alle Seiten verstecken
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // 2. Gewünschte Seite zeigen
    document.getElementById('page-' + pageId).classList.add('active');

    // 3. SIDEBAR FIX: Alle Buttons resetten, dann den richtigen markieren
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('nav-' + pageId);
    if (activeBtn) activeBtn.classList.add('active');

    // 4. Daten für die Seite laden
    document.getElementById('user-name-display').innerText = userName;
    if (pageId === 'list') renderGrid();
    if (pageId === 'stats') renderStats();
}

function renderStats() {
    let totalPoints = 0;
    let subjectCount = 0;
    let allNotesCount = 0;
    const statsDetails = document.getElementById('stats-details');
    statsDetails.innerHTML = '';

    appData.forEach(f => {
        if(f.notes.length > 0) {
            const avg = f.notes.reduce((a,b) => a+b, 0) / f.notes.length;
            totalPoints += avg;
            subjectCount++;
            allNotesCount += f.notes.length;
            
            statsDetails.innerHTML += `
                <div class="subject-card" style="border-left-color: ${getStatusColor(avg)}">
                    <h3>${f.name}</h3>
                    <p>Schnitt: ${avg.toFixed(2)} Punkte</p>
                </div>`;
        }
    });

    const finalAvg = subjectCount > 0 ? (totalPoints / subjectCount) : 0;
    
    // Stats-Zahlen im HTML füllen
    document.getElementById('total-avg').innerText = subjectCount > 0 ? finalAvg.toFixed(1) : '-';
    if(document.getElementById('total-count')) {
        document.getElementById('total-count').innerText = allNotesCount;
    }
    // Banner-Farbe der Stats anpassen
    const statsBanner = document.getElementById('stats-banner');
    if(statsBanner) statsBanner.style.background = getStatusColor(finalAvg);
}

function saveSettings() {
    const inputName = document.getElementById('set-name').value;
    if(inputName.trim() !== "") {
        userName = inputName;
        localStorage.setItem('gf_userName', userName);
        alert('Name gespeichert!');
        showPage('list'); // Zurück zum Dashboard
    }
}

function addFach() {
    const input = document.getElementById('f-name');
    if (!input.value.trim()) return;
    appData.push({ id: Date.now(), name: input.value, notes: [] });
    input.value = '';
    save(); renderGrid();
}

function deleteFach() {
    if(confirm('Dieses Fach wirklich löschen?')) {
        appData = appData.filter(x => x.id !== activeFachId);
        save(); showPage('list');
    }
}

function renderGrid() {
    const grid = document.getElementById('grid-container');
    grid.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
        const color = getStatusColor(avg);
        grid.innerHTML += `
            <div class="subject-card" onclick="openDetail(${f.id})" style="border-left-color: ${color}">
                <h3>${f.name}</h3>
                <div style="font-size:32px; font-weight:900; color:${color}">${f.notes.length ? avg.toFixed(1) : '-'}</div>
            </div>`;
    });
}

function openDetail(id) {
    activeFachId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('det-title').innerText = f.name;
    showPage('detail');
    renderDetail();
}

function addNote() {
    const val = parseFloat(document.getElementById('n-val').value);
    if (isNaN(val) || val < 0 || val > 15) return;
    appData.find(x => x.id === activeFachId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); renderDetail();
}

function renderDetail() {
    const f = appData.find(x => x.id === activeFachId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
    const color = getStatusColor(avg);
    document.getElementById('det-avg').innerText = f.notes.length ? avg.toFixed(1) : '-';
    document.getElementById('hero-banner').style.background = `linear-gradient(135deg, ${color}, #080a12)`;
    
    const list = document.getElementById('notes-history');
    list.innerHTML = '<h3>Notenverlauf</h3>';
    f.notes.slice().reverse().forEach(n => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom:10px; padding:15px; border-left-color:${getStatusColor(n)}">${n} Punkte</div>`;
    });
}

function resetAll() {
    if(confirm('Wirklich ALLES löschen?')) {
        localStorage.clear();
        location.reload();
    }
}

function save() { localStorage.setItem('gf_final_v8', JSON.stringify(appData)); }

// Beim Start
showPage('list');