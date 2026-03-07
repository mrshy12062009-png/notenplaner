/**
 * GRADEFLOW ARCHITECT OS - KERNEL V4.0.0
 * FULL SCALE ACADEMIC DATA PROCESSOR
 */

"use strict";

const Core = {
    state: {
        subjects: JSON.parse(localStorage.getItem('GF_OS_V4_DATA')) || [],
        activeID: null,
        sessionLogs: []
    },

    /** Initialisiert das System */
    init() {
        console.log("%c GF-OS Kernel Initialized ", "background: #00f2ff; color: #000; font-weight: bold;");
        this.sync();
        Router.init();
        NotificationEngine.push("System Secure. Ready for Operation.");
    },

    /** Datenpersistenz */
    sync() {
        localStorage.setItem('GF_OS_V4_DATA', JSON.stringify(this.state.subjects));
        this.updateGlobalMetrics();
    },

    /** Erstellt ein neues Fach mit Validierung */
    initNewSubject() {
        const name = prompt("Enter Subject Module Identifier:");
        if (!name || name.trim().length < 2) {
            NotificationEngine.push("Error: Invalid Module Name", "danger");
            return;
        }

        const newSubject = {
            uid: crypto.randomUUID(),
            name: name.trim(),
            entries: [],
            meta: {
                created: new Date().toISOString(),
                color: `hsl(${Math.random() * 360}, 60%, 50%)`
            }
        };

        this.state.subjects.push(newSubject);
        this.sync();
        this.renderDashboard();
        NotificationEngine.push(`Module [${name}] Virtualized.`);
    },

    /** Berechnet GPA und Statistiken */
    calculateGPA(notes) {
        if (!notes || notes.length === 0) return 0;
        const sum = notes.reduce((a, b) => a + b, 0);
        return (sum / notes.length).toFixed(1);
    },

    /** Dashboard Renderer */
    renderDashboard() {
        const grid = document.getElementById('dashboard-grid');
        grid.innerHTML = '';

        this.state.subjects.forEach(s => {
            const avg = this.calculateGPA(s.entries);
            const card = document.createElement('div');
            card.className = 'glass-morph subject-card-pro';
            card.style.borderLeft = `4px solid ${s.meta.color}`;
            card.onclick = () => this.bootSubjectModule(s.uid);
            
            card.innerHTML = `
                <div class="card-label">Module ID: ${s.uid.substring(0,8)}</div>
                <h2>${avg === 0 && s.entries.length === 0 ? '--' : avg}</h2>
                <div class="card-footer-os">
                    <strong>${s.name}</strong>
                    <p>${s.entries.length} Transaction(s)</p>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    /** Öffnet ein Fach im Detail-Modus */
    bootSubjectModule(uid) {
        this.state.activeID = uid;
        const subject = this.state.subjects.find(x => x.uid === uid);
        
        Router.push('details');
        document.getElementById('det-title-display').innerText = subject.name;
        document.getElementById('det-uuid').innerText = `KERNEL_PATH: //${subject.uid}`;
        
        this.renderSubjectDetails();
    },

    /** Schreibt eine neue Note in die "Chain" */
    pushNewGrade() {
        const input = document.getElementById('grade-input-field');
        const val = parseInt(input.value);

        if (isNaN(val) || val < 0 || val > 15) {
            NotificationEngine.push("Logic Error: Grade out of bounds (0-15)", "danger");
            return;
        }

        const subject = this.state.subjects.find(x => x.uid === this.state.activeID);
        subject.entries.push(val);
        
        input.value = '';
        this.sync();
        this.renderSubjectDetails();
        NotificationEngine.push("Data committed to Ledger.");
    },

    /** Rendert die Detailansicht mit Ring-Animation */
    renderSubjectDetails() {
        const subject = this.state.subjects.find(x => x.uid === this.state.activeID);
        const avg = this.calculateGPA(subject.entries);
        
        // Update Ring
        const ring = document.getElementById('score-ring-fill');
        const offset = 283 - (283 * (avg / 15));
        ring.style.strokeDashoffset = offset;
        document.getElementById('det-avg-display').innerText = avg;

        // Render History
        const stack = document.getElementById('history-stack');
        stack.innerHTML = subject.entries.map((n, i) => `
            <div class="history-item-os glass-morph">
                <div class="h-info">
                    <span class="h-p">#${i+1}</span>
                    <span class="h-v" style="color: ${this.getGradeColor(n)}">${n} Pkt</span>
                </div>
                <button onclick="Core.popGrade(${i})" class="btn-pop">VOID</button>
            </div>
        `).reverse().join('');
    },

    /** Rendert das Diagramm in der Analyse-Ansicht */
    renderAnalytics() {
        const chart = document.getElementById('distribution-chart');
        chart.innerHTML = '';
        
        const dist = new Array(16).fill(0);
        let totalGrades = [];
        
        this.state.subjects.forEach(s => s.entries.forEach(n => {
            dist[n]++;
            totalGrades.push(n);
        }));

        const maxCount = Math.max(...dist) || 1;
        dist.forEach((count, p) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar-unit';
            bar.style.height = `${(count / maxCount) * 100}%`;
            bar.style.backgroundColor = this.getGradeColor(p);
            bar.title = `Value ${p}: ${count} occurrences`;
            chart.appendChild(bar);
        });

        // KPI Update
        const avgGlobal = this.calculateGPA(totalGrades);
        document.getElementById('stat-avg-value').innerText = avgGlobal;
    },

    getGradeColor(p) {
        if (p >= 13) return '#00ffa3';
        if (p >= 10) return '#00f2ff';
        if (p >= 7) return '#ffaa00';
        return '#ff0055';
    },

    updateGlobalUI() {
        const usage = (JSON.stringify(this.state.subjects).length / 10000) * 100;
        document.getElementById('storage-load').style.width = usage + '%';
    }
};

/** Navigations-Logik */
const Router = {
    init() {
        this.push('dash');
    },
    push(viewID) {
        document.querySelectorAll('.view-module').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const target = document.getElementById(`view-${viewID}`);
        if(target) target.classList.add('active');
        
        const nav = document.getElementById(`nav-${viewID}`);
        if(nav) nav.classList.add('active');

        if(viewID === 'dash') Core.renderDashboard();
        if(viewID === 'stats') Core.renderAnalytics();
    }
};

/** Benachrichtigungs-System */
const NotificationEngine = {
    push(msg, type = "info") {
        const container = document.getElementById('notification-center');
        const toast = document.createElement('div');
        toast.className = `toast-os ${type}`;
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
};

// System Start
window.onload = () => Core.init();