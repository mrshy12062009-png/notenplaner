export const PRIORITY_LABELS = {
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig"
};

export function normalizeText(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/\s+/g, " ");
}

export function sanitizePriority(value) {
    if (value === "high" || value === "medium" || value === "low") {
        return value;
    }
    return "medium";
}

export function calculateAverage(notes) {
    if (!Array.isArray(notes) || !notes.length) return null;
    const sum = notes.reduce((acc, note) => acc + note.value, 0);
    return (sum / notes.length).toFixed(1);
}

export function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function priorityRank(priority) {
    if (priority === "high") return 0;
    if (priority === "medium") return 1;
    return 2;
}

export function isIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function toIsoDate(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDate(dateValue) {
    const date = new Date(isIsoDate(dateValue) ? `${dateValue}T00:00:00` : dateValue);
    if (Number.isNaN(date.getTime())) return "Unbekanntes Datum";
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function normalizeId(value, prefix) {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return createId(prefix);
}

export function sanitizeIsoDateTime(value) {
    if (typeof value !== "string") return new Date().toISOString();
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
    return parsed.toISOString();
}
