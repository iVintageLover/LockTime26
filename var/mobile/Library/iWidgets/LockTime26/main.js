var TIME_FONT_FILES = {
    stencil: "stencil.ttf",
    tall: "tall.ttf",
    black: "black.ttf",
    rail: "rail.ttf",
    rounded: "rounded.ttf"
};

var FONT_ORDER = ["stencil", "tall", "black", "rail", "rounded"];

var DEFAULT_CONFIG = {
    font: "stencil",
    timeSize: 80,
    timeColor: "#ffffff",
    timeTop: 60,
    dateSize: 20,
    dateColor: "#ffffff",
    dateTop: 30,
    use24Hour: false
};

var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

var refreshTimer = null;

function onload() {
    applyConfiguration();
    refreshClock();
}

function applyConfiguration() {
    var settings = resolvedConfig();
    var root = document.documentElement;

    loadFonts(settings.font);
    root.style.setProperty("--time-size", settings.timeSize + "px");
    root.style.setProperty("--time-color", normalizeColor(settings.timeColor));
    root.style.setProperty("--time-top", settings.timeTop + "px");
    root.style.setProperty("--date-size", settings.dateSize + "px");
    root.style.setProperty("--date-color", normalizeColor(settings.dateColor));
    root.style.setProperty("--date-top", settings.dateTop + "px");
}

function resolvedConfig() {
    var source = typeof config === "object" && config !== null ? config : {};

    return {
        font: resolveFont(source),
        timeSize: numberValue(source.timeSize, DEFAULT_CONFIG.timeSize),
        timeColor: resolveConfiguredColor(source.timeColor, DEFAULT_CONFIG.timeColor),
        timeTop: numberValue(source.timeTop, DEFAULT_CONFIG.timeTop),
        dateSize: numberValue(source.dateSize, DEFAULT_CONFIG.dateSize),
        dateColor: resolveConfiguredColor(source.dateColor, DEFAULT_CONFIG.dateColor),
        dateTop: numberValue(source.dateTop, DEFAULT_CONFIG.dateTop),
        use24Hour: booleanValue(source.use24Hour, DEFAULT_CONFIG.use24Hour)
    };
}

function resolveFont(source) {
    var rawFont = source.font;
    var candidate = optionValue(rawFont);

    if (booleanValue(source.fontTall, false)) {
        return "tall";
    }

    if (booleanValue(source.fontBlack, false)) {
        return "black";
    }

    if (booleanValue(source.fontRail, false)) {
        return "rail";
    }

    if (booleanValue(source.fontRounded, false)) {
        return "rounded";
    }

    if (booleanValue(source.fontStencil, true)) {
        return "stencil";
    }

    if (typeof candidate === "number" && FONT_ORDER[candidate]) {
        return FONT_ORDER[candidate];
    }

    if (typeof candidate === "string") {
        candidate = candidate.toLowerCase();

        if (TIME_FONT_FILES[candidate]) {
            return candidate;
        }

        if (candidate === "0") return "stencil";
        if (candidate === "1") return "tall";
        if (candidate === "2") return "black";
        if (candidate === "3") return "rail";
        if (candidate === "4") return "rounded";

        if (candidate.indexOf("stencil") !== -1) return "stencil";
        if (candidate.indexOf("tall") !== -1) return "tall";
        if (candidate.indexOf("black") !== -1) return "black";
        if (candidate.indexOf("rail") !== -1) return "rail";
        if (candidate.indexOf("rounded") !== -1) return "rounded";
    }

    return "stencil";
}

function optionValue(value) {
    if (value === null || typeof value === "undefined") {
        return null;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return value;
    }

    if (typeof value === "object") {
        if (typeof value.value !== "undefined") {
            return value.value;
        }

        if (typeof value.text !== "undefined") {
            return value.text;
        }

        if (typeof value.label !== "undefined") {
            return value.label;
        }

        if (typeof value.selected !== "undefined") {
            return value.selected;
        }
    }

    return null;
}

function resolveConfiguredColor(value, fallback) {
    var resolved = normalizeColor(value);
    return resolved === "#ffffff" && fallback !== "#ffffff" ? fallback : resolved;
}



function numberValue(value, fallback) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value, fallback) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return value === "true" || value === "1";
    }

    if (typeof value === "number") {
        return value !== 0;
    }

    return fallback;
}

