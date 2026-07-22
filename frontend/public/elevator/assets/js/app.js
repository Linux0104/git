const state = {
    isFiveM: typeof GetParentResourceName === "function",
    open: false,
    busy: false,
    elevatorId: null,
    currentFloorId: null,
    floors: [],
    ui: {
        kicker: "Sektor",
        title: "Fahrstuhl",
        subtitle: "",
        hint: "Waehle eine Etage"
    },
    theme: {
        accent: "#3ccfff"
    },
    texts: {
        currentFloorEmpty: "--",
        floorsUnit: "",
        stateCurrent: "Aktuell",
        stateLocked: "Gesperrt",
        stateAvailable: "Anfahren",
        floorFallback: "Etage",
        codeFallback: "--",
        emptyTitle: "Keine Etagen",
        emptyBody: "Fuer diesen Fahrstuhl wurden aktuell keine verfuegbaren Stops gefunden.",
        traveling: "Etage wird angefahren...",
        requestFailed: "Die Anfrage konnte nicht gesendet werden.",
        genericError: "Ein Fehler ist aufgetreten."
    }
};

const elements = {
    body: document.body,
    app: document.getElementById("app"),
    kicker: document.getElementById("kickerLabel"),
    buildingLabel: document.getElementById("buildingLabel"),
    buildingSubline: document.getElementById("buildingSubline"),
    badgeStat: document.getElementById("badgeStat"),
    buildingBadge: document.getElementById("buildingBadge"),
    currentFloorLabel: document.getElementById("currentFloorLabel"),
    hintLabel: document.getElementById("hintLabel"),
    floorCount: document.getElementById("floorCount"),
    floorList: document.getElementById("floorList"),
    messageBar: document.getElementById("messageBar"),
    closeBtn: document.getElementById("closeBtn")
};

