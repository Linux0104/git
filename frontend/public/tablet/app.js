const searchParams = new URLSearchParams(window.location.search);
const previewMode = searchParams.get("preview") === "1";
const inferredNui = typeof GetParentResourceName === "function"
    || (window.location.protocol === "https:" && !!window.location.hostname && window.location.hostname !== "localhost");
const isNui = inferredNui && !previewMode;
const resourceName = typeof GetParentResourceName === "function"
    ? GetParentResourceName()
    : (window.location.hostname || "hex_emergency_tablet");

const state = {
    open: false,
    data: null,
    activeTab: "dashboard",
    searchResults: [],
    personDetails: null
};

const tabConfig = [
    { key: "dashboard", label: "Dashboard", read: "dashboard", title: "Dashboard", description: "Lagebild, Einsatzlage und aktuelle Einträge." },
    { key: "persons", label: "Personen", read: "persons", title: "Personen", description: "Personenabfragen, Aktenbezug und Detailansicht." },
    { key: "warrants", label: "Fahndung", read: "warrants", title: "Fahndungssystem", description: "Fahrzeug- und Personenfahndungen verwalten." },
    { key: "medical", label: "Patienten", read: "medical", title: "Patientenverwaltung", description: "Krankenakten, Allergien und Behandlungsverlauf." },
    { key: "dispatch", label: "Leitstelle", read: "dispatch", title: "Leitstelle", description: "Streifen- und Leitstellensystem für Einsatzkräfte." },
    { key: "calendar", label: "Kalender", read: "calendar", title: "Kalender", description: "Gemeinsame Termine und Dienstplanung." }
];

const app = document.getElementById("app");
const navTabs = document.getElementById("navTabs");
const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");
const toast = document.getElementById("toast");

function setUiVisibility(isVisible) {
    document.documentElement.style.display = isVisible ? "block" : "none";
    document.documentElement.style.background = "transparent";
    document.body.style.display = isVisible ? "block" : "none";
    document.body.style.background = "transparent";
    document.body.classList.toggle("nui-open", isVisible);
    document.body.classList.toggle("nui-closed", !isVisible);
    app.classList.toggle("hidden", !isVisible);
}

let mockId = 1000;

function nowIso() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function createDemoData() {
    const dept = new URLSearchParams(window.location.search).get("dept") || "police";
    const deptLabels = {
        police: "Polizei (PD)",
        ambulance: "Rettungsdienst (MD)",
        fire: "Feuerwehr (FD)",
        doj: "Justiz (DOJ)"
    };

    const baseOfficer = {
        name: "Vorschau User",
        identifier: "preview",
        departmentKey: dept,
        departmentLabel: deptLabels[dept] || dept,
        grade: "Dienststelle"
    };

    const permissionsByDept = {
        police: {
            dashboard: true,
            persons: true,
            warrants: true,
            warrantsWrite: true,
            tickets: true,
            ticketsWrite: true,
            cases: true,
            casesWrite: true,
            medical: false,
            medicalWrite: false,
            dispatch: true,
            dispatchWrite: true,
            calendar: true,
            calendarWrite: true,
            manageRecords: true
        },
        ambulance: {
            dashboard: true,
            persons: true,
            warrants: false,
            warrantsWrite: false,
            tickets: false,
            ticketsWrite: false,
            cases: false,
            casesWrite: false,
            medical: true,
            medicalWrite: true,
            dispatch: true,
            dispatchWrite: true,
            calendar: true,
            calendarWrite: true,
            manageRecords: true
        },
        fire: {
            dashboard: true,
            persons: true,
            warrants: false,
            warrantsWrite: false,
            tickets: false,
            ticketsWrite: false,
            cases: false,
            casesWrite: false,
            medical: true,
            medicalWrite: true,
            dispatch: true,
            dispatchWrite: true,
            calendar: true,
            calendarWrite: true,
            manageRecords: true
        },
        doj: {
            dashboard: true,
            persons: true,
            warrants: false,
            warrantsWrite: false,
            tickets: true,
            ticketsWrite: false,
            cases: true,
            casesWrite: true,
            medical: false,
            medicalWrite: false,
            dispatch: false,
            dispatchWrite: false,
            calendar: true,
            calendarWrite: true,
            manageRecords: true
        }
    };

    const permissions = permissionsByDept[dept] || permissionsByDept.police;

    return {
        officer: baseOfficer,
        permissions,
        defaults: {
            warrantPriority: "normal",
            warrantStatus: "active",
            caseStatus: "offen",
            caseSecurity: "intern",
            ticketStatus: "offen",
            medicalStatus: "stabil",
            dispatchStatus: "offen",
            calendarScope: "all"
        },
        options: {
            caseEntryTypes: ["vermerk", "status", "beweis", "entscheidung"],
            dispatchPriorities: ["niedrig", "mittel", "hoch", "sofort"],
            unitStatuses: ["frei", "zugeteilt", "auf_anfahrt", "am_einsatz", "rueckfahrt", "ausser_dienst"]
        },
        stats: {
            unitsOnline: 6,
            activeWarrants: 2,
            openCases: 1,
            openTickets: 3,
            activeDispatch: 1,
            upcomingEvents: 2
        },
        lists: {
            warrants: [
                { id: 1, target_type: "person", target_identifier: "license:123", title: "Diebstahl", priority: "normal", status: "active", updated_at: nowIso() },
                { id: 2, target_type: "vehicle", target_identifier: "LS-AB123", title: "Fluchtfahrzeug", priority: "high", status: "review", updated_at: nowIso() }
            ],
            cases: [
                { id: 1, case_type: "group", subject_identifier: "license:123", subject_name: "Max Mustermann", subject_identifiers: JSON.stringify(["license:123", "license:456"]), subject_names: JSON.stringify(["Max Mustermann", "Erika Musterfrau"]), applies_to_faction: 1, reference_code: "POL-260615-101", title: "Akte #1", summary: "Mehrere Beteiligte, laufende Ermittlungen.", assigned_officer: "Lt. Miller", security_level: "intern", release_state: "intern", status: "offen", updated_at: nowIso() }
            ],
            tickets: [
                { id: 1, person_identifier: "license:123", person_name: "Max Mustermann", amount: 500, reason: "Falschparken", status: "offen", updated_at: nowIso() }
            ],
            medical: [
                { id: 1, patient_identifier: "license:123", patient_name: "Max Mustermann", diagnosis: "Prellung", status: "stabil", assigned_department: "ambulance", updated_at: nowIso() }
            ],
            dispatch: [
                { id: 1, title: "Einsatz #1", location: "Pillbox Hill", incident_code: "10-50", priority: "hoch", unit_code: "A-1", unit_type: "Streife", primary_unit: "A-1", assigned_officer: "Miller", unit_status: "am_einsatz", vehicle_label: "Buffalo STX", vehicle_plate: "LSPD 12", crew_names: "A-1 Miller, A-1 Davis", notes: "Verkehrsunfall", scope: "all", status: "offen", updated_at: nowIso() }
            ],
            calendar: [
                { id: 1, title: "Schichtwechsel", event_date: "2026-06-15 18:00:00", location: "MRPD", notes: "", scope: "police", updated_at: nowIso() },
                { id: 2, title: "Fortbildung", event_date: "2026-06-16 14:00:00", location: "Pillbox", notes: "", scope: "all", updated_at: nowIso() }
            ],
            caseEntries: [
                { id: 1, case_id: 1, case_title: "Akte #1", reference_code: "POL-260615-101", entry_type: "vermerk", title: "Erstaufnahme", content: "Verdächtige wurden identifiziert, erste Aussagen liegen vor.", created_by: "Lt. Miller", created_at: nowIso() },
                { id: 2, case_id: 1, case_title: "Akte #1", reference_code: "POL-260615-101", entry_type: "status", title: "Statusänderung", content: "Akte wurde an die Ermittlungsgruppe übergeben.", created_by: "Lt. Miller", created_at: nowIso() }
            ]
        }
    };
}