function normalizeColor(color) {
    var raw = optionValue(color);
    var match;
    var hexValue;

    if (typeof raw === "number") {
        raw = String(raw);
    }

    if (typeof raw !== "string") {
        if (raw && typeof raw === "object") {
            if (typeof raw.hex !== "undefined") {
                return normalizeColor(raw.hex);
            }

            if (typeof raw.hexValue !== "undefined") {
                return normalizeColor(raw.hexValue);
            }

            if (typeof raw.value !== "undefined") {
                return normalizeColor(raw.value);
            }

            if (
                typeof raw.r !== "undefined" &&
                typeof raw.g !== "undefined" &&
                typeof raw.b !== "undefined"
            ) {
                return rgbToHex(raw.r, raw.g, raw.b);
            }

            if (
                typeof raw.red !== "undefined" &&
                typeof raw.green !== "undefined" &&
                typeof raw.blue !== "undefined"
            ) {
                return rgbToHex(raw.red, raw.green, raw.blue);
            }
        }

        return "#ffffff";
    }

    raw = trim(raw).toLowerCase();

    if (/^#[0-9a-f]{6}$/.test(raw)) {
        return raw;
    }

    if (/^#[0-9a-f]{8}$/.test(raw)) {
        return "#" + raw.slice(1, 7);
    }

    if (/^#[0-9a-f]{3}$/.test(raw)) {
        return "#" +
            raw[1] + raw[1] +
            raw[2] + raw[2] +
            raw[3] + raw[3];
    }

    if (/^[0-9a-f]{6}$/.test(raw)) {
        return "#" + raw;
    }

    if (/^[0-9a-f]{8}$/.test(raw)) {
        return "#" + raw.slice(0, 6);
    }

    if (/^0x[0-9a-f]{6}$/.test(raw)) {
        return "#" + raw.slice(2);
    }

    if (/^0x[0-9a-f]{8}$/.test(raw)) {
        return "#" + raw.slice(2, 8);
    }

    match = raw.match(/^"?\{?([0-9a-f]{6})\}?"?$/);
    if (match) {
        return "#" + match[1];
    }

    match = raw.match(/^rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/);
    if (match) {
        return rgbToHex(match[1], match[2], match[3]);
    }

    match = raw.match(/^rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*[0-9.]+\s*\)$/);
    if (match) {
        return rgbToHex(match[1], match[2], match[3]);
    }

    match = raw.match(/^([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})$/);
    if (match) {
        return rgbToHex(match[1], match[2], match[3]);
    }

    match = raw.match(/^([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)$/);
    if (match) {
        return rgbToHex(match[1], match[2], match[3]);
    }

    hexValue = parseHexInt(raw);
    if (hexValue !== null) {
        return "#" + padHex((hexValue >> 16) & 255) + padHex((hexValue >> 8) & 255) + padHex(hexValue & 255);
    }

    return "#ffffff";
}

function rgbToHex(red, green, blue) {
    return "#" + hexPart(red) + hexPart(green) + hexPart(blue);
}

function hexPart(value) {
    var number = Number(value);

    if (!isFinite(number)) {
        number = 255;
    }

    if (number <= 1 && number >= 0 && String(value).indexOf(".") !== -1) {
        number = Math.round(number * 255);
    }

    if (number < 0) {
        number = 0;
    }

    if (number > 255) {
        number = 255;
    }

    var hex = number.toString(16);
    return hex.length < 2 ? "0" + hex : hex;
}

function padHex(value) {
    var hex = Number(value).toString(16);
    return hex.length < 2 ? "0" + hex : hex;
}

function parseHexInt(value) {
    if (!/^[0-9]+$/.test(value)) {
        return null;
    }

    var parsed = Number(value);
    if (!isFinite(parsed) || parsed < 0 || parsed > 16777215) {
        return null;
    }

    return parsed;
}

function trim(value) {
    return String(value).replace(/^\s+|\s+$/g, "");
}

function loadFonts(fontKey) {
    var fontFile = TIME_FONT_FILES[fontKey] || TIME_FONT_FILES[DEFAULT_CONFIG.font];
    var style = document.getElementById("dynamic-fonts");

    if (!style) {
        style = document.createElement("style");
        style.id = "dynamic-fonts";
        document.head.appendChild(style);
    }

    style.textContent = [
        "@font-face {",
        "    font-family: 'Time';",
        "    src: url('" + fontFile + "') format('truetype');",
        "}",
        "@font-face {",
        "    font-family: 'DateText';",
        "    src: url('datetext.otf') format('opentype');",
        "}"
    ].join("\n");
}

function refreshClock() {
    var settings = resolvedConfig();
    var now = new Date();

    applyConfiguration();
    document.getElementById("time").textContent = formatTime(now, settings.use24Hour);
    document.getElementById("date").textContent = formatDate(now);

    if (refreshTimer !== null) {
        clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(refreshClock, millisecondsUntilNextMinute(now));
}

function formatTime(date, use24Hour) {
    var hours = date.getHours();
    var minutes = pad(date.getMinutes());

    if (!use24Hour) {
        hours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    }

    return hours + ":" + minutes;
}

function formatDate(date) {
    return dayNames[date.getDay()] + " " + monthNames[date.getMonth()] + " " + date.getDate();
}

function pad(value) {
    return value < 10 ? "0" + value : String(value);
}

function millisecondsUntilNextMinute(date) {
    return ((60 - date.getSeconds()) * 1000) - date.getMilliseconds();
}
