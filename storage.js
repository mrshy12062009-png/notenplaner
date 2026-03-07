import {
    createId,
    isIsoDate,
    normalizeId,
    normalizeText,
    sanitizeIsoDateTime,
    sanitizePriority
} from "./utils.js";

const STORAGE_KEYS = {
    subjects: "gf_data",
    events: "gf_events"
};

const SCHEMA_VERSION = 2;

const DEFAULT_EVENTS_SEED = {
    "2026-01-12": [{ id: "seed-1", text: "Präsentationsprüfung", priority: "high", seed: true }],
    "2026-03-09": [{ id: "seed-2", text: "Englisch Mündlich", priority: "medium", seed: true }],
    "2026-04-21": [{ id: "seed-3", text: "MSA Deutsch", priority: "high", seed: true }],
    "2026-04-29": [{ id: "seed-4", text: "MSA Mathe", priority: "high", seed: true }],
    "2026-05-05": [{ id: "seed-5", text: "MSA Englisch", priority: "high", seed: true }]
};

export function loadSubjectsStore() {
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

export function loadEventsStore() {
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

export function persistSubjects(subjectsStore) {
    const cleanStore = {
        version: SCHEMA_VERSION,
        subjects: sanitizeSubjects(subjectsStore.subjects)
    };
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(cleanStore));
    return cleanStore;
}

export function persistEvents(eventsStore) {
    const cleanStore = {
        version: SCHEMA_VERSION,
        events: sanitizeEventsMap(eventsStore.events)
    };
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(cleanStore));
    return cleanStore;
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