const demoData = createDemoData();

function mockFetch(eventName, payload = {}) {
    if (eventName === "close") {
        state.open = false;
        app.classList.add("hidden");
        return Promise.resolve({ success: true });
    }

    if (eventName === "refresh") {
        return Promise.resolve({ success: true, data: demoData });
    }

    if (eventName === "searchPersons") {
        const query = String(payload.query || "").toLowerCase();
        const data = [
            { identifier: "license:123", full_name: "Max Mustermann", image_url: "", job_name: "unemployed", dateofbirth: "1990-01-01", sex: "m", warrantCount: 1, medicalCount: 1 },
            { identifier: "license:456", full_name: "Erika Musterfrau", image_url: "", job_name: "ambulance", dateofbirth: "1994-06-10", sex: "f", warrantCount: 0, medicalCount: 0 }
        ].filter((p) => !query || p.full_name.toLowerCase().includes(query) || p.identifier.toLowerCase().includes(query));

        return Promise.resolve({ success: true, data });
    }

    if (eventName === "getPerson") {
        const identifier = payload.identifier || "license:123";
        return Promise.resolve({
            success: true,
            data: {
                person: { identifier, image_url: "", full_name: identifier === "license:456" ? "Erika Musterfrau" : "Max Mustermann", dateofbirth: "1990-01-01", sex: "m", height: 180 },
                warrants: demoData.lists.warrants.filter((w) => w.target_type === "person" && w.target_identifier === identifier),
                cases: demoData.lists.cases.filter((c) => c.subject_identifier === identifier || String(c.subject_identifiers || "").includes(identifier)),
                tickets: demoData.lists.tickets.filter((t) => t.person_identifier === identifier),
                medical: demoData.lists.medical.filter((m) => m.patient_identifier === identifier),
                caseEntries: demoData.lists.caseEntries.filter((entry) => demoData.lists.cases.some((c) => Number(c.id) === Number(entry.case_id) && (c.subject_identifier === identifier || String(c.subject_identifiers || "").includes(identifier))))
            }
        });
    }

    if (eventName === "savePersonImage") {
        return Promise.resolve({
            success: true,
            message: payload.imageUrl ? "Profilbild gespeichert (Vorschau)." : "Profilbild entfernt (Vorschau).",
            person: {
                identifier: String(payload.identifier || ""),
                image_url: String(payload.imageUrl || ""),
                full_name: String(payload.identifier || "") === "license:456" ? "Erika Musterfrau" : "Max Mustermann",
                dateofbirth: "1990-01-01",
                sex: "m",
                height: 180
            }
        });
    }

    if (eventName === "saveCaseEntry") {
        mockId += 1;
        const linkedCase = demoData.lists.cases.find((entry) => Number(entry.id) === Number(payload.caseId));
        const entry = {
            id: mockId,
            case_id: Number(payload.caseId || 0),
            case_title: linkedCase?.title || "Akte",
            reference_code: linkedCase?.reference_code || "",
            entry_type: payload.entryType || "vermerk",
            title: payload.title || "Akteneintrag",
            content: payload.content || "",
            created_by: state.data?.officer?.name || "Vorschau User",
            created_at: nowIso()
        };
        demoData.lists.caseEntries.unshift(entry);
        return Promise.resolve({ success: true, message: "Aktenvermerk gespeichert (Vorschau).", data: demoData });
    }

    const saveMap = {
        saveWarrant: "warrants",
        saveCase: "cases",
        saveTicket: "tickets",
        saveMedical: "medical",
        saveDispatch: "dispatch",
        saveCalendar: "calendar"
    };

    if (eventName in saveMap) {
        const listKey = saveMap[eventName];
        const incoming = { ...payload };
        const recordId = Number(incoming.id || 0) || null;
        const list = demoData.lists[listKey] || [];

        if (recordId) {
            const index = list.findIndex((entry) => Number(entry.id) === recordId);
            if (index >= 0) {
                list[index] = { ...list[index], ...incoming, id: recordId, updated_at: nowIso() };
            }
        } else {
            mockId += 1;
            list.unshift({ ...incoming, id: mockId, updated_at: nowIso() });
        }

        demoData.lists[listKey] = list;
        return Promise.resolve({ success: true, message: "Gespeichert (Vorschau).", data: demoData });
    }

    return Promise.resolve({ success: false, message: "Diese Aktion ist in der Vorschau nicht verfügbar." });
}

