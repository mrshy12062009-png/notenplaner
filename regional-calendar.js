import { toIsoDate } from "./utils.js";

export const REGION_OPTIONS = [
    { code: "ALL", label: "Alle 16" },
    { code: "BW", label: "Baden-Württemberg" },
    { code: "BY", label: "Bayern" },
    { code: "BE", label: "Berlin" },
    { code: "BB", label: "Brandenburg" },
    { code: "HB", label: "Bremen" },
    { code: "HH", label: "Hamburg" },
    { code: "HE", label: "Hessen" },
    { code: "MV", label: "Mecklenburg-Vorpommern" },
    { code: "NI", label: "Niedersachsen" },
    { code: "NW", label: "Nordrhein-Westfalen" },
    { code: "RP", label: "Rheinland-Pfalz" },
    { code: "SL", label: "Saarland" },
    { code: "SN", label: "Sachsen" },
    { code: "ST", label: "Sachsen-Anhalt" },
    { code: "SH", label: "Schleswig-Holstein" },
    { code: "TH", label: "Thüringen" }
];

const STATE_CODES = REGION_OPTIONS.filter((entry) => entry.code !== "ALL").map((entry) => entry.code);

const VACATION_TEMPLATES = {
    BW: { winterWeek: 8, springStart: -10, springEnd: 1, summerStart: [7, 28], summerLength: 42, autumnWeek: 43 },
    BY: { winterWeek: 9, springStart: -12, springEnd: 1, summerStart: [8, 1], summerLength: 42, autumnWeek: 44 },
    BE: { winterWeek: 7, springStart: -9, springEnd: 2, summerStart: [7, 18], summerLength: 42, autumnWeek: 42 },
    BB: { winterWeek: 7, springStart: -9, springEnd: 2, summerStart: [7, 18], summerLength: 42, autumnWeek: 42 },
    HB: { winterWeek: 6, springStart: -7, springEnd: 2, summerStart: [7, 5], summerLength: 42, autumnWeek: 40 },
    HH: { winterWeek: 6, springStart: -7, springEnd: 2, summerStart: [7, 5], summerLength: 42, autumnWeek: 40 },
    HE: { winterWeek: 8, springStart: -9, springEnd: 2, summerStart: [7, 8], summerLength: 42, autumnWeek: 42 },
    MV: { winterWeek: 7, springStart: -8, springEnd: 2, summerStart: [7, 12], summerLength: 42, autumnWeek: 41 },
    NI: { winterWeek: 6, springStart: -7, springEnd: 2, summerStart: [7, 5], summerLength: 42, autumnWeek: 40 },
    NW: { winterWeek: 8, springStart: -7, springEnd: 2, summerStart: [7, 8], summerLength: 42, autumnWeek: 42 },
    RP: { winterWeek: 8, springStart: -8, springEnd: 2, summerStart: [7, 15], summerLength: 42, autumnWeek: 42 },
    SL: { winterWeek: 8, springStart: -8, springEnd: 2, summerStart: [7, 15], summerLength: 42, autumnWeek: 43 },
    SN: { winterWeek: 7, springStart: -11, springEnd: 1, summerStart: [7, 22], summerLength: 42, autumnWeek: 42 },
    ST: { winterWeek: 8, springStart: -9, springEnd: 2, summerStart: [7, 15], summerLength: 42, autumnWeek: 42 },
    SH: { winterWeek: 6, springStart: -7, springEnd: 2, summerStart: [7, 5], summerLength: 42, autumnWeek: 41 },
    TH: { winterWeek: 7, springStart: -10, springEnd: 1, summerStart: [7, 22], summerLength: 42, autumnWeek: 42 }
};

const HOLIDAY_RULES = {
    epiphany: ["BW", "BY", "ST"],
    frauentag: ["BE", "MV"],
    easterSunday: ["BB"],
    pentecostSunday: ["BB"],
    corpusChristi: ["BW", "BY", "HE", "NW", "RP", "SL"],
    assumptionDay: ["BY", "SL"],
    worldChildDay: ["TH"],
    reformationDay: ["BB", "MV", "SN", "ST", "TH", "HB", "HH", "NI", "SH"],
    allSaints: ["BW", "BY", "NW", "RP", "SL"],
    repentanceDay: ["SN"]
};

export function getRegionalCalendarInfo(date, regionCode) {
    const iso = toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const activeStates = getActiveStates(regionCode);
    const holidayNames = [];
    const vacationNames = [];

    const holidayMap = getHolidayMapForDate(date, activeStates);
    Object.keys(holidayMap).forEach((name) => {
        if (holidayMap[name]) holidayNames.push(name);
    });

    const vacationMap = getVacationMapForDate(iso, date.getFullYear(), activeStates);
    Object.keys(vacationMap).forEach((name) => {
        if (vacationMap[name]) vacationNames.push(name);
    });

    return {
        holidayNames,
        vacationNames
    };
}

export function getRegionCodes() {
    return ["ALL", ...STATE_CODES];
}

function getActiveStates(regionCode) {
    if (regionCode === "ALL" || !STATE_CODES.includes(regionCode)) {
        return STATE_CODES;
    }
    return [regionCode];
}

