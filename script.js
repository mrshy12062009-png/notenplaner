(() => {
    "use strict";

    const STORAGE_KEYS = {
        subjects: "gf_data",
        events: "gf_events"
    };
    const SCHEMA_VERSION = 2;

    const PRIORITY_LABELS = {
        high: "Hoch",
        medium: "Mittel",
        low: "Niedrig"
    };

    const DEFAULT_EVENTS_SEED = {
        "2026-01-12": [{ id: "seed-1", text: "Präsentationsprüfung", priority: "high", seed: true }],
        "2026-03-09": [{ id: "seed-2", text: "Englisch Mündlich", priority: "medium", seed: true }],
        "2026-04-21": [{ id: "seed-3", text: "MSA Deutsch", priority: "high", seed: true }],
        "2026-04-29": [{ id: "seed-4", text: "MSA Mathe", priority: "high", seed: true }],
        "2026-05-05": [{ id: "seed-5", text: "MSA Englisch", priority: "high", seed: true }]
    };

    const state = {
        viewPage: "list",
        viewDate: new Date(),
        currentSubjectId: null,
        editing: {
            subjectId: null,
            noteId: null,
            eventId: null
        },
        subjectsStore: loadSubjectsStore(),
        eventsStore: loadEventsStore()
    };

    const els = {
        pages: document.querySelectorAll(".page"),
        navButtons: document.querySelectorAll(".nav-btn"),
        subjectsGrid: document.getElementById("subjects-grid"),
        subjectForm: document.getElementById("subject-form"),
        subjectNameInput: document.getElementById("subject-name"),
        subjectSubmit: document.getElementById("subject-submit"),
        subjectFeedback: document.getElementById("subject-feedback"),

        detailHeading: document.getElementById("detail-heading"),
        detailAverage: document.getElementById("detail-average"),
        backDashboard: document.getElementById("back-dashboard"),
        noteForm: document.getElementById("note-form"),
        noteIdInput: document.getElementById("note-id"),
        noteFormTitle: document.getElementById("note-form-title"),
        noteValueInput: document.getElementById("note-value"),
        noteSubmit: document.getElementById("note-submit"),
        noteCancel: document.getElementById("note-cancel"),
        noteFeedback: document.getElementById("note-feedback"),
        noteList: document.getElementById("note-list"),

        monthName: document.getElementById("month-name"),
        monthPrev: document.getElementById("month-prev"),
        monthNext: document.getElementById("month-next"),
        calendarGrid: document.getElementById("calendar-grid"),
        eventList: document.getElementById("event-list"),
        eventForm: document.getElementById("event-form"),
        eventFormTitle: document.getElementById("event-form-title"),
        eventIdInput: document.getElementById("event-id"),
        eventDateInput: document.getElementById("event-date"),
        eventTextInput: document.getElementById("event-text"),
        eventPriorityInput: document.getElementById("event-priority"),
        eventSubmit: document.getElementById("event-submit"),
        eventCancel: document.getElementById("event-cancel"),
        eventFeedback: document.getElementById("event-feedback")
    };

    init();

    function init() {
        bindEvents();
        showPage("list");
        renderAll();
    }

    function bindEvents() {
        els.navButtons.forEach((button) => {
            button.addEventListener("click", () => showPage(button.dataset.page));
        });

        els.subjectForm.addEventListener("submit", onSubjectSubmit);

        els.subjectsGrid.addEventListener("click", (event) => {
            const action = event.target.dataset.action;
            const subjectId = event.target.dataset.id;
            if (!action || !subjectId) return;

            if (action === "open") {
                openSubject(subjectId);
            } else if (action === "edit") {
                startEditSubject(subjectId);
            } else if (action === "delete") {
                deleteSubject(subjectId);
            }
        });

        els.backDashboard.addEventListener("click", () => showPage("list"));
        els.noteForm.addEventListener("submit", onNoteSubmit);
        els.noteCancel.addEventListener("click", resetNoteForm);

        els.noteList.addEventListener("click", (event) => {
            const action = event.target.dataset.action;
            const noteId = event.target.dataset.id;
            if (!action || !noteId) return;

            if (action === "edit-note") {
                startEditNote(noteId);
            } else if (action === "delete-note") {
                deleteNote(noteId);
            }
        });

        els.monthPrev.addEventListener("click", () => {
            state.viewDate.setMonth(state.viewDate.getMonth() - 1);
            renderCalendar();
            renderEventList();
        });

        els.monthNext.addEventListener("click", () => {
            state.viewDate.setMonth(state.viewDate.getMonth() + 1);
            renderCalendar();
            renderEventList();
        });

        els.eventForm.addEventListener("submit", onEventSubmit);
        els.eventCancel.addEventListener("click", resetEventForm);

        els.eventList.addEventListener("click", (event) => {
            const action = event.target.dataset.action;
            const date = event.target.dataset.date;
            const eventId = event.target.dataset.id;
            if (!action || !date || !eventId) return;

            if (action === "edit-event") {
                startEditEvent(date, eventId);
            } else if (action === "delete-event") {
                deleteEvent(date, eventId);
            }
        });
    }

    function renderAll() {
        renderSubjects();
        renderSubjectDetail();
        renderCalendar();
        renderEventList();
    }

    function showPage(pageId) {
        state.viewPage = pageId;

        els.pages.forEach((page) => {
            page.classList.toggle("is-active", page.id === `page-${pageId}`);
        });

        els.navButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.page === (pageId === "detail" ? "list" : pageId));
        });
    }

    function createEmptyState(text) {
        return `<div class="empty-state">${escapeHtml(text)}</div>`;
    }

    function renderSubjects() {
        const subjects = state.subjectsStore.subjects;

        if (!subjects.length) {
            els.subjectsGrid.innerHTML = createEmptyState("Noch keine Fächer vorhanden. Lege dein erstes Fach an.");
            return;
        }

        els.subjectsGrid.innerHTML = subjects
            .map((subject) => {
                const avg = calculateAverage(subject.notes);
                return `
                    <article class="card">
                        <h3>${escapeHtml(subject.name)}</h3>
                        <p class="card-value">${avg ?? "--"}</p>
                        <div class="card-actions">
                            <button class="btn btn-primary" data-action="open" data-id="${subject.id}" type="button">Öffnen</button>
                            <button class="btn btn-ghost" data-action="edit" data-id="${subject.id}" type="button">Bearbeiten</button>
                            <button class="btn btn-ghost" data-action="delete" data-id="${subject.id}" type="button">Löschen</button>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    function renderSubjectDetail() {
        const subject = getCurrentSubject();
        if (!subject) {
            els.detailHeading.textContent = "Fachdetails";
            els.detailAverage.textContent = "Schnitt: -";
            els.noteList.innerHTML = createEmptyState("Wähle zuerst ein Fach im Dashboard.");
            return;
        }

        els.detailHeading.textContent = subject.name;
        const avg = calculateAverage(subject.notes);
        els.detailAverage.textContent = `Schnitt: ${avg ?? "--"}`;

        if (!subject.notes.length) {
            els.noteList.innerHTML = createEmptyState("Noch keine Noten gespeichert.");
            return;
        }

        const sortedNotes = [...subject.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        els.noteList.innerHTML = sortedNotes
            .map((note) => {
                return `
                    <article class="list-item">
                        <strong>${note.value} Punkte</strong>
                        <p class="list-meta">Erstellt am ${formatDate(note.createdAt)}</p>
                        <div class="row-actions">
                            <button class="btn btn-ghost" data-action="edit-note" data-id="${note.id}" type="button">Bearbeiten</button>
                            <button class="btn btn-ghost" data-action="delete-note" data-id="${note.id}" type="button">Löschen</button>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    function renderCalendar() {
        const monthFormatter = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
        const month = state.viewDate.getMonth();
        const year = state.viewDate.getFullYear();
        els.monthName.textContent = monthFormatter.format(state.viewDate);

        const firstDay = new Date(year, month, 1).getDay();
        const shift = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = "";
        for (let i = 0; i < shift; i += 1) {
            html += '<div class="day empty" aria-hidden="true"></div>';
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const dateStr = toIsoDate(year, month + 1, day);
            const events = getEventsForDate(dateStr);
            const dominantPriority = events.length ? events[0].priority : null;
            html += `
                <article class="day">
                    <span class="day-number">${day}</span>
                    ${events.length ? `<span class="event-dot priority-${dominantPriority}" title="${events.length} Termin(e)"></span>` : ""}
                </article>
            `;
        }

        els.calendarGrid.innerHTML = html;
    }

    function renderEventList() {
        const month = state.viewDate.getMonth();
        const year = state.viewDate.getFullYear();
        const entries = [];

        Object.keys(state.eventsStore.events).forEach((date) => {
            const parsed = new Date(`${date}T00:00:00`);
            if (Number.isNaN(parsed.getTime())) return;
            if (parsed.getMonth() !== month || parsed.getFullYear() !== year) return;

            const dayEvents = getEventsForDate(date);
            dayEvents.forEach((item) => {
                entries.push({ date, ...item });
            });
        });

        entries.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return priorityRank(a.priority) - priorityRank(b.priority);
        });

        if (!entries.length) {
            els.eventList.innerHTML = createEmptyState("In diesem Monat sind noch keine Termine eingetragen.");
            return;
        }

        els.eventList.innerHTML = entries
            .map((entry) => {
                return `
                    <article class="list-item">
                        <strong>${escapeHtml(entry.text)}</strong>
                        <p class="list-meta">${formatDate(entry.date)} · Priorität: ${PRIORITY_LABELS[entry.priority]}</p>
                        <div class="row-actions">
                            <button class="btn btn-ghost" data-action="edit-event" data-date="${entry.date}" data-id="${entry.id}" type="button">Bearbeiten</button>
                            <button class="btn btn-ghost" data-action="delete-event" data-date="${entry.date}" data-id="${entry.id}" type="button">Löschen</button>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    function onSubjectSubmit(event) {
        event.preventDefault();
        clearFeedback(els.subjectFeedback);

        const name = normalizeText(els.subjectNameInput.value);
        if (!name) {
            setFeedback(els.subjectFeedback, "Bitte einen Fachnamen eingeben.", true);
            return;
        }

        if (state.editing.subjectId) {
            const subject = state.subjectsStore.subjects.find((entry) => entry.id === state.editing.subjectId);
            if (!subject) {
                setFeedback(els.subjectFeedback, "Fach wurde nicht gefunden.", true);
                return;
            }
            subject.name = name;
            state.editing.subjectId = null;
            els.subjectSubmit.textContent = "Hinzufügen";
            persistSubjects();
            renderSubjects();
            setFeedback(els.subjectFeedback, "Fach aktualisiert.");
            els.subjectNameInput.value = "";
            return;
        }

        const subject = {
            id: createId("subject"),
            name,
            notes: []
        };

        state.subjectsStore.subjects.push(subject);
        persistSubjects();
        renderSubjects();
        els.subjectNameInput.value = "";
        setFeedback(els.subjectFeedback, "Fach angelegt.");
    }

    function startEditSubject(subjectId) {
        const subject = state.subjectsStore.subjects.find((entry) => entry.id === subjectId);
        if (!subject) return;
        state.editing.subjectId = subject.id;
        els.subjectNameInput.value = subject.name;
        els.subjectSubmit.textContent = "Speichern";
        setFeedback(els.subjectFeedback, `Bearbeite Fach: ${subject.name}`);
    }

    function deleteSubject(subjectId) {
        const subject = state.subjectsStore.subjects.find((entry) => entry.id === subjectId);
        if (!subject) return;

        if (!window.confirm(`Fach "${subject.name}" wirklich löschen?`)) {
            return;
        }

        state.subjectsStore.subjects = state.subjectsStore.subjects.filter((entry) => entry.id !== subjectId);
        if (state.currentSubjectId === subjectId) {
            state.currentSubjectId = null;
            resetNoteForm();
        }
        persistSubjects();
        renderSubjects();
        renderSubjectDetail();
        setFeedback(els.subjectFeedback, "Fach gelöscht.");
    }

    function openSubject(subjectId) {
        state.currentSubjectId = subjectId;
        resetNoteForm();
        renderSubjectDetail();
        showPage("detail");
    }

    function onNoteSubmit(event) {
        event.preventDefault();
        clearFeedback(els.noteFeedback);

        const subject = getCurrentSubject();
        if (!subject) {
            setFeedback(els.noteFeedback, "Bitte zuerst ein Fach öffnen.", true);
            return;
        }

        const rawValue = Number.parseInt(els.noteValueInput.value, 10);
        if (!Number.isInteger(rawValue) || rawValue < 0 || rawValue > 15) {
            setFeedback(els.noteFeedback, "Nur Ganzzahlen von 0 bis 15 sind erlaubt.", true);
            return;
        }

        const nowIso = new Date().toISOString();

        if (state.editing.noteId) {
            const note = subject.notes.find((entry) => entry.id === state.editing.noteId);
            if (!note) {
                setFeedback(els.noteFeedback, "Note wurde nicht gefunden.", true);
                return;
            }
            note.value = rawValue;
            note.updatedAt = nowIso;
            setFeedback(els.noteFeedback, "Note aktualisiert.");
        } else {
            subject.notes.push({
                id: createId("note"),
                value: rawValue,
                createdAt: nowIso,
                updatedAt: nowIso
            });
            setFeedback(els.noteFeedback, "Note gespeichert.");
        }

        persistSubjects();
        resetNoteForm();
        renderSubjects();
        renderSubjectDetail();
    }

    function startEditNote(noteId) {
        const subject = getCurrentSubject();
        if (!subject) return;
        const note = subject.notes.find((entry) => entry.id === noteId);
        if (!note) return;

        state.editing.noteId = note.id;
        els.noteIdInput.value = note.id;
        els.noteValueInput.value = String(note.value);
        els.noteSubmit.textContent = "Aktualisieren";
        els.noteCancel.classList.remove("hidden");
        els.noteFormTitle.textContent = "Note bearbeiten";
    }

    function deleteNote(noteId) {
        const subject = getCurrentSubject();
        if (!subject) return;

        subject.notes = subject.notes.filter((entry) => entry.id !== noteId);
        persistSubjects();
        resetNoteForm();
        renderSubjects();
        renderSubjectDetail();
        setFeedback(els.noteFeedback, "Note gelöscht.");
    }

    function resetNoteForm() {
        state.editing.noteId = null;
        els.noteIdInput.value = "";
        els.noteValueInput.value = "";
        els.noteSubmit.textContent = "Speichern";
        els.noteFormTitle.textContent = "Note hinzufügen";
        els.noteCancel.classList.add("hidden");
    }

    function onEventSubmit(event) {
        event.preventDefault();
        clearFeedback(els.eventFeedback);

        const date = els.eventDateInput.value;
        const text = normalizeText(els.eventTextInput.value);
        const priority = sanitizePriority(els.eventPriorityInput.value);

        if (!isIsoDate(date)) {
            setFeedback(els.eventFeedback, "Bitte ein gültiges Datum wählen.", true);
            return;
        }

        if (!text) {
            setFeedback(els.eventFeedback, "Bitte einen Termintext eingeben.", true);
            return;
        }

        if (!state.eventsStore.events[date]) {
            state.eventsStore.events[date] = [];
        }

        if (state.editing.eventId) {
            let found = false;
            Object.keys(state.eventsStore.events).forEach((entryDate) => {
                const entryList = state.eventsStore.events[entryDate];
                const target = entryList.find((item) => item.id === state.editing.eventId);
                if (!target) return;

                entryList.splice(entryList.indexOf(target), 1);
                if (!state.eventsStore.events[date]) {
                    state.eventsStore.events[date] = [];
                }
                state.eventsStore.events[date].push({
                    id: target.id,
                    text,
                    priority,
                    seed: false
                });
                if (!entryList.length) {
                    delete state.eventsStore.events[entryDate];
                }
                found = true;
            });

            if (!found) {
                setFeedback(els.eventFeedback, "Termin wurde nicht gefunden.", true);
                return;
            }

            setFeedback(els.eventFeedback, "Termin aktualisiert.");
        } else {
            state.eventsStore.events[date].push({
                id: createId("event"),
                text,
                priority,
                seed: false
            });
            setFeedback(els.eventFeedback, "Termin gespeichert.");
        }

        persistEvents();
        resetEventForm();
        renderCalendar();
        renderEventList();
    }

    function startEditEvent(date, eventId) {
        const item = (state.eventsStore.events[date] || []).find((entry) => entry.id === eventId);
        if (!item) return;

        state.editing.eventId = item.id;
        els.eventIdInput.value = item.id;
        els.eventDateInput.value = date;
        els.eventTextInput.value = item.text;
        els.eventPriorityInput.value = item.priority;
        els.eventSubmit.textContent = "Aktualisieren";
        els.eventFormTitle.textContent = "Termin bearbeiten";
        els.eventCancel.classList.remove("hidden");
    }

    function deleteEvent(date, eventId) {
        const dayEvents = state.eventsStore.events[date] || [];
        state.eventsStore.events[date] = dayEvents.filter((entry) => entry.id !== eventId);
        if (!state.eventsStore.events[date].length) {
            delete state.eventsStore.events[date];
        }
        persistEvents();
        resetEventForm();
        renderCalendar();
        renderEventList();
        setFeedback(els.eventFeedback, "Termin gelöscht.");
    }

    function resetEventForm() {
        state.editing.eventId = null;
        els.eventIdInput.value = "";
        els.eventDateInput.value = "";
        els.eventTextInput.value = "";
        els.eventPriorityInput.value = "medium";
        els.eventSubmit.textContent = "Speichern";
        els.eventFormTitle.textContent = "Termin hinzufügen";
        els.eventCancel.classList.add("hidden");
    }

    function getCurrentSubject() {
        return state.subjectsStore.subjects.find((subject) => subject.id === state.currentSubjectId) || null;
    }

    function getEventsForDate(date) {
        const events = state.eventsStore.events[date] || [];
        return [...events].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    }

    function persistSubjects() {
        state.subjectsStore.subjects = sanitizeSubjects(state.subjectsStore.subjects);
        localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(state.subjectsStore));
    }

    function persistEvents() {
        state.eventsStore.events = sanitizeEventsMap(state.eventsStore.events);
        localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(state.eventsStore));
    }

    function loadSubjectsStore() {
        const fallback = { version: SCHEMA_VERSION, subjects: [] };
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.subjects);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {
                const migrated = {
                    version: SCHEMA_VERSION,
                    subjects: parsed.map((legacySubject) => {
                        const name = normalizeText(legacySubject && legacySubject.name);
                        const safeName = name || "Unbenanntes Fach";
                        const legacyNotes = Array.isArray(legacySubject && legacySubject.notes) ? legacySubject.notes : [];
                        const notes = legacyNotes
                            .map((value, index) => {
                                const intValue = Number.parseInt(value, 10);
                                if (!Number.isInteger(intValue) || intValue < 0 || intValue > 15) return null;
                                const stamp = new Date(Date.now() - index * 1000).toISOString();
                                return {
                                    id: createId("legacy-note"),
                                    value: intValue,
                                    createdAt: stamp,
                                    updatedAt: stamp
                                };
                            })
                            .filter(Boolean);
                        return {
                            id: normalizeId(legacySubject && legacySubject.id, "subject"),
                            name: safeName,
                            notes
                        };
                    })
                };
                localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(migrated));
                return migrated;
            }

            if (!parsed || typeof parsed !== "object") {
                return fallback;
            }

            const subjects = sanitizeSubjects(Array.isArray(parsed.subjects) ? parsed.subjects : []);
            const next = { version: SCHEMA_VERSION, subjects };
            localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(next));
            return next;
        } catch (_) {
            return fallback;
        }
    }

    function loadEventsStore() {
        const fallback = {
            version: SCHEMA_VERSION,
            events: sanitizeEventsMap({ ...DEFAULT_EVENTS_SEED })
        };

        try {
            const raw = localStorage.getItem(STORAGE_KEYS.events);
            if (!raw) {
                localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(fallback));
                return fallback;
            }

            const parsed = JSON.parse(raw);

            if (!parsed || typeof parsed !== "object") {
                localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(fallback));
                return fallback;
            }

            if (!Array.isArray(parsed.events) && !parsed.version && !parsed.events) {
                const migratedLegacy = Object.keys(parsed).reduce((acc, date) => {
                    if (!isIsoDate(date)) return acc;
                    const value = normalizeText(parsed[date]);
                    if (!value) return acc;
                    acc[date] = [{ id: createId("legacy-event"), text: value, priority: "medium", seed: false }];
                    return acc;
                }, {});

                const merged = mergeSeedWithUser(migratedLegacy);
                const migrated = {
                    version: SCHEMA_VERSION,
                    events: sanitizeEventsMap(merged)
                };
                localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(migrated));
                return migrated;
            }

            const currentEvents = sanitizeEventsMap(parsed.events || {});
            const mergedEvents = mergeSeedWithUser(currentEvents);
            const next = {
                version: SCHEMA_VERSION,
                events: mergedEvents
            };
            localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(next));
            return next;
        } catch (_) {
            localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(fallback));
            return fallback;
        }
    }

    function mergeSeedWithUser(userEvents) {
        const merged = sanitizeEventsMap({ ...DEFAULT_EVENTS_SEED });
        Object.keys(userEvents).forEach((date) => {
            if (!merged[date]) {
                merged[date] = [];
            }
            const entries = sanitizeEventList(userEvents[date]);
            const filteredSeed = merged[date].filter((entry) => entry.seed);
            merged[date] = [...filteredSeed, ...entries.filter((entry) => !entry.seed)];
        });
        return sanitizeEventsMap(merged);
    }

    function sanitizeSubjects(subjects) {
        if (!Array.isArray(subjects)) return [];
        return subjects
            .map((subject) => {
                const name = normalizeText(subject && subject.name);
                if (!name) return null;
                return {
                    id: normalizeId(subject && subject.id, "subject"),
                    name,
                    notes: sanitizeNotes(subject && subject.notes)
                };
            })
            .filter(Boolean);
    }

    function sanitizeNotes(notes) {
        if (!Array.isArray(notes)) return [];

        return notes
            .map((note) => {
                if (typeof note === "number") {
                    if (!Number.isInteger(note) || note < 0 || note > 15) return null;
                    const stamp = new Date().toISOString();
                    return {
                        id: createId("note"),
                        value: note,
                        createdAt: stamp,
                        updatedAt: stamp
                    };
                }

                const value = Number.parseInt(note && note.value, 10);
                if (!Number.isInteger(value) || value < 0 || value > 15) return null;
                return {
                    id: normalizeId(note && note.id, "note"),
                    value,
                    createdAt: sanitizeIsoDateTime(note && note.createdAt),
                    updatedAt: sanitizeIsoDateTime(note && note.updatedAt)
                };
            })
            .filter(Boolean);
    }

    function sanitizeEventsMap(eventMap) {
        if (!eventMap || typeof eventMap !== "object") return {};
        const result = {};

        Object.keys(eventMap).forEach((date) => {
            if (!isIsoDate(date)) return;
            const cleaned = sanitizeEventList(eventMap[date]);
            if (cleaned.length) {
                result[date] = cleaned;
            }
        });

        return result;
    }

    function sanitizeEventList(list) {
        if (!Array.isArray(list)) return [];

        return list
            .map((entry) => {
                const text = normalizeText(entry && entry.text);
                if (!text) return null;
                return {
                    id: normalizeId(entry && entry.id, "event"),
                    text,
                    priority: sanitizePriority(entry && entry.priority),
                    seed: Boolean(entry && entry.seed)
                };
            })
            .filter(Boolean);
    }

    function normalizeId(value, prefix) {
        if (typeof value === "string" && value.trim()) return value;
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
        return createId(prefix);
    }

    function sanitizeIsoDateTime(value) {
        if (typeof value !== "string") return new Date().toISOString();
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
        return parsed.toISOString();
    }

    function sanitizePriority(value) {
        if (value === "high" || value === "medium" || value === "low") {
            return value;
        }
        return "medium";
    }

    function normalizeText(value) {
        if (typeof value !== "string") return "";
        return value.trim().replace(/\s+/g, " ");
    }

    function calculateAverage(notes) {
        if (!Array.isArray(notes) || !notes.length) return null;
        const sum = notes.reduce((acc, note) => acc + note.value, 0);
        return (sum / notes.length).toFixed(1);
    }

    function setFeedback(target, message, isError = false) {
        target.textContent = message;
        target.classList.toggle("is-error", isError);
        target.classList.toggle("is-success", !isError);
    }

    function clearFeedback(target) {
        target.textContent = "";
        target.classList.remove("is-error", "is-success");
    }

    function createId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function priorityRank(priority) {
        if (priority === "high") return 0;
        if (priority === "medium") return 1;
        return 2;
    }

    function isIsoDate(value) {
        return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    function toIsoDate(year, month, day) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    function formatDate(dateValue) {
        const date = new Date(isIsoDate(dateValue) ? `${dateValue}T00:00:00` : dateValue);
        if (Number.isNaN(date.getTime())) return "Unbekanntes Datum";
        return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
})();
