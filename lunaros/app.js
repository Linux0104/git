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
    activeCaseId: null,
    caseDetails: null,
    dispatchLoaded: false,
    dispatchOfficersLoaded: false,
    dispatchOfficers: [],
    dispatchList: [],
    activeDispatchId: null,
    dispatchDetails: null,
    dispatchFilters: {
        query: "",
        status: "",
        priority: "",
        scope: "",
        onlyActive: true
    },
    searchResults: [],
    personDetails: null,
    caseSelections: {
        caseForm: [],
        personCaseForm: []
    }
};

const tabConfig = [
    { key: "dashboard", label: "Dashboard", read: "dashboard", title: "Dashboard", description: "Lagebild, Streifenlage und aktuelle Einträge." },
    { key: "persons", label: "Personen", read: "persons", title: "Personen", description: "Personenabfragen, Aktenbezug und Detailansicht." },
    { key: "warrants", label: "Fahndung", read: "warrants", title: "Fahndungssystem", description: "Fahrzeug- und Personenfahndungen verwalten." },
    { key: "cases", label: "Akten", read: "cases", title: "Akten", description: "Strafakten, Justizakten und Ermittlungsstände verwalten." },
    { key: "tickets", label: "Bußgelder", read: "tickets", title: "Bußgelder", description: "Tickets und Bußgelder zentral verwalten." },
    { key: "medical", label: "Patienten", read: "medical", title: "Patientenverwaltung", description: "Krankenakten, Allergien und Behandlungsverlauf." },
    { key: "dispatch", label: "Leitstelle", read: "dispatch", title: "Leitstelle", description: "Streifen, Bereiche, Besatzungen und Status zentral einteilen." },
    { key: "management", label: "Management", read: "management", title: "Management", description: "Dienstnummern verwalten (PD High Command)." },
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
const caseSearchTimers = {};
const dispatchLookupTimers = {};
let dispatchOfficerAdminTimer = null;
let dispatchVehicleTimer = null;
let dispatchVehicleActiveField = null;
let managementOfficerTimer = null;
let dispatchTemplateTimer = null;
let dispatchTemplateActiveField = null;

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
            manageRecords: true,
            management: true
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
            manageRecords: true,
            management: false
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
            manageRecords: true,
            management: false
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
            manageRecords: true,
            management: false
        }
    };

    const permissions = permissionsByDept[dept] || permissionsByDept.police;

    return {
        officer: baseOfficer,
        permissions,
        dispatchTemplates: [],
        defaults: {
            warrantPriority: "normal",
            warrantStatus: "active",
            caseStatus: "offen",
            caseSecurity: "intern",
            ticketStatus: "offen",
            medicalStatus: "stabil",
            dispatchStatus: "im_dienst",
            calendarScope: "all"
        },
        options: {
            caseFactions: [
                { value: "ballas", label: "Ballas" },
                { value: "families", label: "Families" },
                { value: "marabunta", label: "Marabunta" },
                { value: "police", label: "Polizei" }
            ],
            caseParagraphCatalog: [
                { paragraph: "StGB §4 Abs 1 Diebstahl", title: "Diebstahl", he: 0, keywords: ["diebstahl", "gestohlen"] },
                { paragraph: "StGB §5 Abs. 4 Widerstand ggn. die Staatsgewalt", title: "Widerstand gegen die Staatsgewalt", he: 20, keywords: ["widerstand", "flucht"] },
                { paragraph: "StGB §7 Abs. 1.1 Besitz von Schusswaffen ohne Lizenz (nur Pistole)", title: "Unerlaubter Waffenbesitz", he: 20, keywords: ["waffe", "pistole"] }
            ],
            caseEntryTypes: ["vermerk", "status", "beweis", "entscheidung"],
            dispatchPriorities: ["regulaer", "verkehr", "zivil", "sonder"],
            unitStatuses: ["frei", "streife", "pause", "sonderlage", "ausser_dienst"]
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
                {
                    id: 1,
                    case_type: "group",
                    subject_identifier: "license:123",
                    subject_name: "Max Mustermann",
                    subject_identifiers: JSON.stringify(["license:123", "license:456"]),
                    subject_names: JSON.stringify(["Max Mustermann", "Erika Musterfrau"]),
                    applies_to_faction: 1,
                    faction_name: "ballas",
                    reference_code: "POL-260615-101",
                    title: "Akte #1",
                    summary: "Mehrere Beteiligte, laufende Ermittlungen.",
                    seized_items: "Pistole\nSchwarzgeld\nAusweis",
                    evidence_image_url: "https://example.com/ausweisbild.png",
                    facts: "Die Personen wurden nach einer Flucht mit Schusswaffe gestellt.",
                    rights_read_by: "Lt. Miller",
                    witness_name: "Officer Davis",
                    paragraphs_json: JSON.stringify([
                        { paragraph: "StGB §5 Abs. 4 Widerstand ggn. die Staatsgewalt", title: "Widerstand", he: 20 },
                        { paragraph: "StGB §7 Abs. 1.1 Besitz von Schusswaffen ohne Lizenz (nur Pistole)", title: "Waffenbesitz", he: 20 }
                    ]),
                    total_he: 40,
                    assigned_officer: "Lt. Miller",
                    security_level: "intern",
                    release_state: "intern",
                    status: "offen",
                    updated_at: nowIso()
                }
            ],
            tickets: [
                { id: 1, person_identifier: "license:123", person_name: "Max Mustermann", amount: 500, reason: "Falschparken", status: "offen", updated_at: nowIso() }
            ],
            medical: [
                { id: 1, patient_identifier: "license:123", patient_name: "Max Mustermann", diagnosis: "Prellung", status: "stabil", assigned_department: "ambulance", updated_at: nowIso() }
            ],
            dispatch: [
                {
                    id: 1,
                    title: "LSPD 1",
                    code_value: "1",
                    unit_value: "L",
                    location: "Innenstadt",
                    incident_code: "10-10",
                    timestamp_label: "12:10",
                    info_text: "Regelstreife Mission Row",
                    priority: "regulaer",
                    unit_code: "A-1",
                    unit_type: "Streifenwagen",
                    primary_unit: "Leitstelle Süd",
                    assigned_officer: "Linus Höper",
                    unit_status: "streife",
                    vehicle_label: "Buffalo STX",
                    vehicle_plate: "LSPD 1",
                    crew_names: "Linus Höper, Davis",
                    driver_identifier: "license:pd1",
                    driver_name: "Linus Höper",
                    driver_dn: "65",
                    driver_department: "LSPD",
                    driver_rank: "Ofc. II",
                    partner_identifier: "",
                    partner_name: "",
                    partner_dn: "",
                    partner_department: "",
                    partner_rank: "",
                    notes: "Regelstreife Innenstadt",
                    scope: "all",
                    status: "im_dienst",
                    updated_at: nowIso()
                }
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
const demoDispatchOfficers = [
    { identifier: "license:pd1", name: "Linus Höper", dn: "65", departmentLabel: "LSPD", rank: "Ofc. II" },
    { identifier: "license:pd2", name: "Mia Keller", dn: "72", departmentLabel: "LSPD", rank: "Sgt. I" },
    { identifier: "license:pd3", name: "Noah Weber", dn: "41", departmentLabel: "LSSD", rank: "Deputy I" },
    { identifier: "license:ems1", name: "Lea Hartmann", dn: "18", departmentLabel: "MD", rank: "Paramedic" }
];
const dispatchTemplateCatalog = [
    {
        title: "LSPD 1",
        codeValue: "1",
        unitValue: "L",
        location: "Mission Row",
        incidentCode: "Leitstelle Süd",
        timestampLabel: "",
        infoText: "Regelstreife Innenstadt",
        priority: "regulaer",
        unitCode: "Adam 1",
        unitType: "Streifenwagen",
        primaryUnit: "LSPD Leitstelle",
        assignedOfficer: "",
        unitStatus: "streife",
        vehicleLabel: "Buffalo STX",
        vehiclePlate: "LSPD 1",
        driverOfficerIdentifier: "",
        driverLookup: "",
        driverName: "",
        driverDn: "",
        driverDepartment: "",
        driverRank: "",
        partnerOfficerIdentifier: "",
        partnerLookup: "",
        partnerName: "",
        partnerDn: "",
        partnerDepartment: "",
        partnerRank: "",
        crewNames: "",
        scope: "police",
        status: "im_dienst"
    },
    {
        title: "LSPD 2",
        codeValue: "2",
        unitValue: "L",
        location: "Downtown Vinewood",
        incidentCode: "Leitstelle Nord",
        timestampLabel: "",
        infoText: "Regelstreife Nord",
        priority: "regulaer",
        unitCode: "Adam 2",
        unitType: "Streifenwagen",
        primaryUnit: "LSPD Leitstelle",
        assignedOfficer: "",
        unitStatus: "streife",
        vehicleLabel: "Stanier LE",
        vehiclePlate: "LSPD 2",
        driverOfficerIdentifier: "",
        driverLookup: "",
        driverName: "",
        driverDn: "",
        driverDepartment: "",
        driverRank: "",
        partnerOfficerIdentifier: "",
        partnerLookup: "",
        partnerName: "",
        partnerDn: "",
        partnerDepartment: "",
        partnerRank: "",
        crewNames: "",
        scope: "police",
        status: "im_dienst"
    },
    {
        title: "LSPD Air 1",
        codeValue: "AIR",
        unitValue: "1",
        location: "Stadtgebiet",
        incidentCode: "Air Support",
        timestampLabel: "",
        infoText: "Luftunterstützung",
        priority: "sonder",
        unitCode: "Air 1",
        unitType: "Helikopter",
        primaryUnit: "LSPD Leitstelle",
        assignedOfficer: "",
        unitStatus: "sonderlage",
        vehicleLabel: "Police Maverick",
        vehiclePlate: "AIR 1",
        driverOfficerIdentifier: "",
        driverLookup: "",
        driverName: "",
        driverDn: "",
        driverDepartment: "",
        driverRank: "",
        partnerOfficerIdentifier: "",
        partnerLookup: "",
        partnerName: "",
        partnerDn: "",
        partnerDepartment: "",
        partnerRank: "",
        crewNames: "",
        scope: "police",
        status: "im_dienst"
    }
];

demoData.dispatchTemplates = dispatchTemplateCatalog.map((entry, index) => ({
    id: index + 1,
    ...entry
}));

function getManagedDispatchTemplates() {
    const items = state.data?.dispatchTemplates;
    if (Array.isArray(items) && items.length) {
        return items;
    }
    return previewMode ? demoData.dispatchTemplates || [] : [];
}

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

    if (eventName === "getCase") {
        const record = demoData.lists.cases.find((entry) => Number(entry.id) === Number(payload.id));
        if (!record) {
            return Promise.resolve({ success: false, message: "Akte nicht gefunden." });
        }

        return Promise.resolve({
            success: true,
            data: {
                case: record,
                entries: demoData.lists.caseEntries.filter((entry) => Number(entry.case_id) === Number(record.id))
            }
        });
    }

    if (eventName === "listDispatch") {
        const query = String(payload.query || "").toLowerCase();
        const status = String(payload.status || "");
        const priority = String(payload.priority || "");
        const scope = String(payload.scope || "");
        const onlyActive = payload.onlyActive === true || payload.onlyActive === "true" || payload.onlyActive === "on" || payload.onlyActive === 1 || payload.onlyActive === "1";

        const items = (demoData.lists.dispatch || []).filter((item) => {
            if (onlyActive && String(item.status || "") === "abgemeldet") return false;
            if (status && String(item.status || "") !== status) return false;
            if (priority && String(item.priority || "") !== priority) return false;
            if (scope && String(item.scope || "") !== scope) return false;
            if (!query) return true;
            const hay = `${item.title || ""} ${item.code_value || ""} ${item.unit_value || ""} ${item.location || ""} ${item.incident_code || ""} ${item.primary_unit || ""} ${item.unit_code || ""} ${item.assigned_officer || ""} ${item.driver_name || ""} ${item.partner_name || ""} ${item.info_text || ""}`.toLowerCase();
            return hay.includes(query);
        });

        return Promise.resolve({ success: true, data: { items } });
    }

    if (eventName === "getDispatch") {
        const record = demoData.lists.dispatch.find((entry) => Number(entry.id) === Number(payload.id));
        if (!record) {
            return Promise.resolve({ success: false, message: "Streife nicht gefunden." });
        }

        return Promise.resolve({
            success: true,
            data: {
                dispatch: record,
                updates: [
                    { id: 1, dispatch_id: record.id, update_type: "system", title: "Streife angelegt", content: `Streifenname: ${record.title}\nBereich: ${record.location}`, created_by: "Leitstelle", created_at: nowIso() },
                    { id: 2, dispatch_id: record.id, update_type: "status", title: "Dienststatus geändert", content: `Status: ${formatDispatchServiceStatus(record.status)}`, created_by: "Leitstelle", created_at: nowIso() }
                ]
            }
        });
    }

    if (eventName === "listDispatchOfficers") {
        const query = String(payload.query || "").toLowerCase();
        const items = demoDispatchOfficers.filter((entry) => {
            if (!query) return true;
            return `${entry.name} ${entry.dn} ${entry.departmentLabel} ${entry.rank}`.toLowerCase().includes(query);
        });
        return Promise.resolve({ success: true, data: { items } });
    }

    if (eventName === "saveOfficerServiceNumber") {
        const identifier = String(payload.identifier || "");
        const serviceNumber = String(payload.serviceNumber || "").trim();
        const existing = demoDispatchOfficers.find((entry) => entry.identifier === identifier);

        if (!existing) {
            return Promise.resolve({ success: false, message: "Officer oder Dienstnummer fehlt." });
        }

        const duplicate = serviceNumber
            ? demoDispatchOfficers.find((entry) => entry.identifier !== identifier && entry.dn === serviceNumber)
            : null;
        if (duplicate) {
            return Promise.resolve({ success: false, message: "Dienstnummer ist bereits vergeben." });
        }

        existing.dn = serviceNumber;
        return Promise.resolve({ success: true, message: serviceNumber ? "Dienstnummer gespeichert." : "Dienstnummer zurückgesetzt." });
    }

    if (eventName === "saveDispatchTemplate") {
        const incoming = { ...payload };
        const recordId = Number(incoming.id || 0) || null;
        if (!String(incoming.title || "").trim() || !String(incoming.vehiclePlate || "").trim()) {
            return Promise.resolve({ success: false, message: "Bitte Vorlagenname und Kennzeichen angeben." });
        }

        const duplicate = (demoData.dispatchTemplates || []).find((entry) => {
            return Number(entry.id) !== Number(recordId || 0)
                && String(entry.vehiclePlate || "").trim().toLowerCase() === String(incoming.vehiclePlate || "").trim().toLowerCase();
        });
        if (duplicate) {
            return Promise.resolve({ success: false, message: "Kennzeichen ist bereits in einer Vorlage hinterlegt." });
        }

        if (recordId) {
            const index = (demoData.dispatchTemplates || []).findIndex((entry) => Number(entry.id) === recordId);
            if (index >= 0) {
                demoData.dispatchTemplates[index] = { ...demoData.dispatchTemplates[index], ...incoming, id: recordId };
            }
        } else {
            mockId += 1;
            demoData.dispatchTemplates = [{ ...incoming, id: mockId }, ...(demoData.dispatchTemplates || [])];
        }

        return Promise.resolve({ success: true, message: "Streifenvorlage gespeichert.", data: demoData });
    }

    if (eventName === "deleteDispatchTemplate") {
        const recordId = Number(payload.id || 0);
        demoData.dispatchTemplates = (demoData.dispatchTemplates || []).filter((entry) => Number(entry.id) !== recordId);
        return Promise.resolve({ success: true, message: "Streifenvorlage gelöscht.", data: demoData });
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

    if (eventName === "suggestCasePenalties") {
        const searchText = `${payload.facts || ""} ${payload.seizedItems || ""}`.toLowerCase();
        const suggestions = [];

        if (searchText.includes("waffe") || searchText.includes("pistole")) {
            suggestions.push({ paragraph: "StGB §7 Abs. 1.1 Besitz von Schusswaffen ohne Lizenz (nur Pistole)", title: "Waffenbesitz", he: 20 });
        }
        if (searchText.includes("flucht")) {
            suggestions.push({ paragraph: "StGB §5 Abs. 4 Widerstand ggn. die Staatsgewalt", title: "Widerstand", he: 20 });
        }
        if (searchText.includes("drogen") || searchText.includes("weed") || searchText.includes("kokain")) {
            suggestions.push({ paragraph: "StGB §6 Abs 1.4 Besitz Betäubungsmitteln, Drogen, Illegalen Gegenstände", title: "Betäubungsmittelbesitz", he: 20 });
        }

        const totalHe = suggestions.reduce((sum, item) => sum + Number(item.he || 0), 0);
        return Promise.resolve({
            success: true,
            data: {
                paragraphs: suggestions,
                paragraphSummary: suggestions.map((item) => `${item.paragraph} | ${item.he} HE`).join("\n"),
                totalHe
            }
        });
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

function getCaseFactions() {
    return state.data?.options?.caseFactions || [];
}

function buildFactionOptions(selectedValue = "") {
    const options = ['<option value="">Welche Fraktion / Gruppierung?</option>'];
    getCaseFactions().forEach((entry) => {
        const value = String(entry?.value || "");
        const label = String(entry?.label || value);
        const selected = value === String(selectedValue || "") ? " selected" : "";
        options.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`);
    });
    return options.join("");
}

function parseParagraphs(value) {
    return parseJsonArray(value).map((entry) => ({
        paragraph: String(entry?.paragraph || entry?.title || "").trim(),
        title: String(entry?.title || entry?.paragraph || "").trim(),
        he: Number(entry?.he || 0) || 0
    })).filter((entry) => entry.paragraph);
}

function formatParagraphSummary(value) {
    const paragraphs = parseParagraphs(value);
    if (!paragraphs.length) {
        return "-";
    }

    return paragraphs.map((entry) => `${entry.paragraph}${entry.he ? ` | ${entry.he} HE` : ""}`).join("\n");
}

function getCaseParagraphCatalog() {
    return state.data?.options?.caseParagraphCatalog || [];
}

function renderLawCatalog() {
    const container = document.getElementById("lawCatalogList");
    const input = document.getElementById("lawCatalogSearch");
    if (!container || !input) {
        return;
    }

    const query = String(input.value || "").trim().toLowerCase();
    const entries = getCaseParagraphCatalog().filter((entry) => {
        const haystack = [
            entry?.paragraph,
            entry?.title,
            ...(entry?.keywords || [])
        ].join(" ").toLowerCase();
        return !query || haystack.includes(query);
    });

    if (!entries.length) {
        container.innerHTML = '<div class="empty">Keine Straftat im Katalog gefunden.</div>';
        return;
    }

    container.innerHTML = entries.slice(0, 40).map((entry) => `
        <div class="picker-result">
            <div class="picker-result__info">
                <div class="record__title">${escapeHtml(entry.paragraph || entry.title || "Straftat")}</div>
                <div class="record__meta">
                    <div>Bezeichnung: ${escapeHtml(entry.title || "-")}</div>
                    <div>Automatik: ${escapeHtml((entry.keywords || []).join(", ") || "-")}</div>
                    <div>HE: ${escapeHtml(entry.he || 0)}</div>
                </div>
            </div>
        </div>
    `).join("");
}

function escapeAttribute(value) {
    return escapeHtml(JSON.stringify(value ?? ""));
}

function getCaseSelection(formId) {
    if (!state.caseSelections[formId]) {
        state.caseSelections[formId] = [];
    }

    return state.caseSelections[formId];
}

function setCaseSelection(formId, entries) {
    state.caseSelections[formId] = (entries || []).map((entry) => ({
        identifier: String(entry.identifier || "").trim(),
        full_name: String(entry.full_name || entry.subject_name || entry.person_name || entry.identifier || "").trim(),
        image_url: String(entry.image_url || "").trim()
    })).filter((entry) => entry.identifier);
}

function buildSelectionFromFields(form) {
    if (!form) {
        return [];
    }

    const identifiers = String(form.elements.namedItem("subjectIdentifiers")?.value || "")
        .split(/\r?\n|[,;]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    const names = String(form.elements.namedItem("subjectNames")?.value || "")
        .split(/\r?\n|[;]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);

    return identifiers.map((identifier, index) => ({
        identifier,
        full_name: names[index] || names[0] || identifier,
        image_url: ""
    }));
}

function syncCaseSelectionToFields(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    const selection = getCaseSelection(formId);
    const first = selection[0] || { identifier: "", full_name: "" };
    const subjectIdentifierField = form.elements.namedItem("subjectIdentifier");
    const subjectNameField = form.elements.namedItem("subjectName");
    const subjectIdentifiersField = form.elements.namedItem("subjectIdentifiers");
    const subjectNamesField = form.elements.namedItem("subjectNames");

    if (subjectIdentifierField) subjectIdentifierField.value = first.identifier || "";
    if (subjectNameField) subjectNameField.value = first.full_name || "";
    if (subjectIdentifiersField) subjectIdentifiersField.value = selection.map((entry) => entry.identifier).join("\n");
    if (subjectNamesField) subjectNamesField.value = selection.map((entry) => entry.full_name || entry.identifier).join("\n");
}

function renderCaseSelection(formId) {
    const container = document.querySelector(`[data-case-person-selected="${formId}"]`);
    if (!container) {
        return;
    }

    const selection = getCaseSelection(formId);
    if (!selection.length) {
        container.innerHTML = '<div class="empty">Noch keine Person ausgewählt.</div>';
        return;
    }

    container.innerHTML = selection.map((entry) => `
        <div class="picker-pill">
            <span>${avatarMarkup(entry, "person-avatar--sm")}</span>
            <span>${escapeHtml(entry.full_name || entry.identifier)}</span>
            <button type="button" class="ghost-button" data-remove-case-person="${formId}" data-identifier="${escapeHtml(entry.identifier)}">Entfernen</button>
        </div>
    `).join("");
}

function renderCaseSearchResults(formId, results) {
    const container = document.querySelector(`[data-case-person-results="${formId}"]`);
    if (!container) {
        return;
    }

    if (!results?.length) {
        container.innerHTML = '<div class="empty">Keine passenden Personen gefunden.</div>';
        return;
    }

    container.innerHTML = results.map((item) => `
        <div class="picker-result">
            <div class="picker-result__info">
                <div class="record__title record__title--with-avatar">${avatarMarkup(item, "person-avatar--sm")}<span>${escapeHtml(item.full_name || item.identifier)}</span></div>
                <div class="record__meta">
                    <div>Geburtsdatum: ${escapeHtml(item.dateofbirth || "-")}</div>
                </div>
            </div>
            <button type="button" class="primary-button" data-case-person-pick="${formId}" data-person-payload="${escapeAttribute(item)}">Übernehmen</button>
        </div>
    `).join("");
}

function updateCaseFormMode(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    const caseType = form.elements.namedItem("caseType")?.value || "single";
    const isGroup = caseType === "group";
    let selection = getCaseSelection(formId);

    if (!isGroup && selection.length > 1) {
        setCaseSelection(formId, [selection[selection.length - 1]]);
        selection = getCaseSelection(formId);
    }

    form.querySelectorAll(`[data-group-only="${formId}"]`).forEach((element) => {
        element.classList.toggle("hidden", !isGroup);
        element.style.display = isGroup ? "" : "none";
    });

    if (!isGroup) {
        const appliesField = form.elements.namedItem("appliesToFaction");
        const factionField = form.elements.namedItem("factionName");
        if (appliesField) appliesField.checked = false;
        if (factionField) factionField.value = "";
        clearCasePickerResults(formId);
    }

    syncCaseSelectionToFields(formId);
    renderCaseSelection(formId);
}

function hydrateCaseSelection(formId, fallbackPerson) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    let selection = buildSelectionFromFields(form);
    if (!selection.length && fallbackPerson?.identifier) {
        selection = [{
            identifier: fallbackPerson.identifier,
            full_name: fallbackPerson.full_name || fallbackPerson.identifier,
            image_url: fallbackPerson.image_url || ""
        }];
    }

    setCaseSelection(formId, selection);
    syncCaseSelectionToFields(formId);
    renderCaseSelection(formId);
    updateCaseFormMode(formId);
}

async function searchCasePersons(formId) {
    const input = document.querySelector(`[data-case-person-search="${formId}"]`);
    if (!input) {
        return;
    }

    const query = input.value.trim();
    if (!query) {
        renderCaseSearchResults(formId, []);
        attachListInteractions();
        return;
    }

    const response = await fetchNui("searchPersons", { query });
    if (!response.success) {
        showToast(response.message || "Personensuche fehlgeschlagen.", true);
        return;
    }

    const selectedIdentifiers = new Set(getCaseSelection(formId).map((entry) => entry.identifier));
    const results = (response.data || []).filter((entry) => !selectedIdentifiers.has(entry.identifier));
    renderCaseSearchResults(formId, results);
    attachListInteractions();
}

function queueCasePersonSearch(formId) {
    window.clearTimeout(caseSearchTimers[formId]);
    caseSearchTimers[formId] = window.setTimeout(() => {
        searchCasePersons(formId);
    }, 180);
}

function clearCasePickerResults(formId) {
    const input = document.querySelector(`[data-case-person-search="${formId}"]`);
    const container = document.querySelector(`[data-case-person-results="${formId}"]`);
    if (input) input.value = "";
    if (container) container.innerHTML = "";
}

function addCasePerson(formId, person) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    const caseType = form.elements.namedItem("caseType")?.value || "single";
    const current = getCaseSelection(formId);
    const normalized = {
        identifier: String(person.identifier || "").trim(),
        full_name: String(person.full_name || person.subject_name || person.person_name || person.identifier || "").trim(),
        image_url: String(person.image_url || "").trim()
    };

    const nextSelection = caseType === "group"
        ? [...current.filter((entry) => entry.identifier !== normalized.identifier), normalized]
        : [normalized];

    setCaseSelection(formId, nextSelection);
    syncCaseSelectionToFields(formId);
    updateCaseFormMode(formId);
    clearCasePickerResults(formId);
}

function removeCasePerson(formId, identifier) {
    const nextSelection = getCaseSelection(formId).filter((entry) => entry.identifier !== identifier);
    setCaseSelection(formId, nextSelection);
    syncCaseSelectionToFields(formId);
    updateCaseFormMode(formId);
}

function applyPenaltySuggestion(form, payload) {
    if (!form || !payload) {
        return;
    }

    const paragraphs = payload.paragraphs || [];
    const summary = payload.paragraphSummary || formatParagraphSummary(paragraphs);
    const totalHe = Number(payload.totalHe || 0) || 0;

    const paragraphsJsonField = form.elements.namedItem("paragraphsJson");
    const paragraphSummaryField = form.elements.namedItem("paragraphSummary");
    const totalHeField = form.elements.namedItem("totalHe");
    const titleField = form.elements.namedItem("title");
    const summaryField = form.elements.namedItem("summary");

    if (paragraphsJsonField) paragraphsJsonField.value = JSON.stringify(paragraphs);
    if (paragraphSummaryField) paragraphSummaryField.value = summary;
    if (totalHeField && !Number(totalHeField.value || 0)) totalHeField.value = totalHe;
    if (totalHeField && totalHe) totalHeField.value = totalHe;
    if (titleField && !String(titleField.value || "").trim() && payload.suggestedTitle) titleField.value = payload.suggestedTitle;
    if (summaryField && !String(summaryField.value || "").trim() && payload.suggestedSummary) summaryField.value = payload.suggestedSummary;
}

async function suggestCasePenalties(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    const response = await fetchNui("suggestCasePenalties", {
        caseType: form.elements.namedItem("caseType")?.value || "single",
        facts: form.elements.namedItem("facts")?.value || "",
        seizedItems: form.elements.namedItem("seizedItems")?.value || ""
    });

    if (!response.success) {
        showToast(response.message || "Strafbestand konnte nicht ermittelt werden.", true);
        return;
    }

    applyPenaltySuggestion(form, response.data || {});
}

function bindPenaltyAutoSuggest(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    const factsField = form.elements.namedItem("facts");
    const seizedItemsField = form.elements.namedItem("seizedItems");
    let timer = null;

    [factsField, seizedItemsField].forEach((field) => {
        if (!field) {
            return;
        }

        field.oninput = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                const hasContent = String(factsField?.value || seizedItemsField?.value || "").trim();
                if (hasContent) {
                    suggestCasePenalties(formId);
                }
            }, 450);
        };
    });
}

function formatUnitStatus(status) {
    const map = {
        frei: "Frei",
        streife: "Auf Streife",
        pause: "Pause",
        sonderlage: "Sonderlage",
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

function formatCaseText(value, fallback = "Keine Angabe") {
    const text = String(value || "").trim();
    return text ? escapeHtml(text).replace(/\n/g, "<br>") : `<span class="case-detail__muted">${escapeHtml(fallback)}</span>`;
}

function getCaseSubjects(item) {
    const names = parseJsonArray(item?.subject_names).filter(Boolean);
    if (item?.subject_name && !names.includes(item.subject_name)) {
        names.unshift(item.subject_name);
    }

    return names;
}

function findCaseSummaryLines(item) {
    return [
        `Aktennr.: ${item.reference_code || "-"}`,
        `Typ: ${item.case_type === "group" ? "Sammelakte" : "Einzelakte"}`,
        `Personen: ${getCaseSubjects(item).join(", ") || item.subject_name || "-"}`,
        `Fraktion: ${item.faction_name || "-"}`,
        `Sachbearbeiter: ${item.assigned_officer || "-"}`,
        `Status: ${item.status}${item.applies_to_faction ? " | Fraktion" : ""}`
    ];
}

function renderCaseListRecord(item, context = "cases") {
    const openContext = context === "person" ? "person" : "cases";
    return `
        <div class="record">
            <div class="record__title">${escapeHtml(item.title || "Ohne Titel")}</div>
            <div class="record__meta">${findCaseSummaryLines(item).map((line) => `<div>${escapeHtml(line)}</div>`).join("")}</div>
            <div class="record__actions">
                <button class="primary-button" data-open-case="${escapeHtml(item.id)}" data-open-case-context="${escapeHtml(openContext)}">Öffnen</button>
                <button data-edit="${escapeHtml(JSON.stringify(item))}">Bearbeiten</button>
            </div>
        </div>
    `;
}

function renderCaseDetailContent(record, entries = []) {
    if (!record) {
        return '<div class="placeholder">Wähle eine Akte aus, um alle Inhalte zu sehen.</div>';
    }

    const subjectNames = getCaseSubjects(record);
    const paragraphs = formatParagraphSummary(record.paragraphs_json);

    return `
        <div class="case-detail">
            <div class="case-detail__header">
                <div>
                    <div class="panel__subtitle">${escapeHtml(record.reference_code || `Akte #${record.id}`)}</div>
                    <h3>${escapeHtml(record.title || "Ohne Titel")}</h3>
                </div>
                <div class="tag-row">
                    <div class="tag">${escapeHtml(record.case_type === "group" ? "Sammelakte" : "Einzelakte")}</div>
                    <div class="tag">${escapeHtml(record.status || "-")}</div>
                    <div class="tag">${escapeHtml(`${record.total_he || 0} HE`)}</div>
                </div>
            </div>
            <div class="case-detail__meta-grid">
                <div class="case-detail__meta-item"><strong>Personen</strong><span>${escapeHtml(subjectNames.join(", ") || record.subject_name || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Fraktion</strong><span>${escapeHtml(record.faction_name || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Sachbearbeiter</strong><span>${escapeHtml(record.assigned_officer || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Freigabe</strong><span>${escapeHtml(record.release_state || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Sicherheitsstufe</strong><span>${escapeHtml(record.security_level || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Rechte verlesen</strong><span>${escapeHtml(record.rights_read_by || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Zeuge</strong><span>${escapeHtml(record.witness_name || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Fraktionsakte</strong><span>${escapeHtml(record.applies_to_faction ? "Ja" : "Nein")}</span></div>
            </div>
            <div class="case-detail__blocks">
                <div class="case-detail__block">
                    <div class="picker-block__header">Kurzbeschreibung</div>
                    <div class="case-detail__content">${formatCaseText(record.summary)}</div>
                </div>
                <div class="case-detail__block">
                    <div class="picker-block__header">Abgenommene Gegenstände und Ausweis</div>
                    <div class="case-detail__content">${formatCaseText(record.seized_items)}</div>
                </div>
                <div class="case-detail__block case-detail__block--full">
                    <div class="picker-block__header">Sachverhalt</div>
                    <div class="case-detail__content">${formatCaseText(record.facts)}</div>
                </div>
                <div class="case-detail__block">
                    <div class="picker-block__header">Strafbestand</div>
                    <div class="case-detail__content">${formatCaseText(paragraphs, "Keine Paragraphen eingetragen.")}</div>
                </div>
                <div class="case-detail__block">
                    <div class="picker-block__header">Notizen / Abschlussgrund</div>
                    <div class="case-detail__content">${formatCaseText([record.notes, record.closure_reason].filter(Boolean).join("\n\n"), "Keine weiteren Notizen.")}</div>
                </div>
            </div>
            <div class="picker-block__header">Aktenchronik</div>
            ${entries.length ? `
                <div class="case-detail__entries">
                    ${entries.map((entry) => `
                        <div class="case-detail__entry">
                            <div class="record__title">${escapeHtml(formatCaseEntryType(entry.entry_type))} | ${escapeHtml(entry.title || "-")}</div>
                            <div class="record__meta">
                                <div>Von: ${escapeHtml(entry.created_by || "-")}</div>
                                <div>Stand: ${escapeHtml(formatDate(entry.created_at))}</div>
                            </div>
                            <div class="case-detail__content">${formatCaseText(entry.content)}</div>
                        </div>
                    `).join("")}
                </div>
            ` : '<div class="empty">Noch keine Einträge in der Aktenchronik.</div>'}
        </div>
    `;
}

function renderCaseDetailContainer() {
    const container = document.getElementById("caseDetailContainer");
    if (!container) {
        return;
    }

    const record = state.caseDetails?.case || null;
    const entries = state.caseDetails?.entries || [];
    container.innerHTML = renderPanel("Geöffnete Akte", renderCaseDetailContent(record, entries));
}

async function openCaseRecord(caseId, options = {}) {
    const recordId = Number(caseId || 0);
    if (!recordId) {
        return;
    }

    const response = await fetchNui("getCase", { id: recordId });
    if (!response.success) {
        showToast(response.message || "Akte konnte nicht geladen werden.", true);
        return;
    }

    state.activeCaseId = recordId;
    state.caseDetails = response.data || null;

    if (options.personContext && state.personDetails) {
        state.personDetails.activeCaseId = recordId;
        renderPersonDetails();
    }

    renderCaseDetailContainer();
    attachListInteractions();
}

function formatDispatchScope(scope) {
    const map = {
        all: "Alle",
        police: "Polizei",
        ambulance: "Rettungsdienst",
        fire: "Feuerwehr",
        doj: "Justiz"
    };
    return map[scope] || scope || "-";
}

function formatDispatchPriority(priority) {
    const map = {
        regulaer: "Regelstreife",
        verkehr: "Verkehr",
        zivil: "Zivil",
        sonder: "Sondereinheit"
    };
    return map[priority] || priority || "-";
}

function formatDispatchServiceStatus(status) {
    const map = {
        im_dienst: "Im Dienst",
        eingeteilt: "Eingeteilt",
        abgemeldet: "Abgemeldet"
    };
    return map[status] || status || "-";
}

function formatDispatchText(value, fallback = "Keine Angabe") {
    const text = String(value || "").trim();
    return text ? escapeHtml(text).replace(/\n/g, "<br>") : `<span class="case-detail__muted">${escapeHtml(fallback)}</span>`;
}

function normalizeLookupValue(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[ä]/g, "ae")
        .replace(/[ö]/g, "oe")
        .replace(/[ü]/g, "ue")
        .replace(/[ß]/g, "ss")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function positionFloatingResults(container, anchor) {
    if (!container || !anchor) {
        return;
    }

    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    const desiredWidth = rect.width;
    const maxHeight = 260;
    const placeBelow = rect.bottom + margin + 120 < window.innerHeight;
    const top = placeBelow ? (rect.bottom + 6) : Math.max(margin, rect.top - maxHeight - 6);
    const left = Math.min(Math.max(margin, rect.left), Math.max(margin, window.innerWidth - desiredWidth - margin));
    container.style.position = "fixed";
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
    container.style.width = `${desiredWidth}px`;
    container.style.maxWidth = `${desiredWidth}px`;
    container.style.maxHeight = `${maxHeight}px`;
    container.style.overflowY = "auto";
    container.style.zIndex = "9999";
    container.style.padding = "6px";
    container.style.border = "1px solid rgba(104, 190, 255, 0.18)";
    container.style.borderRadius = "10px";
    container.style.background = "rgba(6, 10, 18, 0.98)";
    container.style.boxShadow = "0 18px 40px rgba(0, 0, 0, 0.42)";
}

function resetFloatingResults(container) {
    if (!container) {
        return;
    }

    container.style.position = "";
    container.style.left = "";
    container.style.top = "";
    container.style.width = "";
    container.style.maxWidth = "";
    container.style.maxHeight = "";
    container.style.overflowY = "";
    container.style.zIndex = "";
    container.style.padding = "";
    container.style.border = "";
    container.style.borderRadius = "";
    container.style.background = "";
    container.style.boxShadow = "";
}

function getDispatchVehicleResultsContainer() {
    return document.getElementById("dispatchVehicleResults");
}

function getDispatchTemplateResultsContainer() {
    return document.getElementById("dispatchTemplateResults");
}

function clearDispatchTemplateResults() {
    const container = getDispatchTemplateResultsContainer();
    if (container) {
        container.innerHTML = "";
        resetFloatingResults(container);
    }
}

function clearDispatchVehicleResults() {
    const container = getDispatchVehicleResultsContainer();
    if (container) {
        container.innerHTML = "";
        resetFloatingResults(container);
    }
}

function getDispatchLookupResultsContainer(prefix) {
    if (prefix === "driver") return document.getElementById("dispatchDriverResults");
    if (prefix === "partner") return document.getElementById("dispatchPartnerResults");
    return null;
}

function clearDispatchLookupResults(prefix) {
    const container = getDispatchLookupResultsContainer(prefix);
    if (container) {
        container.innerHTML = "";
        resetFloatingResults(container);
    }
}

function mergeDispatchOfficers(items = []) {
    const next = new Map((state.dispatchOfficers || []).map((entry) => [String(entry.identifier || ""), entry]));
    items.forEach((entry) => {
        const identifier = String(entry?.identifier || "");
        if (!identifier) {
            return;
        }
        next.set(identifier, entry);
    });

    state.dispatchOfficers = Array.from(next.values()).sort((a, b) => {
        const left = String(a?.name || a?.identifier || "").localeCompare(String(b?.name || b?.identifier || ""), "de");
        return left !== 0 ? left : String(a?.identifier || "").localeCompare(String(b?.identifier || ""), "de");
    });
}

function findDispatchOfficerMatch(query) {
    const needle = normalizeLookupValue(query);
    if (!needle) {
        return null;
    }

    const officers = state.dispatchOfficers || [];
    const findUnique = (predicate) => {
        const matches = officers.filter(predicate);
        return matches.length === 1 ? matches[0] : null;
    };

    return findUnique((entry) => normalizeLookupValue(entry.dn) === needle)
        || findUnique((entry) => normalizeLookupValue(entry.name) === needle)
        || findUnique((entry) => normalizeLookupValue(entry.identifier) === needle)
        || findUnique((entry) => normalizeLookupValue(entry.dn).startsWith(needle))
        || findUnique((entry) => normalizeLookupValue(entry.name).startsWith(needle))
        || findUnique((entry) => normalizeLookupValue(`${entry.name} ${entry.dn} ${entry.departmentLabel} ${entry.rank}`).includes(needle));
}

function renderDispatchLookupResults(prefix, items, query) {
    const container = getDispatchLookupResultsContainer(prefix);
    const form = document.getElementById("dispatchForm");
    const anchor = form?.elements.namedItem(`${prefix}Lookup`);
    if (!container) {
        return;
    }

    const needle = normalizeLookupValue(query);
    if (!needle) {
        container.innerHTML = "";
        return;
    }

    if (!items?.length) {
        container.innerHTML = '<div class="empty">Keine Officer gefunden.</div>';
        positionFloatingResults(container, anchor);
        return;
    }

    positionFloatingResults(container, anchor);
    container.innerHTML = items.slice(0, 8).map((entry) => `
        <div class="picker-result" style="flex-direction:column; align-items:stretch;">
            <div class="picker-result__info">
                <div class="record__title">${escapeHtml(entry.name || entry.identifier)}</div>
                <div class="record__meta">
                    <div>DN: ${escapeHtml(entry.dn || "-")} | ${escapeHtml(entry.departmentLabel || "-")} | ${escapeHtml(entry.rank || "-")}</div>
                </div>
            </div>
            <button type="button" class="primary-button" style="width:100%;" data-dispatch-officer-pick="${escapeHtml(prefix)}" data-dispatch-officer-identifier="${escapeHtml(entry.identifier)}">Übernehmen</button>
        </div>
    `).join("");
}

function applyDispatchOfficer(prefix, officer, options = {}) {
    const form = document.getElementById("dispatchForm");
    if (!form) {
        return;
    }

    const preserveLookup = options.preserveLookup === true;
    const lookupField = form.elements.namedItem(`${prefix}Lookup`);
    const identifierField = form.elements.namedItem(`${prefix}OfficerIdentifier`);
    const nameField = form.elements.namedItem(`${prefix}Name`);
    const dnField = form.elements.namedItem(`${prefix}Dn`);
    const departmentField = form.elements.namedItem(`${prefix}Department`);
    const rankField = form.elements.namedItem(`${prefix}Rank`);
    const previousName = nameField ? String(nameField.value || "") : "";

    if (identifierField) identifierField.value = officer?.identifier || "";
    if (nameField) nameField.value = officer?.name || "";
    if (dnField) dnField.value = officer?.dn || "";
    if (departmentField) departmentField.value = officer?.departmentLabel || "";
    if (rankField) rankField.value = officer?.rank || "";
    if (lookupField && !preserveLookup) lookupField.value = officer?.name || officer?.dn || "";
    if (officer?.identifier) {
        clearDispatchLookupResults(prefix);
    }

    if (prefix === "driver") {
        const assignedOfficerField = form.elements.namedItem("assignedOfficer");
        if (assignedOfficerField) {
            const currentAssigned = String(assignedOfficerField.value || "").trim();
            if (!currentAssigned || currentAssigned === previousName) {
                assignedOfficerField.value = officer?.name || "";
            }
        }
    }

    updateDispatchAutoSummary();
}

async function loadDispatchOfficers(force = false, query = "") {
    if (!getPermissions().dispatchWrite) {
        return [];
    }

    const cleanedQuery = String(query || "").trim();
    if (!force && !cleanedQuery) {
        return state.dispatchOfficers || [];
    }
    if (!force && state.dispatchOfficersLoaded && !cleanedQuery) {
        renderDispatchOfficerAdmin();
        return state.dispatchOfficers;
    }

    const scope = state.data?.officer?.departmentKey || "";
    const response = await fetchNui("listDispatchOfficers", { scope, query: cleanedQuery });
    if (!response.success) {
        showToast(response.message || "Officer konnten nicht geladen werden.", true);
        return state.dispatchOfficers;
    }

    if (!cleanedQuery) {
        state.dispatchOfficersLoaded = true;
    }

    mergeDispatchOfficers(response.data?.items || []);
    renderDispatchOfficerAdmin();
    return response.data?.items || [];
}

async function updateDispatchLookupResults(prefix) {
    const form = document.getElementById("dispatchForm");
    if (!form) {
        return;
    }

    const lookupField = form.elements.namedItem(`${prefix}Lookup`);
    const query = String(lookupField?.value || "").trim();
    if (!query) {
        clearDispatchLookupResults(prefix);
        return;
    }

    const items = await loadDispatchOfficers(true, query);
    const match = findDispatchOfficerMatch(query);
    if (match) {
        applyDispatchOfficer(prefix, match);
        return;
    }

    const needle = normalizeLookupValue(query);
    const filtered = (items || []).filter((entry) => normalizeLookupValue(`${entry.name} ${entry.dn} ${entry.departmentLabel} ${entry.rank} ${entry.identifier}`).includes(needle));
    renderDispatchLookupResults(prefix, filtered, query);
    attachListInteractions();
}

async function resolveDispatchOfficer(prefix, options = {}) {
    const form = document.getElementById("dispatchForm");
    if (!form) {
        return null;
    }

    const lookupField = form.elements.namedItem(`${prefix}Lookup`);
    const query = String(lookupField?.value || "").trim();
    if (!query) {
        applyDispatchOfficer(prefix, null, { preserveLookup: true });
        return null;
    }

    let officer = findDispatchOfficerMatch(query);
    if (!officer && options.useRemote !== false) {
        await loadDispatchOfficers(true, query);
        officer = findDispatchOfficerMatch(query);
    }

    if (officer) {
        applyDispatchOfficer(prefix, officer);
        return officer;
    }

    applyDispatchOfficer(prefix, null, { preserveLookup: true });
    return null;
}

function queueDispatchOfficerLookup(prefix) {
    window.clearTimeout(dispatchLookupTimers[prefix]);
    dispatchLookupTimers[prefix] = window.setTimeout(() => {
        updateDispatchLookupResults(prefix);
    }, 180);
}

function renderDispatchOfficerAdmin() {
    const panel = document.getElementById("dispatchOfficerAdmin");
    const list = document.getElementById("dispatchOfficerAdminList");
    const searchField = document.getElementById("dispatchOfficerAdminSearch");
    if (!panel || !list) {
        return;
    }

    const canManage = !!getPermissions().manageRecords && !!getPermissions().dispatchWrite;
    panel.classList.toggle("hidden", !canManage);
    if (!canManage) {
        list.innerHTML = "";
        return;
    }

    const query = normalizeLookupValue(searchField?.value || "");
    if (!query) {
        list.innerHTML = '<div class="empty">Bitte erst suchen (Name oder Dienstnummer).</div>';
        return;
    }
    const items = (state.dispatchOfficers || []).filter((entry) => {
        return normalizeLookupValue(`${entry.name} ${entry.dn} ${entry.departmentLabel} ${entry.rank} ${entry.identifier}`).includes(query);
    });

    if (!items.length) {
        list.innerHTML = '<div class="empty">Keine Officer für diese Suche gefunden.</div>';
        return;
    }

    list.innerHTML = items.slice(0, 50).map((entry) => `
        <div class="record">
            <div class="record__title">${escapeHtml(entry.name || entry.identifier)}</div>
            <div class="record__meta">
                <div>Aktuelle DN: ${escapeHtml(entry.dn || "-")}</div>
                <div>${escapeHtml(entry.departmentLabel || "-")} | ${escapeHtml(entry.rank || "-")}</div>
            </div>
            <div class="record__actions">
                <input type="text" value="${escapeHtml(entry.dn || "")}" placeholder="Dienstnummer" data-officer-service-number="${escapeHtml(entry.identifier)}">
                <button type="button" class="primary-button" data-save-officer-service-number="${escapeHtml(entry.identifier)}">Speichern</button>
                <button type="button" class="ghost-button" data-reset-officer-service-number="${escapeHtml(entry.identifier)}">Zurücksetzen</button>
            </div>
        </div>
    `).join("");
}

function queueDispatchOfficerAdminSearch() {
    window.clearTimeout(dispatchOfficerAdminTimer);
    dispatchOfficerAdminTimer = window.setTimeout(async () => {
        const query = document.getElementById("dispatchOfficerAdminSearch")?.value || "";
        if (String(query).trim()) {
            await loadDispatchOfficers(true, query);
        } else {
            renderDispatchOfficerAdmin();
        }
    }, 180);
}

function renderDispatchDashboardRecord(item, context = "dispatch") {
    const openNav = context === "dashboard" ? "dispatch" : "";
    return `
        <div class="record">
            <div class="record__title">${escapeHtml(item.title || "Streife")}</div>
            <div class="record__meta">
                <div>Bereich: ${escapeHtml(item.location || "-")}</div>
                <div>Code / Unit: ${escapeHtml(item.code_value || "-")} | ${escapeHtml(item.unit_value || "-")}</div>
                <div>Fahrer: ${escapeHtml(item.driver_name || "-")}</div>
                <div>Dienst / Streife: ${escapeHtml(formatDispatchServiceStatus(item.status))} | ${escapeHtml(formatUnitStatus(item.unit_status))}</div>
            </div>
            <div class="record__actions">
                <button class="primary-button" data-open-dispatch="${escapeHtml(item.id)}" data-open-dispatch-nav="${escapeHtml(openNav)}">Öffnen</button>
            </div>
        </div>
    `;
}

function renderDispatchTable(items) {
    const body = document.getElementById("dispatchTableBody");
    if (!body) {
        return;
    }

    if (!items.length) {
        body.innerHTML = `<tr><td colspan="15" class="dispatch-table__empty">Noch keine Streifen vorhanden.</td></tr>`;
        return;
    }

    body.innerHTML = items.map((item) => `
        <tr class="dispatch-table__row${Number(state.activeDispatchId) === Number(item.id) ? " is-active" : ""}" data-open-dispatch="${escapeHtml(item.id)}" data-open-dispatch-nav="">
            <td>${escapeHtml(item.title || "-")}</td>
            <td>${escapeHtml(item.code_value || "-")}</td>
            <td>${escapeHtml(item.unit_value || "-")}</td>
            <td>${escapeHtml(item.incident_code || "-")}</td>
            <td>${escapeHtml(item.timestamp_label || "-")}</td>
            <td>${escapeHtml(item.info_text || "-")}</td>
            <td>${escapeHtml(item.vehicle_label || "-")}</td>
            <td>${escapeHtml(item.vehicle_plate || "-")}</td>
            <td>${escapeHtml(item.driver_dn || "-")}</td>
            <td>${escapeHtml(item.driver_department || "-")}</td>
            <td>${escapeHtml(item.driver_rank || "-")}</td>
            <td>${escapeHtml(item.driver_name || "-")}</td>
            <td>${escapeHtml(item.partner_dn || "-")}</td>
            <td>${escapeHtml(item.partner_department || "-")}</td>
            <td>${escapeHtml(item.partner_rank || "-")}</td>
        </tr>
    `).join("");
}

function renderDispatchDetailContent(record, updates = []) {
    if (!record) {
        return '<div class="placeholder">Wähle eine Streife aus, um alle Inhalte zu sehen.</div>';
    }

    return `
        <div class="case-detail">
            <div class="case-detail__header">
                <div>
                    <div class="panel__subtitle">${escapeHtml(record.incident_code || `Streife #${record.id}`)}</div>
                    <h3>${escapeHtml(record.title || "Streife")}</h3>
                </div>
                <div class="tag-row">
                    <div class="tag">${escapeHtml(formatDispatchScope(record.scope))}</div>
                    <div class="tag">${escapeHtml(formatDispatchPriority(record.priority))}</div>
                    <div class="tag">${escapeHtml(formatDispatchServiceStatus(record.status))}</div>
                </div>
            </div>

            <div class="case-detail__meta-grid">
                <div class="case-detail__meta-item"><strong>Bereich</strong><span>${escapeHtml(record.location || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Code / Unit</strong><span>${escapeHtml(`${record.code_value || "-"} / ${record.unit_value || "-"}`)}</span></div>
                <div class="case-detail__meta-item"><strong>Leitstelle / Dienstgruppe</strong><span>${escapeHtml(record.primary_unit || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Streifenart</strong><span>${escapeHtml(formatDispatchPriority(record.priority))}</span></div>
                <div class="case-detail__meta-item"><strong>Streifenstatus</strong><span>${escapeHtml(formatUnitStatus(record.unit_status))}</span></div>
                <div class="case-detail__meta-item"><strong>Streifenführer</strong><span>${escapeHtml(record.assigned_officer || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Fahrzeug</strong><span>${escapeHtml([record.vehicle_label, record.vehicle_plate ? `(${record.vehicle_plate})` : ""].filter(Boolean).join(" ").trim() || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Funkrufname</strong><span>${escapeHtml(record.unit_code || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Dienststatus</strong><span>${escapeHtml(formatDispatchServiceStatus(record.status))}</span></div>
                <div class="case-detail__meta-item"><strong>Timestamp / Tencode</strong><span>${escapeHtml(`${record.timestamp_label || "-"} / ${record.incident_code || "-"}`)}</span></div>
                <div class="case-detail__meta-item"><strong>Fahrer</strong><span>${escapeHtml(record.driver_name || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Fahrer Daten</strong><span>${escapeHtml(`${record.driver_dn || "-"} | ${record.driver_department || "-"} | ${record.driver_rank || "-"}`)}</span></div>
                <div class="case-detail__meta-item"><strong>Partner</strong><span>${escapeHtml(record.partner_name || "-")}</span></div>
                <div class="case-detail__meta-item"><strong>Partner Daten</strong><span>${escapeHtml(`${record.partner_dn || "-"} | ${record.partner_department || "-"} | ${record.partner_rank || "-"}`)}</span></div>
            </div>

            <div class="case-detail__blocks">
                <div class="case-detail__block case-detail__block--full">
                    <div class="picker-block__header">Info / Besatzung</div>
                    <div class="case-detail__content">${formatDispatchText([record.info_text, record.crew_names].filter(Boolean).join("\n\n"), "Keine Besatzung hinterlegt.")}</div>
                </div>
                <div class="case-detail__block case-detail__block--full">
                    <div class="picker-block__header">Leitstellenhinweise / Dienstnotizen</div>
                    <div class="case-detail__content">${formatDispatchText(record.notes, "Keine Hinweise hinterlegt.")}</div>
                </div>
            </div>

            <div class="picker-block__header">Schnellstatus</div>
            <div class="record__actions">
                ${["im_dienst", "eingeteilt", "abgemeldet"].map((value) => `
                    <button type="button" class="${String(record.status) === value ? "primary-button" : "ghost-button"}" data-dispatch-quick="status" data-value="${escapeHtml(value)}">${escapeHtml(formatDispatchServiceStatus(value))}</button>
                `).join("")}
                ${["frei", "streife", "pause", "sonderlage", "ausser_dienst"].map((value) => `
                    <button type="button" class="${String(record.unit_status) === value ? "primary-button" : "ghost-button"}" data-dispatch-quick="unitStatus" data-value="${escapeHtml(value)}">${escapeHtml(formatUnitStatus(value))}</button>
                `).join("")}
            </div>

            <div class="picker-block__header">Leitstellenchronik</div>
            ${updates.length ? `
                <div class="case-detail__entries">
                    ${updates.map((entry) => `
                        <div class="case-detail__entry">
                            <div class="record__title">${escapeHtml(entry.title || "-")}</div>
                            <div class="record__meta">
                                <div>Typ: ${escapeHtml(entry.update_type || "-")}</div>
                                <div>Von: ${escapeHtml(entry.created_by || "-")}</div>
                                <div>Stand: ${escapeHtml(formatDate(entry.created_at))}</div>
                            </div>
                            <div class="case-detail__content">${formatDispatchText(entry.content)}</div>
                        </div>
                    `).join("")}
                </div>
            ` : '<div class="empty">Noch keine Einträge in der Leitstellenchronik.</div>'}
        </div>
    `;
}

function renderDispatchDetailContainer() {
    const container = document.getElementById("dispatchDetailContainer");
    if (!container) {
        return;
    }

    const record = state.dispatchDetails?.dispatch || null;
    const updates = state.dispatchDetails?.updates || [];
    container.innerHTML = renderPanel("Geöffnete Streife", renderDispatchDetailContent(record, updates));
}

async function openDispatchRecord(dispatchId, options = {}) {
    const recordId = Number(dispatchId || 0);
    if (!recordId) {
        return;
    }

    const response = await fetchNui("getDispatch", { id: recordId });
    if (!response.success) {
        showToast(response.message || "Streife konnte nicht geladen werden.", true);
        return;
    }

    state.activeDispatchId = recordId;
    state.dispatchDetails = response.data || null;
    renderDispatchTable(state.dispatchLoaded ? state.dispatchList : (getLists().dispatch || []));
    renderDispatchDetailContainer();

    const dispatchForm = document.getElementById("dispatchForm");
    if (dispatchForm && state.dispatchDetails?.dispatch) {
        fillForm("dispatchForm", {
            id: state.dispatchDetails.dispatch.id,
            title: state.dispatchDetails.dispatch.title,
            codeValue: state.dispatchDetails.dispatch.code_value,
            unitValue: state.dispatchDetails.dispatch.unit_value,
            location: state.dispatchDetails.dispatch.location,
            incidentCode: state.dispatchDetails.dispatch.incident_code,
            timestampLabel: state.dispatchDetails.dispatch.timestamp_label,
            infoText: state.dispatchDetails.dispatch.info_text,
            priority: state.dispatchDetails.dispatch.priority,
            unitCode: state.dispatchDetails.dispatch.unit_code,
            unitType: state.dispatchDetails.dispatch.unit_type,
            primaryUnit: state.dispatchDetails.dispatch.primary_unit,
            assignedOfficer: state.dispatchDetails.dispatch.assigned_officer,
            unitStatus: state.dispatchDetails.dispatch.unit_status,
            vehicleLabel: state.dispatchDetails.dispatch.vehicle_label,
            vehiclePlate: state.dispatchDetails.dispatch.vehicle_plate,
            crewNames: state.dispatchDetails.dispatch.crew_names,
            driverOfficerIdentifier: state.dispatchDetails.dispatch.driver_identifier,
            driverLookup: state.dispatchDetails.dispatch.driver_name || state.dispatchDetails.dispatch.driver_dn,
            driverName: state.dispatchDetails.dispatch.driver_name,
            driverDn: state.dispatchDetails.dispatch.driver_dn,
            driverDepartment: state.dispatchDetails.dispatch.driver_department,
            driverRank: state.dispatchDetails.dispatch.driver_rank,
            partnerOfficerIdentifier: state.dispatchDetails.dispatch.partner_identifier,
            partnerLookup: state.dispatchDetails.dispatch.partner_name || state.dispatchDetails.dispatch.partner_dn,
            partnerName: state.dispatchDetails.dispatch.partner_name,
            partnerDn: state.dispatchDetails.dispatch.partner_dn,
            partnerDepartment: state.dispatchDetails.dispatch.partner_department,
            partnerRank: state.dispatchDetails.dispatch.partner_rank,
            scope: state.dispatchDetails.dispatch.scope,
            status: state.dispatchDetails.dispatch.status,
            notes: state.dispatchDetails.dispatch.notes
        });
        updateDispatchAutoSummary();
    }

    if (options.switchToDispatchTab) {
        setActiveTab("dispatch");
    }
    attachListInteractions();
}

async function loadDispatchList(force = false) {
    if (!getPermissions().dispatch) {
        return;
    }

    if (!force && state.dispatchLoaded && state.activeTab !== "dispatch") {
        return;
    }

    const response = await fetchNui("listDispatch", {
        query: state.dispatchFilters.query,
        status: state.dispatchFilters.status,
        priority: state.dispatchFilters.priority,
        scope: state.dispatchFilters.scope,
        onlyActive: state.dispatchFilters.onlyActive ? "1" : "0",
        limit: 80,
        offset: 0
    });

    if (!response.success) {
        showToast(response.message || "Streifenliste konnte nicht geladen werden.", true);
        return;
    }

    state.dispatchLoaded = true;
    state.dispatchList = response.data?.items || [];
    renderDataLists();
    attachListInteractions();
}

let dispatchFilterTimer = null;
function queueDispatchListLoad() {
    window.clearTimeout(dispatchFilterTimer);
    dispatchFilterTimer = window.setTimeout(() => {
        loadDispatchList(true);
    }, 200);
}

async function quickUpdateDispatch(fields) {
    const form = document.getElementById("dispatchForm");
    if (!form) {
        return;
    }

    const payload = { ...serializeForm(form), ...fields };
    const response = await fetchNui("saveDispatch", payload);

    if (!response.success) {
        showToast(response.message || "Speichern fehlgeschlagen.", true);
        return;
    }

    state.data = response.data || state.data;
    await loadDispatchList(true);
    if (response.dispatchId) {
        await openDispatchRecord(response.dispatchId);
    } else if (state.activeDispatchId) {
        await openDispatchRecord(state.activeDispatchId);
    }
    showToast(response.message || "Gespeichert.");
}

function buildNav() {
    navTabs.innerHTML = "";

    tabConfig.forEach((tab) => {
        if (!getPermissions()[tab.read]) {
            return;
        }

        const button = document.createElement("button");
        button.textContent = tab.label;
        button.dataset.tab = tab.key;
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
    if (tabKey === "dispatch") {
        renderDispatchOfficerAdmin();
        loadDispatchList(true);
    }
    if (tabKey === "management") {
        renderManagement();
    }
}

function renderStats() {
    const stats = state.data?.stats || {};
    const cards = [
        { label: "Einheiten online", value: stats.unitsOnline ?? 0 },
        { label: "Aktive Fahndungen", value: stats.activeWarrants ?? 0 },
        { label: "Offene Akten", value: stats.openCases ?? 0 },
        { label: "Offene Tickets", value: stats.openTickets ?? 0 },
        { label: "Aktive Streifen", value: stats.activeDispatch ?? 0 },
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
    if (permissions.dispatchWrite) actions.push({ tab: "dispatch", label: "Neue Streife" });
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
            ${getPermissions().dispatch ? renderPanel("Leitstelle", renderSimpleList(lists.dispatch, (item) => renderDispatchDashboardRecord(item, "dashboard"))) : ""}
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

    document.getElementById("casesList").innerHTML = renderSimpleList(lists.cases, (item) => renderCaseListRecord(item, "cases"));
    renderCaseDetailContainer();

    document.getElementById("ticketsList").innerHTML = renderSimpleList(lists.tickets, (item) => recordTemplate(item, item.person_name, [
        `Betrag: $${item.amount}`,
        `Status: ${item.status}`
    ]));

    document.getElementById("medicalList").innerHTML = renderSimpleList(lists.medical, (item) => recordTemplate(item, item.patient_name, [
        `Diagnose: ${item.diagnosis}`,
        `Status: ${item.status}`,
        `Bearbeitet: ${item.assigned_department}`
    ]));

    const dispatchItems = state.dispatchLoaded ? state.dispatchList : (lists.dispatch || []);
    renderDispatchTable(dispatchItems);
    renderDispatchDetailContainer();
    renderDispatchOfficerAdmin();

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
    const activeCaseId = Number(details.activeCaseId || details.cases?.[0]?.id || 0);
    const activeCase = (details.cases || []).find((entry) => Number(entry.id) === activeCaseId) || null;
    const activeCaseEntries = (details.caseEntries || []).filter((entry) => Number(entry.case_id) === Number(activeCase?.id || 0));
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
    const factionOptions = buildFactionOptions();
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
            ${activeCase ? `
                <div class="detail-box case-detail__person-view">
                    <div class="panel__header">
                        <h2>Geöffnete Akte</h2>
                    </div>
                    ${renderCaseDetailContent(activeCase, activeCaseEntries)}
                </div>
            ` : ""}
            <form id="personImageForm" class="detail-box form-grid">
                <input type="hidden" name="identifier" value="${escapeHtml(person.identifier || "")}">
                <input name="imageUrl" type="text" placeholder="https://... / Bild-URL für dieses Profil" value="${escapeHtml(person.image_url || "")}">
                <button type="submit" class="primary-button">Profilbild speichern</button>
                <button type="button" class="ghost-button" id="clearPersonImageButton">Profilbild entfernen</button>
            </form>
            ${getPermissions().casesWrite ? `
                <form id="personCaseForm" class="detail-box form-grid">
                    <input type="hidden" name="id">
                    <input type="hidden" name="subjectIdentifier" value="${escapeHtml(person.identifier || "")}">
                    <input type="hidden" name="subjectName" value="${escapeHtml(person.full_name || "")}">
                    <textarea name="subjectIdentifiers" class="hidden">${escapeHtml(person.identifier || "")}</textarea>
                    <textarea name="subjectNames" class="hidden">${escapeHtml(person.full_name || "")}</textarea>
                    <input type="hidden" name="paragraphsJson">
                    <select name="caseType">
                        <option value="single">Einzelakte für diese Person</option>
                        <option value="group">Sammelakte / Fraktionsakte</option>
                    </select>
                    <input name="referenceCode" type="text" placeholder="Aktennummer / Referenz">
                    <input name="assignedOfficer" type="text" value="${escapeHtml(state.data?.officer?.name || "")}" placeholder="Sachbearbeiter / Zuständig">
                    <div class="picker-block" data-form-picker="personCaseForm">
                        <div class="picker-block__header">Täter / Beteiligte auswählen</div>
                        <div class="picker-block__search">
                            <input type="text" placeholder="Weitere Person suchen..." data-case-person-search="personCaseForm">
                            <button type="button" class="ghost-button" data-case-person-search-button="personCaseForm">Suchen</button>
                        </div>
                        <div class="picker-block__selected" data-case-person-selected="personCaseForm">
                            <div class="empty">Noch keine Person ausgewählt.</div>
                        </div>
                        <div class="picker-block__results" data-case-person-results="personCaseForm"></div>
                    </div>
                    <div class="form-grid__full hidden" data-group-only="personCaseForm">
                        <select name="factionName" data-faction-select="personCaseForm">
                            ${factionOptions}
                        </select>
                    </div>
                    <label class="toggle-row form-grid__full hidden" data-group-only="personCaseForm">
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
                    <textarea name="summary" placeholder="Kurzbeschreibung / Überschrift"></textarea>
                    <textarea name="seizedItems" placeholder="Abgenommene Gegenstände und Ausweis in einer Nachricht"></textarea>
                    <textarea name="facts" placeholder="Sachverhalt"></textarea>
                    <input name="rightsReadBy" type="text" placeholder="Rechte verlesen von">
                    <input name="witnessName" type="text" placeholder="Zeuge">
                    <textarea name="paragraphSummary" placeholder="Strafbestand / Paragraphen" readonly></textarea>
                    <input name="totalHe" type="number" min="0" placeholder="HE Anzahl">
                    <button type="button" class="ghost-button form-grid__full" data-suggest-penalties="personCaseForm">Paragraphen automatisch ermitteln</button>
                    <textarea name="notes" placeholder="Ausführliche Aktennotiz / Sonstiges"></textarea>
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
            ${details.cases?.length ? renderPanel("Akten", renderSimpleList(details.cases, (item) => renderCaseListRecord(item, "person"))) : ""}
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

function getDispatchTemplateCandidates() {
    return getManagedDispatchTemplates().map((entry) => ({
        id: Number(entry?.id || 0) || "",
        title: String(entry?.title || "").trim(),
        codeValue: String(entry?.codeValue || entry?.code_value || "").trim(),
        unitValue: String(entry?.unitValue || entry?.unit_value || "").trim(),
        location: String(entry?.location || "").trim(),
        incidentCode: String(entry?.incidentCode || entry?.incident_code || "").trim(),
        timestampLabel: String(entry?.timestampLabel || entry?.timestamp_label || "").trim(),
        infoText: String(entry?.infoText || entry?.info_text || "").trim(),
        priority: String(entry?.priority || "").trim(),
        unitCode: String(entry?.unitCode || entry?.unit_code || "").trim(),
        unitType: String(entry?.unitType || entry?.unit_type || "").trim(),
        primaryUnit: String(entry?.primaryUnit || entry?.primary_unit || "").trim(),
        assignedOfficer: String(entry?.assignedOfficer || entry?.assigned_officer || "").trim(),
        unitStatus: String(entry?.unitStatus || entry?.unit_status || "").trim(),
        vehicleLabel: String(entry?.vehicleLabel || entry?.vehicle_label || "").trim(),
        vehiclePlate: String(entry?.vehiclePlate || entry?.vehicle_plate || "").trim(),
        driverOfficerIdentifier: "",
        driverLookup: "",
        driverName: "",
        driverDn: "",
        driverDepartment: "",
        driverRank: "",
        partnerOfficerIdentifier: "",
        partnerLookup: "",
        partnerName: "",
        partnerDn: "",
        partnerDepartment: "",
        partnerRank: "",
        crewNames: "",
        scope: String(entry?.scope || "").trim(),
        status: String(entry?.status || "").trim()
    }));
}

function renderDispatchTemplateResults(items, query) {
    const container = getDispatchTemplateResultsContainer();
    const form = document.getElementById("dispatchForm");
    const anchor = dispatchTemplateActiveField ? form?.elements.namedItem(dispatchTemplateActiveField) : null;
    if (!container) {
        return;
    }

    const needle = normalizeLookupValue(query);
    if (!needle) {
        container.innerHTML = "";
        return;
    }

    if (!items?.length) {
        container.innerHTML = '<div class="empty">Keine Vorlagen gefunden.</div>';
        positionFloatingResults(container, anchor);
        return;
    }

    positionFloatingResults(container, anchor);
    container.innerHTML = items.slice(0, 8).map((entry) => `
        <div class="picker-result" style="flex-direction:column; align-items:stretch;">
            <div class="picker-result__info">
                <div class="record__title">${escapeHtml(entry.title || entry.unitCode || "Vorlage")}</div>
                <div class="record__meta">
                    <div>Code / Unit: ${escapeHtml(entry.codeValue || "-")} | ${escapeHtml(entry.unitValue || "-")}</div>
                    <div>Fahrzeug: ${escapeHtml(entry.vehicleLabel || "-")} ${escapeHtml(entry.vehiclePlate ? `(${entry.vehiclePlate})` : "")}</div>
                </div>
            </div>
            <button type="button" class="primary-button" style="width:100%;" data-dispatch-template-pick="${escapeAttribute(entry)}">Übernehmen</button>
        </div>
    `).join("");
}

function applyDispatchTemplate(template) {
    if (!template) {
        return;
    }

    fillForm("dispatchForm", {
        templateId: template.id || "",
        title: template.title,
        codeValue: template.codeValue,
        unitValue: template.unitValue,
        location: template.location,
        incidentCode: template.incidentCode,
        timestampLabel: template.timestampLabel,
        infoText: template.infoText,
        priority: template.priority,
        unitCode: template.unitCode,
        unitType: template.unitType,
        primaryUnit: template.primaryUnit,
        assignedOfficer: template.assignedOfficer,
        unitStatus: template.unitStatus,
        vehicleLabel: template.vehicleLabel,
        vehiclePlate: template.vehiclePlate,
        driverOfficerIdentifier: template.driverOfficerIdentifier,
        driverLookup: template.driverLookup,
        driverName: template.driverName,
        driverDn: template.driverDn,
        driverDepartment: template.driverDepartment,
        driverRank: template.driverRank,
        partnerOfficerIdentifier: template.partnerOfficerIdentifier,
        partnerLookup: template.partnerLookup,
        partnerName: template.partnerName,
        partnerDn: template.partnerDn,
        partnerDepartment: template.partnerDepartment,
        partnerRank: template.partnerRank,
        crewNames: template.crewNames,
        scope: template.scope,
        status: template.status
    });

    clearDispatchTemplateResults();
    clearDispatchVehicleResults();
    clearDispatchLookupResults("driver");
    clearDispatchLookupResults("partner");
    updateDispatchAutoSummary();
}

function updateDispatchTemplateSearch() {
    const form = document.getElementById("dispatchForm");
    if (!form || !dispatchTemplateActiveField) {
        clearDispatchTemplateResults();
        return;
    }

    const query = String(form.elements.namedItem(dispatchTemplateActiveField)?.value || "").trim();
    const needle = normalizeLookupValue(query);
    if (!needle) {
        clearDispatchTemplateResults();
        return;
    }

    const filtered = getDispatchTemplateCandidates().filter((entry) => normalizeLookupValue([
        entry.title,
        entry.codeValue,
        entry.unitValue,
        entry.location,
        entry.incidentCode,
        entry.timestampLabel,
        entry.infoText,
        entry.unitCode,
        entry.unitType,
        entry.primaryUnit,
        entry.assignedOfficer,
        entry.vehicleLabel,
        entry.vehiclePlate
    ].join(" ")).includes(needle));

    renderDispatchTemplateResults(filtered, query);
    attachListInteractions();
}

function queueDispatchTemplateSearch(fieldName) {
    dispatchTemplateActiveField = fieldName;
    window.clearTimeout(dispatchTemplateTimer);
    dispatchTemplateTimer = window.setTimeout(() => {
        updateDispatchTemplateSearch();
    }, 180);
}

function getDispatchVehicleCandidates() {
    return getDispatchTemplateCandidates().map((entry) => ({
        id: entry.id,
        label: entry.vehicleLabel,
        plate: entry.vehiclePlate,
        title: entry.title,
        unitCode: entry.unitCode
    })).filter((entry) => entry.label || entry.plate || entry.title);
}

function renderDispatchVehicleResults(items, query) {
    const container = getDispatchVehicleResultsContainer();
    const form = document.getElementById("dispatchForm");
    const anchor = form?.elements.namedItem("vehiclePlate");
    if (!container) {
        return;
    }

    const needle = normalizeLookupValue(query);
    if (!needle) {
        container.innerHTML = "";
        return;
    }

    if (!items?.length) {
        container.innerHTML = '<div class="empty">Keine Fahrzeuge gefunden.</div>';
        positionFloatingResults(container, anchor);
        return;
    }

    positionFloatingResults(container, anchor);
    container.innerHTML = items.slice(0, 8).map((entry) => `
        <div class="picker-result" style="flex-direction:column; align-items:stretch;">
            <div class="picker-result__info">
                <div class="record__title">${escapeHtml(entry.title || entry.label || "-")}</div>
                <div class="record__meta">
                    <div>Fahrzeug: ${escapeHtml(entry.label || "-")} | Kennzeichen: ${escapeHtml(entry.plate || "-")}</div>
                    <div>Funkrufname: ${escapeHtml(entry.unitCode || "-")}</div>
                </div>
            </div>
            <button type="button" class="primary-button" style="width:100%;" data-dispatch-vehicle-pick="1" data-template-id="${escapeHtml(entry.id || "")}" data-vehicle-label="${escapeHtml(entry.label || "")}" data-vehicle-plate="${escapeHtml(entry.plate || "")}">Übernehmen</button>
        </div>
    `).join("");
}

function applyDispatchVehicle(label, plate, templateId = "") {
    const template = getDispatchTemplateCandidates().find((entry) => {
        if (templateId && String(entry.id || "") === String(templateId)) {
            return true;
        }
        return String(entry.vehiclePlate || "").trim().toLowerCase() === String(plate || "").trim().toLowerCase()
            || String(entry.vehicleLabel || "").trim().toLowerCase() === String(label || "").trim().toLowerCase();
    });

    if (template) {
        applyDispatchTemplate(template);
        return;
    }

    const form = document.getElementById("dispatchForm");
    if (!form) {
        return;
    }
    const templateField = form.elements.namedItem("templateId");
    const labelField = form.elements.namedItem("vehicleLabel");
    const plateField = form.elements.namedItem("vehiclePlate");
    if (templateField) templateField.value = "";
    if (labelField) labelField.value = String(label || "");
    if (plateField) plateField.value = String(plate || "");
    clearDispatchVehicleResults();
    updateDispatchAutoSummary();
}

function updateDispatchVehicleSearch() {
    const form = document.getElementById("dispatchForm");
    if (!form) {
        return;
    }
    const plateValue = String(form.elements.namedItem("vehiclePlate")?.value || "").trim();
    const query = plateValue;
    const needle = normalizeLookupValue(query);
    if (!needle) {
        clearDispatchVehicleResults();
        return;
    }

    const candidates = getDispatchVehicleCandidates();
    const filtered = candidates.filter((entry) => {
        return normalizeLookupValue(`${entry.label} ${entry.plate}`).includes(needle);
    });
    renderDispatchVehicleResults(filtered, query);
    attachListInteractions();
}

function updateDispatchAutoSummary() {
    const form = document.getElementById("dispatchForm");
    const container = document.getElementById("dispatchAutoSummary");
    if (!form || !container) {
        return;
    }

    const getValue = (name) => String(form.elements.namedItem(name)?.value || "").trim();
    const title = getValue("title");
    const plate = getValue("vehiclePlate");
    const vehicle = getValue("vehicleLabel");
    const unitCode = getValue("unitCode");
    const primaryUnit = getValue("primaryUnit");
    const assignedOfficer = getValue("assignedOfficer");
    const driverName = getValue("driverName");
    const partnerName = getValue("partnerName");

    if (!title && !plate && !vehicle && !unitCode) {
        container.textContent = "Noch keine Vorlage gewählt.";
        return;
    }

    const parts = [
        title ? `Streife: ${title}` : "",
        plate ? `Kennzeichen: ${plate}` : "",
        vehicle ? `Fahrzeug: ${vehicle}` : "",
        unitCode ? `Funkrufname: ${unitCode}` : "",
        primaryUnit ? `Leitstelle: ${primaryUnit}` : "",
        assignedOfficer ? `Crew Lead: ${assignedOfficer}` : "",
        driverName ? `Fahrer: ${driverName}` : "",
        partnerName ? `Partner: ${partnerName}` : ""
    ].filter(Boolean);

    container.textContent = parts.join(" | ");
}

function queueDispatchVehicleSearch() {
    window.clearTimeout(dispatchVehicleTimer);
    dispatchVehicleTimer = window.setTimeout(() => {
        updateDispatchVehicleSearch();
    }, 180);
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
                        factionName: payload.faction_name,
                        title: payload.title,
                        status: payload.status,
                        securityLevel: payload.security_level,
                        releaseState: payload.release_state,
                        summary: payload.summary,
                        seizedItems: payload.seized_items,
                        facts: payload.facts,
                        rightsReadBy: payload.rights_read_by,
                        witnessName: payload.witness_name,
                        paragraphsJson: payload.paragraphs_json,
                        paragraphSummary: formatParagraphSummary(payload.paragraphs_json),
                        totalHe: payload.total_he,
                        notes: payload.notes,
                        closureReason: payload.closure_reason
                    });
                    hydrateCaseSelection("caseForm");
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
                        codeValue: payload.code_value,
                        unitValue: payload.unit_value,
                        location: payload.location,
                        incidentCode: payload.incident_code,
                        timestampLabel: payload.timestamp_label,
                        infoText: payload.info_text,
                        priority: payload.priority,
                        unitCode: payload.unit_code,
                        unitType: payload.unit_type,
                        primaryUnit: payload.primary_unit,
                        assignedOfficer: payload.assigned_officer,
                        unitStatus: payload.unit_status,
                        vehicleLabel: payload.vehicle_label,
                        vehiclePlate: payload.vehicle_plate,
                        crewNames: payload.crew_names,
                        driverOfficerIdentifier: payload.driver_identifier,
                        driverLookup: payload.driver_name || payload.driver_dn,
                        driverName: payload.driver_name,
                        driverDn: payload.driver_dn,
                        driverDepartment: payload.driver_department,
                        driverRank: payload.driver_rank,
                        partnerOfficerIdentifier: payload.partner_identifier,
                        partnerLookup: payload.partner_name || payload.partner_dn,
                        partnerName: payload.partner_name,
                        partnerDn: payload.partner_dn,
                        partnerDepartment: payload.partner_department,
                        partnerRank: payload.partner_rank,
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
            state.personDetails.activeCaseId = state.personDetails?.cases?.[0]?.id || null;
            renderPersonDetails();
            if (state.personDetails.activeCaseId) {
                await openCaseRecord(state.personDetails.activeCaseId, { personContext: true });
            } else {
                attachListInteractions();
            }
        };
    });

    document.querySelectorAll("[data-open-case]").forEach((button) => {
        button.onclick = async () => {
            await openCaseRecord(button.dataset.openCase, {
                personContext: button.dataset.openCaseContext === "person"
            });
        };
    });

    document.querySelectorAll("[data-open-dispatch]").forEach((button) => {
        button.onclick = async () => {
            const shouldSwitch = button.dataset.openDispatchNav === "dispatch";
            await openDispatchRecord(button.dataset.openDispatch, { switchToDispatchTab: shouldSwitch });
        };
    });

    document.querySelectorAll("[data-dispatch-quick]").forEach((button) => {
        button.onclick = async () => {
            const type = button.dataset.dispatchQuick;
            const value = button.dataset.value;
            if (!type || value == null) {
                return;
            }

            if (type === "status") {
                await quickUpdateDispatch({ status: value });
                return;
            }

            if (type === "unitStatus") {
                await quickUpdateDispatch({ unitStatus: value });
            }
        };
    });

    document.querySelectorAll("[data-case-person-search-button]").forEach((button) => {
        button.onclick = () => {
            searchCasePersons(button.dataset.casePersonSearchButton);
        };
    });

    document.querySelectorAll("[data-case-person-search]").forEach((input) => {
        input.oninput = () => {
            queueCasePersonSearch(input.dataset.casePersonSearch);
        };
        input.onkeydown = (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                searchCasePersons(input.dataset.casePersonSearch);
            }
        };
    });

    document.querySelectorAll("[data-case-person-pick]").forEach((button) => {
        button.onclick = () => {
            try {
                addCasePerson(button.dataset.casePersonPick, JSON.parse(button.dataset.personPayload));
            } catch (error) {
                showToast("Person konnte nicht übernommen werden.", true);
            }
        };
    });

    document.querySelectorAll("[data-remove-case-person]").forEach((button) => {
        button.onclick = () => {
            removeCasePerson(button.dataset.removeCasePerson, button.dataset.identifier);
        };
    });

    document.querySelectorAll("[data-dispatch-officer-pick]").forEach((button) => {
        button.onclick = () => {
            const prefix = String(button.dataset.dispatchOfficerPick || "");
            const identifier = String(button.dataset.dispatchOfficerIdentifier || "");
            if (!prefix || !identifier) {
                return;
            }
            const officer = (state.dispatchOfficers || []).find((entry) => String(entry.identifier) === identifier);
            if (officer) {
                applyDispatchOfficer(prefix, officer);
            }
        };
    });

    document.querySelectorAll("[data-dispatch-vehicle-pick]").forEach((button) => {
        button.onclick = () => {
            applyDispatchVehicle(
                button.dataset.vehicleLabel || "",
                button.dataset.vehiclePlate || "",
                button.dataset.templateId || ""
            );
        };
    });

    document.querySelectorAll("[data-dispatch-template-pick]").forEach((button) => {
        button.onclick = () => {
            try {
                applyDispatchTemplate(JSON.parse(button.dataset.dispatchTemplatePick || "{}"));
            } catch (error) {
                showToast("Vorlage konnte nicht übernommen werden.", true);
            }
        };
    });

    document.querySelectorAll("[data-mgmt-template-edit]").forEach((button) => {
        button.onclick = () => {
            try {
                fillForm("dispatchTemplateAdminForm", JSON.parse(button.dataset.mgmtTemplateEdit || "{}"));
            } catch (error) {
                showToast("Vorlage konnte nicht geladen werden.", true);
            }
        };
    });

    document.querySelectorAll("[data-mgmt-template-delete]").forEach((button) => {
        button.onclick = async () => {
            const id = String(button.dataset.mgmtTemplateDelete || "");
            if (!id) {
                return;
            }
            const response = await fetchNui("deleteDispatchTemplate", { id });
            if (!response.success) {
                showToast(response.message || "Streifenvorlage konnte nicht gelöscht werden.", true);
                return;
            }

            state.data = response.data || state.data;
            const form = document.getElementById("dispatchTemplateAdminForm");
            form?.reset();
            renderAll();
            showToast(response.message || "Streifenvorlage gelöscht.");
        };
    });

    document.querySelectorAll('form[id="caseForm"], form[id="personCaseForm"]').forEach((form) => {
        const formId = form.id;
        const caseTypeField = form.elements.namedItem("caseType");
        const factionField = form.elements.namedItem("factionName");

        if (factionField) {
            factionField.innerHTML = buildFactionOptions(factionField.value);
        }

        if (caseTypeField) {
            caseTypeField.onchange = () => {
                updateCaseFormMode(formId);
            };
        }

        bindPenaltyAutoSuggest(formId);
        updateCaseFormMode(formId);
    });

    hydrateCaseSelection("caseForm");
    hydrateCaseSelection("personCaseForm", state.personDetails?.person || null);

    document.querySelectorAll("[data-suggest-penalties]").forEach((button) => {
        button.onclick = () => {
            suggestCasePenalties(button.dataset.suggestPenalties);
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
            syncCaseSelectionToFields("personCaseForm");
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

            setCaseSelection("personCaseForm", [{
                identifier: state.personDetails?.person?.identifier || identifier,
                full_name: state.personDetails?.person?.full_name || personCaseForm.elements.namedItem("subjectName")?.value || identifier,
                image_url: state.personDetails?.person?.image_url || ""
            }]);
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

    const dispatchOfficerAdminSearch = document.getElementById("dispatchOfficerAdminSearch");
    if (dispatchOfficerAdminSearch) {
        dispatchOfficerAdminSearch.oninput = () => {
            renderDispatchOfficerAdmin();
            queueDispatchOfficerAdminSearch();
        };
    }

    document.querySelectorAll("[data-save-officer-service-number]").forEach((button) => {
        button.onclick = async () => {
            const identifier = String(button.dataset.saveOfficerServiceNumber || "");
            const input = Array.from(document.querySelectorAll("[data-officer-service-number]"))
                .find((entry) => String(entry.dataset.officerServiceNumber || "") === identifier);
            const serviceNumber = String(input?.value || "").trim();
            const response = await fetchNui("saveOfficerServiceNumber", { identifier, serviceNumber });

            if (!response.success) {
                showToast(response.message || "Dienstnummer konnte nicht gespeichert werden.", true);
                return;
            }

            const officer = (state.dispatchOfficers || []).find((entry) => String(entry.identifier) === identifier);
            if (officer) {
                officer.dn = serviceNumber;
            }

            const form = document.getElementById("dispatchForm");
            if (form?.elements.namedItem("driverOfficerIdentifier")?.value === identifier && officer) {
                applyDispatchOfficer("driver", officer, { preserveLookup: true });
            }
            if (form?.elements.namedItem("partnerOfficerIdentifier")?.value === identifier && officer) {
                applyDispatchOfficer("partner", officer, { preserveLookup: true });
            }

            renderDispatchOfficerAdmin();
            showToast(response.message || "Dienstnummer gespeichert.");
        };
    });

    document.querySelectorAll("[data-reset-officer-service-number]").forEach((button) => {
        button.onclick = async () => {
            const identifier = String(button.dataset.resetOfficerServiceNumber || "");
            const response = await fetchNui("saveOfficerServiceNumber", { identifier, serviceNumber: "" });

            if (!response.success) {
                showToast(response.message || "Dienstnummer konnte nicht zurückgesetzt werden.", true);
                return;
            }

            const officer = (state.dispatchOfficers || []).find((entry) => String(entry.identifier) === identifier);
            if (officer) {
                officer.dn = "";
            }

            const input = Array.from(document.querySelectorAll("[data-officer-service-number]"))
                .find((entry) => String(entry.dataset.officerServiceNumber || "") === identifier);
            if (input) {
                input.value = "";
            }

            renderDispatchOfficerAdmin();
            showToast(response.message || "Dienstnummer zurückgesetzt.");
        };
    });

    document.querySelectorAll("[data-mgmt-save-service-number]").forEach((button) => {
        button.onclick = async () => {
            const identifier = String(button.dataset.mgmtSaveServiceNumber || "");
            const input = Array.from(document.querySelectorAll("[data-mgmt-officer-service-number]"))
                .find((entry) => String(entry.dataset.mgmtOfficerServiceNumber || "") === identifier);
            const serviceNumber = String(input?.value || "").trim();
            const response = await fetchNui("saveOfficerServiceNumber", { identifier, serviceNumber });

            if (!response.success) {
                showToast(response.message || "Dienstnummer konnte nicht gespeichert werden.", true);
                return;
            }

            const officer = (state.dispatchOfficers || []).find((entry) => String(entry.identifier) === identifier);
            if (officer) {
                officer.dn = serviceNumber;
            }

            renderManagement();
            showToast(response.message || "Dienstnummer gespeichert.");
        };
    });

    document.querySelectorAll("[data-mgmt-reset-service-number]").forEach((button) => {
        button.onclick = async () => {
            const identifier = String(button.dataset.mgmtResetServiceNumber || "");
            const response = await fetchNui("saveOfficerServiceNumber", { identifier, serviceNumber: "" });

            if (!response.success) {
                showToast(response.message || "Dienstnummer konnte nicht zurückgesetzt werden.", true);
                return;
            }

            const officer = (state.dispatchOfficers || []).find((entry) => String(entry.identifier) === identifier);
            if (officer) {
                officer.dn = "";
            }

            const input = Array.from(document.querySelectorAll("[data-mgmt-officer-service-number]"))
                .find((entry) => String(entry.dataset.mgmtOfficerServiceNumber || "") === identifier);
            if (input) {
                input.value = "";
            }

            renderManagement();
            showToast(response.message || "Dienstnummer zurückgesetzt.");
        };
    });
}

async function handleSubmit(formId, endpoint) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (formId === "caseForm") {
            syncCaseSelectionToFields("caseForm");
        }
        const response = await fetchNui(endpoint, serializeForm(form));

        if (!response.success) {
            showToast(response.message || "Speichern fehlgeschlagen.", true);
            return;
        }

        state.data = response.data || state.data;
        if (formId === "dispatchForm") {
            await loadDispatchList(true);
            if (response.dispatchId) {
                await openDispatchRecord(response.dispatchId);
            }
            renderAll();
            showToast(response.message || "Gespeichert.");
            return;
        }

        form.reset();
        if (formId === "caseForm") {
            setCaseSelection("caseForm", []);
            clearCasePickerResults("caseForm");
        }
        renderAll();
        showToast(response.message || "Gespeichert.");
    });
}

function renderOfficer() {
    const officer = state.data?.officer;
    document.getElementById("officerName").textContent = officer?.name || "Unbekannt";
    document.getElementById("officerMeta").textContent = officer ? `${officer.departmentLabel} | ${officer.grade}` : "Keine Berechtigung";
}

function renderManagement() {
    const list = document.getElementById("managementOfficerList");
    const searchField = document.getElementById("managementOfficerSearch");
    if (!list || !searchField) {
        return;
    }

    const canManage = !!getPermissions().management;
    if (!canManage) {
        list.innerHTML = '<div class="empty">Keine Berechtigung.</div>';
        return;
    }

    const query = normalizeLookupValue(searchField.value || "");
    if (!query) {
        list.innerHTML = '<div class="empty">Bitte erst suchen (Name oder Dienstnummer).</div>';
    } else {
        const items = (state.dispatchOfficers || []).filter((entry) => normalizeLookupValue(`${entry.name} ${entry.dn} ${entry.departmentLabel} ${entry.rank} ${entry.identifier}`).includes(query));
        if (!items.length) {
            list.innerHTML = '<div class="empty">Keine Officer für diese Suche gefunden.</div>';
        } else {
            list.innerHTML = items.slice(0, 60).map((entry) => `
                <div class="record">
                    <div class="record__title">${escapeHtml(entry.name || entry.identifier)}</div>
                    <div class="record__meta">
                        <div>Aktuelle DN: ${escapeHtml(entry.dn || "-")}</div>
                        <div>${escapeHtml(entry.departmentLabel || "-")} | ${escapeHtml(entry.rank || "-")}</div>
                    </div>
                    <div class="record__actions">
                        <input type="text" value="${escapeHtml(entry.dn || "")}" placeholder="Dienstnummer" data-mgmt-officer-service-number="${escapeHtml(entry.identifier)}">
                        <button type="button" class="primary-button" data-mgmt-save-service-number="${escapeHtml(entry.identifier)}">Speichern</button>
                        <button type="button" class="ghost-button" data-mgmt-reset-service-number="${escapeHtml(entry.identifier)}">Zurücksetzen</button>
                    </div>
                </div>
            `).join("");
        }
    }
}

function renderDispatchTemplateAdmin() {
    const templateList = document.getElementById("dispatchTemplateAdminList");
    const templateForm = document.getElementById("dispatchTemplateAdminForm");
    const panel = templateForm?.closest(".panel");
    if (!templateList || !templateForm || !panel) {
        return;
    }

    const templates = getDispatchTemplateCandidates();
    const canManage = !!getPermissions().management && !!getPermissions().dispatch;
    panel.classList.toggle("hidden", !canManage);
    if (!canManage) {
        templateList.innerHTML = "";
        templateForm.reset();
        return;
    }

    if (!templates.length) {
        templateList.innerHTML = '<div class="empty">Noch keine Streifenvorlagen hinterlegt.</div>';
        return;
    }

    templateList.innerHTML = templates.map((entry) => `
        <div class="record">
            <div class="record__title">${escapeHtml(entry.title || entry.vehiclePlate || "Vorlage")}</div>
            <div class="record__meta">
                <div>${escapeHtml(entry.vehicleLabel || "-")} | ${escapeHtml(entry.vehiclePlate || "-")}</div>
                <div>${escapeHtml(entry.unitCode || "-")} | ${escapeHtml(entry.location || "-")}</div>
            </div>
            <div class="record__actions">
                <button type="button" class="primary-button" data-mgmt-template-edit="${escapeAttribute(entry)}">Bearbeiten</button>
                <button type="button" class="ghost-button" data-mgmt-template-delete="${escapeHtml(entry.id || "")}">Löschen</button>
            </div>
        </div>
    `).join("");
}

async function loadManagementOfficers(query) {
    const cleaned = String(query || "").trim();
    if (!cleaned) {
        renderManagement();
        attachListInteractions();
        return;
    }
    await loadDispatchOfficers(true, cleaned);
    renderManagement();
    attachListInteractions();
}

function renderAll() {
    renderOfficer();
    buildNav();
    renderDashboard();
    renderDataLists();
    renderLawCatalog();
    renderSearchResults();
    renderPersonDetails();
    renderManagement();
    renderDispatchTemplateAdmin();
    updateDispatchAutoSummary();
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
        state.dispatchLoaded = false;
        state.dispatchOfficersLoaded = false;
        state.dispatchOfficers = [];
        state.dispatchList = [];
        state.activeDispatchId = null;
        state.dispatchDetails = null;
        setUiVisibility(true);
        renderAll();
        loadDispatchList(true);
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

document.getElementById("lawCatalogSearch")?.addEventListener("input", () => {
    renderLawCatalog();
});

document.getElementById("dispatchSearch")?.addEventListener("input", (event) => {
    state.dispatchFilters.query = String(event.target?.value || "");
    queueDispatchListLoad();
});

document.getElementById("dispatchFilterStatus")?.addEventListener("change", (event) => {
    state.dispatchFilters.status = String(event.target?.value || "");
    queueDispatchListLoad();
});

document.getElementById("dispatchFilterPriority")?.addEventListener("change", (event) => {
    state.dispatchFilters.priority = String(event.target?.value || "");
    queueDispatchListLoad();
});

document.getElementById("dispatchFilterScope")?.addEventListener("change", (event) => {
    state.dispatchFilters.scope = String(event.target?.value || "");
    state.dispatchOfficersLoaded = false;
    state.dispatchOfficers = [];
    clearDispatchLookupResults("driver");
    clearDispatchLookupResults("partner");
    renderDispatchOfficerAdmin();
    queueDispatchListLoad();
});

document.getElementById("dispatchFilterActive")?.addEventListener("change", (event) => {
    state.dispatchFilters.onlyActive = !!event.target?.checked;
    queueDispatchListLoad();
});

document.getElementById("dispatchDriverLookup")?.addEventListener("input", () => {
    queueDispatchOfficerLookup("driver");
});

document.getElementById("dispatchDriverLookup")?.addEventListener("blur", () => {
    resolveDispatchOfficer("driver", { useRemote: true });
});

document.getElementById("dispatchDriverLookup")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        resolveDispatchOfficer("driver", { useRemote: true });
    }
});

document.getElementById("dispatchPartnerLookup")?.addEventListener("input", () => {
    queueDispatchOfficerLookup("partner");
});

document.getElementById("dispatchPartnerLookup")?.addEventListener("blur", () => {
    resolveDispatchOfficer("partner", { useRemote: true });
});

document.getElementById("dispatchPartnerLookup")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        resolveDispatchOfficer("partner", { useRemote: true });
    }
});

document.querySelector('#dispatchForm [name="scope"]')?.addEventListener("change", () => {
    state.dispatchOfficersLoaded = false;
    state.dispatchOfficers = [];
    clearDispatchLookupResults("driver");
    clearDispatchLookupResults("partner");
    clearDispatchTemplateResults();
    renderDispatchOfficerAdmin();
});

document.querySelector('#dispatchForm [name="vehiclePlate"]')?.addEventListener("focus", () => {
    dispatchVehicleActiveField = "plate";
});

document.querySelector('#dispatchForm [name="vehiclePlate"]')?.addEventListener("input", () => {
    dispatchVehicleActiveField = "plate";
    const form = document.getElementById("dispatchForm");
    const templateField = form?.elements.namedItem("templateId");
    if (templateField) {
        templateField.value = "";
    }
    updateDispatchAutoSummary();
    queueDispatchVehicleSearch();
});

document.querySelector('#dispatchForm [name="vehiclePlate"]')?.addEventListener("blur", () => {
    window.setTimeout(() => clearDispatchVehicleResults(), 150);
});

document.getElementById("managementOfficerSearch")?.addEventListener("input", (event) => {
    window.clearTimeout(managementOfficerTimer);
    const query = String(event.target?.value || "");
    managementOfficerTimer = window.setTimeout(() => {
        loadManagementOfficers(query);
    }, 220);
});

document.getElementById("dispatchTemplateAdminReset")?.addEventListener("click", () => {
    document.getElementById("dispatchTemplateAdminForm")?.reset();
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
handleSubmit("dispatchTemplateAdminForm", "saveDispatchTemplate");
handleSubmit("calendarForm", "saveCalendar");

if (previewMode) {
    state.open = true;
    state.data = demoData;
    state.searchResults = [];
    state.personDetails = null;
    state.dispatchLoaded = false;
    state.dispatchOfficersLoaded = false;
    state.dispatchOfficers = [];
    state.dispatchList = [];
    state.activeDispatchId = null;
    state.dispatchDetails = null;
    setUiVisibility(true);
    renderAll();
    loadDispatchList(true);
    showToast("Vorschau-Modus aktiv (LunarOS).");
} else {
    setUiVisibility(false);
}