function post(endpoint, payload = {}) {
    if (!state.isFiveM) {
        return Promise.resolve({ ok: true });
    }

    return fetch(`https://${GetParentResourceName()}/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(payload)
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const SFX = (() => {
    let ctx = null;

    function ensureContext() {
        if (ctx) {
            if (ctx.state === "suspended") {
                ctx.resume().catch(() => {});
            }
            return ctx;
        }

        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            ctx = null;
        }

        return ctx;
    }

    function play(options) {
        const audioContext = ensureContext();
        if (!audioContext) {
            return;
        }

        const config = Object.assign({
            freq: 440,
            type: "sine",
            dur: 0.08,
            vol: 0.04,
            sweep: 0,
            delay: 0
        }, options || {});

        const startAt = audioContext.currentTime + config.delay;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = config.type;
        osc.frequency.setValueAtTime(config.freq, startAt);
        if (config.sweep !== 0) {
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(40, config.freq + config.sweep),
                startAt + config.dur
            );
        }

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(config.vol, startAt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + config.dur);

        osc.connect(gain).connect(audioContext.destination);
        osc.start(startAt);
        osc.stop(startAt + config.dur + 0.02);
    }

    return {
        open() {
            play({ freq: 330, type: "sine", dur: 0.12, vol: 0.05, sweep: 440 });
            play({ freq: 620, type: "triangle", dur: 0.1, vol: 0.03, delay: 0.04 });
        },
        hover() {
            play({ freq: 780, type: "sine", dur: 0.05, vol: 0.02 });
        },
        select() {
            play({ freq: 520, type: "triangle", dur: 0.06, vol: 0.04 });
            play({ freq: 880, type: "sine", dur: 0.05, vol: 0.03, delay: 0.03 });
        },
        error() {
            play({ freq: 190, type: "sawtooth", dur: 0.12, vol: 0.04, sweep: -40 });
        }
    };
})();

function setMessage(message, kind = "neutral") {
    elements.messageBar.classList.remove("error", "success");

    if (kind === "neutral" || !message) {
        elements.messageBar.textContent = "";
        elements.messageBar.hidden = true;
        return;
    }

    elements.messageBar.textContent = message;
    elements.messageBar.hidden = false;

    if (kind === "error") {
        elements.messageBar.classList.add("error");
    } else if (kind === "success") {
        elements.messageBar.classList.add("success");
    }
}

function applyTheme(theme) {
    if (!theme) {
        return;
    }

    const accent = theme.accent || "#3ccfff";
    document.documentElement.style.setProperty("--cyan", accent);
}

function toggleOptionalText(element, value) {
    if (!element) {
        return;
    }

    const text = String(value || "").trim();
    element.textContent = text;
    element.hidden = text === "";
}

function renderFloors() {
    elements.floorList.innerHTML = "";
    elements.floorCount.textContent = String(state.floors.length);

    if (state.floors.length === 0) {
        elements.floorList.innerHTML = `
            <div class="empty-state">
                <div>
                    <strong>${escapeHtml(state.texts.emptyTitle)}</strong>
                    <span>${escapeHtml(state.texts.emptyBody)}</span>
                </div>
            </div>
        `;
        return;
    }

    state.floors.forEach((floor) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "floor-card";

        if (floor.isCurrent) {
            card.classList.add("active");
        }
        if (!floor.accessible) {
            card.classList.add("locked");
        }
        if (state.busy) {
            card.classList.add("busy");
        }

        let pillText = state.texts.stateAvailable;
        let pillClass = "";
        if (floor.isCurrent) {
            pillText = state.texts.stateCurrent;
            pillClass = "cyan";
        } else if (!floor.accessible) {
            pillText = state.texts.stateLocked;
            pillClass = "danger";
        }

        const descText = String(floor.description || "").trim();
        const descMarkup = descText ? `<span class="floor-desc">${escapeHtml(descText)}</span>` : "";

        card.innerHTML = `
            <span class="floor-code">${escapeHtml(floor.shortLabel || state.texts.codeFallback)}</span>
            <span class="floor-copy">
                <span class="floor-name">${escapeHtml(floor.label || state.texts.floorFallback)}</span>
                ${descMarkup}
            </span>
            <span class="status-pill ${pillClass}">${escapeHtml(pillText)}</span>
        `;

        card.addEventListener("mouseenter", () => SFX.hover());
        card.addEventListener("click", () => {
            if (state.busy || floor.isCurrent || !floor.accessible) {
                if (!floor.accessible || floor.isCurrent) {
                    SFX.error();
                }
                return;
            }

            SFX.select();
            handleTravel(floor.id);
        });

        elements.floorList.appendChild(card);
    });
}

function render() {
    elements.kicker.textContent = state.ui.kicker || "Sektor";
    elements.hintLabel.textContent = state.ui.hint || "Waehle eine Etage";

    const currentFloor = state.floors.find((floor) => floor.id === state.currentFloorId);
    elements.currentFloorLabel.textContent = currentFloor
        ? (currentFloor.shortLabel || currentFloor.label)
        : state.texts.currentFloorEmpty;

    renderFloors();
}

function openApp(payload) {
    state.open = true;
    state.busy = false;
    state.elevatorId = payload.elevatorId || null;
    state.currentFloorId = payload.currentFloorId || null;
    state.floors = Array.isArray(payload.floors) ? payload.floors : [];
    state.ui = Object.assign({}, state.ui, payload.ui || {});
    state.theme = Object.assign({}, state.theme, payload.theme || {});
    state.texts = Object.assign({}, state.texts, payload.texts || {});

    elements.buildingLabel.textContent = payload.buildingLabel || state.ui.title || "Fahrstuhl";
    toggleOptionalText(elements.buildingSubline, payload.buildingSubline || state.ui.subtitle);

    const badgeValue = String(payload.badge || "").trim();
    elements.buildingBadge.textContent = badgeValue;
    elements.badgeStat.hidden = badgeValue === "";

    applyTheme(state.theme);
    elements.app.setAttribute("aria-hidden", "false");
    elements.body.classList.add("visible");

    setMessage("", "neutral");
    render();
    SFX.open();
}

function closeApp() {
    state.open = false;
    state.busy = false;
    state.elevatorId = null;
    state.currentFloorId = null;
    state.floors = [];
    elements.body.classList.remove("visible");
    elements.app.setAttribute("aria-hidden", "true");
}

function handleTravel(floorId) {
    const selectedFloor = state.floors.find((floor) => floor.id === floorId) || null;
    if (!selectedFloor || state.busy || selectedFloor.isCurrent || !selectedFloor.accessible) {
        return;
    }

    state.busy = true;
    setMessage(state.texts.traveling, "success");
    render();
    post("selectFloor", { floorId: selectedFloor.id }).catch(() => {
        state.busy = false;
        setMessage(state.texts.requestFailed, "error");
        render();
    });
}

elements.closeBtn.addEventListener("click", () => {
    post("close").finally(closeApp);
});

document.addEventListener("keydown", (event) => {
    if (!state.open) {
        return;
    }

    if (event.key === "Escape") {
        post("close").finally(closeApp);
    }
});

window.addEventListener("message", (event) => {
    const payload = event.data || {};

    switch (payload.action) {
        case "open":
            openApp(payload);
            break;
        case "close":
            closeApp();
            break;
        case "setBusy":
            state.busy = !!payload.busy;
            render();
            break;
        case "showError":
            state.busy = false;
            setMessage(payload.message || state.texts.genericError, "error");
            render();
            SFX.error();
            break;
        default:
            break;
    }
});

function mountPreview() {
    if (state.isFiveM) {
        return;
    }

    document.body.classList.add("preview-mode");
    openApp({
        elevatorId: "preview",
        buildingLabel: "Polizeirevier",
        buildingSubline: "Zentraler Fahrstuhl - Sektor A",
        badge: "PD-01",
        currentFloorId: "lobby",
        ui: {
            kicker: "Sektor A",
            title: "Polizeirevier",
            hint: "Waehle eine Etage"
        },
        floors: [
            {
                id: "offices",
                label: "Bueros",
                shortLabel: "L2",
                description: "Verwaltung & Leitung",
                accessible: true,
                isCurrent: false
            },
            {
                id: "cells",
                label: "Zellenblock",
                shortLabel: "L1",
                description: "Zugang beschraenkt",
                accessible: false,
                isCurrent: false
            },
            {
                id: "lobby",
                label: "Erdgeschoss",
                shortLabel: "EG",
                description: "Empfang & Wache",
                accessible: true,
                isCurrent: true
            },
            {
                id: "garage",
                label: "Tiefgarage",
                shortLabel: "B1",
                description: "Fuhrpark",
                accessible: true,
                isCurrent: false
            }
        ],
        theme: state.theme
    });
}

mountPreview();
