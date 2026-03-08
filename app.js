import {
    PRIORITY_LABELS,
    calculateAverage,
    createId,
    escapeHtml,
    formatDate,
    isIsoDate,
    normalizeText,
    priorityRank,
    sanitizePriority,
    toIsoDate
} from "./utils.js";
import {
    loadEventsStore,
    loadSettings,
    loadSubjectsStore,
    persistEvents,
    persistSettings,
    persistSubjects
} from "./storage.js";
import { getRegionalCalendarInfo } from "./regional-calendar.js";

export function initApp() {
    const defaultSettings = {
        accent: "teal",
        region: "ALL",
        weekend: "blue",
        radius: "soft",
        density: "comfortable",
        background: "dynamic",
        mode: "light",
        showHolidays: "on",
        showVacations: "on",
        showEventLabels: "on",
        showLegend: "on",
        defaultPage: "list",
        fontScale: "normal",
        reducedMotion: "off"
    };

    const initialSettings = loadSettings();

    const state = {
        viewPage: initialSettings.defaultPage || "list",
        viewDate: new Date(),
        selectedDate: toIsoDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
        currentSubjectId: null,
        editing: {
            subjectId: null,
            noteId: null,
            eventId: null
        },
        subjectsStore: loadSubjectsStore(),
        eventsStore: loadEventsStore(),
        settings: initialSettings,
        goals: loadGoals()
    };

    const els = {
        pages: document.querySelectorAll(".page"),
        navButtons: document.querySelectorAll(".nav-btn"),
        sidebarToggle: document.getElementById("sidebar-toggle"),
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
        calendarLegend: document.getElementById("calendar-legend"),
        eventList: document.getElementById("event-list"),
        eventForm: document.getElementById("event-form"),
        eventFormTitle: document.getElementById("event-form-title"),
        eventIdInput: document.getElementById("event-id"),
        eventDateInput: document.getElementById("event-date"),
        eventTextInput: document.getElementById("event-text"),
        eventTypeInput: document.getElementById("event-type"),
        eventPriorityInput: document.getElementById("event-priority"),
        eventSubmit: document.getElementById("event-submit"),
        eventCancel: document.getElementById("event-cancel"),
        eventFeedback: document.getElementById("event-feedback"),
        eventUseToday: document.getElementById("event-use-today"),
        selectedDayChip: document.getElementById("selected-day-chip"),
        quickTemplateButtons: document.querySelectorAll(".quick-template"),

        settingsForm: document.getElementById("settings-form"),
        settingAccent: document.getElementById("setting-accent"),
        settingRegion: document.getElementById("setting-region"),
        settingWeekend: document.getElementById("setting-weekend"),
        settingRadius: document.getElementById("setting-radius"),
        settingDensity: document.getElementById("setting-density"),
        settingBackground: document.getElementById("setting-background"),
        settingMode: document.getElementById("setting-mode"),
        settingFontScale: document.getElementById("setting-font-scale"),
        settingReducedMotion: document.getElementById("setting-reduced-motion"),
        settingDefaultPage: document.getElementById("setting-default-page"),
        settingShowHolidays: document.getElementById("setting-show-holidays"),
        settingShowVacations: document.getElementById("setting-show-vacations"),
        settingShowEventLabels: document.getElementById("setting-show-event-labels"),
        settingShowLegend: document.getElementById("setting-show-legend"),
        settingsReset: document.getElementById("settings-reset"),
        settingsFeedback: document.getElementById("settings-feedback"),
        dataExport: document.getElementById("data-export"),
        dataImport: document.getElementById("data-import"),
        dataImportFile: document.getElementById("data-import-file"),

        statsGrid: document.getElementById("stats-grid"),
        chartSubjectAvg: document.getElementById("chart-subject-avg"),
        chartEventsMonth: document.getElementById("chart-events-month"),
        chartGoalsProgress: document.getElementById("chart-goals-progress"),
        goalForm: document.getElementById("goal-form"),
        goalTextInput: document.getElementById("goal-text"),
        goalDateInput: document.getElementById("goal-date"),
        goalFeedback: document.getElementById("goal-feedback"),
        goalList: document.getElementById("goal-list"),
        goalSubjects: document.getElementById("goal-subjects"),

        confirmModal: document.getElementById("confirm-modal"),
        confirmMessage: document.getElementById("confirm-message"),
        confirmOk: document.getElementById("confirm-ok"),
        confirmCancel: document.getElementById("confirm-cancel"),
        appToast: document.getElementById("app-toast")
    };
    let confirmAction = null;
    let toastTimer = null;
    let draftsTimer = null;

    applyThemeSettings();
    closeConfirmModal();
    if (window.innerWidth <= 1200 && window.innerWidth > 920) {
        document.body.classList.add("sidebar-collapsed");
    }
    syncSidebarToggleState();
    hydrateSettingsForm();
    hydrateDrafts();
    updateSelectedDayUI();
    bindEvents();
    showPage(state.settings.defaultPage || "list");
    renderAll();

    function bindEvents() {
        els.navButtons.forEach((button) => {
            button.addEventListener("click", () => {
                showPage(button.dataset.page);
                if (window.innerWidth <= 920) {
                    document.body.classList.remove("sidebar-expanded");
                    syncSidebarToggleState();
                }
            });
        });

        els.sidebarToggle.addEventListener("click", () => {
            if (window.innerWidth <= 920) {
                document.body.classList.toggle("sidebar-expanded");
            } else {
                document.body.classList.toggle("sidebar-collapsed");
            }
            syncSidebarToggleState();
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 920) {
                document.body.classList.remove("sidebar-expanded");
                syncSidebarToggleState();
            }
        });

        els.subjectForm.addEventListener("submit", onSubjectSubmit);
        els.subjectNameInput.addEventListener("input", saveDraftsThrottled);

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
        els.noteValueInput.addEventListener("input", saveDraftsThrottled);

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
        els.eventDateInput.addEventListener("input", saveDraftsThrottled);
        els.eventTextInput.addEventListener("input", saveDraftsThrottled);
        els.eventDateInput.addEventListener("change", () => {
            if (isIsoDate(els.eventDateInput.value)) {
                selectDate(els.eventDateInput.value);
            }
        });
        els.eventUseToday.addEventListener("click", () => {
            const today = startOfDay(new Date());
            selectDate(toIsoDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));
            setFeedback(els.eventFeedback, "Heute wurde als Datum gesetzt.");
        });

        els.quickTemplateButtons.forEach((button) => {
            button.addEventListener("click", () => {
                els.eventTextInput.value = button.dataset.template || "";
                const tpl = (button.dataset.template || "").toLowerCase();
                if (tpl.includes("test")) els.eventTypeInput.value = "test";
                else if (tpl.includes("abgabe")) els.eventTypeInput.value = "deadline";
                else els.eventTypeInput.value = "exam";
                els.eventTextInput.focus();
                saveDraftsThrottled();
            });
        });

        els.calendarGrid.addEventListener("click", (event) => {
            const dayElement = event.target.closest("[data-date]");
            if (!dayElement) return;
            selectDate(dayElement.dataset.date);
            showPage("calendar");
        });
        els.calendarGrid.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            const dayElement = event.target.closest("[data-date]");
            if (!dayElement) return;
            event.preventDefault();
            selectDate(dayElement.dataset.date);
            showPage("calendar");
        });

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

        els.settingsForm.addEventListener("change", onSettingsChange);
        els.settingsReset.addEventListener("click", () => {
            state.settings = persistSettings(defaultSettings);
            hydrateSettingsForm();
            applyThemeSettings();
            renderCalendar();
            renderEventList();
            setFeedback(els.settingsFeedback, "Einstellungen zurückgesetzt.");
        });
        els.dataExport.addEventListener("click", exportData);
        els.dataImport.addEventListener("click", () => els.dataImportFile.click());
        els.dataImportFile.addEventListener("change", importData);

        els.goalForm.addEventListener("submit", onGoalSubmit);
        els.goalTextInput.addEventListener("input", saveDraftsThrottled);
        els.goalDateInput.addEventListener("input", saveDraftsThrottled);
        els.goalList.addEventListener("click", (event) => {
            const action = event.target.dataset.action;
            const goalId = event.target.dataset.id;
            if (!action || !goalId) return;
            if (action === "delete-goal") deleteGoal(goalId);
        });
        els.goalSubjects.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-action='goal-from-subject']");
            if (!btn) return;
            const subjectId = btn.dataset.id;
            applySubjectGoalTemplate(subjectId);
        });

        els.confirmOk.addEventListener("click", () => {
            const action = confirmAction;
            closeConfirmModal();
            if (typeof action === "function") action();
        });
        els.confirmCancel.addEventListener("click", closeConfirmModal);
        els.confirmModal.addEventListener("click", (event) => {
            if (event.target.dataset.action === "close-confirm") {
                closeConfirmModal();
            }
        });
        document.addEventListener("keydown", (event) => {
            if (els.confirmModal.classList.contains("hidden")) return;
            if (event.key === "Escape") {
                event.preventDefault();
                closeConfirmModal();
            } else if (event.key === "Enter") {
                event.preventDefault();
                const action = confirmAction;
                closeConfirmModal();
                if (typeof action === "function") action();
            }
        });
    }

    function renderAll() {
        renderSubjects();
        renderSubjectDetail();
        renderCalendar();
        renderEventList();
        renderStats();
        renderGoalSubjects();
        renderGoals();
    }

    function showPage(pageId) {
        state.viewPage = pageId;

        els.pages.forEach((page) => {
            page.classList.toggle("is-active", page.id === `page-${pageId}`);
        });

        els.navButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.page === (pageId === "detail" ? "list" : pageId));
        });

        if (pageId === "calendar") {
            updateSelectedDayUI();
        }
    }

    function onSettingsChange() {
        state.settings = persistSettings({
            accent: els.settingAccent.value,
            region: els.settingRegion.value,
            weekend: els.settingWeekend.value,
            radius: els.settingRadius.value,
            density: els.settingDensity.value,
            background: els.settingBackground.value,
            mode: els.settingMode.value,
            fontScale: els.settingFontScale.value,
            reducedMotion: els.settingReducedMotion.value,
            defaultPage: els.settingDefaultPage.value,
            showHolidays: els.settingShowHolidays.value,
            showVacations: els.settingShowVacations.value,
            showEventLabels: els.settingShowEventLabels.value,
            showLegend: els.settingShowLegend.value
        });
        applyThemeSettings();
        renderCalendar();
        renderEventList();
        setFeedback(els.settingsFeedback, "Einstellungen gespeichert.");
    }

    function hydrateSettingsForm() {
        els.settingAccent.value = state.settings.accent;
        els.settingRegion.value = state.settings.region;
        els.settingWeekend.value = state.settings.weekend;
        els.settingRadius.value = state.settings.radius;
        els.settingDensity.value = state.settings.density;
        els.settingBackground.value = state.settings.background;
        els.settingMode.value = state.settings.mode;
        els.settingFontScale.value = state.settings.fontScale;
        els.settingReducedMotion.value = state.settings.reducedMotion;
        els.settingDefaultPage.value = state.settings.defaultPage;
        els.settingShowHolidays.value = state.settings.showHolidays;
        els.settingShowVacations.value = state.settings.showVacations;
        els.settingShowEventLabels.value = state.settings.showEventLabels;
        els.settingShowLegend.value = state.settings.showLegend;
    }

    function applyThemeSettings() {
        const root = document.documentElement;
        const body = document.body;

        body.classList.toggle("weekend-blue", state.settings.weekend === "blue");
        body.classList.toggle("weekend-mint", state.settings.weekend === "mint");
        body.classList.toggle("weekend-rose", state.settings.weekend === "rose");
        body.classList.toggle("weekend-gray", state.settings.weekend === "gray");
        body.classList.toggle("density-compact", state.settings.density === "compact");
        body.classList.toggle("bg-plain", state.settings.background === "plain");
        body.classList.toggle("mode-dark", state.settings.mode === "dark");
        body.classList.toggle("font-small", state.settings.fontScale === "small");
        body.classList.toggle("font-large", state.settings.fontScale === "large");
        body.classList.toggle("reduce-motion", state.settings.reducedMotion === "on");

        root.classList.remove("radius-soft", "radius-sharp", "radius-rounded");
        root.classList.add(`radius-${state.settings.radius}`);
        if (els.calendarLegend) {
            els.calendarLegend.classList.toggle("hidden", state.settings.showLegend === "off");
        }

        const accentMap = {
            teal: { primary: "#127f8f", strong: "#0d6774" },
            blue: { primary: "#1f63dc", strong: "#1a4eb0" },
            green: { primary: "#1f8a4c", strong: "#17693a" },
            orange: { primary: "#c56b10", strong: "#9d550d" }
        };

        const colors = accentMap[state.settings.accent] || accentMap.teal;
        root.style.setProperty("--primary", colors.primary);
        root.style.setProperty("--primary-strong", colors.strong);
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
                const avgClass = classifyScore(avg);
                return `
                    <article class="card subject-card ${avgClass ? `subject-${avgClass}` : "subject-none"}">
                        <h3>${escapeHtml(subject.name)}</h3>
                        <p class="card-value ${avgClass ? `score-${avgClass}` : ""}">${avg ?? "--"}</p>
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
        const avgClass = classifyScore(avg);
        els.detailAverage.innerHTML = `Schnitt: <span class="${avgClass ? `score-${avgClass}` : ""}">${avg ?? "--"}</span>`;

        if (!subject.notes.length) {
            els.noteList.innerHTML = createEmptyState("Noch keine Noten gespeichert.");
            return;
        }

        const sortedNotes = [...subject.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        els.noteList.innerHTML = sortedNotes
            .map((note) => {
                const noteClass = classifyScore(note.value);
                return `
                    <article class="list-item">
                        <strong class="note-pill score-${noteClass}">${note.value} Punkte</strong>
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
        const compactCalendar = window.innerWidth <= 920;
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
            const meta = getDayMeta(dateStr);
            const events = getEventsForDate(dateStr);
            const previewEvents = state.settings.showEventLabels === "on" ? events.slice(0, compactCalendar ? 1 : 2) : [];

            const dayClasses = ["day"];
            if (meta.isWeekend) dayClasses.push("is-weekend");
            if (meta.isPast) dayClasses.push("is-past");
            if (meta.isToday) dayClasses.push("is-today");
            if (meta.holidayNames.length) dayClasses.push("is-holiday");
            if (meta.vacationNames.length) dayClasses.push("is-vacation");
            if (state.selectedDate === dateStr) dayClasses.push("is-selected");
            if (compactCalendar) dayClasses.push("is-compact");

            const holidayMarkup = compactCalendar
                ? (meta.holidayNames.length ? '<span class="day-chip-mini day-chip-mini-holiday">H</span>' : "")
                : (meta.holidayNames.length ? `<span class="day-pill day-pill-holiday">${escapeHtml(summarizeLabel(meta.holidayNames))}</span>` : "");
            const vacationMarkup = compactCalendar
                ? (meta.vacationNames.length ? '<span class="day-chip-mini day-chip-mini-vacation">V</span>' : "")
                : (meta.vacationNames.length ? `<span class="day-pill day-pill-vacation">${escapeHtml(summarizeLabel(meta.vacationNames))}</span>` : "");
            const eventMarkup = compactCalendar
                ? previewEvents.map((entry) => `<span class="day-chip-mini day-chip-mini-event event-type-${entry.type || "exam"}">P</span>`).join("")
                : previewEvents.map((entry) => `<span class="day-pill day-pill-event event-type-${entry.type || "exam"}">${escapeHtml(entry.text)}</span>`).join("");

            html += `
                <article class="${dayClasses.join(" ")}" title="${escapeHtml(meta.title)}" data-date="${dateStr}" role="button" tabindex="0" aria-label="Tag ${day}. ${escapeHtml(meta.title)}">
                    <div class="day-header">
                        <span class="day-number">${day}</span>
                        ${meta.isToday ? '<span class="today-badge">Heute</span>' : ""}
                    </div>
                    <div class="day-meta">
                        ${holidayMarkup}
                        ${vacationMarkup}
                        ${eventMarkup}
                    </div>
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
                entries.push({
                    date,
                    ...item
                });
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
                    <article class="list-item event-item event-type-${entry.type || "exam"}">
                        <strong>${escapeHtml(entry.text)}</strong>
                        <p class="list-meta">${formatDate(entry.date)} · ${eventTypeLabel(entry.type)} · Priorität: ${PRIORITY_LABELS[entry.priority]}</p>
                        <div class="row-actions">
                            <button class="btn btn-ghost" data-action="edit-event" data-date="${entry.date}" data-id="${entry.id}" type="button">Bearbeiten</button>
                            <button class="btn btn-ghost" data-action="delete-event" data-date="${entry.date}" data-id="${entry.id}" type="button">Löschen</button>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    function renderStats() {
        const subjects = state.subjectsStore.subjects;
        const notes = subjects.flatMap((subject) => subject.notes || []);
        const allEvents = Object.values(state.eventsStore.events).flat();
        const goalProgressList = evaluateGoalsProgress();
        autoCompleteGoals(goalProgressList);
        const nowIso = toIsoDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        const upcomingExams = Object.keys(state.eventsStore.events).reduce((count, date) => {
            if (date < nowIso) return count;
            const exams = (state.eventsStore.events[date] || []).filter((entry) => (entry.type || "exam") === "exam").length;
            return count + exams;
        }, 0);
        const openGoals = goalProgressList.filter((goal) => goal.status === "open").length;
        const nearGoals = goalProgressList.filter((goal) => goal.status === "near").length;
        const doneGoals = goalProgressList.filter((goal) => goal.status === "done").length;

        const stats = [
            { label: "Fächer", value: String(subjects.length) },
            { label: "Noten gesamt", value: String(notes.length) },
            { label: "Schnitt gesamt", value: notes.length ? (notes.reduce((acc, note) => acc + note.value, 0) / notes.length).toFixed(1) : "--" },
            { label: "Termine gesamt", value: String(allEvents.length) },
            { label: "Prüfungen offen", value: String(upcomingExams) },
            { label: "Offene Ziele", value: String(openGoals) },
            { label: "Nahe Ziele", value: String(nearGoals) },
            { label: "Erreichte Ziele", value: String(doneGoals) }
        ];

        els.statsGrid.innerHTML = stats
            .map((item) => `
                <article class="stat-card">
                    <p class="list-meta">${item.label}</p>
                    <strong>${item.value}</strong>
                </article>
            `)
            .join("");

        renderSubjectAverageChart(subjects);
        renderEventsByMonthChart();
        renderGoalsProgressChart(goalProgressList);
    }

    function renderGoals() {
        if (!state.goals.length) {
            els.goalList.innerHTML = createEmptyState("Noch keine Ziele gesetzt.");
            return;
        }

        const progressMap = new Map(evaluateGoalsProgress().map((item) => [item.goal.id, item]));
        autoCompleteGoals([...progressMap.values()]);

        els.goalList.innerHTML = state.goals
            .slice()
            .sort((a, b) => {
                const aStatus = progressMap.get(a.id)?.status || a.status;
                const bStatus = progressMap.get(b.id)?.status || b.status;
                if (aStatus !== bStatus) return aStatus === "open" ? -1 : 1;
                return (a.targetDate || "9999-12-31").localeCompare(b.targetDate || "9999-12-31");
            })
            .map((goal) => {
                const progress = progressMap.get(goal.id) || { status: goal.status === "done" ? "done" : "open", ratio: goal.status === "done" ? 1 : 0, percent: goal.status === "done" ? 100 : 0 };
                const statusLabel = progress.status === "done" ? "Erreicht" : (progress.status === "near" ? "Nah dran" : "Offen");
                return `
                <article class="list-item goal-item ${progress.status === "done" ? "done" : ""}">
                    <strong>${escapeHtml(goal.text)}</strong>
                    <p class="list-meta">${goal.targetDate ? `Zieldatum: ${formatDate(goal.targetDate)}` : "Ohne Zieldatum"} · Status: <span class="goal-status ${progress.status}">${statusLabel}</span></p>
                    <div class="goal-progress">
                        <div class="goal-progress-track"><div class="goal-progress-fill ${progress.status}" style="width:${progress.percent}%"></div></div>
                        <span class="goal-progress-value">${progress.percent}%</span>
                    </div>
                    <div class="row-actions">
                        <button class="btn btn-ghost" data-action="delete-goal" data-id="${goal.id}" type="button">Löschen</button>
                    </div>
                </article>
            `;
            })
            .join("");
    }

    function renderGoalSubjects() {
        const subjects = state.subjectsStore.subjects;
        if (!subjects.length) {
            els.goalSubjects.innerHTML = createEmptyState("Noch keine Fächer vorhanden.");
            return;
        }

        els.goalSubjects.innerHTML = subjects
            .map((subject) => {
                const avg = calculateAverage(subject.notes);
                const avgClass = classifyScore(avg);
                return `
                    <article class="stat-card">
                        <p class="list-meta">Fach</p>
                        <strong>${escapeHtml(subject.name)}</strong>
                        <p class="list-meta">Schnitt: <span class="${avgClass ? `score-${avgClass}` : ""}">${avg ?? "--"}</span> · Noten: ${subject.notes.length}</p>
                        <div class="row-actions">
                            <button class="btn btn-ghost" data-action="goal-from-subject" data-id="${subject.id}" type="button">Ziel aus Fach erstellen</button>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    function renderSubjectAverageChart(subjects) {
        if (!subjects.length) {
            els.chartSubjectAvg.innerHTML = createEmptyState("Noch keine Fächer für ein Diagramm.");
            return;
        }
        const rows = subjects.map((subject) => {
            const avg = subject.notes.length ? (subject.notes.reduce((acc, n) => acc + n.value, 0) / subject.notes.length) : 0;
            const pct = Math.max(2, Math.round((avg / 15) * 100));
            const scoreClass = classifyScore(avg);
            return { name: subject.name, value: avg, pct, scoreClass };
        });

        els.chartSubjectAvg.innerHTML = rows
            .map((row) => `
                <div class="chart-row">
                    <span class="chart-label">${escapeHtml(row.name)}</span>
                    <div class="chart-track"><div class="chart-fill chart-score-${row.scoreClass || "mid"}" style="width:${row.pct}%"></div></div>
                    <span class="chart-value">${row.value.toFixed(1)}</span>
                </div>
            `)
            .join("");
    }

    function renderEventsByMonthChart() {
        const base = new Date();
        const months = [];
        for (let i = 0; i < 6; i += 1) {
            const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = new Intl.DateTimeFormat("de-DE", { month: "short" }).format(d);
            months.push({ key, label, count: 0 });
        }

        Object.keys(state.eventsStore.events).forEach((date) => {
            const key = date.slice(0, 7);
            const target = months.find((m) => m.key === key);
            if (!target) return;
            target.count += (state.eventsStore.events[date] || []).length;
        });

        const max = Math.max(1, ...months.map((m) => m.count));
        els.chartEventsMonth.innerHTML = months
            .map((m) => {
                const pct = Math.max(4, Math.round((m.count / max) * 100));
                return `
                    <div class="chart-row">
                        <span class="chart-label">${escapeHtml(m.label)}</span>
                        <div class="chart-track"><div class="chart-fill chart-fill-alt" style="width:${pct}%"></div></div>
                        <span class="chart-value">${m.count}</span>
                    </div>
                `;
            })
            .join("");
    }

    function renderGoalsProgressChart(goalProgressList) {
        if (!goalProgressList.length) {
            els.chartGoalsProgress.innerHTML = createEmptyState("Noch keine Ziele für ein Diagramm.");
            return;
        }

        const rows = goalProgressList
            .slice()
            .sort((a, b) => b.percent - a.percent)
            .map((item) => ({
                label: item.goal.text,
                percent: item.percent,
                status: item.status
            }));

        els.chartGoalsProgress.innerHTML = rows
            .map((row) => `
                <div class="chart-row">
                    <span class="chart-label">${escapeHtml(row.label)}</span>
                    <div class="chart-track"><div class="chart-fill chart-goal-${row.status}" style="width:${Math.max(4, row.percent)}%"></div></div>
                    <span class="chart-value">${row.percent}%</span>
                </div>
            `)
            .join("");
    }

    function selectDate(dateStr) {
        if (!isIsoDate(dateStr)) return;
        state.selectedDate = dateStr;
        els.eventDateInput.value = dateStr;
        updateSelectedDayUI();
        renderCalendar();
    }

    function updateSelectedDayUI() {
        if (!isIsoDate(state.selectedDate)) {
            els.selectedDayChip.textContent = "Kein Tag ausgewählt";
            return;
        }
        els.selectedDayChip.textContent = `Ausgewählt: ${formatDate(state.selectedDate)}`;
        if (!state.editing.eventId) {
            els.eventDateInput.value = state.selectedDate;
        }
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
            state.subjectsStore = persistSubjects(state.subjectsStore);
            renderSubjects();
            renderStats();
            renderGoalSubjects();
            setFeedback(els.subjectFeedback, "Fach aktualisiert.");
            els.subjectNameInput.value = "";
            saveDraftsThrottled();
            return;
        }

        state.subjectsStore.subjects.push({
            id: createId("subject"),
            name,
            notes: []
        });
        state.subjectsStore = persistSubjects(state.subjectsStore);
        renderSubjects();
        renderStats();
        renderGoalSubjects();
        els.subjectNameInput.value = "";
        setFeedback(els.subjectFeedback, "Fach angelegt.");
        saveDraftsThrottled();
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

        openConfirmModal(`Fach "${subject.name}" wirklich löschen?`, () => {
            state.subjectsStore.subjects = state.subjectsStore.subjects.filter((entry) => entry.id !== subjectId);
            if (state.currentSubjectId === subjectId) {
                state.currentSubjectId = null;
                resetNoteForm();
            }
            state.subjectsStore = persistSubjects(state.subjectsStore);
            renderSubjects();
            renderSubjectDetail();
            renderStats();
            renderGoalSubjects();
            setFeedback(els.subjectFeedback, "Fach gelöscht.");
        });
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

        state.subjectsStore = persistSubjects(state.subjectsStore);
        resetNoteForm();
        renderSubjects();
        renderSubjectDetail();
        renderStats();
        renderGoalSubjects();
        saveDraftsThrottled();
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
        state.subjectsStore = persistSubjects(state.subjectsStore);
        resetNoteForm();
        renderSubjects();
        renderSubjectDetail();
        renderStats();
        renderGoalSubjects();
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
        const type = sanitizeEventType(els.eventTypeInput.value);
        const priority = sanitizePriority(els.eventPriorityInput.value);

        if (!isIsoDate(date)) {
            setFeedback(els.eventFeedback, "Bitte ein gültiges Datum wählen.", true);
            return;
        }

        if (!text) {
            setFeedback(els.eventFeedback, "Bitte einen Termintext eingeben.", true);
            return;
        }

        state.selectedDate = date;

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
                    type,
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
                type,
                priority,
                seed: false
            });
            setFeedback(els.eventFeedback, "Termin gespeichert.");
        }

        state.eventsStore = persistEvents(state.eventsStore);
        resetEventForm();
        updateSelectedDayUI();
        renderCalendar();
        renderEventList();
        renderStats();
    }

    function startEditEvent(date, eventId) {
        const item = (state.eventsStore.events[date] || []).find((entry) => entry.id === eventId);
        if (!item) return;

        state.editing.eventId = item.id;
        els.eventIdInput.value = item.id;
        els.eventDateInput.value = date;
        els.eventTextInput.value = item.text;
        els.eventTypeInput.value = sanitizeEventType(item.type);
        els.eventPriorityInput.value = item.priority;
        els.eventSubmit.textContent = "Aktualisieren";
        els.eventFormTitle.textContent = "Termin bearbeiten";
        els.eventCancel.classList.remove("hidden");
        state.selectedDate = date;
        updateSelectedDayUI();
    }

    function deleteEvent(date, eventId) {
        const dayEvents = state.eventsStore.events[date] || [];
        state.eventsStore.events[date] = dayEvents.filter((entry) => entry.id !== eventId);
        if (!state.eventsStore.events[date].length) {
            delete state.eventsStore.events[date];
        }
        state.eventsStore = persistEvents(state.eventsStore);
        resetEventForm();
        renderCalendar();
        renderEventList();
        renderStats();
        setFeedback(els.eventFeedback, "Termin gelöscht.");
    }

    function onGoalSubmit(event) {
        event.preventDefault();
        clearFeedback(els.goalFeedback);

        const text = normalizeText(els.goalTextInput.value);
        const targetDate = els.goalDateInput.value;
        if (!text) {
            setFeedback(els.goalFeedback, "Bitte ein Ziel eingeben.", true);
            return;
        }
        if (targetDate && !isIsoDate(targetDate)) {
            setFeedback(els.goalFeedback, "Ungültiges Zieldatum.", true);
            return;
        }

        state.goals.push({
            id: createId("goal"),
            text,
            targetDate: targetDate || "",
            status: "open",
            createdAt: new Date().toISOString()
        });
        persistGoals(state.goals);
        els.goalTextInput.value = "";
        els.goalDateInput.value = "";
        renderGoals();
        renderStats();
        setFeedback(els.goalFeedback, "Ziel gespeichert.");
        saveDraftsThrottled();
    }

    function applySubjectGoalTemplate(subjectId) {
        const subject = state.subjectsStore.subjects.find((entry) => entry.id === subjectId);
        if (!subject) return;
        const avg = calculateAverage(subject.notes) || "0.0";
        const baseTarget = Math.min(15, Math.max(8, Math.ceil(Number.parseFloat(avg) + 1)));
        els.goalTextInput.value = `${subject.name}: Schnitt auf ${baseTarget.toFixed(1)} steigern`;
        els.goalTextInput.focus();
        setFeedback(els.goalFeedback, `Vorlage für ${subject.name} eingefügt.`);
        saveDraftsThrottled();
    }

    function deleteGoal(goalId) {
        state.goals = state.goals.filter((entry) => entry.id !== goalId);
        persistGoals(state.goals);
        renderGoals();
        renderStats();
        setFeedback(els.goalFeedback, "Ziel gelöscht.");
    }

    function resetEventForm() {
        state.editing.eventId = null;
        els.eventIdInput.value = "";
        els.eventDateInput.value = state.selectedDate || "";
        els.eventTextInput.value = "";
        els.eventTypeInput.value = "exam";
        els.eventPriorityInput.value = "medium";
        els.eventSubmit.textContent = "Speichern";
        els.eventFormTitle.textContent = "Termin hinzufügen";
        els.eventCancel.classList.add("hidden");
        saveDraftsThrottled();
    }

    function getCurrentSubject() {
        return state.subjectsStore.subjects.find((subject) => subject.id === state.currentSubjectId) || null;
    }

    function getEventsForDate(date) {
        const events = state.eventsStore.events[date] || [];
        return [...events].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    }

    function getDayMeta(dateStr) {
        const date = new Date(`${dateStr}T00:00:00`);
        const today = startOfDay(new Date());
        const regional = getRegionalCalendarInfo(date, state.settings.region);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isToday = toIsoDate(today.getFullYear(), today.getMonth() + 1, today.getDate()) === dateStr;
        const isPast = date < today;
        const holidayNames = state.settings.showHolidays === "on" ? regional.holidayNames : [];
        const vacationNames = state.settings.showVacations === "on" ? regional.vacationNames : [];

        const titleParts = [];
        if (holidayNames.length) titleParts.push(`Feiertag: ${holidayNames.join(", ")}`);
        if (vacationNames.length) titleParts.push(`Ferien: ${vacationNames.join(", ")}`);
        if (isWeekend) titleParts.push("Wochenende");
        if (isToday) titleParts.push("Heute");
        if (isPast) titleParts.push("Vergangener Tag");

        return {
            isWeekend,
            isToday,
            isPast,
            holidayNames,
            vacationNames,
            title: titleParts.join(" | ") || "Kalendertag"
        };
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function summarizeLabel(entries) {
        if (!entries.length) return "";
        if (entries.length === 1) return entries[0];
        return `${entries[0]} +${entries.length - 1}`;
    }

    function sanitizeEventType(value) {
        if (value === "exam" || value === "test" || value === "deadline" || value === "other") {
            return value;
        }
        return "exam";
    }

    function eventTypeLabel(type) {
        if (type === "test") return "Test";
        if (type === "deadline") return "Abgabe";
        if (type === "other") return "Sonstiges";
        return "Prüfung";
    }

    function syncSidebarToggleState() {
        const mobileExpanded = document.body.classList.contains("sidebar-expanded");
        const desktopCollapsed = document.body.classList.contains("sidebar-collapsed");
        els.sidebarToggle.setAttribute("aria-expanded", mobileExpanded ? "true" : "false");
        if (window.innerWidth <= 920) {
            els.sidebarToggle.textContent = mobileExpanded ? "Menü zu" : "Menü";
        } else {
            els.sidebarToggle.textContent = desktopCollapsed ? "Sidebar öffnen" : "Sidebar zuklappen";
        }
    }

    function classifyScore(score) {
        if (typeof score !== "number") return "";
        if (score >= 11) return "good";
        if (score >= 7) return "mid";
        return "bad";
    }

    function evaluateGoalsProgress() {
        return state.goals.map((goal) => {
            const manualDone = goal.status === "done";
            const parsed = parseGoalTarget(goal.text);
            let ratio = manualDone ? 1 : 0;
            let status = manualDone ? "done" : "open";

            if (parsed) {
                const subject = findSubjectByName(parsed.subjectName);
                const avg = subject ? Number(calculateAverage(subject.notes) || 0) : 0;
                ratio = parsed.targetPoints <= 0 ? 0 : Math.max(0, Math.min(1, avg / parsed.targetPoints));
                if (ratio >= 1) status = "done";
                else if (ratio >= 0.85) status = "near";
            }

            return {
                goal,
                status,
                ratio,
                percent: Math.round(ratio * 100)
            };
        });
    }

    function autoCompleteGoals(goalProgressList) {
        let changed = false;
        goalProgressList.forEach((item) => {
            const nextStoredStatus = item.status === "done" ? "done" : "open";
            if (item.goal.status !== nextStoredStatus) {
                item.goal.status = nextStoredStatus;
                changed = true;
            }
        });
        if (changed) {
            persistGoals(state.goals);
        }
    }

    function parseGoalTarget(text) {
        const normalized = normalizeText(text).toLowerCase();
        if (!normalized) return null;

        const match = normalized.match(/auf\s*(\d+(?:[.,]\d+)?)\s*(punkte|punkt|p)?/i)
            || normalized.match(/(\d+(?:[.,]\d+)?)\s*(punkte|punkt|p)/i);
        if (!match) return null;

        const targetPoints = Number.parseFloat(String(match[1]).replace(",", "."));
        if (!Number.isFinite(targetPoints) || targetPoints <= 0 || targetPoints > 15) return null;

        const subjectName = normalized.includes(":")
            ? normalized.split(":")[0]
            : normalized.split(" auf ")[0];

        return {
            targetPoints,
            subjectName: normalizeText(subjectName)
        };
    }

    function findSubjectByName(name) {
        if (!name) return null;
        const target = name.toLowerCase();
        return state.subjectsStore.subjects.find((subject) => subject.name.toLowerCase() === target)
            || state.subjectsStore.subjects.find((subject) => target.includes(subject.name.toLowerCase()))
            || null;
    }

    function saveDraftsThrottled() {
        if (draftsTimer) {
            clearTimeout(draftsTimer);
        }
        draftsTimer = setTimeout(saveDrafts, 220);
    }

    function saveDrafts() {
        const drafts = {
            subjectName: els.subjectNameInput.value,
            noteValue: els.noteValueInput.value,
            eventDate: els.eventDateInput.value,
            eventText: els.eventTextInput.value,
            goalText: els.goalTextInput.value,
            goalDate: els.goalDateInput.value
        };
        localStorage.setItem("gf_drafts", JSON.stringify(drafts));
    }

    function hydrateDrafts() {
        try {
            const raw = localStorage.getItem("gf_drafts");
            if (!raw) return;
            const drafts = JSON.parse(raw);
            if (!drafts || typeof drafts !== "object") return;
            if (typeof drafts.subjectName === "string") els.subjectNameInput.value = drafts.subjectName;
            if (typeof drafts.noteValue === "string") els.noteValueInput.value = drafts.noteValue;
            if (typeof drafts.eventDate === "string" && drafts.eventDate) els.eventDateInput.value = drafts.eventDate;
            if (typeof drafts.eventText === "string") els.eventTextInput.value = drafts.eventText;
            if (typeof drafts.goalText === "string") els.goalTextInput.value = drafts.goalText;
            if (typeof drafts.goalDate === "string") els.goalDateInput.value = drafts.goalDate;
        } catch (_) {
            // ignore invalid draft storage
        }
    }

    function showToast(message, type = "info") {
        if (!els.appToast) return;
        els.appToast.textContent = message;
        els.appToast.classList.remove("hidden", "success", "info");
        els.appToast.classList.add("is-visible", type);
        if (toastTimer) {
            clearTimeout(toastTimer);
        }
        toastTimer = setTimeout(() => {
            els.appToast.classList.remove("is-visible");
            els.appToast.classList.add("hidden");
        }, 2600);
    }

    function openConfirmModal(message, onConfirm) {
        confirmAction = onConfirm;
        els.confirmMessage.textContent = message;
        els.confirmModal.classList.remove("hidden");
        els.confirmModal.setAttribute("aria-hidden", "false");
        els.confirmOk.focus();
    }

    function closeConfirmModal() {
        confirmAction = null;
        els.confirmModal.classList.add("hidden");
        els.confirmModal.setAttribute("aria-hidden", "true");
    }

    function loadGoals() {
        try {
            const raw = localStorage.getItem("gf_goals");
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .map((entry) => ({
                    id: typeof entry.id === "string" ? entry.id : createId("goal"),
                    text: normalizeText(entry.text),
                    targetDate: isIsoDate(entry.targetDate) ? entry.targetDate : "",
                    status: entry.status === "done" ? "done" : "open",
                    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString()
                }))
                .filter((entry) => entry.text);
        } catch (_) {
            return [];
        }
    }

    function persistGoals(goals) {
        localStorage.setItem("gf_goals", JSON.stringify(goals));
    }

    function exportData() {
        const payload = {
            exportedAt: new Date().toISOString(),
            subjectsStore: state.subjectsStore,
            eventsStore: state.eventsStore,
            settings: state.settings,
            goals: state.goals
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notenplaner-export-${toIsoDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setFeedback(els.settingsFeedback, "Export erstellt.");
    }

    function importData(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || "{}"));
                if (parsed.subjectsStore && typeof parsed.subjectsStore === "object") {
                    state.subjectsStore = parsed.subjectsStore;
                    localStorage.setItem("gf_data", JSON.stringify(state.subjectsStore));
                }
                if (parsed.eventsStore && typeof parsed.eventsStore === "object") {
                    state.eventsStore = parsed.eventsStore;
                    localStorage.setItem("gf_events", JSON.stringify(state.eventsStore));
                }
                if (parsed.settings && typeof parsed.settings === "object") {
                    state.settings = persistSettings(parsed.settings);
                }
                if (Array.isArray(parsed.goals)) {
                    state.goals = parsed.goals;
                    persistGoals(state.goals);
                }

                applyThemeSettings();
                hydrateSettingsForm();
                renderAll();
                setFeedback(els.settingsFeedback, "Import erfolgreich.");
            } catch (_) {
                setFeedback(els.settingsFeedback, "Import fehlgeschlagen: ungültige Datei.", true);
            } finally {
                els.dataImportFile.value = "";
            }
        };
        reader.readAsText(file);
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
}
