const root = document.getElementById('app')

const state = {
	mode: 'none',
	open: false,
	view: 'home',
	data: null,
	current: 0,
	answers: [],
	result: null,
	submitting: false,
	hud: {
		show: false,
		checkpoint: 0,
		total: 0,
		speedLimit: 0,
		errors: 0,
		maxErrors: 0,
		timeLeft: 0
	}
}

function esc(s) {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function post(name, payload) {
	return fetch(`https://${GetParentResourceName()}/${name}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json; charset=UTF-8' },
		body: JSON.stringify(payload || {})
	}).then((r) => r.json().catch(() => null))
}

function setBodyActive(active) {
	document.body.classList.toggle('ui-active', !!active)
}

function applyMode() {
	root.className = state.mode
	root.style.display = state.mode === 'none' ? 'none' : state.mode === 'full' ? 'flex' : 'block'
	setBodyActive(state.mode !== 'none')
}

function icon(n) {
	const p = {
		grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
		car: '<path d="M5 11l1.6-4.6A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.4L19 11m-14 0h14M5 11a2 2 0 0 0-2 2v3h2m14-5a2 2 0 0 1 2 2v3h-2M7 16h10M7 16v2m10-2v2"/>',
		book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 3v18"/>',
		close: '<path d="M6 6l12 12M18 6L6 18"/>',
		check: '<path d="M20 6L9 17l-5-5"/>',
		x: '<path d="M18 6L6 18M6 6l12 12"/>'
	}
	return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p[n] || ''}</svg>`
}

function getCurrentSectionLabel() {
	if (state.view === 'practice') return 'Praxis'
	if (state.view === 'stvo') return 'STVO'
	if (state.view === 'quiz') return 'Theorie'
	if (state.view === 'result') return 'Auswertung'
	return 'Übersicht'
}

function headMeta() {
	switch (state.view) {
		case 'quiz':
			return { k: 'Theorieprüfung', t: 'Fragebogen' }
		case 'practice':
			return { k: 'Praktische Fahrt', t: 'Fahrprüfung' }
		case 'stvo':
			return { k: 'Regelwerk', t: 'STVO Kurzfassung' }
		case 'result':
			return { k: 'Auswertung', t: 'Ergebnis' }
		default:
			return { k: 'Führerscheincenter', t: (state.data && state.data.title) || 'Übersicht' }
	}
}

function fmtTime(sec) {
	const s = Math.max(0, Number(sec) || 0)
	const m = Math.floor(s / 60)
	const r = s % 60
	return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function startTheoryFlow() {
	return post('startTheory')
		.then((res) => {
			if (res && res.ok) {
				state.current = 0
				state.answers = new Array(state.data.questions.length).fill(0)
				state.result = null
				setView('quiz')
				return
			}
			state.result = { ok: false, reason: (res && res.reason) || 'noMoneyBank' }
			setView('result')
		})
		.catch(() => {
			state.result = { ok: false, reason: 'error' }
			setView('result')
		})
}

function open(data) {
	state.mode = 'full'
	state.open = true
	state.data = data
	state.view = 'home'
	state.current = 0
	state.answers = new Array((data && data.totalQuestions) || 0).fill(0)
	state.result = null
	state.submitting = false
	applyMode()
	render()
}

function close() {
	state.mode = 'none'
	state.open = false
	state.view = 'home'
	state.data = null
	state.current = 0
	state.answers = []
	state.result = null
	state.submitting = false
	state.hud.show = false
	applyMode()
	render()
}

function setView(view) {
	state.view = view
	render()
}

function setAnswer(idx, val) {
	state.answers[idx] = val
	render()
}

function nextQ() {
	if (!state.data) return
	if (state.current < state.data.questions.length - 1) {
		state.current++
		render()
	}
}

function prevQ() {
	if (state.current > 0) {
		state.current--
		render()
	}
}

function canSubmit() {
	for (let i = 0; i < state.answers.length; i++) {
		if (!state.answers[i]) return false
	}
	return true
}

function submit() {
	if (state.submitting) return
	state.submitting = true
	render()
	post('submitExam', { answers: state.answers }).catch(() => {})
}

function setResult(result) {
	state.submitting = false
	state.result = result
	if (state.data && result && result.theoryPassed === true) {
		state.data.theoryPassed = true
	}
	state.view = 'result'
	render()
}

function setHud(show, data) {
	state.mode = show ? 'hud' : 'none'
	state.open = false
	state.view = 'home'
	state.data = state.data || {}
	state.hud.show = !!show
	if (data) state.hud = { ...state.hud, ...data }
	applyMode()
	render()
}

function renderRail() {
	const homeActive = state.view === 'home' || state.view === 'quiz' || state.view === 'result'
	const title = (state.data && state.data.title) || 'Fahrschule'
	return `
		<aside class="rail">
			<div class="rail-brand">
				<div class="logo">FS</div>
				<div class="rail-brand-txt">
					<span class="rail-title">${esc(title)}</span>
					<span class="rail-sub">Fahrschule</span>
				</div>
			</div>
			<nav class="rail-nav">
				<button class="rail-item ${homeActive ? 'active' : ''}" data-nav="quiz">${icon('grid')}<span>Übersicht</span></button>
				<button class="rail-item ${state.view === 'practice' ? 'active' : ''}" data-nav="practice">${icon('car')}<span>Praxis</span></button>
				<button class="rail-item ${state.view === 'stvo' ? 'active' : ''}" data-nav="stvo">${icon('book')}<span>STVO</span></button>
			</nav>
			<div class="rail-spacer"></div>
			<button class="rail-close" data-action="close">${icon('close')}<span>Schließen</span></button>
		</aside>
	`
}

function renderHome() {
	const data = state.data
	const theoryPassed = !!(data && data.theoryPassed)
	const licenses = (data && data.licenses) || []
	const hasAnyLicense = !!(data && data.hasAnyLicense) || licenses.some((l) => l && l.hasLicense)
	const canPracticeAny = theoryPassed && licenses.some((l) => !l.hasLicense)
	const ownedLicenses = licenses.filter((l) => l && l.hasLicense).length
	const openLicenses = licenses.filter((l) => l && !l.hasLicense).length
	const buttons = licenses
		.map((l) => {
			const can = theoryPassed && !l.hasLicense
			return `<button class="lic" data-action="startPractice" data-license="${esc(l.id)}" ${can ? '' : 'disabled'}>${esc(l.label)}</button>`
		})
		.join('')

	return `
		<div class="view">
			<div class="lead">
				<span class="eyebrow">Prüfungsablauf</span>
				<h2 class="lead-title">${theoryPassed ? 'Wähle deine Führerscheinklasse' : 'Starte mit der Theorieprüfung'}</h2>
				<p class="lead-text">Erst Theorie, dann die praktische Fahrprüfung – anschließend erhältst du die gewünschte Klasse.</p>
			</div>

			<div class="statrow">
				<div class="stat">
					<span class="stat-k">Theorie</span>
					<span class="stat-v"><span class="dot ${theoryPassed ? 'ok' : 'off'}"></span>${theoryPassed ? 'Bestanden' : 'Offen'}</span>
					<span class="stat-note">${theoryPassed ? 'Erfolgreich abgeschlossen' : 'Fragebogen steht noch aus'}</span>
				</div>
				<div class="stat">
					<span class="stat-k">Praxis</span>
					<span class="stat-v"><span class="dot ${theoryPassed ? 'ok' : 'off'}"></span>${theoryPassed ? 'Verfügbar' : 'Gesperrt'}</span>
					<span class="stat-note">${theoryPassed ? 'Fahrprüfung kann starten' : 'Nach bestandener Theorie'}</span>
				</div>
				<div class="stat">
					<span class="stat-k">Klassen</span>
					<span class="stat-v"><span class="dot ${openLicenses ? 'warn' : 'ok'}"></span>${openLicenses} offen</span>
					<span class="stat-note">${ownedLicenses} vorhanden${licenses.length ? ` von ${licenses.length}` : ''}</span>
				</div>
			</div>

			${
				theoryPassed
					? `
			<div class="panel accent">
				<div>
					<span class="eyebrow">Fahrprüfung</span>
					<div class="panel-title" style="margin-top:8px">Klasse auswählen und losfahren</div>
				</div>
				<p class="panel-text">Nur Klassen ohne vorhandenen Führerschein können gestartet werden.</p>
				<div class="chip-row">${buttons || '<div class="empty">Keine Klassen konfiguriert.</div>'}</div>
				${!canPracticeAny ? `<div class="hint">Alle konfigurierten Führerscheine sind bereits vorhanden.</div>` : ''}
			</div>`
					: `
			<div class="panel accent">
				<div>
					<span class="eyebrow">Nächster Schritt</span>
					<div class="panel-title" style="margin-top:8px">Theorieprüfung starten</div>
				</div>
				<p class="panel-text">Beantworte den Fragebogen vollständig. Danach wird die Fahrprüfung automatisch freigeschaltet.</p>
				<div class="steps">
					<div class="step"><span class="step-n">1</span>Alle Fragen beantworten und gesammelt abgeben</div>
					<div class="step"><span class="step-n">2</span>Praxis wird nach bestandener Theorie freigeschaltet</div>
					<div class="step"><span class="step-n">3</span>Gewünschte Führerscheinklasse auswählen</div>
				</div>
				<div class="actions">
					<button class="btn primary" data-action="startQuiz" ${hasAnyLicense ? 'disabled' : ''}>Theorie starten</button>
					<button class="btn ghost" data-action="openStvo">STVO lesen</button>
				</div>
				${hasAnyLicense ? `<div class="hint">Mindestens eine Klasse ist bereits vorhanden.</div>` : ''}
			</div>`
			}
		</div>
	`
}

function renderPractice() {
	const data = state.data
	const theoryPassed = !!(data && data.theoryPassed)
	const practice = data && data.practice ? data.practice : { maxDurationSec: 300, maxErrors: 3 }
	const licenses = (data && data.licenses) || []
	const buttons = licenses
		.map((l) => {
			const can = theoryPassed && !l.hasLicense
			return `<button class="lic" data-action="startPractice" data-license="${esc(l.id)}" ${can ? '' : 'disabled'}>${esc(l.label)}</button>`
		})
		.join('')

	return `
		<div class="view">
			<div class="lead">
				<span class="eyebrow">Ablauf</span>
				<h2 class="lead-title">Fahre die Route sauber ab</h2>
				<p class="lead-text">Halte die Geschwindigkeitsvorgaben ein und sammle nicht zu viele Fehlerpunkte.</p>
			</div>

			<div class="statrow">
				<div class="stat">
					<span class="stat-k">Dauer</span>
					<span class="stat-v">${esc(practice.maxDurationSec)}s</span>
					<span class="stat-note">Maximale Zeit für die Route</span>
				</div>
				<div class="stat">
					<span class="stat-k">Max. Fehler</span>
					<span class="stat-v">${esc(practice.maxErrors)} Punkte</span>
					<span class="stat-note">Mehr Fehler führen zum Abbruch</span>
				</div>
				<div class="stat">
					<span class="stat-k">Status</span>
					<span class="stat-v"><span class="dot ${theoryPassed ? 'ok' : 'off'}"></span>${theoryPassed ? 'Frei' : 'Gesperrt'}</span>
					<span class="stat-note">${theoryPassed ? 'Du kannst eine Klasse starten' : 'Erst die Theorie bestehen'}</span>
				</div>
			</div>

			<div class="grid-2">
				<div class="panel">
					<span class="eyebrow">So läuft es ab</span>
					<div class="steps">
						<div class="step"><span class="step-n">1</span>Checkpoint für Checkpoint sauber abfahren</div>
						<div class="step"><span class="step-n">2</span>Tempolimit und Vorfahrt beachten</div>
						<div class="step"><span class="step-n">3</span>Fehlerpunkte möglichst vermeiden</div>
					</div>
					<div class="actions">
						<button class="btn ghost" data-action="openStvo">STVO lesen</button>
						<button class="btn ghost" data-action="backHome">Zurück</button>
					</div>
				</div>
				<div class="panel accent">
					<span class="eyebrow">Klassenwahl</span>
					<div class="panel-title">Fahrprüfung starten</div>
					<p class="panel-text">Nur Klassen ohne vorhandenen Führerschein können gestartet werden.</p>
					<div class="chip-row">${buttons || '<div class="empty">Keine Klassen konfiguriert.</div>'}</div>
					${!theoryPassed ? `<div class="hint">Du musst zuerst die Theorieprüfung bestehen.</div>` : ''}
				</div>
			</div>
		</div>
	`
}

function renderQuiz() {
	const data = state.data
	const q = data.questions[state.current]
	const picked = state.answers[state.current]
	const progress = Math.round(((state.current + 1) / data.questions.length) * 100)

	const opts = q.answers
		.map((a, idx) => {
			const v = idx + 1
			const active = picked === v ? 'active' : ''
			const key = String.fromCharCode(65 + idx)
			return `<div class="opt ${active}" data-opt="${v}"><span class="opt-key">${esc(key)}</span><span class="opt-text">${esc(a)}</span></div>`
		})
		.join('')

	const submitDisabled = !canSubmit() || state.submitting

	return `
		<div class="view quiz">
			<div class="progress">
				<div class="progress-top">
					<span>Frage ${esc(state.current + 1)} / ${esc(data.questions.length)}</span>
					<span>${esc(progress)}%</span>
				</div>
				<div class="bar"><div style="width:${esc(progress)}%"></div></div>
			</div>

			<div class="question">${esc(q.question)}</div>

			<div class="answers">${opts}</div>

			<div class="actions">
				<button class="btn ghost" data-action="prev" ${state.current === 0 ? 'disabled' : ''}>Zurück</button>
				<button class="btn ghost" data-action="next" ${state.current === data.questions.length - 1 ? 'disabled' : ''}>Weiter</button>
				<button class="btn primary" data-action="submit" ${submitDisabled ? 'disabled' : ''}>Abgeben</button>
			</div>

			${state.submitting ? `<div class="hint">Auswertung läuft ...</div>` : ''}
		</div>
	`
}

function renderStvo() {
	const stvo = (state.data && state.data.stvo) || []
	const cards = stvo.length
		? stvo
				.map((s, index) => {
					const ps = (s.paragraphs || []).map((p) => `<div class="rule-p">${esc(p)}</div>`).join('')
					return `<div class="rule"><div class="rule-n">${esc(String(index + 1).padStart(2, '0'))}</div><div class="rule-body"><div class="rule-title">${esc(s.title)}</div>${ps}</div></div>`
				})
				.join('')
		: '<div class="empty">Aktuell wurden keine STVO-Punkte übergeben.</div>'

	return `
		<div class="view">
			<div class="lead">
				<span class="eyebrow">Merke</span>
				<h2 class="lead-title">Schilder und Verkehrslage gehen immer vor</h2>
				<p class="lead-text">Diese Übersicht hilft beim Lernen, ersetzt aber keine aufmerksame Fahrt im Straßenverkehr.</p>
			</div>
			<div class="rules">${cards}</div>
			<div class="actions">
				<button class="btn ghost" data-action="backHome">Zurück</button>
			</div>
		</div>
	`
}

function renderResult() {
	const r = state.result || {}
	if (!r.ok) {
		let msg = 'Fehler.'
		if (r.reason === 'noMoneyBank') msg = 'Du hast nicht genug Geld auf der Bank.'
		if (r.reason === 'notPaid') msg = 'Bitte starte die Theorieprüfung zuerst.'
		if (r.reason === 'alreadyPassed') msg = 'Du hast die Theorie bereits bestanden.'
		if (r.reason === 'hasLicense') msg = 'Du hast bereits einen Führerschein.'
		if (r.reason === 'invalidCount') msg = 'Ungültige Antworten.'
		if (r.reason === 'error') msg = 'Unerwarteter Fehler.'
		return `
			<div class="view">
				<div class="result bad">
					<div class="result-badge">${icon('x')}</div>
					<div>
						<div class="result-title">Aktion fehlgeschlagen</div>
						<div class="result-copy">${esc(msg)}</div>
					</div>
				</div>
				<div class="actions">
					<button class="btn ghost" data-action="backHome">Zurück</button>
				</div>
			</div>
		`
	}

	const passed = !!r.passed
	const licenses = (state.data && state.data.licenses) || []
	const buttons = licenses
		.map((l) => {
			const can = passed && !l.hasLicense
			return `<button class="lic" data-action="startPractice" data-license="${esc(l.id)}" ${can ? '' : 'disabled'}>${esc(l.label)}</button>`
		})
		.join('')

	return `
		<div class="view">
			<div class="result ${passed ? 'ok' : 'bad'}">
				<div class="result-badge">${icon(passed ? 'check' : 'x')}</div>
				<div>
					<div class="result-title">${passed ? 'Bestanden' : 'Nicht bestanden'}</div>
					<div class="result-copy">${passed ? 'Die Theorie wurde erfolgreich abgeschlossen. Die praktische Prüfung ist jetzt verfügbar.' : 'Die Theorie muss erneut bestanden werden, bevor eine praktische Fahrt möglich ist.'}</div>
				</div>
			</div>

			<div class="panel ${passed ? 'accent' : ''}">
				<span class="eyebrow">${passed ? 'Klassen' : 'Nächster Schritt'}</span>
				<div class="panel-title">${passed ? 'Verfügbare Fahrprüfungen' : 'Vorbereitung'}</div>
				<p class="panel-text">${passed ? 'Starte direkt die gewünschte praktische Fahrprüfung.' : 'Lies die STVO noch einmal oder beginne die Theorie erneut.'}</p>
				${
					passed
						? `<div class="chip-row">${buttons || '<div class="empty">Keine Klassen konfiguriert.</div>'}</div>`
						: `<div class="actions"><button class="btn primary" data-action="retry">Theorie erneut</button><button class="btn ghost" data-action="openStvo">STVO lesen</button></div>`
				}
			</div>

			<div class="actions">
				<button class="btn ghost" data-action="backHome">Zurück</button>
			</div>
		</div>
	`
}

function render() {
	if (state.mode === 'hud') {
		if (!state.hud.show) {
			root.innerHTML = ''
			return
		}
		const bad = (state.hud.errors || 0) >= (state.hud.maxErrors || 999)
		root.innerHTML = `
			<div class="hudbox">
				<div class="hudhead">
					<div>
						<span class="eyebrow">Live Run</span>
						<div class="hudtitle">Fahrprüfung</div>
					</div>
					<div class="hudpill ${bad ? 'bad' : 'good'}">${bad ? 'Kritisch' : 'Stabil'}</div>
				</div>
				<div class="hudgrid">
					<div class="hudstat">
						<span class="hudlabel">Checkpoint</span>
						<span class="hudvalue">${esc(state.hud.checkpoint)} / ${esc(state.hud.total)}</span>
					</div>
					<div class="hudstat">
						<span class="hudlabel">Tempolimit</span>
						<span class="hudvalue">${esc(state.hud.speedLimit)} km/h</span>
					</div>
					<div class="hudstat">
						<span class="hudlabel">Fehler</span>
						<span class="hudvalue">${esc(state.hud.errors)} / ${esc(state.hud.maxErrors)}</span>
					</div>
					<div class="hudstat">
						<span class="hudlabel">Zeit</span>
						<span class="hudvalue">${esc(fmtTime(state.hud.timeLeft))}</span>
					</div>
				</div>
			</div>
		`
		return
	}

	if (!state.open || !state.data) {
		root.innerHTML = ''
		return
	}

	const meta = headMeta()

	let main = ''
	if (state.view === 'home') main = renderHome()
	else if (state.view === 'quiz') main = renderQuiz()
	else if (state.view === 'practice') main = renderPractice()
	else if (state.view === 'stvo') main = renderStvo()
	else if (state.view === 'result') main = renderResult()
	else main = renderHome()

	root.innerHTML = `
		<div class="shell">
			${renderRail()}
			<section class="stage">
				<header class="stage-head">
					<div>
						<span class="eyebrow">${esc(meta.k)}</span>
						<h1 class="stage-title">${esc(meta.t)}</h1>
					</div>
					<span class="chip">${esc(getCurrentSectionLabel())}</span>
				</header>
				<div class="stage-body">${main}</div>
			</section>
		</div>
	`

	root.querySelectorAll('[data-action]').forEach((el) => {
		el.addEventListener('click', () => {
			const a = el.getAttribute('data-action')
			if (a === 'close') post('close').catch(() => {})
			if (a === 'startQuiz') startTheoryFlow()
			if (a === 'openStvo') setView('stvo')
			if (a === 'backHome') setView('home')
			if (a === 'prev') prevQ()
			if (a === 'next') nextQ()
			if (a === 'submit') submit()
			if (a === 'startPractice') post('startPractice', { licenseId: el.getAttribute('data-license') }).catch(() => {})
			if (a === 'retry') startTheoryFlow()
		})
	})

	root.querySelectorAll('[data-nav]').forEach((el) => {
		el.addEventListener('click', () => {
			const nav = el.getAttribute('data-nav')
			if (nav === 'stvo') setView('stvo')
			if (nav === 'quiz') setView(state.view === 'quiz' || state.view === 'result' ? state.view : 'home')
			if (nav === 'practice') setView('practice')
		})
	})

	root.querySelectorAll('[data-opt]').forEach((el) => {
		el.addEventListener('click', () => {
			const v = Number(el.getAttribute('data-opt'))
			setAnswer(state.current, v)
		})
	})
}

window.addEventListener('message', (event) => {
	const msg = event.data || {}
	if (msg.action === 'open') open(msg.data)
	if (msg.action === 'close') close()
	if (msg.action === 'result') setResult(msg.result)
	if (msg.action === 'setMode') {
		state.mode = msg.mode || 'none'
		applyMode()
		render()
	}
	if (msg.action === 'practiceHud') {
		if (msg.show) setHud(true, msg.data || {})
		else setHud(false)
	}
})

window.addEventListener('keydown', (e) => {
	if (state.mode !== 'full' || !state.open) return
	if (e.key === 'Escape') {
		post('close').catch(() => {})
	}
})