function fetchNui(eventName, payload = {}) {
    if (previewMode) {
        return mockFetch(eventName, payload);
    }

    return fetch(`https://${resourceName}/${eventName}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(payload)
    }).then((response) => response.json());
}

function showToast(message, isError = false) {
    toast.textContent = message || "";
    toast.style.color = isError ? "#fca5a5" : "#98a6d4";
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return String(value).replace("T", " ").replace(".000Z", "");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getInitials(name) {
    return String(name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "?";
}

function avatarMarkup(person, extraClass = "") {
    const fullName = person?.full_name || person?.person_name || person?.patient_name || person?.subject_name || person?.identifier || "?";
    const cls = extraClass ? ` ${extraClass}` : "";

    if (person?.image_url) {
        return `<img class="person-avatar${cls}" src="${escapeHtml(person.image_url)}" alt="${escapeHtml(fullName)}">`;
    }

    return `<div class="person-avatar person-avatar--fallback${cls}">${escapeHtml(getInitials(fullName))}</div>`;
}

function getPermissions() {
    return state.data?.permissions || {};
}

function getLists() {
    return state.data?.lists || {};
}

function parseJsonArray(value) {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function formatUnitStatus(status) {
    const map = {
        frei: "Frei",
        zugeteilt: "Zugewiesen",
        auf_anfahrt: "Auf Anfahrt",
        am_einsatz: "Am Einsatz",
        rueckfahrt: "Rückfahrt",
        ausser_dienst: "Außer Dienst"
    };

    return map[status] || status || "-";
}

function formatCaseEntryType(type) {
    const map = {
        vermerk: "Vermerk",
        status: "Status",
        beweis: "Beweis",
        entscheidung: "Entscheidung"
    };

    return map[type] || type || "-";
}

function buildNav() {
    navTabs.innerHTML = "";

    tabConfig.forEach((tab) => {
        if (!getPermissions()[tab.read]) {
            return;
        }

        const button = document.createElement("button");
        button.textContent = tab.label;
        button.classList.toggle("active", state.activeTab === tab.key);
        button.addEventListener("click", () => setActiveTab(tab.key));
        navTabs.appendChild(button);
    });
}

function setActiveTab(tabKey) {
    state.activeTab = tabKey;

    tabConfig.forEach((tab) => {
        const view = document.getElementById(`${tab.key}View`);
        if (!view) {
            return;
        }

        view.classList.toggle("hidden", tab.key !== tabKey);
    });

    const config = tabConfig.find((tab) => tab.key === tabKey) || tabConfig[0];
    pageTitle.textContent = config.title;
    pageDescription.textContent = config.description;
    buildNav();
}

function renderStats() {
    const stats = state.data?.stats || {};
    const cards = [
        { label: "Einheiten online", value: stats.unitsOnline ?? 0 },
        { label: "Aktive Fahndungen", value: stats.activeWarrants ?? 0 },
        { label: "Offene Akten", value: stats.openCases ?? 0 },
        { label: "Offene Tickets", value: stats.openTickets ?? 0 },
        { label: "Aktive Einsätze", value: stats.activeDispatch ?? 0 },
        { label: "Nächste Termine", value: stats.upcomingEvents ?? 0 }
    ];

    return `
        <div class="stats-grid">
            ${cards.map((card) => `
                <div class="stat-card">
                    <div class="panel__subtitle">${escapeHtml(card.label)}</div>
                    <div class="stat-card__value">${escapeHtml(card.value)}</div>
                </div>
            `).join("")}
        </div>
    `;
}

function renderQuickActions() {
    const permissions = getPermissions();
    const actions = [];

    if (permissions.warrantsWrite) actions.push({ tab: "warrants", label: "Neue Fahndung" });
    if (permissions.medicalWrite) actions.push({ tab: "medical", label: "Neue Krankenakte" });
    if (permissions.dispatchWrite) actions.push({ tab: "dispatch", label: "Neuer Einsatz" });
    if (permissions.calendarWrite) actions.push({ tab: "calendar", label: "Neuer Termin" });

    if (!actions.length) {
        return "";
    }

    return `
        <div class="panel">
            <div class="panel__header">
                <h2>Schnellaktionen</h2>
            </div>
            <div class="actions-grid">
                ${actions.map((action) => `
                    <button class="action-button" data-nav="${escapeHtml(action.tab)}">${escapeHtml(action.label)}</button>
                `).join("")}
            </div>
        </div>
    `;
}

function recordTemplate(item, title, metaLines) {
    return `
        <div class="record">
            <div class="record__title">${escapeHtml(title)}</div>
            <div class="record__meta">${metaLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}</div>
            <div class="record__actions">
                <button data-edit="${escapeHtml(JSON.stringify(item))}">Bearbeiten</button>
            </div>
        </div>
    `;
}

function renderDashboard() {
    const lists = getLists();
    const dashboardView = document.getElementById("dashboardView");

    dashboardView.innerHTML = `
        ${renderStats()}
        ${renderQuickActions()}
        <div class="dashboard-grid">
            ${getPermissions().warrants ? renderPanel("Fahndungen", renderSimpleList(lists.warrants, (item) => recordTemplate(item, item.title, [
                `${item.target_type === "vehicle" ? "Fahrzeug" : "Person"}: ${item.target_identifier}`,
                `Status: ${item.status}`,
                `Priorität: ${item.priority}`,
                `Stand: ${formatDate(item.updated_at)}`
            ]))) : ""}
            ${getPermissions().cases ? renderPanel("Akten", renderSimpleList(lists.cases, (item) => recordTemplate(item, item.title, [
                `Aktennr.: ${item.reference_code || "-"}`,
                `Typ: ${item.case_type === "group" ? "Sammelakte" : "Einzelakte"}`,
                `Sachbearbeiter: ${item.assigned_officer || "-"}`,
                `Sicherheitsstufe: ${item.security_level}`,
                `Freigabe: ${item.release_state}`,
                `Status: ${item.status}`,
                `Stand: ${formatDate(item.updated_at)}`
            ]))) : ""}
            ${getPermissions().medical ? renderPanel("Patienten", renderSimpleList(lists.medical, (item) => recordTemplate(item, item.patient_name, [
                `Diagnose: ${item.diagnosis}`,
                `Status: ${item.status}`,
                `Stand: ${formatDate(item.updated_at)}`
            ]))) : ""}
            ${getPermissions().dispatch ? renderPanel("Leitstelle", renderSimpleList(lists.dispatch, (item) => recordTemplate(item, item.title, [
                `Ort: ${item.location}`,
                `Code/Priorität: ${item.incident_code || "-"} | ${item.priority || "-"}`,
                `Einheit: ${item.primary_unit || item.unit_code || "-"} | ${item.unit_type || "-"}`,
                `Leitung: ${item.assigned_officer || "-"}`,
                `Fahrzeug: ${item.vehicle_label || "-"} ${item.vehicle_plate ? `(${item.vehicle_plate})` : ""}`.trim(),
                `Einheitsstatus: ${formatUnitStatus(item.unit_status)}`,
                `Einsatzstatus: ${item.status}`,
                `Stand: ${formatDate(item.updated_at)}`
            ]))) : ""}
            ${getPermissions().calendar ? renderPanel("Kalender", renderSimpleList(lists.calendar, (item) => recordTemplate(item, item.title, [
                `Datum: ${formatDate(item.event_date)}`,
                `Ort: ${item.location || "-"}`,
                `Bereich: ${item.scope}`
            ]))) : ""}
            ${getPermissions().tickets ? renderPanel("Tickets", renderSimpleList(lists.tickets, (item) => recordTemplate(item, item.person_name, [
                `Betrag: $${item.amount}`,
                `Status: ${item.status}`,
                `Stand: ${formatDate(item.updated_at)}`
            ]))) : ""}
        </div>
    `;
}

function renderPanel(title, content) {
    return `
        <div class="panel">
            <div class="panel__header">
                <h2>${escapeHtml(title)}</h2>
            </div>
            ${content}
        </div>
    `;
}

function renderSimpleList(list, renderer) {
    if (!list || !list.length) {
        return '<div class="empty">Keine Einträge vorhanden.</div>';
    }

    return `<div class="list">${list.map((item) => renderer(item)).join("")}</div>`;
}

function renderDataLists() {
    const lists = getLists();

    document.getElementById("warrantsList").innerHTML = renderSimpleList(lists.warrants, (item) => recordTemplate(item, item.title, [
        `${item.target_type === "vehicle" ? "Kennzeichen" : "Person"}: ${item.target_identifier}`,
        `Status: ${item.status}`,
        `Priorität: ${item.priority}`
    ]));

    document.getElementById("casesList").innerHTML = renderSimpleList(lists.cases, (item) => recordTemplate(item, item.title, [
        `Aktennr.: ${item.reference_code || "-"}`,
        `Typ: ${item.case_type === "group" ? "Sammelakte" : "Einzelakte"}`,
        `Person: ${item.subject_name || "-"}`,
        `Sachbearbeiter: ${item.assigned_officer || "-"}`,
        `Sicherheitsstufe: ${item.security_level}`,
        `Status: ${item.status}${item.applies_to_faction ? " | Fraktion" : ""}`
    ]));

    document.getElementById("ticketsList").innerHTML = renderSimpleList(lists.tickets, (item) => recordTemplate(item, item.person_name, [
        `Betrag: $${item.amount}`,
        `Status: ${item.status}`
    ]));

    document.getElementById("medicalList").innerHTML = renderSimpleList(lists.medical, (item) => recordTemplate(item, item.patient_name, [
        `Diagnose: ${item.diagnosis}`,
        `Status: ${item.status}`,
        `Bearbeitet: ${item.assigned_department}`
    ]));

    document.getElementById("dispatchList").innerHTML = renderSimpleList(lists.dispatch, (item) => recordTemplate(item, item.title, [
        `Ort: ${item.location}`,
        `Code/Priorität: ${item.incident_code || "-"} | ${item.priority || "-"}`,
        `Einheit: ${item.primary_unit || item.unit_code || "-"} | ${item.unit_type || "-"}`,
        `Leitung: ${item.assigned_officer || "-"}`,
        `Fahrzeug: ${item.vehicle_label || "-"} ${item.vehicle_plate ? `(${item.vehicle_plate})` : ""}`.trim(),
        `Besatzung: ${item.crew_names || "-"}`,
        `Einheitsstatus: ${formatUnitStatus(item.unit_status)}`,
        `Einsatzstatus: ${item.status}`
    ]));

    document.getElementById("calendarList").innerHTML = renderSimpleList(lists.calendar, (item) => recordTemplate(item, item.title, [
        `Datum: ${formatDate(item.event_date)}`,
        `Ort: ${item.location || "-"}`,
        `Bereich: ${item.scope}`
    ]));
}

function renderSearchResults() {
    const container = document.getElementById("personSearchResults");

    if (!state.searchResults.length) {
        container.innerHTML = '<div class="empty">Noch keine Suchergebnisse.</div>';
        return;
    }

    container.innerHTML = state.searchResults.map((item) => `
        <div class="record">
            <div class="record__title record__title--with-avatar">${avatarMarkup(item, "person-avatar--sm")}<span>${escapeHtml(item.full_name || item.identifier)}</span></div>
            <div class="record__meta">
                <div>Geburtsdatum: ${escapeHtml(item.dateofbirth || "-")}</div>
                <div>Fahndungen: ${escapeHtml(item.warrantCount || 0)} | Krankenakten: ${escapeHtml(item.medicalCount || 0)}</div>
            </div>
            <div class="record__actions">
                <button data-person="${escapeHtml(item.identifier)}">Öffnen</button>
            </div>
        </div>
    `).join("");
}

function renderPersonDetails() {
    const container = document.getElementById("personDetails");
    const details = state.personDetails;

    if (!details?.person) {
        container.innerHTML = `
            <div class="panel__header"><h2>Personendetails</h2></div>
            <div class="placeholder">Wähle eine Person aus der Suche aus.</div>
        `;
        return;
    }

    const person = details.person;
    const caseOptions = (details.cases || []).map((entry) => {
        const label = [entry.reference_code || `Akte #${entry.id}`, entry.title || "Ohne Titel"].filter(Boolean).join(" | ");
        return `<option value="${escapeHtml(entry.id)}">${escapeHtml(label)}</option>`;
    }).join("");
    const personStats = [
        { label: "Fahndungen", value: details.warrants?.length || 0 },
        { label: "Akten", value: details.cases?.length || 0 },
        { label: "Tickets", value: details.tickets?.length || 0 },
        { label: "Krankenakten", value: details.medical?.length || 0 }
    ];
    container.innerHTML = `
        <div class="panel__header"><h2>Personendetails</h2></div>
        <div class="detail-grid">
            <div class="detail-box person-card">
                <div class="person-card__image">${avatarMarkup(person)}</div>
                <div class="person-card__meta">
                    <div><strong>Name</strong>${escapeHtml(person.full_name || "-")}</div>
                    <div><strong>Geburtsdatum</strong>${escapeHtml(person.dateofbirth || "-")}</div>
                    <div><strong>Geschlecht</strong>${escapeHtml(person.sex || "-")}</div>
                    <div><strong>Größe</strong>${escapeHtml(person.height || "-")}</div>
                </div>
            </div>
            <div class="detail-box">
                <div class="tag-row">
                    ${personStats.map((item) => `<div class="tag">${escapeHtml(item.label)}: ${escapeHtml(item.value)}</div>`).join("")}
                </div>
            </div>
            <form id="personImageForm" class="detail-box form-grid">
                <input type="hidden" name="identifier" value="${escapeHtml(person.identifier || "")}">
                <input name="imageUrl" type="text" placeholder="https://... / Bild-URL für dieses Profil" value="${escapeHtml(person.image_url || "")}">
                <button type="submit" class="primary-button">Profilbild speichern</button>
                <button type="button" class="ghost-button" id="clearPersonImageButton">Profilbild entfernen</button>
            </form>
            ${getPermissions().casesWrite ? `
                <form id="personCaseForm" class="detail-box form-grid">
                    <input type="hidden" name="id">
                    <select name="caseType">
                        <option value="single">Einzelakte für diese Person</option>
                        <option value="group">Sammelakte / Fraktionsakte</option>
                    </select>
                    <input name="referenceCode" type="text" placeholder="Aktennummer / Referenz">
                    <input name="assignedOfficer" type="text" value="${escapeHtml(state.data?.officer?.name || "")}" placeholder="Sachbearbeiter / Zuständig">
                    <input name="subjectIdentifier" type="hidden" value="${escapeHtml(person.identifier || "")}">
                    <input name="subjectName" type="text" value="${escapeHtml(person.full_name || "")}" placeholder="Name der Person">
                    <textarea name="subjectIdentifiers" placeholder="Weitere interne Kennungen für Sammelakte oder Fraktion, getrennt mit Zeilenumbruch"></textarea>
                    <textarea name="subjectNames" placeholder="Weitere Namen für Sammelakte oder Fraktion, getrennt mit Zeilenumbruch">${escapeHtml(person.full_name || "")}</textarea>
                    <label class="toggle-row">
                        <input name="appliesToFaction" type="checkbox">
                        <span>Als Fraktionsakte markieren und allen aufgeführten Personen zuweisen</span>
                    </label>
                    <input name="title" type="text" placeholder="Akten-Titel">
                    <select name="status">
                        <option value="offen">Offen</option>
                        <option value="in bearbeitung">In Bearbeitung</option>
                        <option value="geschlossen">Geschlossen</option>
                    </select>
                    <select name="securityLevel">
                        <option value="oeffentlich">Öffentlich</option>
                        <option value="intern" selected>Intern</option>
                        <option value="vertraulich">Vertraulich</option>
                        <option value="gesperrt">Gesperrt</option>
                    </select>
                    <select name="releaseState">
                        <option value="intern" selected>Nur intern</option>
                        <option value="justiz">Justizfreigabe</option>
                        <option value="freigegeben">Voll freigegeben</option>
                    </select>
                    <textarea name="summary" placeholder="Kurzbeschreibung"></textarea>
                    <textarea name="notes" placeholder="Ausführliche Aktennotiz"></textarea>
                    <textarea name="closureReason" placeholder="Abschlussgrund / richterliche Entscheidung"></textarea>
                    <button type="submit" class="primary-button">Akte für diese Person / Gruppe speichern</button>
                </form>
            ` : ""}
            ${getPermissions().casesWrite && details.cases?.length ? `
                <form id="personCaseEntryForm" class="detail-box form-grid">
                    <select name="caseId">${caseOptions}</select>
                    <select name="entryType">
                        <option value="vermerk">Vermerk</option>
                        <option value="status">Status</option>
                        <option value="beweis">Beweis</option>
                        <option value="entscheidung">Entscheidung</option>
                    </select>
                    <input name="title" type="text" placeholder="Titel des Akteneintrags">
                    <textarea name="content" placeholder="Inhalt des Vermerks / der Entscheidung"></textarea>
                    <button type="submit" class="primary-button">Aktenvermerk speichern</button>
                </form>
            ` : ""}
            ${getPermissions().ticketsWrite ? `
                <form id="personTicketForm" class="detail-box form-grid">
                    <input type="hidden" name="id">
                    <input name="personIdentifier" type="hidden" value="${escapeHtml(person.identifier || "")}">
                    <input name="personName" type="text" value="${escapeHtml(person.full_name || "")}" placeholder="Name der Person">
                    <input name="amount" type="number" min="0" placeholder="Betrag">
                    <select name="status">
                        <option value="offen">Offen</option>
                        <option value="bezahlt">Bezahlt</option>
                        <option value="storniert">Storniert</option>
                    </select>
                    <textarea name="reason" placeholder="Grund / Verstoß / Bußgeld"></textarea>
                    <button type="submit" class="primary-button">Ticket / Bußgeld für diese Person speichern</button>
                </form>
            ` : ""}
            ${details.warrants?.length ? renderPanel("Fahndungen", renderSimpleList(details.warrants, (item) => `
                <div class="record">
                    <div class="record__title">${escapeHtml(item.title)}</div>
                    <div class="record__meta">
                        <div>Status: ${escapeHtml(item.status)}</div>
                        <div>Priorität: ${escapeHtml(item.priority)}</div>
                    </div>
                </div>
            `)) : ""}
            ${details.cases?.length ? renderPanel("Akten", renderSimpleList(details.cases, (item) => `
                <div class="record">
                    <div class="record__title">${escapeHtml(item.title)}</div>
                    <div class="record__meta">
                        <div>Aktennr.: ${escapeHtml(item.reference_code || "-")}</div>
                        <div>Typ: ${escapeHtml(item.case_type === "group" ? "Sammelakte" : "Einzelakte")}</div>
                        <div>Sachbearbeiter: ${escapeHtml(item.assigned_officer || "-")}</div>
                        <div>Status: ${escapeHtml(item.status)}</div>
                        <div>Freigabe: ${escapeHtml(item.release_state || "-")}</div>
                        <div>Sicherheitsstufe: ${escapeHtml(item.security_level)}</div>
                        <div>Fraktionsakte: ${escapeHtml(item.applies_to_faction ? "Ja" : "Nein")}</div>
                        ${item.closure_reason ? `<div>Abschlussgrund: ${escapeHtml(item.closure_reason)}</div>` : ""}
                    </div>
                </div>
            `)) : ""}
            ${details.caseEntries?.length ? renderPanel("Aktenchronik", renderSimpleList(details.caseEntries, (item) => `
                <div class="record">
                    <div class="record__title">${escapeHtml(item.reference_code || `Akte #${item.case_id}`)} | ${escapeHtml(item.title)}</div>
                    <div class="record__meta">
                        <div>Akte: ${escapeHtml(item.case_title || "-")}</div>
                        <div>Typ: ${escapeHtml(formatCaseEntryType(item.entry_type))}</div>
                        <div>Von: ${escapeHtml(item.created_by || "-")}</div>
                        <div>Stand: ${escapeHtml(formatDate(item.created_at))}</div>
                        <div>${escapeHtml(item.content || "-")}</div>
                    </div>
                </div>
            `)) : ""}
            ${details.tickets?.length ? renderPanel("Tickets", renderSimpleList(details.tickets, (item) => `
                <div class="record">
                    <div class="record__title">${escapeHtml(item.person_name)}</div>
                    <div class="record__meta">
                        <div>Betrag: $${escapeHtml(item.amount)}</div>
                        <div>Status: ${escapeHtml(item.status)}</div>
                    </div>
                </div>
            `)) : ""}
            ${details.medical?.length ? renderPanel("Krankenakten", renderSimpleList(details.medical, (item) => `
                <div class="record">
                    <div class="record__title">${escapeHtml(item.patient_name)}</div>
                    <div class="record__meta">
                        <div>Diagnose: ${escapeHtml(item.diagnosis)}</div>
                        <div>Status: ${escapeHtml(item.status)}</div>
                    </div>
                </div>
            `)) : ""}
        </div>
    `;
}