function getHolidayMapForDate(date, states) {
    const year = date.getFullYear();
    const iso = toIsoDate(year, date.getMonth() + 1, date.getDate());
    const easter = calculateEasterSunday(year);

    const baseMap = {
        Neujahr: iso === toIsoDate(year, 1, 1),
        Karfreitag: iso === dateToIso(addDays(easter, -2)),
        Ostermontag: iso === dateToIso(addDays(easter, 1)),
        "Tag der Arbeit": iso === toIsoDate(year, 5, 1),
        "Christi Himmelfahrt": iso === dateToIso(addDays(easter, 39)),
        Pfingstmontag: iso === dateToIso(addDays(easter, 50)),
        "Tag der Deutschen Einheit": iso === toIsoDate(year, 10, 3),
        "1. Weihnachtstag": iso === toIsoDate(year, 12, 25),
        "2. Weihnachtstag": iso === toIsoDate(year, 12, 26)
    };

    const optional = {
        HeiligeDreiKoenige: iso === toIsoDate(year, 1, 6) && hasState(states, HOLIDAY_RULES.epiphany),
        Frauentag: iso === toIsoDate(year, 3, 8) && hasState(states, HOLIDAY_RULES.frauentag),
        Ostersonntag: iso === dateToIso(easter) && hasState(states, HOLIDAY_RULES.easterSunday),
        Pfingstsonntag: iso === dateToIso(addDays(easter, 49)) && hasState(states, HOLIDAY_RULES.pentecostSunday),
        Fronleichnam: iso === dateToIso(addDays(easter, 60)) && hasState(states, HOLIDAY_RULES.corpusChristi),
        MariaeHimmelfahrt: iso === toIsoDate(year, 8, 15) && hasState(states, HOLIDAY_RULES.assumptionDay),
        Weltkindertag: iso === toIsoDate(year, 9, 20) && hasState(states, HOLIDAY_RULES.worldChildDay),
        Reformationstag: iso === toIsoDate(year, 10, 31) && hasState(states, HOLIDAY_RULES.reformationDay),
        Allerheiligen: iso === toIsoDate(year, 11, 1) && hasState(states, HOLIDAY_RULES.allSaints),
        BussUndBettag: iso === dateToIso(getRepentanceDay(year)) && hasState(states, HOLIDAY_RULES.repentanceDay)
    };

    return {
        ...baseMap,
        "Heilige Drei Könige": optional.HeiligeDreiKoenige,
        "Internationaler Frauentag": optional.Frauentag,
        Ostersonntag: optional.Ostersonntag,
        Pfingstsonntag: optional.Pfingstsonntag,
        Fronleichnam: optional.Fronleichnam,
        "Mariä Himmelfahrt": optional.MariaeHimmelfahrt,
        Weltkindertag: optional.Weltkindertag,
        Reformationstag: optional.Reformationstag,
        Allerheiligen: optional.Allerheiligen,
        "Buß- und Bettag": optional.BussUndBettag
    };
}

function getVacationMapForDate(iso, year, states) {
    const map = {
        Winterferien: false,
        Osterferien: false,
        Sommerferien: false,
        Herbstferien: false,
        Weihnachtsferien: false
    };

    states.forEach((code) => {
        const template = VACATION_TEMPLATES[code];
        if (!template) return;

        const easter = calculateEasterSunday(year);
        const ranges = [
            {
                name: "Winterferien",
                start: dateToIso(getWeekStartDate(year, template.winterWeek)),
                end: dateToIso(addDays(getWeekStartDate(year, template.winterWeek), 6))
            },
            {
                name: "Osterferien",
                start: dateToIso(addDays(easter, template.springStart)),
                end: dateToIso(addDays(easter, template.springEnd))
            },
            {
                name: "Sommerferien",
                start: toIsoDate(year, template.summerStart[0], template.summerStart[1]),
                end: dateToIso(addDays(new Date(year, template.summerStart[0] - 1, template.summerStart[1]), template.summerLength))
            },
            {
                name: "Herbstferien",
                start: dateToIso(getWeekStartDate(year, template.autumnWeek)),
                end: dateToIso(addDays(getWeekStartDate(year, template.autumnWeek), 9))
            },
            {
                name: "Weihnachtsferien",
                start: toIsoDate(year, 12, 23),
                end: toIsoDate(year + 1, 1, 6)
            },
            {
                name: "Weihnachtsferien",
                start: toIsoDate(year - 1, 12, 23),
                end: toIsoDate(year, 1, 6)
            }
        ];

        ranges.forEach((range) => {
            if (iso >= range.start && iso <= range.end) {
                map[range.name] = true;
            }
        });
    });

    return map;
}

function hasState(states, candidates) {
    return states.some((entry) => candidates.includes(entry));
}

function getRepentanceDay(year) {
    const date = new Date(year, 10, 23);
    while (date.getDay() !== 3) {
        date.setDate(date.getDate() - 1);
    }
    return date;
}

function getWeekStartDate(year, isoWeek) {
    const simple = new Date(year, 0, 1 + (isoWeek - 1) * 7);
    const dayOfWeek = simple.getDay() || 7;
    if (dayOfWeek <= 4) {
        simple.setDate(simple.getDate() - dayOfWeek + 1);
    } else {
        simple.setDate(simple.getDate() + 8 - dayOfWeek);
    }
    return simple;
}

function calculateEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function addDays(date, offset) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    copy.setDate(copy.getDate() + offset);
    return copy;
}

function dateToIso(date) {
    return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
