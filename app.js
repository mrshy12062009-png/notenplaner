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
    const OFFICIAL_EXAMS_STORAGE_KEY = "gf_official_exams";
    const OFFICIAL_EXAMS_REFRESH_MS = 1000 * 60 * 60 * 24 * 7;
    const BERLIN_MSA_URL = "https://www.berlin-msa.de/termine";
    const BERLIN_MSA_OFFICIAL_PDF = "https://www.berlin.de/sen/bildung/schule/pruefungen-und-abschluesse/pruefungsplan-2026.pdf";
    const BB_MSA_URL = "https://bildungsserver.berlin-brandenburg.de/unterricht/pruefungen/pruefungen-10/pruefungstermine";
    const OFFICIAL_EXAM_SOURCES = {
        BE: { label: "Berlin", url: BERLIN_MSA_URL, pdf: BERLIN_MSA_OFFICIAL_PDF, parser: "berlin" },
        BB: { label: "Brandenburg", url: BB_MSA_URL, pdf: "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/Pruefungen/Pruefungen_10/Pruefungstermine_MSA_BBR_eBBR_2026.pdf", parser: "berlin" },
        BW: { label: "Baden-Württemberg", url: "https://km.baden-wuerttemberg.de/de/schule/realschule/pruefungstermine-", pdf: "", parser: "none" },
        BY: { label: "Bayern", url: "https://www.isb.bayern.de/schularten/realschule/termine/", pdf: "", parser: "none" },
        HB: { label: "Bremen", url: "https://www.bildung.bremen.de/sixcms/media.php/13/11008-Anlage%2090-2025.pdf", pdf: "https://www.bildung.bremen.de/sixcms/media.php/13/11008-Anlage%2090-2025.pdf", parser: "none" },
        HH: { label: "Hamburg", url: "https://www.hamburg.de/politik-und-verwaltung/behoerden/bsfb/themen/zentrale-pruefungen/msa-2026-935302", pdf: "", parser: "none" },
        HE: { label: "Hessen", url: "https://kultus.hessen.de/schulsystem/schulformen-und-bildungsgaenge/hauptschule/hauptschulabschluss/termine-pruefungsabfolge-zaa", pdf: "", parser: "none" },
        MV: { label: "Mecklenburg-Vorpommern", url: "https://www.bildung-mv.de/schule/abschlusspruefungen/index.html", pdf: "", parser: "none" },
        NI: { label: "Niedersachsen", url: "https://www.mk.niedersachsen.de/download/89182/Abschlusspruefungen_2016.pdf", pdf: "https://www.mk.niedersachsen.de/download/89182/Abschlusspruefungen_2016.pdf", parser: "none" },
        NW: { label: "Nordrhein-Westfalen", url: "https://www.standardsicherung.schulministerium.nrw.de/zentrale-pruefungen-am-ende-der-klasse-10-zp10/termine", pdf: "", parser: "none" },
        RP: { label: "Rheinland-Pfalz", url: "https://bildung.rlp.de/", pdf: "", parser: "none" },
        SH: { label: "Schleswig-Holstein", url: "https://www.schleswig-holstein.de/DE/fachinhalte/Z/zentrale_abschluesse/Durchfuehrungsbestimmungen_ESA_MSA", pdf: "", parser: "none" },
        SL: { label: "Saarland", url: "https://www.saarland.de/mbk/DE/portal/schule/", pdf: "", parser: "none" },
        SN: { label: "Sachsen", url: "https://www.schule.sachsen.de/schuljahrestermine-4793.html", pdf: "https://www.revosax.sachsen.de/vorschrift_gesamt/21219/48854.pdf", parser: "none" },
        ST: { label: "Sachsen-Anhalt", url: "https://mb.sachsen-anhalt.de/themen/schule", pdf: "", parser: "none" },
        TH: { label: "Thüringen", url: "https://www.schulportal-thueringen.de/services/resources/download/public/2280298/VVOrgS2526-Anlage_6-1_ABLAUF.pdf", pdf: "https://www.schulportal-thueringen.de/services/resources/download/public/2280298/VVOrgS2526-Anlage_6-1_ABLAUF.pdf", parser: "none" }
    };

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
        goals: loadGoals(),
        studyHelper: loadStudyHelper(),
        examPrep: loadExamPrep(),
        languageHelper: loadLanguageHelper(),
        officialExams: loadOfficialExams()
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
        dashSubjects: document.getElementById("dash-subjects"),
        dashAverage: document.getElementById("dash-average"),
        dashNotes: document.getElementById("dash-notes"),
        dashNextEvent: document.getElementById("dash-next-event"),
        dashNextEventMeta: document.getElementById("dash-next-event-meta"),
        dashOpenGoals: document.getElementById("dash-open-goals"),
        dashStudyOpen: document.getElementById("dash-study-open"),
        dashExams: document.getElementById("dash-exams"),

        detailBanner: document.getElementById("detail-banner"),
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

        focusMinutesInput: document.getElementById("focus-minutes"),
        focusStart: document.getElementById("focus-start"),
        focusPause: document.getElementById("focus-pause"),
        focusStop: document.getElementById("focus-stop"),
        focusReset: document.getElementById("focus-reset"),
        focusDisplay: document.getElementById("focus-display"),
        focusFloating: document.getElementById("focus-floating"),
        focusFloatingTime: document.getElementById("focus-floating-time"),
        focusFloatingStop: document.getElementById("focus-floating-stop"),
        studyForm: document.getElementById("study-form"),
        studySubjectInput: document.getElementById("study-subject"),
        studyMinutesInput: document.getElementById("study-minutes"),
        studyFeedback: document.getElementById("study-feedback"),
        studyList: document.getElementById("study-list"),
        quizSubject: document.getElementById("quiz-subject"),
        quizTopicFocus: document.getElementById("quiz-topic-focus"),
        quizLevel: document.getElementById("quiz-level"),
        quizStyle: document.getElementById("quiz-style"),
        quizQuestion: document.getElementById("quiz-question"),
        quizAnswer: document.getElementById("quiz-answer"),
        quizCheck: document.getElementById("quiz-check"),
        quizNext: document.getElementById("quiz-next"),
        quizHint: document.getElementById("quiz-hint"),
        quizExplain: document.getElementById("quiz-explain"),
        quizAskInput: document.getElementById("quiz-ask-input"),
        quizAskBtn: document.getElementById("quiz-ask-btn"),
        quizAskAnswer: document.getElementById("quiz-ask-answer"),
        quizFeedback: document.getElementById("quiz-feedback"),
        quizStats: document.getElementById("quiz-stats"),
        calcInput: document.getElementById("calc-input"),
        calcEval: document.getElementById("calc-eval"),
        calcResult: document.getElementById("calc-result"),
        dudenInput: document.getElementById("duden-input"),
        dudenLookup: document.getElementById("duden-lookup"),
        dudenResult: document.getElementById("duden-result"),
        examCalcInput: document.getElementById("exam-calc-input"),
        examCalcEval: document.getElementById("exam-calc-eval"),
        examCalcResult: document.getElementById("exam-calc-result"),
        examDudenInput: document.getElementById("exam-duden-input"),
        examDudenLookup: document.getElementById("exam-duden-lookup"),
        examDudenResult: document.getElementById("exam-duden-result"),
        calcKeys: document.querySelectorAll(".calc-key"),

        examForm: document.getElementById("exam-form"),
        examTrack: document.getElementById("exam-track"),
        examItemText: document.getElementById("exam-item-text"),
        examFeedback: document.getElementById("exam-feedback"),
        examList: document.getElementById("exam-list"),
        examProgressFill: document.getElementById("exam-progress-fill"),
        examProgressValue: document.getElementById("exam-progress-value"),
        examThemeProgress: document.getElementById("exam-theme-progress"),
        examTutorTrack: document.getElementById("exam-tutor-track"),
        examTutorSubject: document.getElementById("exam-tutor-subject"),
        examTutorLevel: document.getElementById("exam-tutor-level"),
        examTutorQuestion: document.getElementById("exam-tutor-question"),
        examTutorAnswer: document.getElementById("exam-tutor-answer"),
        examTutorCheck: document.getElementById("exam-tutor-check"),
        examTutorNext: document.getElementById("exam-tutor-next"),
        examTutorHint: document.getElementById("exam-tutor-hint"),
        examTutorAskInput: document.getElementById("exam-tutor-ask-input"),
        examTutorAskBtn: document.getElementById("exam-tutor-ask-btn"),
        examTutorAskAnswer: document.getElementById("exam-tutor-ask-answer"),
        examTutorFeedback: document.getElementById("exam-tutor-feedback"),
        examTutorStats: document.getElementById("exam-tutor-stats"),
        examFocusMinutesInput: document.getElementById("exam-focus-minutes"),
        examFocusStart: document.getElementById("exam-focus-start"),
        examFocusPause: document.getElementById("exam-focus-pause"),
        examFocusStop: document.getElementById("exam-focus-stop"),
        examFocusReset: document.getElementById("exam-focus-reset"),
        examFocusDisplay: document.getElementById("exam-focus-display"),
        officialExamsRefresh: document.getElementById("official-exams-refresh"),
        officialExamsImport: document.getElementById("official-exams-import"),
        officialExamsRegion: document.getElementById("official-exams-region"),
        officialExamsStatus: document.getElementById("official-exams-status"),
        officialExamsList: document.getElementById("official-exams-list"),
        examOralFocusMinutesInput: document.getElementById("exam-oral-focus-minutes"),
        examOralFocusStart: document.getElementById("exam-oral-focus-start"),
        examOralFocusPause: document.getElementById("exam-oral-focus-pause"),
        examOralFocusStop: document.getElementById("exam-oral-focus-stop"),
        examOralFocusReset: document.getElementById("exam-oral-focus-reset"),
        examOralFocusDisplay: document.getElementById("exam-oral-focus-display"),
        examTabButtons: document.querySelectorAll(".exam-tab-btn"),
        examPanelWritten: document.getElementById("exam-panel-written"),
        examPanelOral: document.getElementById("exam-panel-oral"),
        oralTrack: document.getElementById("oral-track"),
        oralLanguage: document.getElementById("oral-language"),
        oralTopic: document.getElementById("oral-topic"),
        oralGenerate: document.getElementById("oral-generate"),
        oralNextQuestion: document.getElementById("oral-next-question"),
        oralPrompt: document.getElementById("oral-prompt"),
        oralTeacherQuestion: document.getElementById("oral-teacher-question"),
        oralPresentationFile: document.getElementById("oral-presentation-file"),
        oralSlideCount: document.getElementById("oral-slide-count"),
        oralSlideSeconds: document.getElementById("oral-slide-seconds"),
        oralSlideStart: document.getElementById("oral-slide-start"),
        oralSlideStop: document.getElementById("oral-slide-stop"),
        oralSlideNext: document.getElementById("oral-slide-next"),
        oralSlideStatus: document.getElementById("oral-slide-status"),
        oralSlidePreview: document.getElementById("oral-slide-preview"),
        oralSlidePreviewHint: document.getElementById("oral-slide-preview-hint"),
        oralPronunciationRecord: document.getElementById("oral-pronunciation-record"),
        oralPronunciationStop: document.getElementById("oral-pronunciation-stop"),
        oralPronunciationText: document.getElementById("oral-pronunciation-text"),
        oralPronunciationCheck: document.getElementById("oral-pronunciation-check"),
        oralPronunciationFeedback: document.getElementById("oral-pronunciation-feedback"),
        langMode: document.getElementById("lang-mode"),
        langLevel: document.getElementById("lang-level"),
        langNext: document.getElementById("lang-next"),
        langQuestion: document.getElementById("lang-question"),
        langFeedback: document.getElementById("lang-feedback"),
        langRecordStart: document.getElementById("lang-record-start"),
        langRecordStop: document.getElementById("lang-record-stop"),
        langTranscript: document.getElementById("lang-transcript"),
        langPronCheck: document.getElementById("lang-pron-check"),
        langPronFeedback: document.getElementById("lang-pron-feedback"),
        langPresentationTools: document.getElementById("lang-presentation-tools"),
        langPresentationFile: document.getElementById("lang-presentation-file"),
        langSlideCount: document.getElementById("lang-slide-count"),
        langSlideSeconds: document.getElementById("lang-slide-seconds"),
        langPresentationStart: document.getElementById("lang-presentation-start"),
        langPresentationStop: document.getElementById("lang-presentation-stop"),
        langPresentationNext: document.getElementById("lang-presentation-next"),
        langPresentationStatus: document.getElementById("lang-presentation-status"),
        langPresentationPreviewHint: document.getElementById("lang-presentation-preview-hint"),
        langPresentationPreview: document.getElementById("lang-presentation-preview"),
        langPresentationFeedback: document.getElementById("lang-presentation-feedback"),
        langTeacherQuestion: document.getElementById("lang-teacher-question"),
        langTeacherAnswer: document.getElementById("lang-teacher-answer"),
        langTeacherSubmit: document.getElementById("lang-teacher-submit"),
        langTeacherNext: document.getElementById("lang-teacher-next"),
        langTeacherLog: document.getElementById("lang-teacher-log"),

        confirmModal: document.getElementById("confirm-modal"),
        confirmMessage: document.getElementById("confirm-message"),
        confirmOk: document.getElementById("confirm-ok"),
        confirmCancel: document.getElementById("confirm-cancel"),
        appToast: document.getElementById("app-toast")
    };
    let confirmAction = null;
    let toastTimer = null;
    let draftsTimer = null;
    let focusTimer = null;
    let oralSlideTimer = null;
    let oralPreviewUrl = "";
    let langPresentationTimer = null;
    let langPresentationPreviewUrl = "";
    let oralRecognition = null;
    let languageRecognition = null;
    let focusLockActive = false;

    applyThemeSettings();
    closeConfirmModal();
    if (window.innerWidth <= 1200 && window.innerWidth > 920) {
        document.body.classList.add("sidebar-collapsed");
    }
    applyResponsiveLayoutState();
    syncSidebarToggleState();
    hydrateSettingsForm();
    hydrateDrafts();
    updateSelectedDayUI();
    hydrateExamPrepUI();
    hydrateLanguageUI();
    maybeRefreshOfficialExams();
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
            applyResponsiveLayoutState();
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

        els.backDashboard.addEventListener("click", () => showPage("subjects"));
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

        els.focusStart.addEventListener("click", startFocusTimer);
        els.focusPause.addEventListener("click", pauseFocusTimer);
        els.focusStop.addEventListener("click", stopFocusTimer);
        els.focusReset.addEventListener("click", resetFocusTimer);
        els.focusFloatingStop.addEventListener("click", stopFocusTimer);
        els.focusMinutesInput.addEventListener("change", resetFocusTimer);
        els.examFocusStart.addEventListener("click", () => startFocusTimer("exam"));
        els.examFocusPause.addEventListener("click", pauseFocusTimer);
        els.examFocusStop.addEventListener("click", stopFocusTimer);
        els.examFocusReset.addEventListener("click", () => resetFocusTimer("exam"));
        els.examFocusMinutesInput.addEventListener("change", () => resetFocusTimer("exam"));
        if (els.officialExamsRegion) {
            els.officialExamsRegion.addEventListener("change", () => {
                renderOfficialExamDates();
                fetchOfficialExamDates(getOfficialExamRegion(), false);
            });
        }
        if (els.officialExamsRefresh) {
            els.officialExamsRefresh.addEventListener("click", () => fetchOfficialExamDates(getOfficialExamRegion(), true));
        }
        if (els.officialExamsImport) {
            els.officialExamsImport.addEventListener("click", importOfficialExamDates);
        }
        els.examOralFocusStart.addEventListener("click", () => startFocusTimer("exam_oral"));
        els.examOralFocusPause.addEventListener("click", pauseFocusTimer);
        els.examOralFocusStop.addEventListener("click", stopFocusTimer);
        els.examOralFocusReset.addEventListener("click", () => resetFocusTimer("exam_oral"));
        els.examOralFocusMinutesInput.addEventListener("change", () => resetFocusTimer("exam_oral"));

        els.studyForm.addEventListener("submit", onStudySubmit);
        els.studySubjectInput.addEventListener("input", saveDraftsThrottled);
        els.studyMinutesInput.addEventListener("input", saveDraftsThrottled);
        els.quizSubject.addEventListener("change", () => {
            generateNewQuizTask();
        });
        els.quizTopicFocus.addEventListener("input", saveDraftsThrottled);
        els.quizLevel.addEventListener("change", () => {
            generateNewQuizTask();
        });
        els.quizStyle.addEventListener("change", () => {
            generateNewQuizTask();
        });
        els.quizAnswer.addEventListener("input", saveDraftsThrottled);
        els.quizAskInput.addEventListener("input", saveDraftsThrottled);
        els.quizCheck.addEventListener("click", checkQuizAnswer);
        els.quizNext.addEventListener("click", generateNewQuizTask);
        els.quizHint.addEventListener("click", showQuizHint);
        els.quizExplain.addEventListener("click", showQuizExplanation);
        els.quizAskBtn.addEventListener("click", answerQuizTutorQuestion);
        els.quizAskInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                answerQuizTutorQuestion();
            }
        });
        els.calcEval.addEventListener("click", evaluateCalculator);
        els.calcInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                evaluateCalculator();
            }
        });
        if (els.examCalcEval && els.examCalcInput && els.examCalcResult) {
            els.examCalcEval.addEventListener("click", () => evaluateCalculatorFor(els.examCalcInput, els.examCalcResult));
            els.examCalcInput.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    evaluateCalculatorFor(els.examCalcInput, els.examCalcResult);
                }
            });
        }
        els.calcKeys.forEach((button) => {
            button.addEventListener("click", () => onCalcKeyPress(button));
        });
        if (els.dudenLookup && els.dudenInput && els.dudenResult) {
            els.dudenLookup.addEventListener("click", lookupDudenWord);
            els.dudenInput.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    lookupDudenWord();
                }
            });
            els.dudenResult.addEventListener("click", (event) => {
                const btn = event.target.closest("[data-action='duden-suggest']");
                if (!btn) return;
                const word = btn.dataset.word;
                if (!word) return;
                els.dudenInput.value = word;
                lookupDudenWord();
            });
        }
        if (els.examDudenLookup && els.examDudenInput && els.examDudenResult) {
            els.examDudenLookup.addEventListener("click", () => lookupDudenWordFor(els.examDudenInput, els.examDudenResult));
            els.examDudenInput.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    lookupDudenWordFor(els.examDudenInput, els.examDudenResult);
                }
            });
            els.examDudenResult.addEventListener("click", (event) => {
                const btn = event.target.closest("[data-action='duden-suggest']");
                if (!btn) return;
                const word = btn.dataset.word;
                if (!word) return;
                els.examDudenInput.value = word;
                lookupDudenWordFor(els.examDudenInput, els.examDudenResult);
            });
        }
        els.studyList.addEventListener("click", (event) => {
            const action = event.target.dataset.action;
            const id = event.target.dataset.id;
            if (!action || !id) return;
            if (action === "delete-study") deleteStudySession(id);
        });

        els.examTrack.addEventListener("change", () => {
            state.examPrep.activeTrack = els.examTrack.value;
            persistExamPrep(state.examPrep);
            renderExamPrep();
            setFeedback(els.examFeedback, `${els.examTrack.value} ausgewählt.`);
        });
        els.examTutorTrack.addEventListener("change", () => {
            generateExamTutorTask();
        });
        els.examTutorSubject.addEventListener("change", () => {
            generateExamTutorTask();
        });
        els.examTutorLevel.addEventListener("change", () => {
            generateExamTutorTask();
        });
        els.examTutorAnswer.addEventListener("input", saveDraftsThrottled);
        els.examTutorAskInput.addEventListener("input", saveDraftsThrottled);
        els.examTutorCheck.addEventListener("click", checkExamTutorAnswer);
        els.examTutorNext.addEventListener("click", generateExamTutorTask);
        els.examTutorHint.addEventListener("click", showExamTutorHint);
        els.examTutorAskBtn.addEventListener("click", answerExamTutorQuestion);
        els.examTutorAskInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                answerExamTutorQuestion();
            }
        });
        els.examItemText.addEventListener("input", saveDraftsThrottled);
        els.examForm.addEventListener("submit", onExamItemSubmit);
        els.examList.addEventListener("click", (event) => {
            const action = event.target.dataset.action;
            const id = event.target.dataset.id;
            if (!action || !id) return;
            if (action === "delete-exam-item") deleteExamItem(id);
        });
        els.examTabButtons.forEach((button) => {
            button.addEventListener("click", () => {
                setExamTab(button.dataset.tab || "written");
            });
        });
        els.oralTrack.addEventListener("change", () => {
            state.examPrep.oral.track = els.oralTrack.value;
            state.examPrep = persistExamPrep(state.examPrep);
            renderOralCoach();
        });
        els.oralLanguage.addEventListener("change", () => {
            state.examPrep.oral.language = els.oralLanguage.value;
            state.examPrep = persistExamPrep(state.examPrep);
            renderOralCoach();
        });
        els.oralTopic.addEventListener("change", saveDraftsThrottled);
        els.oralGenerate.addEventListener("click", generateOralSession);
        els.oralNextQuestion.addEventListener("click", nextTeacherQuestion);
        els.oralSlideStart.addEventListener("click", startOralSlides);
        els.oralSlideStop.addEventListener("click", stopOralSlides);
        els.oralSlideNext.addEventListener("click", advanceOralSlide);
        els.oralSlideCount.addEventListener("change", renderOralCoach);
        els.oralSlideSeconds.addEventListener("change", renderOralCoach);
        els.oralPresentationFile.addEventListener("change", onOralFileChange);
        els.oralPronunciationRecord.addEventListener("click", startPronunciationCapture);
        els.oralPronunciationStop.addEventListener("click", stopPronunciationCapture);
        els.oralPronunciationCheck.addEventListener("click", analyzePronunciationText);
        els.oralPronunciationText.addEventListener("input", saveDraftsThrottled);
        els.langMode.addEventListener("change", () => generateLanguageTask(true));
        els.langLevel.addEventListener("change", () => generateLanguageTask(true));
        els.langNext.addEventListener("click", () => generateLanguageTask(true));
        els.langRecordStart.addEventListener("click", startLanguageRecording);
        els.langRecordStop.addEventListener("click", stopLanguageRecording);
        els.langPronCheck.addEventListener("click", analyzeLanguagePronunciation);
        els.langTranscript.addEventListener("input", saveDraftsThrottled);
        els.langPresentationFile.addEventListener("change", onLanguagePresentationFileChange);
        els.langSlideCount.addEventListener("change", renderLanguagePage);
        els.langSlideSeconds.addEventListener("change", renderLanguagePage);
        els.langPresentationStart.addEventListener("click", startLanguagePresentationRun);
        els.langPresentationStop.addEventListener("click", stopLanguagePresentationRun);
        els.langPresentationNext.addEventListener("click", nextLanguagePresentationSlide);
        els.langTeacherSubmit.addEventListener("click", submitLanguageTeacherAnswer);
        els.langTeacherNext.addEventListener("click", nextLanguageTeacherQuestion);

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
        renderQuizSubjectOptions();
        renderSubjectDetail();
        renderCalendar();
        renderEventList();
        renderDashboardSummary();
        renderStats();
        renderGoalSubjects();
        renderGoals();
        renderStudyHelper();
        renderExamPrep();
        renderExamTutor();
        renderOralCoach();
        renderLanguagePage();
        renderQuizCard();
    }

    function showPage(pageId) {
        if (focusLockActive && pageId !== "helper" && pageId !== "exams") {
            pageId = "helper";
        }
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
            renderDashboardSummary();
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
        renderQuizSubjectOptions();
        renderDashboardSummary();
    }

    function renderSubjectDetail() {
        const subject = getCurrentSubject();
        const bannerClasses = ["detail-good", "detail-mid", "detail-bad", "detail-none"];
        if (els.detailBanner) {
            els.detailBanner.classList.remove(...bannerClasses);
        }
        if (!subject) {
            els.detailHeading.textContent = "Fachdetails";
            els.detailAverage.textContent = "Schnitt: -";
            if (els.detailBanner) {
                els.detailBanner.classList.add("detail-none");
            }
            els.noteList.innerHTML = createEmptyState("Wähle zuerst ein Fach in Noten.");
            return;
        }

        els.detailHeading.textContent = subject.name;
        const avg = calculateAverage(subject.notes);
        const avgClass = classifyScore(avg);
        els.detailAverage.innerHTML = `Schnitt: <span class="${avgClass ? `score-${avgClass}` : ""}">${avg ?? "--"}</span>`;
        if (els.detailBanner) {
            els.detailBanner.classList.add(avgClass ? `detail-${avgClass}` : "detail-none");
        }

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
            renderDashboardSummary();
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
        renderDashboardSummary();
    }

    function renderStats() {
        const subjects = state.subjectsStore.subjects;
        const notes = subjects.flatMap((subject) => subject.notes || []);
        const allEvents = Object.values(state.eventsStore.events).flat();
        const goalProgressList = evaluateGoalsProgress();
        autoCompleteGoals(goalProgressList);
        const studyOpen = state.studyHelper.sessions.filter((entry) => !entry.done).length;
        const activeExamItems = getExamItems(state.examPrep.activeTrack);
        const examDone = activeExamItems.filter((entry) => entry.done).length;
        const examPercent = activeExamItems.length ? Math.round((examDone / activeExamItems.length) * 100) : 0;
        const examTutorReady = state.examPrep.tutor?.stats?.readiness || 0;
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
            { label: "Erreichte Ziele", value: String(doneGoals) },
            { label: "Lernblöcke offen", value: String(studyOpen) },
            { label: `${state.examPrep.activeTrack}-Fortschritt`, value: `${examPercent}%` },
            { label: "Prüfungsreife", value: `${examTutorReady}%` }
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
        renderDashboardSummary();
    }

    function renderGoals() {
        if (!state.goals.length) {
            els.goalList.innerHTML = createEmptyState("Noch keine Ziele gesetzt.");
            renderDashboardSummary();
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
        renderDashboardSummary();
    }

    function renderDashboardSummary() {
        if (!els.dashSubjects) return;
        const subjects = state.subjectsStore.subjects || [];
        const allNotes = subjects.flatMap((subject) => subject.notes || []);
        const avg = calculateAverage(allNotes);
        const avgText = avg ? String(avg) : "-";
        const goalProgressList = evaluateGoalsProgress();
        const openGoals = goalProgressList.filter((goal) => goal.status === "open").length;
        const studyOpen = state.studyHelper.sessions.filter((entry) => !entry.done).length;
        const nowIso = toIsoDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        const upcomingExams = Object.keys(state.eventsStore.events).reduce((count, date) => {
            if (date < nowIso) return count;
            const exams = (state.eventsStore.events[date] || []).filter((entry) => (entry.type || "exam") === "exam").length;
            return count + exams;
        }, 0);

        els.dashSubjects.textContent = String(subjects.length);
        els.dashAverage.textContent = avgText;
        els.dashNotes.textContent = String(allNotes.length);
        els.dashOpenGoals.textContent = String(openGoals);
        els.dashStudyOpen.textContent = String(studyOpen);
        els.dashExams.textContent = String(upcomingExams);

        const next = findNextUpcomingEvent();
        if (next) {
            els.dashNextEvent.textContent = next.title;
            els.dashNextEventMeta.textContent = `${formatDate(next.date)} · ${next.typeLabel}`;
        } else {
            els.dashNextEvent.textContent = "-";
            els.dashNextEventMeta.textContent = "Keine Termine";
        }
    }

    function findNextUpcomingEvent() {
        const today = toIsoDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        const dates = Object.keys(state.eventsStore.events).filter((date) => date >= today).sort();
        if (!dates.length) return null;
        const firstDate = dates[0];
        const events = getEventsForDate(firstDate);
        if (!events.length) return null;
        const item = events[0];
        return {
            date: firstDate,
            title: item.text || "Termin",
            typeLabel: eventTypeLabel(item.type || "exam")
        };
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
                <div class="chart-row chart-row-goal">
                    <span class="chart-label chart-label-goal" title="${escapeHtml(row.label)}">${escapeHtml(row.label)}</span>
                    <div class="chart-track"><div class="chart-fill chart-goal-${row.status}" style="width:${Math.max(4, row.percent)}%"></div></div>
                    <span class="chart-value">${row.percent}%</span>
                </div>
            `)
            .join("");
    }

    function renderStudyHelper() {
        const sessions = Array.isArray(state.studyHelper.sessions) ? state.studyHelper.sessions : [];
        if (!sessions.length) {
            els.studyList.innerHTML = createEmptyState("Noch keine Lernblöcke geplant.");
        } else {
            els.studyList.innerHTML = sessions
                .slice()
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((entry) => `
                    <article class="list-item ${entry.done ? "goal-item done" : ""}">
                        <strong>${escapeHtml(entry.subject)}</strong>
                        <p class="list-meta">${entry.minutes} Minuten · ${entry.done ? "Abgeschlossen" : "Offen"}</p>
                        <div class="row-actions">
                            <button class="btn btn-ghost" data-action="delete-study" data-id="${entry.id}" type="button">Löschen</button>
                        </div>
                    </article>
                `)
                .join("");
        }

        const remaining = Math.max(0, Number.parseInt(state.studyHelper.focusRemainingSec, 10) || 0);
        const timeText = formatDuration(remaining);
        els.focusDisplay.textContent = timeText;
        if (els.examFocusDisplay) {
            els.examFocusDisplay.textContent = timeText;
        }
        if (els.examOralFocusDisplay) {
            els.examOralFocusDisplay.textContent = timeText;
        }
        if (els.focusFloatingTime) {
            els.focusFloatingTime.textContent = timeText;
        }
    }

    function renderQuizCard() {
        if (!state.studyHelper.quiz || !state.studyHelper.quiz.currentTask) {
            generateNewQuizTask(false);
        }
        const task = state.studyHelper.quiz.currentTask;
        els.quizQuestion.innerHTML = `
            <p><strong>Mini-Erklärung:</strong> ${escapeHtml(task.lesson || "Wir lösen die Aufgabe Schritt für Schritt.")}</p>
            <p><strong>Aufgabe:</strong> ${escapeHtml(task.question)}</p>
        `;
        const stats = state.studyHelper.quiz.stats;
        const total = stats.correct + stats.wrong;
        const quote = total ? Math.round((stats.correct / total) * 100) : 0;
        els.quizStats.textContent = `Richtig: ${stats.correct} · Falsch: ${stats.wrong} · Trefferquote: ${quote}% · Serie: ${stats.streak} · Punkte: ${stats.points || 0}`;
        if (!els.quizFeedback.textContent) {
            els.quizFeedback.innerHTML = "<p>Antworte auf die Aufgabe. Bei Fehler bekommst du einen Lernhinweis.</p>";
        }
    }

    function getOfficialExamRegion() {
        const uiValue = els.officialExamsRegion?.value;
        if (uiValue === "ALL") return "ALL";
        if (uiValue && OFFICIAL_EXAM_SOURCES[uiValue]) return uiValue;
        const settingValue = state.settings.region;
        if (settingValue === "ALL") return "ALL";
        if (settingValue && OFFICIAL_EXAM_SOURCES[settingValue]) return settingValue;
        return "BE";
    }

    function getOfficialExamStateData(code) {
        const byState = state.officialExams.byState || {};
        if (!byState[code]) {
            byState[code] = {
                source: "",
                officialPdf: "",
                updatedAt: 0,
                status: "",
                items: []
            };
        }
        return byState[code];
    }

    function maybeRefreshOfficialExams() {
        refreshOfficialExamsForAll();
        const region = getOfficialExamRegion();
        if (region === "ALL") {
            renderOfficialExamDates();
            return;
        }
        const stateData = getOfficialExamStateData(region);
        const lastUpdate = Number.isFinite(stateData.updatedAt) ? stateData.updatedAt : 0;
        if (!lastUpdate || Date.now() - lastUpdate > OFFICIAL_EXAMS_REFRESH_MS) {
            fetchOfficialExamDates(region, false);
        } else {
            renderOfficialExamDates();
        }
    }

    async function refreshOfficialExamsForAll() {
        const codes = Object.keys(OFFICIAL_EXAM_SOURCES);
        for (const code of codes) {
            const stateData = getOfficialExamStateData(code);
            const lastUpdate = Number.isFinite(stateData.updatedAt) ? stateData.updatedAt : 0;
            if (!lastUpdate || Date.now() - lastUpdate > OFFICIAL_EXAMS_REFRESH_MS) {
                await fetchOfficialExamDates(code, false);
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        }
    }

    function parseGermanDateNumber(value) {
        const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (!match) return "";
        const day = Number.parseInt(match[1], 10);
        const month = Number.parseInt(match[2], 10);
        const year = Number.parseInt(match[3], 10);
        return toIsoDate(year, month, day);
    }

    function parseGermanDateLong(value) {
        const monthMap = {
            januar: 1,
            februar: 2,
            maerz: 3,
            märz: 3,
            april: 4,
            mai: 5,
            juni: 6,
            juli: 7,
            august: 8,
            september: 9,
            oktober: 10,
            november: 11,
            dezember: 12
        };
        const match = value.toLowerCase().match(/(\d{1,2})\.\s*([a-zäöüß]+)\s*(\d{4})/i);
        if (!match) return "";
        const day = Number.parseInt(match[1], 10);
        const month = monthMap[match[2]];
        const year = Number.parseInt(match[3], 10);
        if (!month) return "";
        return toIsoDate(year, month, day);
    }

    function stripHtmlToText(html) {
        return html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<\/p>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function extractBetween(text, startToken, endToken) {
        const startIndex = text.indexOf(startToken);
        if (startIndex === -1) return "";
        const endIndex = endToken ? text.indexOf(endToken, startIndex + startToken.length) : -1;
        if (endIndex === -1) return text.slice(startIndex);
        return text.slice(startIndex, endIndex);
    }

    function parseExamBlock(text, track) {
        const items = [];
        const subjects = [
            { key: "Deutsch", label: "Deutsch" },
            { key: "Mathematik", label: "Mathe" },
            { key: "1. Fremdsprache", label: "Englisch" }
        ];
        subjects.forEach((subject) => {
            const mainMatch = text.match(new RegExp(`${subject.key}\\s+[A-Za-zäöüÄÖÜß]+,?\\s*(\\d{2}\\.\\d{2}\\.\\d{4})`));
            if (mainMatch) {
                items.push({
                    track,
                    subject: subject.label,
                    date: parseGermanDateNumber(mainMatch[1]),
                    kind: "exam",
                    note: ""
                });
            }
            const makeUpMatch = text.match(new RegExp(`Nachtermin\\s*:\\s*${subject.key}\\s+[A-Za-zäöüÄÖÜß]+,?\\s*(\\d{2}\\.\\d{2}\\.\\d{4})`));
            if (makeUpMatch) {
                items.push({
                    track,
                    subject: `${subject.label} (Nachtermin)`,
                    date: parseGermanDateNumber(makeUpMatch[1]),
                    kind: "makeup",
                    note: ""
                });
            }
        });
        if (!items.length) {
            const fallbackMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/g) || [];
            fallbackMatch.slice(0, 3).forEach((value, index) => {
                items.push({
                    track,
                    subject: ["Deutsch", "Mathe", "Englisch"][index] || "Prüfung",
                    date: parseGermanDateNumber(value),
                    kind: "exam",
                    note: ""
                });
            });
        }
        return items.filter((entry) => entry.date);
    }

    async function fetchOfficialExamDates(region, force = true) {
        const code = OFFICIAL_EXAM_SOURCES[region] ? region : "BE";
        const source = OFFICIAL_EXAM_SOURCES[code];
        const stateData = getOfficialExamStateData(code);
        if (!force && stateData.status === "loading") return;
        if (!source.url) {
            stateData.status = "Quelle für dieses Bundesland ist noch nicht hinterlegt.";
            stateData.updatedAt = Date.now();
            state.officialExams = persistOfficialExams(state.officialExams);
            renderOfficialExamDates();
            return;
        }
        stateData.status = "loading";
        state.officialExams = persistOfficialExams(state.officialExams);
        renderOfficialExamDates();
        try {
            const backendPayload = await fetchBackendJson(`/api/official-exams?state=${encodeURIComponent(code)}`);
            if (backendPayload && Array.isArray(backendPayload.items)) {
                stateData.source = backendPayload.source || source.url;
                stateData.officialPdf = backendPayload.officialPdf || source.pdf || "";
                stateData.updatedAt = Number.isFinite(backendPayload.updatedAt) ? backendPayload.updatedAt : Date.now();
                stateData.status = backendPayload.status || "";
                stateData.items = backendPayload.items;
                state.officialExams = persistOfficialExams(state.officialExams);
                renderOfficialExamDates();
                showToast("Offizielle Termine aktualisiert.", "info");
                return;
            }
            const response = await fetch(source.url, { cache: "no-store" });
            if (!response.ok) throw new Error("Laden fehlgeschlagen.");
            const html = await response.text();
            const text = stripHtmlToText(html);
            const msaBlock = extractBetween(text, "MSA Abschlussprüfung", "eBBR Abschlussprüfung") || text;
            const ebbrBlock = extractBetween(text, "eBBR Abschlussprüfung", "BBR Abschlussprüfung") || "";
            const items = source.parser === "berlin"
                ? [
                    ...parseExamBlock(msaBlock, "MSA"),
                    ...parseExamBlock(ebbrBlock, "eBBR")
                ]
                : [];
            const updatedMatch = text.match(/Zuletzt aktualisiert:\\s*([^·]+?\\d{4})/i);
            const updatedAt = updatedMatch ? parseGermanDateLong(updatedMatch[1]) : "";
            stateData.source = source.url;
            stateData.officialPdf = source.pdf || "";
            stateData.updatedAt = updatedAt ? new Date(updatedAt).getTime() : Date.now();
            stateData.status = items.length ? "" : "Keine Termine erkannt. Quelle prüfen.";
            stateData.items = items;
            state.officialExams = persistOfficialExams(state.officialExams);
            renderOfficialExamDates();
            showToast("Offizielle Termine aktualisiert.", "info");
        } catch (error) {
            stateData.status = "Fehler beim Laden. Prüfe Internetverbindung oder CORS.";
            stateData.updatedAt = Date.now();
            state.officialExams = persistOfficialExams(state.officialExams);
            renderOfficialExamDates();
        }
    }

    function renderOfficialExamDates() {
        if (!els.officialExamsList || !els.officialExamsStatus) return;
        const region = getOfficialExamRegion();
        if (els.officialExamsRegion && els.officialExamsRegion.value !== region) {
            els.officialExamsRegion.value = region;
        }
        if (region === "ALL") {
            const cards = Object.entries(OFFICIAL_EXAM_SOURCES).map(([code, meta]) => {
                const stateData = getOfficialExamStateData(code);
                const items = Array.isArray(stateData.items) ? stateData.items : [];
                const stand = stateData.updatedAt ? formatDate(new Date(stateData.updatedAt).toISOString().slice(0, 10)) : "—";
                const source = stateData.source || meta.url || "Quelle fehlt";
                const listHtml = items.length
                    ? items
                        .slice(0, 6)
                        .map((item) => {
                            const dateText = item.date ? formatDate(item.date) : "Schulintern";
                            return `<div class="list-meta">${escapeHtml(item.track)} · ${escapeHtml(item.subject)} · ${dateText}</div>`;
                        })
                        .join("")
                    : "<div class=\"list-meta\">Keine Termine geladen.</div>";
                return `
                    <article class="list-item">
                        <strong>${escapeHtml(meta.label || code)}</strong>
                        <p class="list-meta">Stand: ${stand} · Quelle: ${escapeHtml(source)}</p>
                        ${listHtml}
                    </article>
                `;
            }).join("");
            els.officialExamsStatus.textContent = "Alle 16 Bundesländer · Stand/Quelle pro Bundesland.";
            els.officialExamsList.innerHTML = cards || createEmptyState("Noch keine offiziellen Termine geladen.");
            return;
        }
        const sourceMeta = OFFICIAL_EXAM_SOURCES[region] || {};
        const stateData = getOfficialExamStateData(region);
        const { items, updatedAt, source, status, officialPdf } = stateData;
        const statusParts = [];
        statusParts.push(`Bundesland: ${sourceMeta.label || region}`);
        if (updatedAt) {
            statusParts.push(`Stand: ${formatDate(new Date(updatedAt).toISOString().slice(0, 10))}`);
        }
        if (source) {
            statusParts.push(`Quelle: ${source}`);
        }
        if (officialPdf) {
            statusParts.push("Offizieller Prüfungsplan: PDF hinterlegt");
        }
        if (status) {
            statusParts.push(status);
        }
        els.officialExamsStatus.textContent = statusParts.join(" · ") || "Noch keine Online-Termine geladen.";
        if (!items || !items.length) {
            els.officialExamsList.innerHTML = createEmptyState("Keine offiziellen Termine geladen.");
            return;
        }
        const sorted = [...items].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        els.officialExamsList.innerHTML = sorted.map((item) => {
            const dateText = item.date ? formatDate(item.date) : "Schulintern";
            return `
                <article class="list-item">
                    <strong>${escapeHtml(item.track)} · ${escapeHtml(item.subject)}</strong>
                    <p class="list-meta">${dateText}${item.kind === "makeup" ? " · Nachtermin" : ""}</p>
                </article>
            `;
        }).join("");
    }

    function importOfficialExamDates() {
        const region = getOfficialExamRegion();
        const stateData = getOfficialExamStateData(region);
        const items = Array.isArray(stateData.items) ? stateData.items : [];
        if (!items.length) {
            showToast("Keine offiziellen Termine vorhanden.", "info");
            return;
        }
        let added = 0;
        items.forEach((item) => {
            if (!item.date) return;
            const text = `${item.track} ${item.subject}`;
            const exists = state.eventsStore.events.some((event) => event.date === item.date && normalizeText(event.text) === normalizeText(text));
            if (exists) return;
            state.eventsStore.events.push({
                id: createId("event"),
                date: item.date,
                text,
                type: "exam",
                priority: "high"
            });
            added += 1;
        });
        if (added) {
            state.eventsStore = persistEvents(state.eventsStore);
            renderCalendar();
            renderEventList();
            renderDashboardSummary();
            showToast(`Offizielle Termine übernommen (${added}).`, "info");
        } else {
            showToast("Termine waren bereits im Kalender.", "info");
        }
    }

    function generateNewQuizTask(clearFeedback = true) {
        const subjectKey = els.quizSubject.value || "mix";
        const topicFocus = normalizeText(els.quizTopicFocus.value);
        const level = Number.parseInt(els.quizLevel.value, 10) || 3;
        const style = els.quizStyle.value || "coach";
        const currentTask = createQuizTask(subjectKey, level, style, topicFocus);
        state.studyHelper.quiz = state.studyHelper.quiz || { currentTask: null, stats: { correct: 0, wrong: 0, streak: 0, points: 0 } };
        state.studyHelper.quiz.currentTask = currentTask;
        state.studyHelper = persistStudyHelper(state.studyHelper);
        els.quizAnswer.value = "";
        if (clearFeedback) {
            els.quizFeedback.innerHTML = "<p>Neue Lernaufgabe ist bereit.</p>";
        }
        renderQuizCard();
        saveDraftsThrottled();
    }

    function checkQuizAnswer() {
        const userInput = normalizeText(els.quizAnswer.value);
        if (!userInput) {
            els.quizFeedback.innerHTML = "<p>Bitte eine Antwort eingeben.</p>";
            return;
        }

        const task = state.studyHelper.quiz?.currentTask;
        if (!task) {
            generateNewQuizTask();
            return;
        }

        const isCorrect = validateQuizAnswer(task, userInput);
        const stats = state.studyHelper.quiz.stats;
        if (isCorrect) {
            stats.correct += 1;
            stats.streak += 1;
            stats.points = (stats.points || 0) + (task.reward || 10);
            els.quizFeedback.innerHTML = `<p><strong>Richtig.</strong> ${escapeHtml(task.successTip || "Stark gelöst.")}</p>`;
            showToast("Richtig beantwortet.", "success");
        } else {
            stats.wrong += 1;
            stats.streak = 0;
            stats.points = Math.max(0, (stats.points || 0) - 3);
            els.quizFeedback.innerHTML = `
                <p><strong>Noch nicht richtig.</strong> Richtige Antwort: <strong>${escapeHtml(String(task.solutionLabel))}</strong></p>
                <p>${escapeHtml(task.hint || "Tipp: Schritt für Schritt arbeiten.")}</p>
            `;
            showToast("Nicht richtig. Versuch die nächste Aufgabe.", "info");
        }
        state.studyHelper = persistStudyHelper(state.studyHelper);
        renderQuizCard();
    }

    function showQuizHint() {
        const task = state.studyHelper.quiz?.currentTask;
        if (!task) return;
        els.quizFeedback.innerHTML = `<p><strong>Hinweis:</strong> ${escapeHtml(task.hint || "Arbeite Schritt für Schritt.")}</p>`;
    }

    function showQuizExplanation() {
        const task = state.studyHelper.quiz?.currentTask;
        if (!task) return;
        els.quizFeedback.innerHTML = `<p><strong>Lösungsweg:</strong> ${escapeHtml(task.explain || task.hint || "Kein Lösungsweg hinterlegt.")}</p>`;
    }

    function answerQuizTutorQuestion() {
        const question = normalizeText(els.quizAskInput.value).toLowerCase();
        const task = state.studyHelper.quiz?.currentTask;
        if (!question) {
            els.quizAskAnswer.innerHTML = "<p>Stell eine konkrete Frage, z. B. \"Warum teile ich hier durch 6?\"</p>";
            return;
        }
        if (!task) {
            els.quizAskAnswer.innerHTML = "<p>Ich brauche zuerst eine Aufgabe. Erzeuge eine neue Lernaufgabe.</p>";
            return;
        }
        if (question.includes("warum") || question.includes("wieso")) {
            els.quizAskAnswer.innerHTML = `<p><strong>Begründung:</strong> ${escapeHtml(task.lesson || "Wir formen die Aufgabe in kleine Schritte um.")}</p>`;
            return;
        }
        if (question.includes("schritt") || question.includes("weg") || question.includes("lösen")) {
            els.quizAskAnswer.innerHTML = `<p><strong>Schritt-für-Schritt:</strong> ${escapeHtml(task.explain || task.hint || "Erst ordnen, dann rechnen.")}</p>`;
            return;
        }
        if (question.includes("tip") || question.includes("hilfe")) {
            els.quizAskAnswer.innerHTML = `<p><strong>Tipp:</strong> ${escapeHtml(task.hint || "Arbeite langsam und sauber.")}</p>`;
            return;
        }
        els.quizAskAnswer.innerHTML = `<p>Gute Frage. Starte mit: Problem verstehen -> bekannten Wert markieren -> Zielgröße lösen. Aufgabe aktuell: <strong>${escapeHtml(task.question)}</strong>.</p>`;
    }

    function createQuizTask(subjectKey, level = 3, style = "coach", topicFocus = "") {
        const resolved = resolveQuizDomain(subjectKey);
        let task;
        if (resolved === "algebra") task = createAlgebraQuizTask(level, style);
        else if (resolved === "de") task = createGermanQuizTask(level, style);
        else if (resolved === "en") task = createEnglishQuizTask(level, style);
        else task = createMathQuizTask(level, style);
        if (topicFocus) {
            task = {
                ...task,
                lesson: `${task.lesson} Themenbereich: ${topicFocus}.`,
                question: `${task.question} (Themenbereich: ${topicFocus})`,
                hint: `${task.hint} Achte dabei auf den Themenbereich "${topicFocus}".`
            };
        }
        return task;
    }

    function resolveQuizDomain(subjectKey) {
        if (subjectKey === "mix") return ["math", "de", "en"][Math.floor(Math.random() * 3)];
        if (subjectKey.startsWith("subject:")) {
            const subjectName = subjectKey.slice("subject:".length);
            const inferred = inferDomainFromSubjectName(subjectName);
            return inferred || "math";
        }
        return "math";
    }

    function inferDomainFromSubjectName(subjectName) {
        const lower = normalizeText(subjectName).toLowerCase();
        if (!lower) return "";
        if (lower.includes("deutsch") || lower.includes("sprache") || lower.includes("literatur")) return "de";
        if (lower.includes("englisch") || lower.includes("english")) return "en";
        if (lower.includes("algebra")) return "algebra";
        if (lower.includes("mathe") || lower.includes("math") || lower.includes("physik") || lower.includes("chemie")) return "math";
        return "";
    }

    function renderQuizSubjectOptions() {
        if (!els.quizSubject) return;
        const current = els.quizSubject.value || "mix";
        const base = [
            { value: "mix", label: "Alle Fächer" }
        ];
        const fromDashboard = state.subjectsStore.subjects.map((subject) => ({
            value: `subject:${subject.name}`,
            label: `Fach: ${subject.name}`
        }));
        const options = [...base, ...fromDashboard];
        els.quizSubject.innerHTML = options
            .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
            .join("");
        const exists = options.some((option) => option.value === current);
        els.quizSubject.value = exists ? current : "mix";
    }

    function createAlgebraQuizTask(level = 3, style = "coach") {
        const a = rand(2, 3 + level * 2);
        const x = rand(-4 - level, 6 + level);
        const b = rand(-6 - level, 8 + level);
        const c = a * x + b;
        const signB = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
        const invSignB = b >= 0 ? `-${b}` : `+ ${Math.abs(b)}`;
        return {
            type: "algebra-x",
            lesson: "Bringe zuerst die Zahl auf die andere Seite, dann durch den Faktor vor x teilen.",
            question: `${a}x ${signB} = ${c}. Löse nach x auf.`,
            solution: x,
            tolerance: 0.001,
            solutionLabel: `x = ${x}`,
            hint: `Schritt 1: ${a}x = ${c} ${invSignB}. Schritt 2: durch ${a} teilen.`,
            explain: `${a}x ${signB} = ${c} -> ${a}x = ${c} ${invSignB} -> x = (${c} ${invSignB}) / ${a} = ${x}`,
            successTip: style === "exam" ? "Prüfungsstark gelöst." : "Genau so löst du lineare Gleichungen.",
            reward: 8 + level * 3
        };
    }

    function createMathQuizTask(level = 3, style = "coach") {
        const mode = Math.floor(Math.random() * 3);
        if (mode === 0) {
            const a = rand(8 * level, 20 * level + 20);
            const b = rand(8 * level, 20 * level + 20);
            return {
                type: "number",
                lesson: "Addiere die Zahlen sauber untereinander.",
                question: `${a} + ${b} = ?`,
                solution: a + b,
                tolerance: 0.001,
                solutionLabel: String(a + b),
                hint: `Rechne zuerst Zehner, dann Einer: ${a} + ${b}.`,
                explain: `${a} + ${b} = ${a + b}`,
                successTip: style === "speed" ? "Schnell und korrekt." : "Sauber gerechnet.",
                reward: 6 + level * 2
            };
        }
        if (mode === 1) {
            const a = rand(2, 6 + level * 2);
            const b = rand(2, 6 + level * 2);
            return {
                type: "number",
                lesson: "Multiplikation heißt wiederholte Addition.",
                question: `${a} × ${b} = ?`,
                solution: a * b,
                tolerance: 0.001,
                solutionLabel: String(a * b),
                hint: `Nutze das Einmaleins oder zerlege ${b}.`,
                explain: `${a} × ${b} = ${a * b}`,
                successTip: "Gute Rechengeschwindigkeit.",
                reward: 6 + level * 2
            };
        }
        const percent = rand(10, 35 + level * 12);
        const base = rand(20, 60 + level * 80);
        const result = Number(((percent / 100) * base).toFixed(2));
        return {
            type: "number",
            lesson: "Prozent heißt Bruch: p% = p/100.",
            question: `Wie viel sind ${percent}% von ${base}?`,
            solution: result,
            tolerance: 0.01,
            solutionLabel: String(result).replace(".", ","),
            hint: `Rechne ${percent}/100 × ${base}.`,
            explain: `${percent}/100 × ${base} = ${result}`,
            successTip: "Prozentrechnung sitzt.",
            reward: 8 + level * 2
        };
    }

    function createGermanQuizTask(level = 3) {
        const pool = [
            { question: "Welches Wort ist ein Nomen? (haus / laufen / schön)", solution: "haus" },
            { question: "Wie heißt die Mehrzahl von \"Buch\"?", solution: "bücher" },
            { question: "Welches Satzzeichen beendet eine Frage?", solution: "?" },
            { question: "Setze ein passendes Verb ein: Ich ___ heute für Mathe.", solution: "lerne" }
        ];
        const item = pool[rand(0, pool.length - 1)];
        return {
            type: "text",
            lesson: "Achte auf Wortart und Rechtschreibung.",
            question: item.question,
            solution: item.solution,
            solutionLabel: item.solution,
            hint: "Lies die Aufgabe noch einmal langsam.",
            explain: `Achte auf die Satzfunktion. Die erwartete Lösung ist "${item.solution}".`,
            reward: 5 + level
        };
    }

    function createEnglishQuizTask(level = 3) {
        const pool = [
            { question: "Übersetze ins Deutsche: \"school\"", solution: "schule" },
            { question: "Übersetze ins Englische: \"lernen\"", solution: "learn" },
            { question: "Wie heißt \"Montag\" auf Englisch?", solution: "monday" },
            { question: "Setze ein: She ___ to school every day. (go/goes)", solution: "goes" }
        ];
        const item = pool[rand(0, pool.length - 1)];
        return {
            type: "text",
            lesson: "Nutze dein Grundvokabular und prüfe die Schreibweise.",
            question: item.question,
            solution: item.solution,
            solutionLabel: item.solution,
            hint: "Denke an die übliche Schulvokabel.",
            explain: `In diesem Kontext ist "${item.solution}" korrekt.`,
            reward: 5 + level
        };
    }

    function validateQuizAnswer(task, input) {
        if (task.type === "keyword-text") {
            const cleaned = normalizeQuizText(input);
            const keywords = Array.isArray(task.solution) ? task.solution.map((k) => normalizeQuizText(String(k))) : [];
            const hits = keywords.reduce((count, key) => (key && cleaned.includes(key) ? count + 1 : count), 0);
            const threshold = Number.isInteger(task.keywordThreshold) ? task.keywordThreshold : Math.max(1, Math.ceil(keywords.length * 0.6));
            return hits >= threshold;
        }
        if (task.type === "algebra-x") {
            const raw = input.toLowerCase().replace(/\s/g, "");
            const valueText = raw.startsWith("x=") ? raw.slice(2) : raw;
            const normalized = Number.parseFloat(valueText.replace(",", "."));
            if (!Number.isFinite(normalized)) return false;
            return Math.abs(normalized - Number(task.solution)) <= (task.tolerance || 0.001);
        }
        if (task.type === "number") {
            const normalized = Number.parseFloat(input.replace(",", "."));
            if (!Number.isFinite(normalized)) return false;
            return Math.abs(normalized - Number(task.solution)) <= (task.tolerance || 0.001);
        }
        const cleanedInput = normalizeQuizText(input);
        const cleanedSolution = normalizeQuizText(String(task.solution));
        return cleanedInput === cleanedSolution;
    }

    function normalizeQuizText(value) {
        return normalizeText(value)
            .toLowerCase()
            .replace(/[.!?,;:]/g, "")
            .trim();
    }

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function evaluateCalculator() {
        evaluateCalculatorFor(els.calcInput, els.calcResult);
    }

    function evaluateCalculatorFor(inputEl, resultEl) {
        const raw = normalizeText(inputEl.value);
        if (!raw) {
            resultEl.textContent = "Bitte einen Ausdruck eingeben.";
            return;
        }
        const expr = raw.replace(/,/g, ".").replace(/\s+/g, "");
        if (!/^[0-9+\-*/().%]+$/.test(expr)) {
            resultEl.textContent = "Nur Zahlen und + - * / ( ) % erlaubt.";
            return;
        }
        try {
            const safeExpr = expr.replace(/%/g, "/100");
            const value = Function(`"use strict"; return (${safeExpr});`)();
            if (!Number.isFinite(value)) {
                resultEl.textContent = "Ungültige Berechnung.";
                return;
            }
            resultEl.textContent = `${value}`;
        } catch (_) {
            resultEl.textContent = "Ausdruck konnte nicht berechnet werden.";
        }
    }

    const WIKTAPI_BASE = "https://api.wiktapi.dev/v1/de";
    const BACKEND_BASES = ["", "http://localhost:4177"];
    const BACKEND_TIMEOUT_MS = 2500;
    const WIKTAPI_LANG = "de";
    const DUDEN_CACHE_KEY = "gf_duden_cache";
    const DUDEN_CACHE_TTL = 1000 * 60 * 60 * 24 * 30;

    function loadDudenCache() {
        try {
            const raw = localStorage.getItem(DUDEN_CACHE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function persistDudenCache(cache) {
        localStorage.setItem(DUDEN_CACHE_KEY, JSON.stringify(cache));
    }

    function getCachedDuden(wordKey) {
        const cache = loadDudenCache();
        const entry = cache[wordKey];
        if (!entry) return null;
        if (Date.now() - entry.updatedAt > DUDEN_CACHE_TTL) return null;
        return entry.data || null;
    }

    function setCachedDuden(wordKey, data) {
        const cache = loadDudenCache();
        cache[wordKey] = { updatedAt: Date.now(), data };
        const keys = Object.keys(cache);
        if (keys.length > 60) {
            keys
                .sort((a, b) => (cache[a].updatedAt || 0) - (cache[b].updatedAt || 0))
                .slice(0, keys.length - 60)
                .forEach((oldKey) => delete cache[oldKey]);
        }
        persistDudenCache(cache);
    }

    async function fetchWithTimeout(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
        try {
            const res = await fetch(url, { cache: "no-store", signal: controller.signal });
            return res;
        } finally {
            clearTimeout(timeout);
        }
    }

    async function fetchBackendJson(path) {
        for (const base of BACKEND_BASES) {
            const url = `${base}${path}`;
            try {
                const res = await fetchWithTimeout(url);
                if (!res || !res.ok) continue;
                return res.json();
            } catch (_) {
                continue;
            }
        }
        return null;
    }

    async function fetchWiktapiWord(word) {
        const backend = await fetchBackendJson(`/api/duden?word=${encodeURIComponent(word)}`);
        if (backend && backend.entries) return backend;
        const url = `${WIKTAPI_BASE}/word/${encodeURIComponent(word)}?lang=${WIKTAPI_LANG}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Lookup failed");
        return res.json();
    }

    async function fetchWiktapiSearch(query) {
        const url = `${WIKTAPI_BASE}/search?q=${encodeURIComponent(query)}&lang=${WIKTAPI_LANG}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    }

    function renderWiktapiEntry(word, payload, hintText = "") {
        const entries = Array.isArray(payload?.entries) ? payload.entries : [];
        const germanEntries = entries.filter((entry) => entry.lang_code === "de" || entry.lang === "German");
        const activeEntries = germanEntries.length ? germanEntries : entries;
        if (!activeEntries.length) return "";
        const wordLabel = payload?.word || word;
        const hintHtml = hintText ? `<div class="duden-meta">${escapeHtml(hintText)}</div>` : "";
        const sections = activeEntries.map((entry) => {
            const pos = entry.pos ? escapeHtml(entry.pos) : "Wortart";
            const ipas = Array.isArray(entry.sounds)
                ? Array.from(new Set(entry.sounds.map((sound) => sound.ipa).filter(Boolean)))
                : [];
            const ipaHtml = ipas.length ? `<div class="duden-meta">IPA: ${ipas.map((ipa) => escapeHtml(ipa)).join(" · ")}</div>` : "";
            const forms = Array.isArray(entry.forms)
                ? entry.forms
                    .filter((form) => form.form && form.tags)
                    .slice(0, 6)
                    .map((form) => `${escapeHtml(form.form)} (${escapeHtml(form.tags.join(", "))})`)
                : [];
            const formsHtml = forms.length
                ? `<div class="duden-meta">Formen: ${forms.join(" · ")}</div>`
                : "";
            const senses = Array.isArray(entry.senses) ? entry.senses : [];
            const meaningHtml = senses.map((sense, index) => {
                const gloss = Array.isArray(sense.glosses) ? sense.glosses.join(" · ") : "";
                const tags = Array.isArray(sense.tags) && sense.tags.length
                    ? `<div class="duden-meta">Tags: ${sense.tags.map((tag) => escapeHtml(tag)).join(", ")}</div>`
                    : "";
                const examples = Array.isArray(sense.examples) && sense.examples.length
                    ? `<div class="duden-examples">${sense.examples.map((ex) => `„${escapeHtml(ex.text || ex)}“`).join(" · ")}</div>`
                    : "";
                const synonyms = Array.isArray(sense.synonyms) && sense.synonyms.length
                    ? `<div class="duden-meta">Synonyme: ${sense.synonyms.map((syn) => escapeHtml(syn.word || syn)).join(", ")}</div>`
                    : "";
                if (!gloss) return "";
                return `
                    <details ${index === 0 ? "open" : ""}>
                        <summary>${escapeHtml(gloss)}</summary>
                        ${tags}
                        ${examples}
                        ${synonyms}
                    </details>
                `;
            }).join("");
            return `
                <div class="duden-section">
                    <div class="duden-section-title">${pos}</div>
                    ${ipaHtml}
                    ${formsHtml}
                    <div class="duden-meanings">${meaningHtml || "<div class=\"duden-meta\">Keine Bedeutungen gefunden.</div>"}</div>
                </div>
            `;
        }).join("");
        return `
            <div class="duden-entry">
                <div class="duden-title">
                    <strong>${escapeHtml(wordLabel)}</strong>
                    <span class="duden-meta">Wiktionary-Daten (online)</span>
                </div>
                ${hintHtml}
                ${sections}
            </div>
        `;
    }

    function lookupDudenWord() {
        lookupDudenWordFor(els.dudenInput, els.dudenResult);
    }

    async function lookupDudenWordFor(inputEl, resultEl) {
        const input = normalizeText(inputEl.value);
        if (!input) {
            resultEl.innerHTML = "<div class=\"duden-entry\"><div class=\"duden-title\"><strong>Hinweis</strong></div><div class=\"duden-meta\">Bitte ein Wort eingeben.</div></div>";
            return;
        }
        const rawWord = input.trim();
        resultEl.innerHTML = "<div class=\"duden-entry\"><div class=\"duden-title\"><strong>Suche läuft...</strong></div><div class=\"duden-meta\">Online-Wörterbuch wird geladen.</div></div>";
        try {
            const variants = Array.from(new Set([
                rawWord,
                rawWord.replace(/ae/g, "ä").replace(/oe/g, "ö").replace(/ue/g, "ü")
            ])).filter(Boolean);

            for (const candidate of variants) {
                const cached = getCachedDuden(candidate.toLowerCase());
                if (cached) {
                    resultEl.innerHTML = renderWiktapiEntry(candidate, cached, candidate !== rawWord ? `Meintest du „${candidate}“?` : "");
                    return;
                }
                const payload = await fetchWiktapiWord(candidate);
                if (payload && Array.isArray(payload.entries) && payload.entries.length) {
                    setCachedDuden(candidate.toLowerCase(), payload);
                    resultEl.innerHTML = renderWiktapiEntry(candidate, payload, candidate !== rawWord ? `Meintest du „${candidate}“?` : "");
                    return;
                }
            }

            const suggestions = await fetchWiktapiSearch(rawWord);
            const fallbackSuggestions = suggestions
                .map((entry) => entry.word || entry.title || entry)
                .filter(Boolean);
            const bestSuggestion = fallbackSuggestions[0];
            if (bestSuggestion && normalizeText(bestSuggestion).toLowerCase() !== rawWord.toLowerCase()) {
                try {
                    const suggestedPayload = await fetchWiktapiWord(bestSuggestion);
                    if (suggestedPayload && Array.isArray(suggestedPayload.entries) && suggestedPayload.entries.length) {
                        setCachedDuden(bestSuggestion.toLowerCase(), suggestedPayload);
                        resultEl.innerHTML = renderWiktapiEntry(bestSuggestion, suggestedPayload, `Meintest du „${bestSuggestion}“?`);
                        return;
                    }
                } catch (_) {
                    // ignore and continue to suggestion list
                }
            }

            const fallbackHtml = fallbackSuggestions.length
                ? `<div class="duden-suggestions">${fallbackSuggestions
                    .slice(0, 6)
                    .map((suggest) => `<button class="duden-suggest-btn" data-action="duden-suggest" data-word="${escapeHtml(suggest)}" type="button">${escapeHtml(suggest)}</button>`)
                    .join("")}</div>`
                : "<div class=\"duden-meta\">Keine Online-Treffer gefunden.</div>";
            resultEl.innerHTML = `
                <div class="duden-entry">
                    <div class="duden-title"><strong>${escapeHtml(rawWord)}</strong><span class="duden-meta">kein Eintrag gefunden</span></div>
                    <div class="duden-meta">Meintest du:</div>
                    ${fallbackHtml}
                </div>
            `;
        } catch (err) {
            const key = normalizeDudenKey(rawWord);
            const entry = DUDEN_DB[key] || DUDEN_DB[rawWord.toLowerCase()] || null;
            const suggestions = entry ? [] : getDudenSuggestions(key, 3);
            const suggestionHtml = suggestions.length
                ? `<div class="duden-suggestions">${suggestions
                    .map((suggest) => `<button class="duden-suggest-btn" data-action="duden-suggest" data-word="${escapeHtml(suggest)}" type="button">${escapeHtml(suggest)}</button>`)
                    .join("")}</div>`
                : "<div class=\"duden-meta\">Keine Treffer im Offline-Wortschatz.</div>";
            if (!entry) {
                resultEl.innerHTML = `
                    <div class="duden-entry">
                        <div class="duden-title"><strong>${escapeHtml(rawWord)}</strong><span class="duden-meta">kein Eintrag gefunden</span></div>
                        <div class="duden-meta">Meintest du:</div>
                        ${suggestionHtml}
                        <div class="duden-meta">Hinweis: Online-Suche fehlgeschlagen (CORS/Offline).</div>
                    </div>
                `;
                return;
            }
            resultEl.innerHTML = renderDudenEntry(entry);
        }
    }

    const DUDEN_DB = {
        handy: {
            lemma: "Handy",
            syllables: "Han·dy",
            hyphenation: "Han|dy",
            wordClass: "Substantiv, Neutrum",
            meanings: [
                {
                    title: "Mobiltelefon",
                    description: "tragbares Telefon für das Mobilfunknetz",
                    examples: ["Mein Handy ist leer.", "Sie hat ihr Handy im Bus verloren."]
                }
            ],
            synonyms: ["Mobiltelefon", "Smartphone"]
        },
        analyse: {
            lemma: "Analyse",
            syllables: "Ana·ly·se",
            hyphenation: "Ana|ly|se",
            wordClass: "Substantiv, feminin",
            meanings: [
                {
                    title: "Untersuchung",
                    description: "Untersuchung eines Sachverhalts nach Merkmalen",
                    examples: ["Die Analyse der Zahlen zeigt einen Trend."]
                },
                {
                    title: "Textanalyse",
                    description: "systematische Betrachtung eines Textes",
                    examples: ["Wir schreiben eine Analyse des Gedichts."]
                }
            ],
            synonyms: ["Untersuchung", "Auswertung"]
        },
        argument: {
            lemma: "Argument",
            syllables: "Ar·gu·ment",
            hyphenation: "Ar|gu|ment",
            wordClass: "Substantiv, Neutrum",
            meanings: [
                {
                    title: "Begründung",
                    description: "Begründung zur Stützung einer Aussage",
                    examples: ["Das ist ein starkes Argument."]
                }
            ],
            synonyms: ["Begründung", "Grund"]
        },
        eroerterung: {
            lemma: "Erörterung",
            syllables: "Er·ör·te·rung",
            hyphenation: "Er|oer|te|rung",
            wordClass: "Substantiv, feminin",
            meanings: [
                {
                    title: "schriftliche Auseinandersetzung",
                    description: "systematische Gegenüberstellung von Pro und Contra",
                    examples: ["Wir schreiben eine Erörterung zum Thema."]
                }
            ],
            synonyms: ["Abwägung", "Diskussion"]
        },
        interpretation: {
            lemma: "Interpretation",
            syllables: "In·ter·pre·ta·ti·on",
            hyphenation: "In|ter|pre|ta|ti|on",
            wordClass: "Substantiv, feminin",
            meanings: [
                {
                    title: "Deutung",
                    description: "Sinngebende Deutung eines Textes oder Ergebnisses",
                    examples: ["Die Interpretation des Gedichts ist überzeugend."]
                }
            ],
            synonyms: ["Deutung", "Auslegung"]
        },
        praesentation: {
            lemma: "Präsentation",
            syllables: "Prä·sen·ta·ti·on",
            hyphenation: "Prae|sen|ta|ti|on",
            wordClass: "Substantiv, feminin",
            meanings: [
                {
                    title: "Vortrag",
                    description: "strukturierte Vorstellung eines Themas",
                    examples: ["Die Präsentation war klar aufgebaut."]
                }
            ],
            synonyms: ["Vortrag", "Darstellung"]
        },
        grammatik: {
            lemma: "Grammatik",
            syllables: "Gram·ma·tik",
            hyphenation: "Gram|ma|tik",
            wordClass: "Substantiv, feminin",
            meanings: [
                {
                    title: "Regelsystem",
                    description: "Regeln zur Bildung von Wörtern und Sätzen",
                    examples: ["Die Grammatikregeln sind wichtig."]
                }
            ],
            synonyms: ["Sprachlehre"]
        },
        rechtschreibung: {
            lemma: "Rechtschreibung",
            syllables: "Recht·schrei·bung",
            hyphenation: "Recht|schrei|bung",
            wordClass: "Substantiv, feminin",
            meanings: [
                {
                    title: "Schreibung",
                    description: "Regeln zur korrekten Schreibung von Wörtern",
                    examples: ["Achte auf die Rechtschreibung."]
                }
            ],
            synonyms: ["Orthografie", "Orthographie"]
        },
        synonym: {
            lemma: "Synonym",
            syllables: "Sy·no·nym",
            hyphenation: "Sy|no|nym",
            wordClass: "Substantiv, Neutrum",
            meanings: [
                {
                    title: "bedeutungsgleiches Wort",
                    description: "Wort mit gleicher oder ähnlicher Bedeutung",
                    examples: ["\"schnell\" ist ein Synonym für \"rasch\"."]
                }
            ],
            synonyms: ["Gleichbedeutung"]
        },
        metapher: {
            lemma: "Metapher",
            syllables: "Me·ta·pher",
            hyphenation: "Me|ta|pher",
            wordClass: "Substantiv, feminin",
            meanings: [
                {
                    title: "Sprachbild",
                    description: "bildlicher Ausdruck mit übertragener Bedeutung",
                    examples: ["\"Flut der Gefühle\" ist eine Metapher."]
                }
            ],
            synonyms: ["Sprachbild"]
        },
        kohaerenz: {
            lemma: "Kohärenz",
            syllables: "Ko·hä·renz",
            hyphenation: "Ko|hae|renz",
            wordClass: "Substantiv, feminin",
            meanings: [
                {
                    title: "Zusammenhang",
                    description: "inhaltlicher Zusammenhang zwischen Aussagen",
                    examples: ["Die Kohärenz des Textes ist gut."]
                }
            ],
            synonyms: ["Zusammenhang"]
        },
        fazit: {
            lemma: "Fazit",
            syllables: "Fa·zit",
            hyphenation: "Fa|zit",
            wordClass: "Substantiv, Neutrum",
            meanings: [
                {
                    title: "Schlussfolgerung",
                    description: "abschließende Zusammenfassung oder Bewertung",
                    examples: ["Mein Fazit ist eindeutig."]
                }
            ],
            synonyms: ["Schluss", "Ergebnis"]
        },
        dass: {
            lemma: "dass",
            syllables: "dass",
            hyphenation: "dass",
            wordClass: "Konjunktion",
            meanings: [
                {
                    title: "Bindewort",
                    description: "leitet einen Nebensatz ein",
                    examples: ["Ich denke, dass es stimmt."]
                }
            ],
            synonyms: []
        },
        das: {
            lemma: "das",
            syllables: "das",
            hyphenation: "das",
            wordClass: "Artikel/Pronomen",
            meanings: [
                {
                    title: "Artikel",
                    description: "bestimmter Artikel für Neutrum",
                    examples: ["Das Haus ist groß."]
                },
                {
                    title: "Pronomen",
                    description: "stellt auf etwas Vorheriges",
                    examples: ["Ich sehe das."]
                }
            ],
            synonyms: []
        },
        seit: {
            lemma: "seit",
            syllables: "seit",
            hyphenation: "seit",
            wordClass: "Präposition",
            meanings: [
                {
                    title: "Zeitangabe",
                    description: "seit einem Zeitpunkt",
                    examples: ["Seit gestern regnet es."]
                }
            ],
            synonyms: []
        },
        seid: {
            lemma: "seid",
            syllables: "seid",
            hyphenation: "seid",
            wordClass: "Verb",
            meanings: [
                {
                    title: "Form von sein",
                    description: "2. Person Plural Präsens",
                    examples: ["Ihr seid pünktlich."]
                }
            ],
            synonyms: []
        }
    };

    function normalizeDudenKey(text) {
        return normalizeText(text)
            .toLowerCase()
            .replace(/ß/g, "ss")
            .replace(/ä/g, "ae")
            .replace(/ö/g, "oe")
            .replace(/ü/g, "ue")
            .replace(/[^a-z]/g, "");
    }

    function getDudenSuggestions(key, limit = 3) {
        const keys = Object.keys(DUDEN_DB);
        if (!key) return [];
        const scored = keys.map((k) => ({
            word: DUDEN_DB[k].lemma,
            score: dudenDistance(key, k)
        }));
        scored.sort((a, b) => a.score - b.score);
        return scored.filter((item) => item.score <= 3).slice(0, limit).map((item) => item.word);
    }

    function dudenDistance(a, b) {
        const m = a.length;
        const n = b.length;
        if (!m) return n;
        if (!n) return m;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i += 1) dp[i][0] = i;
        for (let j = 0; j <= n; j += 1) dp[0][j] = j;
        for (let i = 1; i <= m; i += 1) {
            for (let j = 1; j <= n; j += 1) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[m][n];
    }

    function getDudenHyphenation(entry) {
        if (entry.hyphenation) return entry.hyphenation;
        if (entry.syllables && entry.syllables.includes("·")) {
            return entry.syllables.replace(/·/g, "|");
        }
        return "";
    }

    function renderDudenEntry(entry) {
        const hyphenation = getDudenHyphenation(entry);
        const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
        const meaningHtml = meanings
            .map((meaning, index) => {
                const examples = Array.isArray(meaning.examples) && meaning.examples.length
                    ? `<div class="duden-examples">${meaning.examples.map((ex) => `„${escapeHtml(ex)}“`).join(" · ")}</div>`
                    : "";
                return `
                    <details ${index === 0 ? "open" : ""}>
                        <summary>${escapeHtml(meaning.title)}</summary>
                        <div class="duden-meta">${escapeHtml(meaning.description)}</div>
                        ${examples}
                    </details>
                `;
            })
            .join("");
        const synonyms = Array.isArray(entry.synonyms) && entry.synonyms.length
            ? `<div class="duden-meta">Synonyme: ${entry.synonyms.map((s) => escapeHtml(s)).join(", ")}</div>`
            : "";
        return `
            <div class="duden-entry">
                <div class="duden-title">
                    <strong>${escapeHtml(entry.lemma)}</strong>
                    <span class="duden-meta">${escapeHtml(entry.wordClass)}</span>
                    <span class="duden-meta">${escapeHtml(entry.syllables)}</span>
                </div>
                <div class="duden-section">
                    <div class="duden-section-title">Rechtschreibung</div>
                    ${hyphenation ? `<div class="duden-kv"><span>Worttrennung</span><strong>${escapeHtml(hyphenation)}</strong></div>` : "<div class=\"duden-meta\">Keine Trennung hinterlegt.</div>"}
                </div>
                <div class="duden-section">
                    <div class="duden-section-title">Bedeutung</div>
                    <div class="duden-meanings">${meaningHtml}</div>
                </div>
                ${synonyms}
            </div>
        `;
    }

    function onCalcKeyPress(button) {
        const key = button.dataset.key;
        const targetId = button.closest(".calc-pad")?.dataset.target;
        if (!key || !targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;
        if (key === "clear") {
            target.value = "";
            if (targetId === "calc-input") els.calcResult.textContent = "";
            if (targetId === "exam-calc-input" && els.examCalcResult) els.examCalcResult.textContent = "";
            return;
        }
        if (key === "eval") {
            if (targetId === "calc-input") evaluateCalculatorFor(els.calcInput, els.calcResult);
            if (targetId === "exam-calc-input" && els.examCalcInput && els.examCalcResult) evaluateCalculatorFor(els.examCalcInput, els.examCalcResult);
            return;
        }
        target.value += key;
        target.focus();
    }

    function renderExamTutor() {
        if (!state.examPrep.tutor || !state.examPrep.tutor.currentTask) {
            generateExamTutorTask(false);
        }
        const task = state.examPrep.tutor.currentTask;
        const levelLabel = state.examPrep.tutor.level === 6 ? "MSA Original" : `Level ${state.examPrep.tutor.level}`;
        els.examTutorQuestion.innerHTML = `
            <p><strong>${escapeHtml(state.examPrep.tutor.track)} · ${escapeHtml(subjectLabel(state.examPrep.tutor.subject))} · ${escapeHtml(levelLabel)}</strong></p>
            <p>${escapeHtml(task.question)}</p>
        `;
        const stats = state.examPrep.tutor.stats;
        const total = stats.correct + stats.wrong;
        const quote = total ? Math.round((stats.correct / total) * 100) : 0;
        const key = `${state.examPrep.tutor.track}:${state.examPrep.tutor.subject}`;
        const themeReadiness = Math.max(0, Math.min(100, Number.parseInt(stats.progressByTheme?.[key], 10) || stats.readiness || 0));
        els.examTutorStats.textContent = `Richtig: ${stats.correct} · Falsch: ${stats.wrong} · Quote: ${quote}% · Reife-Score Thema: ${themeReadiness}%`;
        if (!els.examTutorFeedback.textContent) {
            els.examTutorFeedback.innerHTML = "<p>Prüfungsantwort eingeben und prüfen.</p>";
        }
    }

    function generateExamTutorTask(clearFeedback = true) {
        const track = els.examTutorTrack.value || "MSA";
        const subject = els.examTutorSubject.value || "math";
        const rawLevel = Number.parseInt(els.examTutorLevel.value, 10);
        const level = [1, 2, 3, 4, 5, 6].includes(rawLevel) ? rawLevel : 3;
        state.examPrep.tutor = state.examPrep.tutor || { track, subject, level, currentTask: null, stats: { correct: 0, wrong: 0, readiness: 0 } };
        state.examPrep.tutor.track = track;
        state.examPrep.tutor.subject = subject;
        state.examPrep.tutor.level = level;
        state.examPrep.tutor.currentTask = createExamTutorTask(track, subject, level);
        state.examPrep = persistExamPrep(state.examPrep);
        els.examTutorAnswer.value = "";
        if (clearFeedback) {
            els.examTutorFeedback.innerHTML = "<p>Neue Prüfungsaufgabe erstellt.</p>";
        }
        renderExamTutor();
    }

    function createExamTutorTask(track, subject, level) {
        if (level === 6) {
            return createExamOriginalTask(track, subject);
        }
        if (subject === "math") {
            const baseTask = createAlgebraQuizTask(level + (track === "MSA" ? 1 : 0), "exam");
            return { ...baseTask, question: `[${track}] ${baseTask.question}` };
        }
        if (subject === "de") {
            const task = createGermanQuizTask(level + 1);
        return { ...task, question: `[${track}] ${task.question}` };
    }

    function createExamOriginalTask(track, subject) {
        const bank = EXAM_ORIGINAL_TASKS[track]?.[subject] || EXAM_ORIGINAL_TASKS.MSA[subject] || [];
        if (!bank.length) {
            return { question: `[${track}] Keine Originalaufgaben hinterlegt.`, solution: "" };
        }
        const task = bank[rand(0, bank.length - 1)];
        return {
            question: `[${track}] ${task.question}`,
            solution: task.solution,
            hint: task.hint,
            explain: task.explain
        };
    }

    const EXAM_ORIGINAL_TASKS = {
        MSA: {
            math: [
                {
                    question: "Berechne: 3x + 12 = 48. Löse nach x.",
                    solution: 12,
                    hint: "Erst 12 abziehen, dann durch 3 teilen.",
                    explain: "3x = 36 -> x = 12"
                },
                {
                    question: "Ein Dreieck hat Grundseite 8 cm und Höhe 5 cm. Berechne die Fläche.",
                    solution: 20,
                    hint: "Fläche = (g * h) / 2.",
                    explain: "A = (8 * 5) / 2 = 20"
                },
                {
                    question: "Ein Text kostet 7,50 €. 15 % Rabatt. Wie viel zahlst du?",
                    solution: 6.375,
                    hint: "15 % von 7,50 sind 1,125. Dann abziehen.",
                    explain: "7,50 - 1,125 = 6,375"
                }
            ],
            de: [
                {
                    question: "Setze die Satzzeichen richtig: Wann kommst du fragte er",
                    solution: "Wann kommst du?, fragte er.",
                    hint: "Fragezeichen + Komma vor Begleitsatz.",
                    explain: "Direkte Rede endet mit ? und Komma vor dem Begleitsatz."
                },
                {
                    question: "Nenne die Wortart von \"schnell\" in: Er läuft schnell.",
                    solution: "Adverb",
                    hint: "Beschreibt das Verb 'läuft'.",
                    explain: "Adverb bestimmt die Art und Weise."
                }
            ],
            en: [
                {
                    question: "Fill in: She ___ to school every day. (go/goes)",
                    solution: "goes",
                    hint: "3. Person Singular braucht -s.",
                    explain: "She goes."
                },
                {
                    question: "Translate to English: \"Ich habe gestern Fußball gespielt.\"",
                    solution: "I played football yesterday.",
                    hint: "Simple Past.",
                    explain: "I played football yesterday."
                }
            ],
            en_oral: [
                {
                    question: "Speak about your last weekend for 60 seconds. Mention 3 activities.",
                    solution: "",
                    hint: "Use past tense verbs.",
                    explain: ""
                }
            ],
            presentation: [
                {
                    question: "Präsentiere dein Thema 2–3 Minuten: Einstieg, 2 Kernpunkte, Beispiel, Schluss.",
                    solution: "",
                    hint: "Nutze klare Übergänge.",
                    explain: ""
                }
            ]
        },
        BBR: {},
        eBBR: {}
    };
        if (subject === "en_oral") {
            return createEnglishOralTutorTask(track, level);
        }
        if (subject === "presentation") {
            return createPresentationTutorTask(track, level);
        }
        const enTask = createEnglishQuizTask(level + 1);
        return { ...enTask, question: `[${track}] ${enTask.question}` };
    }

    function createEnglishOralTutorTask(track, level) {
        const prompts = [
            {
                question: "Speak for about 60 seconds: introduce yourself and your school goals.",
                keywords: ["name", "school", "goal", "because"]
            },
            {
                question: "Describe your favorite subject and explain why it is useful.",
                keywords: ["subject", "because", "important", "future"]
            },
            {
                question: "Compare learning at home and learning at school.",
                keywords: ["home", "school", "difference", "better"]
            }
        ];
        const selected = prompts[rand(0, prompts.length - 1)];
        return {
            type: "keyword-text",
            lesson: "Mündlich zählen Struktur, klare Sätze und Begründung.",
            question: `[${track}] Oral English (${level}): ${selected.question}`,
            solution: selected.keywords,
            solutionLabel: `Schlüsselwörter: ${selected.keywords.join(", ")}`,
            hint: "Nutze 3-4 Sätze: Aussage, Grund, Beispiel, Abschluss.",
            explain: `Treffe mindestens ${Math.max(2, Math.ceil(selected.keywords.length * 0.6))} Schlüsselwörter.`,
            keywordThreshold: Math.max(2, Math.ceil(selected.keywords.length * 0.6)),
            successTip: "Gute mündliche Leistung. Achte auch auf Aussprache und Tempo.",
            reward: 10 + level * 3
        };
    }

    function createPresentationTutorTask(track, level) {
        const prompts = [
            {
                question: "Skizziere eine Kurzpräsentation: 'Social Media in der Schule - Chance oder Risiko?'",
                keywords: ["einleitung", "argument", "beispiel", "fazit"]
            },
            {
                question: "Baue eine 3-Minuten-Präsentation zu 'Klimawandel und Alltag'.",
                keywords: ["thema", "daten", "beispiel", "schluss"]
            },
            {
                question: "Gliedere eine Präsentation über deinen Wunschberuf.",
                keywords: ["beruf", "aufgaben", "ausbildung", "warum"]
            }
        ];
        const selected = prompts[rand(0, prompts.length - 1)];
        return {
            type: "keyword-text",
            lesson: "Präsentationen brauchen roten Faden: Einstieg, Kern, Schluss.",
            question: `[${track}] Präsentation (${level}): ${selected.question}`,
            solution: selected.keywords,
            solutionLabel: `Strukturwörter: ${selected.keywords.join(", ")}`,
            hint: "Nutze klare Gliederung: Einleitung - Hauptteil - Fazit.",
            explain: `Mindestens ${Math.max(2, Math.ceil(selected.keywords.length * 0.6))} Strukturpunkte einbauen.`,
            keywordThreshold: Math.max(2, Math.ceil(selected.keywords.length * 0.6)),
            successTip: "Struktur ist stark. Als Nächstes auf Zeit und freies Sprechen achten.",
            reward: 10 + level * 3
        };
    }

    function checkExamTutorAnswer() {
        const input = normalizeText(els.examTutorAnswer.value);
        if (!input) {
            els.examTutorFeedback.innerHTML = "<p>Bitte Antwort eingeben.</p>";
            return;
        }
        const task = state.examPrep.tutor?.currentTask;
        if (!task) {
            generateExamTutorTask();
            return;
        }
        const isCorrect = validateQuizAnswer(task, input);
        const stats = state.examPrep.tutor.stats;
        const key = `${state.examPrep.tutor.track}:${state.examPrep.tutor.subject}`;
        const themeMap = stats.progressByTheme || {};
        let currentTheme = Math.max(0, Math.min(100, Number.parseInt(themeMap[key], 10) || 0));
        if (isCorrect) {
            stats.correct += 1;
            currentTheme = Math.min(100, currentTheme + 4 + state.examPrep.tutor.level);
            stats.readiness = currentTheme;
            els.examTutorFeedback.innerHTML = `<p><strong>Richtig.</strong> ${escapeHtml(task.successTip || "Prüfungsstark.")}</p>`;
        } else {
            stats.wrong += 1;
            currentTheme = Math.max(0, currentTheme - 2);
            stats.readiness = currentTheme;
            els.examTutorFeedback.innerHTML = `<p><strong>Falsch.</strong> Richtige Antwort: <strong>${escapeHtml(String(task.solutionLabel))}</strong></p><p>${escapeHtml(task.hint || "")}</p>`;
        }
        stats.progressByTheme = { ...themeMap, [key]: currentTheme };
        state.examPrep = persistExamPrep(state.examPrep);
        renderExamTutor();
        renderExamPrep();
        renderStats();
    }

    function showExamTutorHint() {
        const task = state.examPrep.tutor?.currentTask;
        if (!task) return;
        els.examTutorFeedback.innerHTML = `<p><strong>Hinweis:</strong> ${escapeHtml(task.hint || "Strukturiert lösen.")}</p>`;
    }

    function answerExamTutorQuestion() {
        const question = normalizeText(els.examTutorAskInput.value).toLowerCase();
        const task = state.examPrep.tutor?.currentTask;
        if (!question) {
            els.examTutorAskAnswer.innerHTML = "<p>Frag konkret, z. B. \"Wie strukturiere ich die Antwort?\"</p>";
            return;
        }
        if (!task) {
            els.examTutorAskAnswer.innerHTML = "<p>Bitte zuerst eine Prüfungsaufgabe erzeugen.</p>";
            return;
        }
        if (state.examPrep.tutor?.level === 6) {
            els.examTutorAskAnswer.innerHTML = "<p>Originalaufgaben: Lies die Aufgabenstellung genau, markiere Schlüsselwörter und rechne Schritt für Schritt.</p>";
            return;
        }
        if (question.includes("struktur") || question.includes("aufbau")) {
            els.examTutorAskAnswer.innerHTML = "<p><strong>Prüfungsstruktur:</strong> Einleitung -> Kernargument/Beispiel -> Schluss. Kurz, klar, begründet.</p>";
            return;
        }
        if (question.includes("besser") || question.includes("verbessern")) {
            els.examTutorAskAnswer.innerHTML = `<p><strong>So wird es besser:</strong> ${escapeHtml(task.hint || "Nutze präzise Begriffe und begründe jede Aussage.")}</p>`;
            return;
        }
        if (question.includes("bewertung") || question.includes("punkte")) {
            els.examTutorAskAnswer.innerHTML = "<p><strong>Bewertung:</strong> Inhalt + Struktur + sprachliche Klarheit. Triff die Kernpunkte und bleibe beim Thema.</p>";
            return;
        }
        els.examTutorAskAnswer.innerHTML = `<p>Für diese Aufgabe ist wichtig: <strong>${escapeHtml(task.lesson || "Klare Struktur und passende Begriffe.")}</strong></p>`;
    }

    function subjectLabel(code) {
        if (code === "de") return "Deutsch";
        if (code === "en") return "Englisch";
        if (code === "en_oral") return "Englisch mündlich";
        if (code === "presentation") return "Präsentation";
        return "Mathe";
    }

    function renderExamPrep() {
        const track = state.examPrep.activeTrack;
        const items = getExamItems(track);
        const autoPercent = getTrackCompletionPercent(track);
        autoMarkExamItems(track, autoPercent);
        const doneCount = items.filter((item) => item.done).length;
        const percent = items.length ? Math.round((doneCount / items.length) * 100) : autoPercent;

        els.examProgressFill.style.width = `${percent}%`;
        els.examProgressValue.textContent = `${percent}%`;
        if (els.examThemeProgress) {
            els.examThemeProgress.textContent = `Thema-Abschluss (${track}): ${autoPercent}%`;
        }
        els.examProgressFill.classList.remove("done", "near");
        if (percent >= 100) els.examProgressFill.classList.add("done");
        else if (percent >= 75) els.examProgressFill.classList.add("near");

        if (!items.length) {
            els.examList.innerHTML = createEmptyState("Keine Punkte vorhanden.");
            return;
        }

        els.examList.innerHTML = items
            .map((item) => {
                const themeCode = inferThemeCodeFromItemText(item.text);
                const themePercent = getThemeProgressPercent(track, themeCode);
                const remaining = Math.max(0, 100 - themePercent);
                const fillClass = themePercent >= 100 ? "done" : (themePercent >= 75 ? "near" : "");
                return `
                    <article class="list-item ${item.done ? "goal-item done" : ""}">
                        <strong>${escapeHtml(item.text)}</strong>
                        <p class="list-meta">${item.done ? "Abgehakt (auto)" : "Offen"} · ${item.preset ? "Standard" : "Eigener Punkt"} · ${themePercent}% geschafft · ${remaining}% offen</p>
                        <div class="goal-progress">
                            <div class="goal-progress-track"><div class="goal-progress-fill ${fillClass}" style="width:${themePercent}%"></div></div>
                            <span class="goal-progress-value">${themePercent}%</span>
                        </div>
                        <div class="row-actions">
                            ${item.preset ? "" : `<button class="btn btn-ghost" data-action="delete-exam-item" data-id="${item.id}" type="button">Löschen</button>`}
                        </div>
                    </article>
                `;
            })
            .join("");
        renderOfficialExamDates();
    }

    function setExamTab(tab) {
        const activeTab = tab === "oral" ? "oral" : "written";
        state.examPrep.oral = state.examPrep.oral || {};
        state.examPrep.oral.activeTab = activeTab;
        state.examPrep = persistExamPrep(state.examPrep);
        els.examTabButtons.forEach((button) => {
            const isActive = button.dataset.tab === activeTab;
            button.classList.toggle("is-active", isActive);
            button.classList.toggle("btn-primary", isActive);
            button.classList.toggle("btn-ghost", !isActive);
            button.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        if (els.examPanelWritten) {
            const writtenActive = activeTab === "written";
            els.examPanelWritten.classList.toggle("is-active", writtenActive);
            els.examPanelWritten.setAttribute("aria-hidden", writtenActive ? "false" : "true");
        }
        if (els.examPanelOral) {
            const oralActive = activeTab === "oral";
            els.examPanelOral.classList.toggle("is-active", oralActive);
            els.examPanelOral.setAttribute("aria-hidden", oralActive ? "false" : "true");
        }
    }

    function renderOralCoach() {
        const oral = state.examPrep.oral || {};
        const currentPrompt = oral.currentPrompt || "Wähle Sprache + Thema und starte eine mündliche Aufgabe.";
        const currentTeacherQuestion = oral.currentTeacherQuestion || "Noch keine Lehrerfrage. Starte zuerst den Mündlich-Coach.";
        if (els.oralPrompt) {
            els.oralPrompt.innerHTML = `<p><strong>Aufgabe:</strong> ${escapeHtml(currentPrompt)}</p>`;
        }
        if (els.oralTeacherQuestion) {
            els.oralTeacherQuestion.innerHTML = `<p><strong>Lehrerfrage:</strong> ${escapeHtml(currentTeacherQuestion)}</p>`;
        }
        const slideState = oral.slides || {};
        const fileName = slideState.fileName || "Keine Datei gewählt";
        const currentSlide = Math.max(1, Number.parseInt(slideState.currentSlide, 10) || 1);
        const slideCount = Math.max(1, Number.parseInt(slideState.slideCount, 10) || 8);
        const seconds = Math.max(10, Number.parseInt(slideState.secondsPerSlide, 10) || 45);
        if (els.oralSlideStatus) {
            const runningText = slideState.running ? "läuft" : "gestoppt";
            els.oralSlideStatus.innerHTML = `
                <p><strong>Datei:</strong> ${escapeHtml(fileName)}</p>
                <p><strong>Folie:</strong> ${currentSlide}/${slideCount} · ${runningText} · ${seconds}s pro Folie</p>
            `;
        }
        if (els.oralPronunciationFeedback && !els.oralPronunciationFeedback.textContent.trim()) {
            els.oralPronunciationFeedback.innerHTML = "<p>Starte die Aufnahme, sprich frei und analysiere danach.</p>";
        }
        if (els.oralSlidePreview && els.oralSlidePreviewHint) {
            if (oralPreviewUrl) {
                els.oralSlidePreview.src = oralPreviewUrl;
                els.oralSlidePreview.classList.remove("hidden");
                els.oralSlidePreviewHint.textContent = "Vorschau aktiv. Nutze den Folienmodus parallel.";
            } else {
                els.oralSlidePreview.removeAttribute("src");
                els.oralSlidePreview.classList.add("hidden");
                if (slideState.fileName && /\.(ppt|pptx)$/i.test(slideState.fileName)) {
                    els.oralSlidePreviewHint.textContent = "PPT/PPTX kann lokal nicht direkt gerendert werden. Exportiere als PDF für Live-Vorschau.";
                } else if (slideState.fileName) {
                    els.oralSlidePreviewHint.textContent = "Datei geladen. Für Vorschau bitte PDF verwenden.";
                } else {
                    els.oralSlidePreviewHint.textContent = "Lade eine PDF hoch, um die Folien direkt in der App zu sehen.";
                }
            }
        }
        const remaining = Math.max(0, Number.parseInt(state.studyHelper.focusRemainingSec, 10) || 0);
        const timeText = formatDuration(remaining);
        if (els.examOralFocusDisplay) {
            els.examOralFocusDisplay.textContent = timeText;
        }
    }

    function generateOralSession() {
        const track = ["MSA", "BBR", "eBBR"].includes(els.oralTrack.value) ? els.oralTrack.value : "MSA";
        const language = els.oralLanguage.value === "presentation" ? "presentation" : "en";
        const topic = normalizeText(els.oralTopic.value) || (language === "presentation" ? "Meine Präsentation" : "My school project");
        const level = [1, 2, 3, 4, 5, 6].includes(Number.parseInt(els.examTutorLevel?.value, 10))
            ? Number.parseInt(els.examTutorLevel.value, 10)
            : 3;
        const scenario = buildOralScenario({ track, language, topic, level });
        state.examPrep.oral.track = track;
        state.examPrep.oral.language = language;
        state.examPrep.oral.topic = topic;
        state.examPrep.oral.currentPrompt = scenario.prompt;
        const queue = createTeacherQuestions(scenario);
        state.examPrep.oral.teacherQuestions = queue;
        state.examPrep.oral.teacherIndex = 0;
        state.examPrep.oral.currentTeacherQuestion = queue[0] || "";
        state.examPrep = persistExamPrep(state.examPrep);
        renderOralCoach();
    }

    function buildOralScenario({ track, language, topic, level }) {
        if (language === "presentation") {
            const prompts = [
                `[${track}] Präsentationsprüfung (Level ${level}): Stelle "${topic}" in 2-3 Minuten vor. Struktur: Einstieg -> Kernpunkte -> Beispiel/Daten -> Fazit.`,
                `[${track}] Präsentationsprüfung (Level ${level}): Erkläre "${topic}" mit klarer Gliederung und nenne mindestens einen praktischen Nutzen.`,
                `[${track}] Präsentationsprüfung (Level ${level}): Präsentiere "${topic}" adressatengerecht und beende mit einer überzeugenden Schlussaussage.`
            ];
            return {
                track,
                language,
                topic,
                prompt: prompts[rand(0, prompts.length - 1)],
                rubric: ["Aufbau", "Fachinhalt", "Beispiel/Daten", "Vortragsweise", "Schluss"]
            };
        }
        const prompts = [
            `[${track}] Oral English (Level ${level}): Speak about "${topic}" for 2-3 minutes. Structure: intro -> claim -> evidence/example -> short conclusion.`,
            `[${track}] Oral English (Level ${level}): Give your opinion on "${topic}" and support it with one real example and one counter-argument.`,
            `[${track}] Oral English (Level ${level}): Explain advantages and disadvantages of "${topic}" and finish with your own position.`
        ];
        return {
            track,
            language,
            topic,
            prompt: prompts[rand(0, prompts.length - 1)],
            rubric: ["Structure", "Reasoning", "Example", "Conclusion", "Clarity"]
        };
    }

    function createTeacherQuestions(scenario) {
        const { topic, language, rubric } = scenario;
        if (language === "presentation") {
            return [
                `Wie lautet deine Kernbotschaft zu "${topic}" in einem Satz?`,
                "Welche 2 Kernpunkte willst du unbedingt zeigen?",
                "Welches Beispiel oder welche Zahl macht deine Aussage stark?",
                "Wie leitest du zu einem klaren Schluss über?",
                `Mini-Bewertung: Prüfe selbst ${rubric.join(", ")} (je 0-2 Punkte).`
            ];
        }
        return [
            `What is your main claim about "${topic}" in one sentence?`,
            "Which concrete example supports your argument best?",
            "What is a strong counter-argument and how do you answer it?",
            "Why is your conclusion convincing?",
            `Self-check: rate yourself in ${rubric.join(", ")} (0-2 points each).`
        ];
    }

    function nextTeacherQuestion() {
        const queue = Array.isArray(state.examPrep.oral.teacherQuestions) ? state.examPrep.oral.teacherQuestions : [];
        if (!queue.length) {
            state.examPrep.oral.currentTeacherQuestion = "Starte zuerst den Mündlich-Coach, dann bekommst du Lehrerfragen.";
            state.examPrep = persistExamPrep(state.examPrep);
            renderOralCoach();
            return;
        }
        const nextIndex = Math.min(queue.length - 1, (Number.parseInt(state.examPrep.oral.teacherIndex, 10) || 0) + 1);
        state.examPrep.oral.teacherIndex = nextIndex;
        state.examPrep.oral.currentTeacherQuestion = queue[nextIndex];
        state.examPrep = persistExamPrep(state.examPrep);
        renderOralCoach();
    }

    function onOralFileChange() {
        const file = els.oralPresentationFile.files && els.oralPresentationFile.files[0];
        state.examPrep.oral.slides.fileName = file ? file.name : "";
        if (oralPreviewUrl) {
            URL.revokeObjectURL(oralPreviewUrl);
            oralPreviewUrl = "";
        }
        if (file && file.type === "application/pdf") {
            oralPreviewUrl = URL.createObjectURL(file);
        }
        state.examPrep = persistExamPrep(state.examPrep);
        renderOralCoach();
    }

    function startOralSlides() {
        stopOralSlides(false);
        const slideCount = Math.max(1, Number.parseInt(els.oralSlideCount.value, 10) || 8);
        const seconds = Math.max(10, Number.parseInt(els.oralSlideSeconds.value, 10) || 45);
        state.examPrep.oral.slides.slideCount = slideCount;
        state.examPrep.oral.slides.secondsPerSlide = seconds;
        state.examPrep.oral.slides.currentSlide = 1;
        state.examPrep.oral.slides.running = true;
        state.examPrep.oral.slides.nextAt = Date.now() + (seconds * 1000);
        oralSlideTimer = setInterval(() => {
            if (!state.examPrep.oral.slides.running) return;
            const now = Date.now();
            if (now < state.examPrep.oral.slides.nextAt) return;
            const maxSlide = state.examPrep.oral.slides.slideCount;
            const current = state.examPrep.oral.slides.currentSlide;
            if (current >= maxSlide) {
                stopOralSlides(false);
                const queue = createTeacherQuestions(
                    buildOralScenario({
                        track: state.examPrep.oral.track || "MSA",
                        language: state.examPrep.oral.language || "en",
                        topic: state.examPrep.oral.topic || (state.examPrep.oral.language === "presentation" ? "dein Präsentationsthema" : "your topic"),
                        level: 3
                    })
                );
                state.examPrep.oral.teacherQuestions = queue;
                state.examPrep.oral.teacherIndex = 0;
                state.examPrep.oral.currentTeacherQuestion = queue[0] || "Fragerunde gestartet.";
                state.examPrep = persistExamPrep(state.examPrep);
                renderOralCoach();
                showToast("Folien fertig. Fragerunde gestartet.", "info");
                return;
            }
            state.examPrep.oral.slides.currentSlide += 1;
            state.examPrep.oral.slides.nextAt = now + (state.examPrep.oral.slides.secondsPerSlide * 1000);
            state.examPrep = persistExamPrep(state.examPrep);
            renderOralCoach();
        }, 500);
        state.examPrep = persistExamPrep(state.examPrep);
        renderOralCoach();
        showToast("Folienmodus gestartet.", "info");
    }

    function stopOralSlides(showNotice = true) {
        if (oralSlideTimer) {
            clearInterval(oralSlideTimer);
            oralSlideTimer = null;
        }
        state.examPrep.oral.slides.running = false;
        state.examPrep = persistExamPrep(state.examPrep);
        renderOralCoach();
        if (showNotice) showToast("Folienmodus gestoppt.", "info");
    }

    function advanceOralSlide() {
        const maxSlide = Math.max(1, Number.parseInt(state.examPrep.oral.slides.slideCount, 10) || 8);
        const current = Math.max(1, Number.parseInt(state.examPrep.oral.slides.currentSlide, 10) || 1);
        state.examPrep.oral.slides.currentSlide = Math.min(maxSlide, current + 1);
        state.examPrep = persistExamPrep(state.examPrep);
        renderOralCoach();
    }

    function startPronunciationCapture() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            els.oralPronunciationFeedback.innerHTML = "<p>Spracherkennung im Browser nicht verfügbar. Nutze den Textbereich für Analyse.</p>";
            return;
        }
        if (oralRecognition) {
            try { oralRecognition.stop(); } catch (_) { }
        }
        oralRecognition = new SpeechRecognition();
        oralRecognition.lang = state.examPrep.oral?.language === "presentation" ? "de-DE" : "en-US";
        oralRecognition.interimResults = true;
        oralRecognition.continuous = true;
        oralRecognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                transcript += `${event.results[i][0].transcript} `;
            }
            els.oralPronunciationText.value = normalizeText(`${els.oralPronunciationText.value} ${transcript}`);
        };
        oralRecognition.onerror = () => {
            els.oralPronunciationFeedback.innerHTML = "<p>Aufnahmefehler. Bitte Mikrofon prüfen oder Text manuell eingeben.</p>";
        };
        oralRecognition.start();
        els.oralPronunciationFeedback.innerHTML = "<p>Aufnahme läuft... sprich frei und stoppe danach.</p>";
    }

    function stopPronunciationCapture() {
        if (oralRecognition) {
            try { oralRecognition.stop(); } catch (_) { }
        }
        els.oralPronunciationFeedback.innerHTML = "<p>Aufnahme gestoppt. Starte jetzt die Analyse.</p>";
    }

    function analyzePronunciationText() {
        const text = normalizeText(els.oralPronunciationText.value);
        if (!text) {
            els.oralPronunciationFeedback.innerHTML = "<p>Bitte zuerst Text einfügen oder sprechen.</p>";
            return;
        }
        const lower = text.toLowerCase();
        const words = lower.split(/\s+/).filter(Boolean);
        const sentenceCount = Math.max(1, text.split(/[.!?]+/).filter((part) => normalizeText(part)).length);
        const avgWords = Math.round(words.length / sentenceCount);
        const isPresentation = state.examPrep.oral?.language === "presentation";
        const fillerCount = isPresentation
            ? (lower.match(/\b(äh|ähm|sozusagen|halt|irgendwie)\b/g) || []).length
            : (lower.match(/\b(um|uh|like|you know)\b/g) || []).length;
        const tips = [];
        if (avgWords < 7) tips.push("Nutze längere Sätze (8-14 Wörter), damit deine Begründung klarer wirkt.");
        if (fillerCount > 2) tips.push("Reduziere Füllwörter und nutze kurze Sprechpausen.");
        if (isPresentation) {
            if (!lower.match(/\b(erstens|zweitens|abschließend|fazit)\b/)) tips.push("Nutze Strukturwörter: erstens, zweitens, abschließend.");
            tips.push("Sprich in Blöcken: Aussage -> kurze Pause -> nächster Punkt.");
            tips.push("Zeige Folien nicht nur, erkläre aktiv die Bedeutung in eigenen Worten.");
        } else {
            if (!lower.includes("because")) tips.push("Use 'because' more often to justify your points.");
            if (!lower.match(/\b(first|second|finally|in conclusion)\b/)) tips.push("Use structure words: first, second, finally, in conclusion.");
            tips.push("Pronunciation tip: soft 'th' with tongue between teeth (think/this).");
            tips.push("Watch stress: PRE-sent (noun) vs pre-SENT (verb).");
        }
        const score = Math.max(40, Math.min(98, 88 - (fillerCount * 4) + (avgWords >= 8 ? 6 : 0)));
        els.oralPronunciationFeedback.innerHTML = `
            <p><strong>Aussprache-Check:</strong> ca. ${score}% verständlich.</p>
            <ul>${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
        `;
        state.examPrep.oral.pronunciation.lastText = text;
        state.examPrep.oral.pronunciation.lastScore = score;
        state.examPrep = persistExamPrep(state.examPrep);
    }

    function renderLanguagePage() {
        if (!state.languageHelper.currentTask) {
            generateLanguageTask(false);
        }
        const task = state.languageHelper.currentTask;
        if (!task) return;
        els.langQuestion.innerHTML = `<p><strong>${escapeHtml(task.title)}</strong></p><p>${escapeHtml(task.question)}</p>`;
        const isPresentation = state.languageHelper.mode === "presentation_speaking";
        if (els.langPresentationTools) {
            els.langPresentationTools.classList.toggle("hidden", !isPresentation);
        }
        if (!els.langFeedback.textContent.trim()) {
            els.langFeedback.innerHTML = "<p>Starte Aufnahme und antworte mündlich. Danach Aussprache-Check ausführen.</p>";
        }
        if (!els.langPronFeedback.textContent.trim()) {
            els.langPronFeedback.innerHTML = "<p>Starte Sprechen für Aussprache-/Sprachstil-Tipps.</p>";
        }
        renderLanguagePresentationState();
    }

    function generateLanguageTask(clearFeedback = true) {
        const mode = els.langMode.value || "en_speaking";
        const level = Number.parseInt(els.langLevel.value, 10) || 3;
        state.languageHelper.mode = mode;
        state.languageHelper.level = level;
        const task = createLanguageTask(mode, level);
        state.languageHelper.currentTask = task;
        state.languageHelper = persistLanguageHelper(state.languageHelper);
        if (clearFeedback) {
            els.langFeedback.innerHTML = "<p>Neue Sprachaufgabe erzeugt.</p>";
        }
        renderLanguagePage();
    }

    function createLanguageTask(mode, level) {
        if (mode === "en_speaking") {
            return {
                type: "keyword-text",
                title: `Englisch Sprechen · Level ${level}`,
                question: "Speak about your school goals for 60-90 seconds.",
                solution: ["goal", "because", "future", "improve"],
                hint: "Nutze klaren Aufbau: statement -> reason -> example -> conclusion.",
                successTip: "Starke Struktur. Sprich deutlich und mit Pausen."
            };
        }
        return {
            type: "keyword-text",
            title: `Präsentation · Level ${level}`,
            question: "Sprich frei 2-3 Minuten: Einstieg, 2 Kernpunkte, Beispiel, Schluss. Keine schriftliche Antwort nötig.",
            solution: ["einstieg", "kernpunkt", "beispiel", "schluss"],
            hint: "Klarer Aufbau und ruhiges Sprechen mit Pausen.",
            successTip: "Gute Präsentationsstruktur und klare Aussagen."
        };
    }

    function startLanguageRecording() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            els.langPronFeedback.innerHTML = "<p>Spracherkennung nicht verfügbar. Nutze Texteingabe.</p>";
            return;
        }
        if (languageRecognition) {
            try { languageRecognition.stop(); } catch (_) { }
        }
        languageRecognition = new SpeechRecognition();
        languageRecognition.lang = (els.langMode.value || "").startsWith("en") ? "en-US" : "de-DE";
        languageRecognition.interimResults = true;
        languageRecognition.continuous = true;
        languageRecognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                transcript += `${event.results[i][0].transcript} `;
            }
            els.langTranscript.value = normalizeText(`${els.langTranscript.value} ${transcript}`);
        };
        languageRecognition.start();
        els.langPronFeedback.innerHTML = "<p>Aufnahme läuft...</p>";
    }

    function stopLanguageRecording() {
        if (languageRecognition) {
            try { languageRecognition.stop(); } catch (_) { }
        }
        els.langPronFeedback.innerHTML = "<p>Aufnahme gestoppt. Starte jetzt den Check.</p>";
    }

    function analyzeLanguagePronunciation() {
        const text = normalizeText(els.langTranscript.value);
        if (!text) {
            els.langPronFeedback.innerHTML = "<p>Bitte Text einfügen oder sprechen.</p>";
            return;
        }
        const lower = text.toLowerCase();
        const words = lower.split(/\s+/).filter(Boolean);
        const sentenceCount = Math.max(1, text.split(/[.!?]+/).filter((part) => normalizeText(part)).length);
        const avgWords = Math.round(words.length / sentenceCount);
        const fillers = (lower.match(/\b(äh|ähm|um|uh|like)\b/g) || []).length;
        const tips = [];
        if (avgWords < 7) tips.push("Nutze längere Sätze mit Begründung.");
        if (fillers > 2) tips.push("Reduziere Füllwörter, mach kurze Pausen.");
        if ((els.langMode.value || "").startsWith("en")) {
            if (!lower.includes("because")) tips.push("Verwende häufiger 'because' für Gründe.");
            tips.push("Achte auf 'th' in think/this und klare Wortbetonung.");
        } else {
            if (!lower.includes("weil")) tips.push("Baue 'weil'-Sätze für stärkere Begründung ein.");
            tips.push("Achte auf klare Satzenden und deutliches Sprechen.");
        }
        const score = Math.max(35, Math.min(98, 85 - fillers * 4 + (avgWords >= 8 ? 6 : 0)));
        els.langPronFeedback.innerHTML = `<p><strong>Sprach-Check:</strong> ca. ${score}%</p><ul>${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>`;
        state.languageHelper.lastTranscript = text;
        state.languageHelper.lastScore = score;
        state.languageHelper = persistLanguageHelper(state.languageHelper);
    }

    function ensureLanguagePresentationState() {
        if (!state.languageHelper.presentation || typeof state.languageHelper.presentation !== "object") {
            state.languageHelper.presentation = {
                fileName: "",
                slideCount: 8,
                secondsPerSlide: 45,
                currentSlide: 1,
                running: false,
                nextAt: 0,
                feedback: "",
                teacherQuestions: [],
                teacherIndex: 0,
                currentTeacherQuestion: "",
                answerLog: []
            };
        }
        return state.languageHelper.presentation;
    }

    function renderLanguagePresentationState() {
        const presentation = ensureLanguagePresentationState();
        const slideCount = Math.max(1, Number.parseInt(els.langSlideCount.value, 10) || presentation.slideCount || 8);
        const seconds = Math.max(10, Number.parseInt(els.langSlideSeconds.value, 10) || presentation.secondsPerSlide || 45);
        presentation.slideCount = slideCount;
        presentation.secondsPerSlide = seconds;
        if (presentation.currentSlide > slideCount) {
            presentation.currentSlide = slideCount;
        }
        if (els.langSlideCount) {
            els.langSlideCount.value = String(slideCount);
        }
        if (els.langSlideSeconds) {
            els.langSlideSeconds.value = String(seconds);
        }
        if (els.langPresentationStatus) {
            const runningText = presentation.running ? "läuft" : "gestoppt";
            const fileName = presentation.fileName || "Keine Datei gewählt";
            els.langPresentationStatus.innerHTML = `
                <p><strong>Datei:</strong> ${escapeHtml(fileName)}</p>
                <p><strong>Folie:</strong> ${presentation.currentSlide}/${slideCount} · ${runningText} · ${seconds}s pro Folie</p>
            `;
        }
        if (els.langPresentationPreview && els.langPresentationPreviewHint) {
            if (langPresentationPreviewUrl) {
                els.langPresentationPreview.src = langPresentationPreviewUrl;
                els.langPresentationPreview.classList.remove("hidden");
                els.langPresentationPreviewHint.textContent = "Vorschau aktiv. Nutze den Folienmodus parallel.";
            } else {
                els.langPresentationPreview.removeAttribute("src");
                els.langPresentationPreview.classList.add("hidden");
                els.langPresentationPreviewHint.textContent = "PDF wird direkt angezeigt. PPT/PPTX bitte für Vorschau als PDF exportieren.";
            }
        }
        if (els.langPresentationFeedback) {
            els.langPresentationFeedback.innerHTML = presentation.feedback
                ? `<p>${escapeHtml(presentation.feedback)}</p>`
                : "<p>Starte den Folienmodus, danach bekommst du Feedback und Lehrerfragen.</p>";
        }
        if (els.langTeacherQuestion) {
            const question = presentation.currentTeacherQuestion || "Noch keine Lehrerfrage. Starte zuerst die Präsentation.";
            els.langTeacherQuestion.innerHTML = `<p><strong>Lehrerfrage:</strong> ${escapeHtml(question)}</p>`;
        }
        if (els.langTeacherLog) {
            const total = presentation.answerLog.length;
            const last = presentation.answerLog[total - 1];
            els.langTeacherLog.textContent = total
                ? `Antworten gespeichert: ${total}${last ? ` · zuletzt: ${last.text.slice(0, 48)}...` : ""}`
                : "Noch keine Antworten gespeichert.";
        }
        state.languageHelper = persistLanguageHelper(state.languageHelper);
    }

    function onLanguagePresentationFileChange() {
        const presentation = ensureLanguagePresentationState();
        const file = els.langPresentationFile.files && els.langPresentationFile.files[0];
        presentation.fileName = file ? file.name : "";
        if (langPresentationPreviewUrl) {
            URL.revokeObjectURL(langPresentationPreviewUrl);
            langPresentationPreviewUrl = "";
        }
        if (file && file.type === "application/pdf") {
            langPresentationPreviewUrl = URL.createObjectURL(file);
        }
        state.languageHelper = persistLanguageHelper(state.languageHelper);
        renderLanguagePresentationState();
    }

    function startLanguagePresentationRun() {
        stopLanguagePresentationRun(false);
        const presentation = ensureLanguagePresentationState();
        const slideCount = Math.max(1, Number.parseInt(els.langSlideCount.value, 10) || presentation.slideCount || 8);
        const seconds = Math.max(10, Number.parseInt(els.langSlideSeconds.value, 10) || presentation.secondsPerSlide || 45);
        presentation.slideCount = slideCount;
        presentation.secondsPerSlide = seconds;
        presentation.currentSlide = 1;
        presentation.running = true;
        presentation.nextAt = Date.now() + (seconds * 1000);
        presentation.feedback = "Präsentation gestartet. Sprich frei zu jeder Folie und wechsle bei Bedarf manuell.";
        langPresentationTimer = setInterval(() => {
            if (!presentation.running) return;
            const now = Date.now();
            if (now < presentation.nextAt) return;
            if (presentation.currentSlide >= presentation.slideCount) {
                stopLanguagePresentationRun(false);
                const scenario = buildOralScenario({
                    track: "MSA",
                    language: "presentation",
                    topic: "dein Thema",
                    level: state.languageHelper.level || 3
                });
                const queue = createTeacherQuestions(scenario);
                presentation.teacherQuestions = queue;
                presentation.teacherIndex = 0;
                presentation.currentTeacherQuestion = queue[0] || "Fragerunde gestartet.";
                presentation.feedback = "Folien fertig. Fragerunde gestartet.";
                state.languageHelper = persistLanguageHelper(state.languageHelper);
                renderLanguagePresentationState();
                showToast("Präsentation fertig. Lehrerfragen gestartet.", "info");
                return;
            }
            presentation.currentSlide += 1;
            presentation.nextAt = now + (presentation.secondsPerSlide * 1000);
            state.languageHelper = persistLanguageHelper(state.languageHelper);
            renderLanguagePresentationState();
        }, 500);
        state.languageHelper = persistLanguageHelper(state.languageHelper);
        renderLanguagePresentationState();
        showToast("Präsentation gestartet.", "info");
    }

    function stopLanguagePresentationRun(showNotice = true) {
        if (langPresentationTimer) {
            clearInterval(langPresentationTimer);
            langPresentationTimer = null;
        }
        const presentation = ensureLanguagePresentationState();
        presentation.running = false;
        state.languageHelper = persistLanguageHelper(state.languageHelper);
        renderLanguagePresentationState();
        if (showNotice) showToast("Präsentation gestoppt.", "info");
    }

    function nextLanguagePresentationSlide() {
        const presentation = ensureLanguagePresentationState();
        const maxSlide = Math.max(1, Number.parseInt(presentation.slideCount, 10) || 8);
        const current = Math.max(1, Number.parseInt(presentation.currentSlide, 10) || 1);
        presentation.currentSlide = Math.min(maxSlide, current + 1);
        presentation.nextAt = Date.now() + (presentation.secondsPerSlide * 1000);
        state.languageHelper = persistLanguageHelper(state.languageHelper);
        renderLanguagePresentationState();
    }

    function submitLanguageTeacherAnswer() {
        const presentation = ensureLanguagePresentationState();
        const answer = normalizeText(els.langTeacherAnswer.value);
        if (!answer) {
            showToast("Bitte eine Antwort eingeben.", "info");
            return;
        }
        const question = presentation.currentTeacherQuestion || "";
        presentation.answerLog.push({
            text: answer,
            question,
            createdAt: new Date().toISOString()
        });
        if (presentation.answerLog.length > 30) {
            presentation.answerLog = presentation.answerLog.slice(-30);
        }
        els.langTeacherAnswer.value = "";
        state.languageHelper = persistLanguageHelper(state.languageHelper);
        renderLanguagePresentationState();
    }

    function nextLanguageTeacherQuestion() {
        const presentation = ensureLanguagePresentationState();
        const queue = Array.isArray(presentation.teacherQuestions) ? presentation.teacherQuestions : [];
        if (!queue.length) {
            presentation.currentTeacherQuestion = "Starte zuerst die Präsentation, um Fragen zu erhalten.";
            state.languageHelper = persistLanguageHelper(state.languageHelper);
            renderLanguagePresentationState();
            return;
        }
        const nextIndex = Math.min(queue.length - 1, (Number.parseInt(presentation.teacherIndex, 10) || 0) + 1);
        presentation.teacherIndex = nextIndex;
        presentation.currentTeacherQuestion = queue[nextIndex];
        state.languageHelper = persistLanguageHelper(state.languageHelper);
        renderLanguagePresentationState();
    }

    function onStudySubmit(event) {
        event.preventDefault();
        clearFeedback(els.studyFeedback);
        const subject = normalizeText(els.studySubjectInput.value);
        const minutes = Number.parseInt(els.studyMinutesInput.value, 10);

        if (!subject) {
            setFeedback(els.studyFeedback, "Bitte ein Fach eingeben.", true);
            return;
        }
        if (!Number.isInteger(minutes) || minutes < 10 || minutes > 240) {
            setFeedback(els.studyFeedback, "Minuten nur von 10 bis 240.", true);
            return;
        }

        state.studyHelper.sessions.push({
            id: createId("study"),
            subject,
            minutes,
            done: false,
            createdAt: new Date().toISOString()
        });
        state.studyHelper = persistStudyHelper(state.studyHelper);
        els.studySubjectInput.value = "";
        els.studyMinutesInput.value = "";
        saveDraftsThrottled();
        renderStudyHelper();
        setFeedback(els.studyFeedback, "Lernblock hinzugefügt.");
    }

    function deleteStudySession(id) {
        state.studyHelper.sessions = state.studyHelper.sessions.filter((entry) => entry.id !== id);
        state.studyHelper = persistStudyHelper(state.studyHelper);
        renderStudyHelper();
    }

    function startFocusTimer(source = "helper") {
        if (focusTimer) return;
        const minutesInput = source === "exam"
            ? els.examFocusMinutesInput
            : (source === "exam_oral" ? els.examOralFocusMinutesInput : els.focusMinutesInput);
        const inputMinutes = Number.parseInt(minutesInput.value, 10);
        if (!Number.isInteger(inputMinutes) || inputMinutes < 5 || inputMinutes > 120) {
            showToast("Timer-Minuten müssen zwischen 5 und 120 liegen.", "info");
            return;
        }
        syncFocusMinuteInputs(inputMinutes);
        if (!state.studyHelper.focusRemainingSec || state.studyHelper.focusRemainingSec <= 0) {
            state.studyHelper.focusRemainingSec = inputMinutes * 60;
        }
        setFocusLock(true);
        focusTimer = setInterval(() => {
            state.studyHelper.focusRemainingSec -= 1;
            if (state.studyHelper.focusRemainingSec <= 0) {
                clearInterval(focusTimer);
                focusTimer = null;
                state.studyHelper.focusRemainingSec = 0;
                completeNextStudySession();
                setFocusLock(false);
                showToast("Fokus-Block abgeschlossen.", "success");
            }
            renderStudyHelper();
            persistStudyHelper(state.studyHelper);
        }, 1000);
        showToast("Fokus-Timer gestartet.", "info");
    }

    function pauseFocusTimer() {
        if (!focusTimer) return;
        clearInterval(focusTimer);
        focusTimer = null;
        persistStudyHelper(state.studyHelper);
        showToast("Fokus-Timer pausiert.", "info");
    }

    function stopFocusTimer() {
        if (focusTimer) {
            clearInterval(focusTimer);
            focusTimer = null;
        }
        setFocusLock(false);
        persistStudyHelper(state.studyHelper);
        showToast("Fokus-Modus beendet.", "info");
    }

    function resetFocusTimer(source = "helper") {
        if (focusTimer) {
            clearInterval(focusTimer);
            focusTimer = null;
        }
        setFocusLock(false);
        const minutesInput = source === "exam"
            ? els.examFocusMinutesInput
            : (source === "exam_oral" ? els.examOralFocusMinutesInput : els.focusMinutesInput);
        const inputMinutes = Number.parseInt(minutesInput.value, 10);
        const minutes = Number.isInteger(inputMinutes) && inputMinutes >= 5 && inputMinutes <= 120 ? inputMinutes : 25;
        syncFocusMinuteInputs(minutes);
        state.studyHelper.focusRemainingSec = minutes * 60;
        state.studyHelper = persistStudyHelper(state.studyHelper);
        renderStudyHelper();
    }

    function completeNextStudySession() {
        const nextOpen = state.studyHelper.sessions
            .filter((entry) => !entry.done)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
        if (!nextOpen) return;
        nextOpen.done = true;
        state.studyHelper = persistStudyHelper(state.studyHelper);
        renderStudyHelper();
    }

    function setFocusLock(active) {
        focusLockActive = active;
        document.body.classList.toggle("focus-active", active);
        if (els.focusFloating) {
            els.focusFloating.classList.toggle("hidden", !active);
        }
        const whitelist = new Set([
            "focus-pause", "focus-reset", "focus-stop", "focus-floating-stop",
            "exam-focus-pause", "exam-focus-reset", "exam-focus-stop",
            "exam-oral-focus-pause", "exam-oral-focus-reset", "exam-oral-focus-stop",
            "quiz-subject", "quiz-topic-focus", "quiz-level", "quiz-style", "quiz-answer",
            "quiz-check", "quiz-next", "quiz-hint", "quiz-explain", "quiz-ask-input", "quiz-ask-btn",
            "exam-tutor-track", "exam-tutor-subject", "exam-tutor-level", "exam-tutor-answer",
            "exam-tutor-check", "exam-tutor-next", "exam-tutor-hint", "exam-tutor-ask-input", "exam-tutor-ask-btn",
            "exam-tab-written", "exam-tab-oral",
            "oral-track", "oral-language", "oral-topic", "oral-generate", "oral-next-question",
            "oral-presentation-file", "oral-slide-count", "oral-slide-seconds",
            "oral-slide-start", "oral-slide-stop", "oral-slide-next",
            "oral-pronunciation-record", "oral-pronunciation-stop", "oral-pronunciation-text", "oral-pronunciation-check",
            "calc-input", "calc-eval", "duden-input", "duden-lookup",
            "exam-calc-input", "exam-calc-eval", "exam-duden-input", "exam-duden-lookup",
            "btn-helper", "btn-language", "btn-exams"
        ]);
        const controls = document.querySelectorAll("button, input, select, textarea");
        controls.forEach((el) => {
            if (whitelist.has(el.id) || el.classList.contains("calc-key")) {
                el.disabled = false;
                return;
            }
            el.disabled = active;
        });
        if (!active) {
            controls.forEach((el) => {
                el.disabled = false;
            });
        }
        if (active && state.viewPage !== "helper" && state.viewPage !== "exams") {
            showPage("helper");
        }
    }

    function syncFocusMinuteInputs(minutes) {
        if (els.focusMinutesInput) els.focusMinutesInput.value = String(minutes);
        if (els.examFocusMinutesInput) els.examFocusMinutesInput.value = String(minutes);
        if (els.examOralFocusMinutesInput) els.examOralFocusMinutesInput.value = String(minutes);
    }

    function onExamItemSubmit(event) {
        event.preventDefault();
        clearFeedback(els.examFeedback);
        const text = normalizeText(els.examItemText.value);
        if (!text) {
            setFeedback(els.examFeedback, "Bitte einen Punkt eingeben.", true);
            return;
        }
        const track = state.examPrep.activeTrack;
        const items = getExamItems(track);
        items.push({
            id: createId("exam-item"),
            text,
            done: false,
            preset: false
        });
        state.examPrep = persistExamPrep(state.examPrep);
        els.examItemText.value = "";
        saveDraftsThrottled();
        renderExamPrep();
        renderStats();
        setFeedback(els.examFeedback, "Punkt hinzugefügt.");
    }

    function deleteExamItem(id) {
        const track = state.examPrep.activeTrack;
        state.examPrep.tracks[track] = getExamItems(track).filter((entry) => entry.id !== id);
        state.examPrep = persistExamPrep(state.examPrep);
        renderExamPrep();
        renderStats();
    }

    function getTrackCompletionPercent(track) {
        const map = state.examPrep.tutor?.stats?.progressByTheme || {};
        const keys = [`${track}:math`, `${track}:de`, `${track}:en`, `${track}:en_oral`, `${track}:presentation`];
        const values = keys.map((key) => Math.max(0, Math.min(100, Number.parseInt(map[key], 10) || 0)));
        const avg = Math.round(values.reduce((acc, value) => acc + value, 0) / values.length);
        return avg;
    }

    function getThemeProgressPercent(track, themeCode) {
        if (!themeCode) return getTrackCompletionPercent(track);
        const map = state.examPrep.tutor?.stats?.progressByTheme || {};
        const key = `${track}:${themeCode}`;
        return Math.max(0, Math.min(100, Number.parseInt(map[key], 10) || 0));
    }

    function inferThemeCodeFromItemText(text) {
        const lower = normalizeText(text).toLowerCase();
        if (!lower) return "";
        if (lower.includes("mathe") || lower.includes("algebra") || lower.includes("x ")) return "math";
        if (lower.includes("deutsch") || lower.includes("textanalyse") || lower.includes("erörterung")) return "de";
        if (lower.includes("englisch mündlich") || lower.includes("oral") || lower.includes("mündlich")) return "en_oral";
        if (lower.includes("englisch") || lower.includes("listening") || lower.includes("writing") || lower.includes("vokabel")) return "en";
        if (lower.includes("präsentation") || lower.includes("praesentation")) return "presentation";
        return "";
    }

    function autoMarkExamItems(track, percent) {
        const items = getExamItems(track);
        if (!items.length) return;
        const targetDone = Math.round((percent / 100) * items.length);
        items.forEach((item, index) => {
            item.done = index < targetDone;
        });
        state.examPrep = persistExamPrep(state.examPrep);
    }

    function getExamItems(track) {
        if (!state.examPrep.tracks[track]) {
            state.examPrep.tracks[track] = buildExamPreset(track);
        }
        return state.examPrep.tracks[track];
    }

    function buildExamPreset(track) {
        const presets = {
            MSA: ["Deutsch: Textanalyse üben", "Mathe: Aufgabenmix trainieren", "Englisch: Listening + Writing", "Präsentationsprüfung vorbereiten"],
            BBR: ["Deutsch Grundlagen wiederholen", "Mathe Grundaufgaben festigen", "Englisch Basis-Vokabeln", "Prüfungsablauf durchgehen"],
            eBBR: ["Deutsch: Erörterung strukturieren", "Mathe: Sachaufgaben intensiv", "Englisch: Grammatik festigen", "Lernplan für Prüfungstage erstellen"]
        };
        return (presets[track] || presets.MSA).map((text) => ({
            id: createId("exam-item"),
            text,
            done: false,
            preset: true
        }));
    }

    function hydrateExamPrepUI() {
        if (els.examTrack) {
            els.examTrack.value = state.examPrep.activeTrack;
        }
        if (els.examTutorTrack) {
            els.examTutorTrack.value = state.examPrep.tutor?.track || "MSA";
        }
        if (els.examTutorSubject) {
            els.examTutorSubject.value = state.examPrep.tutor?.subject || "math";
        }
        if (els.examTutorLevel) {
            const stored = Number.parseInt(state.examPrep.tutor?.level, 10);
            const safeLevel = [1, 2, 3, 4, 5, 6].includes(stored) ? stored : 3;
            els.examTutorLevel.value = String(safeLevel);
        }
        if (els.officialExamsRegion) {
            const region = OFFICIAL_EXAM_SOURCES[state.settings.region] ? state.settings.region : "BE";
            els.officialExamsRegion.value = region;
        }
        if (els.oralTrack) {
            els.oralTrack.value = state.examPrep.oral?.track || "MSA";
        }
        if (els.oralLanguage) {
            els.oralLanguage.value = state.examPrep.oral?.language || "en";
        }
        if (els.oralTopic) {
            els.oralTopic.value = state.examPrep.oral?.topic || "";
        }
        if (els.oralSlideCount) {
            els.oralSlideCount.value = String(state.examPrep.oral?.slides?.slideCount || 8);
        }
        if (els.oralSlideSeconds) {
            els.oralSlideSeconds.value = String(state.examPrep.oral?.slides?.secondsPerSlide || 45);
        }
        setExamTab("written");
    }

    function hydrateLanguageUI() {
        if (els.langMode) {
            els.langMode.value = state.languageHelper.mode || "en_speaking";
        }
        if (els.langLevel) {
            els.langLevel.value = String(state.languageHelper.level || 3);
        }
        if (els.langTranscript && typeof state.languageHelper.lastTranscript === "string") {
            els.langTranscript.value = state.languageHelper.lastTranscript;
        }
        if (state.languageHelper.presentation) {
            if (els.langSlideCount) {
                els.langSlideCount.value = String(state.languageHelper.presentation.slideCount || 8);
            }
            if (els.langSlideSeconds) {
                els.langSlideSeconds.value = String(state.languageHelper.presentation.secondsPerSlide || 45);
            }
        }
    }

    function formatDuration(totalSeconds) {
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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

    function applyResponsiveLayoutState() {
        const isMobile = window.innerWidth <= 920;
        document.body.classList.toggle("is-mobile", isMobile);
        if (isMobile) {
            document.body.classList.remove("sidebar-collapsed");
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
            goalDate: els.goalDateInput.value,
            studySubject: els.studySubjectInput.value,
            studyMinutes: els.studyMinutesInput.value,
            examItemText: els.examItemText.value,
            quizAnswer: els.quizAnswer.value,
            quizSubject: els.quizSubject.value,
            quizTopicFocus: els.quizTopicFocus.value,
            quizLevel: els.quizLevel.value,
            quizStyle: els.quizStyle.value,
            quizAskInput: els.quizAskInput.value,
            examTutorAnswer: els.examTutorAnswer.value,
            examTutorAskInput: els.examTutorAskInput.value,
            oralTopic: els.oralTopic.value,
            oralPronunciationText: els.oralPronunciationText.value,
            langTranscript: els.langTranscript.value
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
            if (typeof drafts.studySubject === "string") els.studySubjectInput.value = drafts.studySubject;
            if (typeof drafts.studyMinutes === "string") els.studyMinutesInput.value = drafts.studyMinutes;
            if (typeof drafts.examItemText === "string") els.examItemText.value = drafts.examItemText;
            if (typeof drafts.quizAnswer === "string") els.quizAnswer.value = drafts.quizAnswer;
            if (typeof drafts.quizSubject === "string") els.quizSubject.value = drafts.quizSubject;
            else if (typeof drafts.quizTopic === "string") els.quizSubject.value = drafts.quizTopic;
            if (typeof drafts.quizTopicFocus === "string") els.quizTopicFocus.value = drafts.quizTopicFocus;
            if (typeof drafts.quizLevel === "string") els.quizLevel.value = drafts.quizLevel;
            if (typeof drafts.quizStyle === "string") els.quizStyle.value = drafts.quizStyle;
            if (typeof drafts.quizAskInput === "string") els.quizAskInput.value = drafts.quizAskInput;
            if (typeof drafts.examTutorAnswer === "string") els.examTutorAnswer.value = drafts.examTutorAnswer;
            if (typeof drafts.examTutorAskInput === "string") els.examTutorAskInput.value = drafts.examTutorAskInput;
            if (typeof drafts.oralTopic === "string") els.oralTopic.value = drafts.oralTopic;
            if (typeof drafts.oralPronunciationText === "string") els.oralPronunciationText.value = drafts.oralPronunciationText;
            if (typeof drafts.langTranscript === "string") els.langTranscript.value = drafts.langTranscript;
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

    function loadStudyHelper() {
        const fallback = {
            sessions: [],
            focusRemainingSec: 25 * 60,
            quiz: {
                currentTask: null,
                stats: { correct: 0, wrong: 0, streak: 0, points: 0 }
            }
        };
        try {
            const raw = localStorage.getItem("gf_study_helper");
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") return fallback;
            const sessions = Array.isArray(parsed.sessions)
                ? parsed.sessions
                    .map((entry) => ({
                        id: typeof entry.id === "string" ? entry.id : createId("study"),
                        subject: normalizeText(entry.subject),
                        minutes: Number.parseInt(entry.minutes, 10),
                        done: Boolean(entry.done),
                        createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString()
                    }))
                    .filter((entry) => entry.subject && Number.isInteger(entry.minutes) && entry.minutes >= 10 && entry.minutes <= 240)
                : [];
            const focusRemainingSec = Number.isInteger(parsed.focusRemainingSec) && parsed.focusRemainingSec >= 0 ? parsed.focusRemainingSec : fallback.focusRemainingSec;
            const quizStats = parsed.quiz && parsed.quiz.stats && typeof parsed.quiz.stats === "object"
                ? {
                    correct: Math.max(0, Number.parseInt(parsed.quiz.stats.correct, 10) || 0),
                    wrong: Math.max(0, Number.parseInt(parsed.quiz.stats.wrong, 10) || 0),
                    streak: Math.max(0, Number.parseInt(parsed.quiz.stats.streak, 10) || 0),
                    points: Math.max(0, Number.parseInt(parsed.quiz.stats.points, 10) || 0)
                }
                : fallback.quiz.stats;
            const currentTask = parsed.quiz && parsed.quiz.currentTask && typeof parsed.quiz.currentTask === "object"
                ? parsed.quiz.currentTask
                : null;
            return {
                sessions,
                focusRemainingSec,
                quiz: {
                    currentTask,
                    stats: quizStats
                }
            };
        } catch (_) {
            return fallback;
        }
    }

    function persistStudyHelper(data) {
        const clean = {
            sessions: Array.isArray(data.sessions) ? data.sessions : [],
            focusRemainingSec: Number.isInteger(data.focusRemainingSec) && data.focusRemainingSec >= 0 ? data.focusRemainingSec : 25 * 60,
            quiz: {
                currentTask: data.quiz && data.quiz.currentTask ? data.quiz.currentTask : null,
                stats: {
                    correct: Math.max(0, Number.parseInt(data.quiz?.stats?.correct, 10) || 0),
                    wrong: Math.max(0, Number.parseInt(data.quiz?.stats?.wrong, 10) || 0),
                    streak: Math.max(0, Number.parseInt(data.quiz?.stats?.streak, 10) || 0),
                    points: Math.max(0, Number.parseInt(data.quiz?.stats?.points, 10) || 0)
                }
            }
        };
        localStorage.setItem("gf_study_helper", JSON.stringify(clean));
        return clean;
    }

    function loadLanguageHelper() {
        const fallback = {
            mode: "en_speaking",
            level: 3,
            currentTask: null,
            stats: { correct: 0, wrong: 0 },
            lastTranscript: "",
            lastScore: 0,
            presentation: {
                fileName: "",
                slideCount: 8,
                secondsPerSlide: 45,
                currentSlide: 1,
                running: false,
                nextAt: 0,
                feedback: "",
                teacherQuestions: [],
                teacherIndex: 0,
                currentTeacherQuestion: "",
                answerLog: []
            }
        };
        try {
            const raw = localStorage.getItem("gf_language_helper");
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") return fallback;
            const presentationRaw = parsed.presentation && typeof parsed.presentation === "object" ? parsed.presentation : {};
            const slideCount = Math.max(1, Number.parseInt(presentationRaw.slideCount, 10) || fallback.presentation.slideCount);
            const seconds = Math.max(10, Number.parseInt(presentationRaw.secondsPerSlide, 10) || fallback.presentation.secondsPerSlide);
            const currentSlide = Math.max(1, Math.min(slideCount, Number.parseInt(presentationRaw.currentSlide, 10) || 1));
            const teacherQuestions = Array.isArray(presentationRaw.teacherQuestions)
                ? presentationRaw.teacherQuestions.filter((entry) => typeof entry === "string" && entry.trim())
                : [];
            const answerLog = Array.isArray(presentationRaw.answerLog)
                ? presentationRaw.answerLog
                    .filter((entry) => entry && typeof entry === "object" && typeof entry.text === "string")
                    .slice(-30)
                : [];
            const teacherIndex = Math.min(
                Math.max(0, Number.parseInt(presentationRaw.teacherIndex, 10) || 0),
                Math.max(0, teacherQuestions.length - 1)
            );
            return {
                mode: ["en_speaking", "presentation_speaking"].includes(parsed.mode) ? parsed.mode : fallback.mode,
                level: [1, 2, 3, 4, 5].includes(Number.parseInt(parsed.level, 10)) ? Number.parseInt(parsed.level, 10) : fallback.level,
                currentTask: parsed.currentTask && typeof parsed.currentTask === "object" ? parsed.currentTask : null,
                stats: {
                    correct: Math.max(0, Number.parseInt(parsed.stats?.correct, 10) || 0),
                    wrong: Math.max(0, Number.parseInt(parsed.stats?.wrong, 10) || 0)
                },
                lastTranscript: typeof parsed.lastTranscript === "string" ? parsed.lastTranscript : "",
                lastScore: Math.max(0, Math.min(100, Number.parseInt(parsed.lastScore, 10) || 0)),
                presentation: {
                    fileName: typeof presentationRaw.fileName === "string" ? presentationRaw.fileName : "",
                    slideCount,
                    secondsPerSlide: seconds,
                    currentSlide,
                    running: false,
                    nextAt: 0,
                    feedback: typeof presentationRaw.feedback === "string" ? presentationRaw.feedback : "",
                    teacherQuestions,
                    teacherIndex,
                    currentTeacherQuestion: typeof presentationRaw.currentTeacherQuestion === "string"
                        ? presentationRaw.currentTeacherQuestion
                        : "",
                    answerLog
                }
            };
        } catch (_) {
            return fallback;
        }
    }

    function persistLanguageHelper(data) {
        const presentationRaw = data.presentation && typeof data.presentation === "object" ? data.presentation : {};
        const slideCount = Math.max(1, Number.parseInt(presentationRaw.slideCount, 10) || 8);
        const seconds = Math.max(10, Number.parseInt(presentationRaw.secondsPerSlide, 10) || 45);
        const currentSlide = Math.max(1, Math.min(slideCount, Number.parseInt(presentationRaw.currentSlide, 10) || 1));
        const teacherQuestions = Array.isArray(presentationRaw.teacherQuestions)
            ? presentationRaw.teacherQuestions.filter((entry) => typeof entry === "string" && entry.trim())
            : [];
        const teacherIndex = Math.min(
            Math.max(0, Number.parseInt(presentationRaw.teacherIndex, 10) || 0),
            Math.max(0, teacherQuestions.length - 1)
        );
        const answerLog = Array.isArray(presentationRaw.answerLog)
            ? presentationRaw.answerLog
                .filter((entry) => entry && typeof entry === "object" && typeof entry.text === "string")
                .slice(-30)
            : [];
        const clean = {
            mode: ["en_speaking", "presentation_speaking"].includes(data.mode) ? data.mode : "en_speaking",
            level: [1, 2, 3, 4, 5].includes(Number.parseInt(data.level, 10)) ? Number.parseInt(data.level, 10) : 3,
            currentTask: data.currentTask && typeof data.currentTask === "object" ? data.currentTask : null,
            stats: {
                correct: Math.max(0, Number.parseInt(data.stats?.correct, 10) || 0),
                wrong: Math.max(0, Number.parseInt(data.stats?.wrong, 10) || 0)
            },
            lastTranscript: typeof data.lastTranscript === "string" ? data.lastTranscript : "",
            lastScore: Math.max(0, Math.min(100, Number.parseInt(data.lastScore, 10) || 0)),
            presentation: {
                fileName: typeof presentationRaw.fileName === "string" ? presentationRaw.fileName : "",
                slideCount,
                secondsPerSlide: seconds,
                currentSlide,
                running: Boolean(presentationRaw.running) && false,
                nextAt: 0,
                feedback: typeof presentationRaw.feedback === "string" ? presentationRaw.feedback : "",
                teacherQuestions,
                teacherIndex,
                currentTeacherQuestion: typeof presentationRaw.currentTeacherQuestion === "string"
                    ? presentationRaw.currentTeacherQuestion
                    : "",
                answerLog
            }
        };
        localStorage.setItem("gf_language_helper", JSON.stringify(clean));
        return clean;
    }

    function loadOfficialExams() {
        const fallback = {
            byState: {}
        };
        try {
            const raw = localStorage.getItem(OFFICIAL_EXAMS_STORAGE_KEY);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") return fallback;
            const byState = parsed.byState && typeof parsed.byState === "object" ? parsed.byState : {};
            const cleanByState = {};
            Object.keys(OFFICIAL_EXAM_SOURCES).forEach((code) => {
                const stateData = byState[code] && typeof byState[code] === "object" ? byState[code] : {};
                const items = Array.isArray(stateData.items)
                    ? stateData.items
                        .filter((entry) => entry && typeof entry === "object")
                        .map((entry) => ({
                            track: ["MSA", "BBR", "eBBR"].includes(entry.track) ? entry.track : "MSA",
                            subject: typeof entry.subject === "string" ? entry.subject : "",
                            date: isIsoDate(entry.date) ? entry.date : "",
                            kind: entry.kind === "makeup" ? "makeup" : "exam",
                            note: typeof entry.note === "string" ? entry.note : ""
                        }))
                        .filter((entry) => entry.subject || entry.note)
                    : [];
                cleanByState[code] = {
                    source: typeof stateData.source === "string" ? stateData.source : "",
                    officialPdf: typeof stateData.officialPdf === "string" ? stateData.officialPdf : "",
                    updatedAt: Number.isFinite(stateData.updatedAt) ? stateData.updatedAt : 0,
                    status: typeof stateData.status === "string" ? stateData.status : "",
                    items
                };
            });
            return {
                byState: cleanByState
            };
        } catch (_) {
            return fallback;
        }
    }

    function persistOfficialExams(data) {
        const inputByState = data.byState && typeof data.byState === "object" ? data.byState : {};
        const cleanByState = {};
        Object.keys(OFFICIAL_EXAM_SOURCES).forEach((code) => {
            const stateData = inputByState[code] && typeof inputByState[code] === "object" ? inputByState[code] : {};
            cleanByState[code] = {
                source: typeof stateData.source === "string" ? stateData.source : "",
                officialPdf: typeof stateData.officialPdf === "string" ? stateData.officialPdf : "",
                updatedAt: Number.isFinite(stateData.updatedAt) ? stateData.updatedAt : 0,
                status: typeof stateData.status === "string" ? stateData.status : "",
                items: Array.isArray(stateData.items)
                    ? stateData.items.map((entry) => ({
                        track: ["MSA", "BBR", "eBBR"].includes(entry.track) ? entry.track : "MSA",
                        subject: typeof entry.subject === "string" ? entry.subject : "",
                        date: isIsoDate(entry.date) ? entry.date : "",
                        kind: entry.kind === "makeup" ? "makeup" : "exam",
                        note: typeof entry.note === "string" ? entry.note : ""
                    }))
                    : []
            };
        });
        const clean = { byState: cleanByState };
        localStorage.setItem(OFFICIAL_EXAMS_STORAGE_KEY, JSON.stringify(clean));
        return clean;
    }

    function loadExamPrep() {
        const fallback = {
            activeTrack: "MSA",
            tracks: {
                MSA: buildExamPreset("MSA"),
                BBR: buildExamPreset("BBR"),
                eBBR: buildExamPreset("eBBR")
            },
            tutor: {
                track: "MSA",
                subject: "math",
                level: 3,
                currentTask: null,
                stats: { correct: 0, wrong: 0, readiness: 0 }
            },
            oral: {
                activeTab: "written",
                track: "MSA",
                language: "en",
                topic: "",
                currentPrompt: "",
                teacherQuestions: [],
                teacherIndex: 0,
                currentTeacherQuestion: "",
                slides: {
                    fileName: "",
                    slideCount: 8,
                    secondsPerSlide: 45,
                    currentSlide: 1,
                    running: false,
                    nextAt: 0
                },
                pronunciation: {
                    lastText: "",
                    lastScore: 0
                }
            }
        };
        try {
            const raw = localStorage.getItem("gf_exam_prep");
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") return fallback;
            const activeTrack = ["MSA", "BBR", "eBBR"].includes(parsed.activeTrack) ? parsed.activeTrack : "MSA";
            const tracks = { ...fallback.tracks };
            if (parsed.tracks && typeof parsed.tracks === "object") {
                ["MSA", "BBR", "eBBR"].forEach((track) => {
                    if (!Array.isArray(parsed.tracks[track])) return;
                    const items = parsed.tracks[track]
                        .map((entry) => ({
                            id: typeof entry.id === "string" ? entry.id : createId("exam-item"),
                            text: normalizeText(entry.text),
                            done: Boolean(entry.done),
                            preset: Boolean(entry.preset)
                        }))
                        .filter((entry) => entry.text);
                    tracks[track] = items.length ? items : buildExamPreset(track);
                });
            }
            const tutorRaw = parsed.tutor && typeof parsed.tutor === "object" ? parsed.tutor : fallback.tutor;
            const tutor = {
                track: ["MSA", "BBR", "eBBR"].includes(tutorRaw.track) ? tutorRaw.track : "MSA",
                subject: ["math", "de", "en", "en_oral", "presentation"].includes(tutorRaw.subject) ? tutorRaw.subject : "math",
                level: [1, 2, 3, 4, 5, 6].includes(Number.parseInt(tutorRaw.level, 10)) ? Number.parseInt(tutorRaw.level, 10) : 3,
                currentTask: tutorRaw.currentTask && typeof tutorRaw.currentTask === "object" ? tutorRaw.currentTask : null,
                stats: {
                    correct: Math.max(0, Number.parseInt(tutorRaw.stats?.correct, 10) || 0),
                    wrong: Math.max(0, Number.parseInt(tutorRaw.stats?.wrong, 10) || 0),
                    readiness: Math.max(0, Math.min(100, Number.parseInt(tutorRaw.stats?.readiness, 10) || 0)),
                    progressByTheme: tutorRaw.stats?.progressByTheme && typeof tutorRaw.stats.progressByTheme === "object" ? tutorRaw.stats.progressByTheme : {}
                }
            };
            const oralRaw = parsed.oral && typeof parsed.oral === "object" ? parsed.oral : fallback.oral;
            const oral = {
                activeTab: oralRaw.activeTab === "oral" ? "oral" : "written",
                track: ["MSA", "BBR", "eBBR"].includes(oralRaw.track) ? oralRaw.track : "MSA",
                language: oralRaw.language === "presentation" ? "presentation" : "en",
                topic: normalizeText(oralRaw.topic),
                currentPrompt: typeof oralRaw.currentPrompt === "string" ? oralRaw.currentPrompt : "",
                teacherQuestions: Array.isArray(oralRaw.teacherQuestions) ? oralRaw.teacherQuestions.filter((entry) => typeof entry === "string") : [],
                teacherIndex: Math.max(0, Number.parseInt(oralRaw.teacherIndex, 10) || 0),
                currentTeacherQuestion: typeof oralRaw.currentTeacherQuestion === "string" ? oralRaw.currentTeacherQuestion : "",
                slides: {
                    fileName: typeof oralRaw.slides?.fileName === "string" ? oralRaw.slides.fileName : "",
                    slideCount: Math.max(1, Number.parseInt(oralRaw.slides?.slideCount, 10) || 8),
                    secondsPerSlide: Math.max(10, Number.parseInt(oralRaw.slides?.secondsPerSlide, 10) || 45),
                    currentSlide: Math.max(1, Number.parseInt(oralRaw.slides?.currentSlide, 10) || 1),
                    running: false,
                    nextAt: 0
                },
                pronunciation: {
                    lastText: typeof oralRaw.pronunciation?.lastText === "string" ? oralRaw.pronunciation.lastText : "",
                    lastScore: Math.max(0, Math.min(100, Number.parseInt(oralRaw.pronunciation?.lastScore, 10) || 0))
                }
            };
            return { activeTrack, tracks, tutor, oral };
        } catch (_) {
            return fallback;
        }
    }

    function persistExamPrep(data) {
        const clean = {
            activeTrack: ["MSA", "BBR", "eBBR"].includes(data.activeTrack) ? data.activeTrack : "MSA",
            tracks: {
                MSA: Array.isArray(data.tracks?.MSA) ? data.tracks.MSA : buildExamPreset("MSA"),
                BBR: Array.isArray(data.tracks?.BBR) ? data.tracks.BBR : buildExamPreset("BBR"),
                eBBR: Array.isArray(data.tracks?.eBBR) ? data.tracks.eBBR : buildExamPreset("eBBR")
            },
            tutor: {
                track: ["MSA", "BBR", "eBBR"].includes(data.tutor?.track) ? data.tutor.track : "MSA",
                subject: ["math", "de", "en", "en_oral", "presentation"].includes(data.tutor?.subject) ? data.tutor.subject : "math",
            level: [1, 2, 3, 4, 5, 6].includes(Number.parseInt(data.tutor?.level, 10)) ? Number.parseInt(data.tutor.level, 10) : 3,
                currentTask: data.tutor?.currentTask && typeof data.tutor.currentTask === "object" ? data.tutor.currentTask : null,
                stats: {
                    correct: Math.max(0, Number.parseInt(data.tutor?.stats?.correct, 10) || 0),
                    wrong: Math.max(0, Number.parseInt(data.tutor?.stats?.wrong, 10) || 0),
                    readiness: Math.max(0, Math.min(100, Number.parseInt(data.tutor?.stats?.readiness, 10) || 0)),
                    progressByTheme: data.tutor?.stats?.progressByTheme && typeof data.tutor.stats.progressByTheme === "object" ? data.tutor.stats.progressByTheme : {}
                }
            },
            oral: {
                activeTab: data.oral?.activeTab === "oral" ? "oral" : "written",
                track: ["MSA", "BBR", "eBBR"].includes(data.oral?.track) ? data.oral.track : "MSA",
                language: data.oral?.language === "presentation" ? "presentation" : "en",
                topic: normalizeText(data.oral?.topic),
                currentPrompt: typeof data.oral?.currentPrompt === "string" ? data.oral.currentPrompt : "",
                teacherQuestions: Array.isArray(data.oral?.teacherQuestions) ? data.oral.teacherQuestions.filter((entry) => typeof entry === "string") : [],
                teacherIndex: Math.max(0, Number.parseInt(data.oral?.teacherIndex, 10) || 0),
                currentTeacherQuestion: typeof data.oral?.currentTeacherQuestion === "string" ? data.oral.currentTeacherQuestion : "",
                slides: {
                    fileName: typeof data.oral?.slides?.fileName === "string" ? data.oral.slides.fileName : "",
                    slideCount: Math.max(1, Number.parseInt(data.oral?.slides?.slideCount, 10) || 8),
                    secondsPerSlide: Math.max(10, Number.parseInt(data.oral?.slides?.secondsPerSlide, 10) || 45),
                    currentSlide: Math.max(1, Number.parseInt(data.oral?.slides?.currentSlide, 10) || 1),
                    running: false,
                    nextAt: 0
                },
                pronunciation: {
                    lastText: typeof data.oral?.pronunciation?.lastText === "string" ? data.oral.pronunciation.lastText : "",
                    lastScore: Math.max(0, Math.min(100, Number.parseInt(data.oral?.pronunciation?.lastScore, 10) || 0))
                }
            }
        };
        localStorage.setItem("gf_exam_prep", JSON.stringify(clean));
        return clean;
    }

    function exportData() {
        const payload = {
            exportedAt: new Date().toISOString(),
            subjectsStore: state.subjectsStore,
            eventsStore: state.eventsStore,
            settings: state.settings,
            goals: state.goals,
            studyHelper: state.studyHelper,
            examPrep: state.examPrep,
            languageHelper: state.languageHelper,
            officialExams: state.officialExams
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
                if (parsed.studyHelper && typeof parsed.studyHelper === "object") {
                    state.studyHelper = persistStudyHelper(parsed.studyHelper);
                }
                if (parsed.examPrep && typeof parsed.examPrep === "object") {
                    state.examPrep = persistExamPrep(parsed.examPrep);
                    hydrateExamPrepUI();
                }
                if (parsed.languageHelper && typeof parsed.languageHelper === "object") {
                    state.languageHelper = persistLanguageHelper(parsed.languageHelper);
                    hydrateLanguageUI();
                }
                if (parsed.officialExams && typeof parsed.officialExams === "object") {
                    state.officialExams = persistOfficialExams(parsed.officialExams);
                    renderOfficialExamDates();
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