function fillForm(formId, values) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    Object.entries(values || {}).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (!field) {
            return;
        }

        if (field.type === "checkbox") {
            field.checked = value === true || value === "true" || value === "on" || value === 1 || value === "1";
            return;
        }

        if (value == null) {
            field.value = "";
            return;
        }

        field.value = field.type === "datetime-local" ? String(value).replace(" ", "T") : String(value);
    });
}

function serializeForm(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
        data[key] = value;
    });
    return data;
}

function setWritePanels() {
    toggleWritePanel("warrantForm", !!getPermissions().warrantsWrite);
    toggleWritePanel("caseForm", !!getPermissions().casesWrite);
    toggleWritePanel("ticketForm", !!getPermissions().ticketsWrite);
    toggleWritePanel("medicalForm", !!getPermissions().medicalWrite);
    toggleWritePanel("dispatchForm", !!getPermissions().dispatchWrite);
    toggleWritePanel("calendarForm", !!getPermissions().calendarWrite);
}

function toggleWritePanel(formId, isAllowed) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    const panel = form.closest(".panel");
    if (!panel) {
        return;
    }

    panel.classList.toggle("hidden", !isAllowed);
}

function attachListInteractions() {
    document.querySelectorAll("[data-nav]").forEach((button) => {
        button.onclick = () => {
            setActiveTab(button.dataset.nav);
        };
    });

    document.querySelectorAll("[data-edit]").forEach((button) => {
        button.onclick = () => {
            try {
                const payload = JSON.parse(button.dataset.edit);
                if ("target_identifier" in payload) {
                    fillForm("warrantForm", {
                        id: payload.id,
                        targetType: payload.target_type,
                        targetIdentifier: payload.target_identifier,
                        title: payload.title,
                        priority: payload.priority,
                        status: payload.status,
                        reason: payload.reason,
                        notes: payload.notes
                    });
                } else if ("security_level" in payload) {
                    fillForm("caseForm", {
                        id: payload.id,
                        caseType: payload.case_type || "single",
                        referenceCode: payload.reference_code,
                        assignedOfficer: payload.assigned_officer,
                        subjectIdentifier: payload.subject_identifier,
                        subjectName: payload.subject_name,
                        subjectIdentifiers: parseJsonArray(payload.subject_identifiers).join("\n"),
                        subjectNames: parseJsonArray(payload.subject_names).join("\n"),
                        appliesToFaction: payload.applies_to_faction ? "on" : "",
                        title: payload.title,
                        status: payload.status,
                        securityLevel: payload.security_level,
                        releaseState: payload.release_state,
                        summary: payload.summary,
                        notes: payload.notes,
                        closureReason: payload.closure_reason
                    });
                } else if ("amount" in payload) {
                    fillForm("ticketForm", {
                        id: payload.id,
                        personIdentifier: payload.person_identifier,
                        personName: payload.person_name,
                        amount: payload.amount,
                        status: payload.status,
                        reason: payload.reason
                    });
                } else if ("diagnosis" in payload) {
                    fillForm("medicalForm", {
                        id: payload.id,
                        patientIdentifier: payload.patient_identifier,
                        patientName: payload.patient_name,
                        diagnosis: payload.diagnosis,
                        status: payload.status,
                        allergies: payload.allergies,
                        treatment: payload.treatment,
                        notes: payload.notes
                    });
                } else if ("unit_code" in payload) {
                    fillForm("dispatchForm", {
                        id: payload.id,
                        title: payload.title,
                        location: payload.location,
                        incidentCode: payload.incident_code,
                        priority: payload.priority,
                        unitCode: payload.unit_code,
                        unitType: payload.unit_type,
                        primaryUnit: payload.primary_unit,
                        assignedOfficer: payload.assigned_officer,
                        unitStatus: payload.unit_status,
                        vehicleLabel: payload.vehicle_label,
                        vehiclePlate: payload.vehicle_plate,
                        crewNames: payload.crew_names,
                        scope: payload.scope,
                        status: payload.status,
                        notes: payload.notes
                    });
                } else if ("event_date" in payload) {
                    fillForm("calendarForm", {
                        id: payload.id,
                        title: payload.title,
                        eventDate: payload.event_date,
                        location: payload.location,
                        scope: payload.scope,
                        notes: payload.notes
                    });
                }
            } catch (error) {
                showToast("Eintrag konnte nicht geladen werden.", true);
            }
        };
    });

    document.querySelectorAll("[data-person]").forEach((button) => {
        button.onclick = async () => {
            const response = await fetchNui("getPerson", { identifier: button.dataset.person });
            if (!response.success) {
                showToast(response.message || "Person konnte nicht geladen werden.", true);
                return;
            }

            state.personDetails = response.data;
            renderPersonDetails();
            attachListInteractions();
        };
    });

    const personImageForm = document.getElementById("personImageForm");
    if (personImageForm) {
        personImageForm.onsubmit = async (event) => {
            event.preventDefault();
            const response = await fetchNui("savePersonImage", serializeForm(personImageForm));

            if (!response.success) {
                showToast(response.message || "Profilbild konnte nicht gespeichert werden.", true);
                return;
            }

            if (state.personDetails?.person) {
                state.personDetails.person = { ...state.personDetails.person, ...response.person };
            }

            renderPersonDetails();
            attachListInteractions();
            showToast(response.message || "Profilbild gespeichert.");
        };

        const clearButton = document.getElementById("clearPersonImageButton");
        if (clearButton) {
            clearButton.onclick = async () => {
                const identifierField = personImageForm.elements.namedItem("identifier");
                const response = await fetchNui("savePersonImage", {
                    identifier: identifierField ? identifierField.value : "",
                    imageUrl: ""
                });

                if (!response.success) {
                    showToast(response.message || "Profilbild konnte nicht entfernt werden.", true);
                    return;
                }

                if (state.personDetails?.person) {
                    state.personDetails.person = { ...state.personDetails.person, ...response.person };
                }

                renderPersonDetails();
                attachListInteractions();
                showToast(response.message || "Profilbild entfernt.");
            };
        }
    }

    const personCaseForm = document.getElementById("personCaseForm");
    if (personCaseForm) {
        personCaseForm.onsubmit = async (event) => {
            event.preventDefault();
            const response = await fetchNui("saveCase", serializeForm(personCaseForm));

            if (!response.success) {
                showToast(response.message || "Akte konnte nicht gespeichert werden.", true);
                return;
            }

            state.data = response.data || state.data;
            const identifierField = personCaseForm.elements.namedItem("subjectIdentifier");
            const identifier = identifierField ? identifierField.value : "";

            if (identifier) {
                const personResponse = await fetchNui("getPerson", { identifier });
                if (personResponse.success) {
                    state.personDetails = personResponse.data;
                }
            }

            renderAll();
            showToast(response.message || "Akte gespeichert.");
        };
    }

    const personCaseEntryForm = document.getElementById("personCaseEntryForm");
    if (personCaseEntryForm) {
        personCaseEntryForm.onsubmit = async (event) => {
            event.preventDefault();
            const response = await fetchNui("saveCaseEntry", serializeForm(personCaseEntryForm));

            if (!response.success) {
                showToast(response.message || "Aktenvermerk konnte nicht gespeichert werden.", true);
                return;
            }

            state.data = response.data || state.data;
            const identifier = state.personDetails?.person?.identifier || "";

            if (identifier) {
                const personResponse = await fetchNui("getPerson", { identifier });
                if (personResponse.success) {
                    state.personDetails = personResponse.data;
                }
            }

            renderAll();
            showToast(response.message || "Aktenvermerk gespeichert.");
        };
    }

    const personTicketForm = document.getElementById("personTicketForm");
    if (personTicketForm) {
        personTicketForm.onsubmit = async (event) => {
            event.preventDefault();
            const response = await fetchNui("saveTicket", serializeForm(personTicketForm));

            if (!response.success) {
                showToast(response.message || "Ticket konnte nicht gespeichert werden.", true);
                return;
            }

            state.data = response.data || state.data;
            const identifierField = personTicketForm.elements.namedItem("personIdentifier");
            const identifier = identifierField ? identifierField.value : "";

            if (identifier) {
                const personResponse = await fetchNui("getPerson", { identifier });
                if (personResponse.success) {
                    state.personDetails = personResponse.data;
                }
            }

            renderAll();
            showToast(response.message || "Ticket gespeichert.");
        };
    }
}

async function handleSubmit(formId, endpoint) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const response = await fetchNui(endpoint, serializeForm(form));

        if (!response.success) {
            showToast(response.message || "Speichern fehlgeschlagen.", true);
            return;
        }

        state.data = response.data || state.data;
        renderAll();
        form.reset();
        showToast(response.message || "Gespeichert.");
    });
}

function renderOfficer() {
    const officer = state.data?.officer;
    document.getElementById("officerName").textContent = officer?.name || "Unbekannt";
    document.getElementById("officerMeta").textContent = officer ? `${officer.departmentLabel} | ${officer.grade}` : "Keine Berechtigung";
}

function renderAll() {
    renderOfficer();
    buildNav();
    renderDashboard();
    renderDataLists();
    renderSearchResults();
    renderPersonDetails();
    setWritePanels();
    attachListInteractions();

    const allowedTabs = tabConfig.filter((tab) => getPermissions()[tab.read]);
    if (!allowedTabs.find((tab) => tab.key === state.activeTab)) {
        state.activeTab = allowedTabs[0]?.key || "dashboard";
    }

    setActiveTab(state.activeTab);
}

window.addEventListener("message", (event) => {
    const { action, payload } = event.data || {};

    if (action === "open") {
        state.open = true;
        state.data = payload;
        state.searchResults = [];
        state.personDetails = null;
        setUiVisibility(true);
        renderAll();
        showToast("LunarOS verbunden.");
    }

    if (action === "close") {
        state.open = false;
        setUiVisibility(false);
    }
});

document.getElementById("closeButton").addEventListener("click", () => {
    fetchNui("close");
});

document.getElementById("personSearchButton").addEventListener("click", async () => {
    const query = document.getElementById("personSearchInput").value;
    const response = await fetchNui("searchPersons", { query });

    if (!response.success) {
        showToast(response.message || "Suche fehlgeschlagen.", true);
        return;
    }

    state.searchResults = response.data || [];
    renderSearchResults();
    attachListInteractions();
});

document.getElementById("personSearchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        document.getElementById("personSearchButton").click();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) {
        fetchNui("close");
    }
});

handleSubmit("warrantForm", "saveWarrant");
handleSubmit("caseForm", "saveCase");
handleSubmit("ticketForm", "saveTicket");
handleSubmit("medicalForm", "saveMedical");
handleSubmit("dispatchForm", "saveDispatch");
handleSubmit("calendarForm", "saveCalendar");

if (previewMode) {
    state.open = true;
    state.data = demoData;
    state.searchResults = [];
    state.personDetails = null;
    setUiVisibility(true);
    renderAll();
    showToast("Vorschau-Modus aktiv (LunarOS).");
} else {
    setUiVisibility(false);
}
