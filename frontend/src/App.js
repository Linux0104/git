import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Type,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "@/components/ui/sonner";
import "@/App.css";

const FILES = [
  { name: "index.html", path: "/garage/index.html", label: "Struktur" },
  { name: "style.css", path: "/garage/style.css", label: "Design" },
  { name: "script.js", path: "/garage/script.js", label: "Logik" },
  { name: "fonts.css", path: "/garage/fonts.css", label: "Typografie" },
];

const IMPROVEMENTS = [
  {
    icon: Palette,
    title: "Neue Farbwelt",
    text: "Cyan-Electric (#5EE9FF) + Violet-Plasma (#8A6BFF) statt flachem Blau. Mehr Tiefe, mehr Charakter.",
  },
  {
    icon: Layers,
    title: "Echtes Glass-Panel",
    text: "Saubere Glasmorphie mit Backdrop-Blur, feinem Border-Gradient und cinematischen Shadows.",
  },
  {
    icon: Type,
    title: "Klare Hierarchie",
    text: "BebasNeue-Display für Titel, Gilroy für Body, JetBrains Mono für Codes/Kennzeichen.",
  },
  {
    icon: Sparkles,
    title: "Smooth Micro-Interaktionen",
    text: "Hover-Lift, animierter Status-Puls, weiche Gradienten-Border beim Fokus.",
  },
  {
    icon: Search,
    title: "Bessere UX-Signale",
    text: "Aktiver Tab mit Underline, Fokus-Ring auf Inputs, kbd-Hints für ESC / Enter.",
  },
  {
    icon: ShieldCheck,
    title: "Kompatibel",
    text: "Original NUI-Message-Protokoll bleibt: open, close, toggleFavourite, renameVehicle, storeVehicle, spawnVehicle.",
  },
];

const CHANGE_LOG = [
  "Neuer Header mit Brand-Mark (Auto-Icon), Search-Fokus-Ring und Tab-Group",
  "Fahrzeugkarten: gradient border on hover, weicher lift, glow-plate unter dem Auto",
  "Status-LEDs mit Puls-Animation (parkend / ausgeparkt / impound)",
  "Fußzeile mit Live-Statistiken und Tastatur-Shortcuts (ESC, ↩)",
  "Rename-Modal als echtes Overlay mit Blur-Backdrop und Gradient-Border",
  "Web-Preview: läuft ohne FiveM mit Demo-Daten (12 Fahrzeuge)",
  "Fallback-Fonts via Google Fonts, damit die UI auch außerhalb von FiveM strahlt",
];

function CopyBtn({ text, testid }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      data-testid={testid}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast("Kopiert", { description: text });
        setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Kopiert" : "Kopieren"}
    </button>
  );
}

function Home() {
  useEffect(() => {
    document.title = "Lunar Garage · FiveM UI Redesign";
  }, []);

  const handleOpenPreview = () =>
    window.open("/garage/index.html", "_blank", "noopener,noreferrer");

  return (
    <main
      className="min-h-screen bg-[#05070d] text-white"
      data-testid="landing-root"
    >
      <Toaster />

      {/* ambient background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 800px at 10% 0%, rgba(94,233,255,0.10), transparent 60%), radial-gradient(900px 700px at 90% 100%, rgba(138,107,255,0.12), transparent 60%), radial-gradient(1400px 800px at 50% 50%, rgba(94,233,255,0.03), transparent 70%), linear-gradient(180deg, #05070d 0%, #070a14 55%, #05070d 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,190,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,190,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl"
        data-testid="site-header"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-lg"
              style={{
                background:
                  "conic-gradient(from 210deg at 50% 50%, #5EE9FF, #8A6BFF, #5EE9FF)",
                boxShadow: "0 0 20px rgba(94,233,255,0.35)",
              }}
            >
              <div className="grid h-7 w-7 place-items-center rounded-md bg-[#0a0f1e] text-cyan-300">
                <Star className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/80">
                FiveM · NUI Redesign
              </p>
              <h1 className="font-mono text-lg tracking-[0.18em] text-white">
                LUNAR&nbsp;GARAGE
              </h1>
            </div>
          </div>
          <nav
            className="hidden items-center gap-8 md:flex"
            data-testid="desktop-nav"
          >
            {[
              { l: "Preview", h: "#preview" },
              { l: "Verbesserungen", h: "#improvements" },
              { l: "Dateien", h: "#files" },
              { l: "Integration", h: "#integration" },
            ].map((i) => (
              <a
                key={i.l}
                href={i.h}
                className="text-sm text-zinc-400 transition hover:text-white"
                data-testid={`nav-${i.l.toLowerCase()}`}
              >
                {i.l}
              </a>
            ))}
          </nav>
          <Button
            onClick={handleOpenPreview}
            className="bg-gradient-to-r from-cyan-400 to-violet-500 text-[#05070d] hover:brightness-110"
            data-testid="header-open-preview"
          >
            Live Preview <ExternalLink className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28"
        data-testid="hero"
      >
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <Badge
              className="mb-6 border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-300"
              data-testid="hero-badge"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Beautified FiveM Garage
            </Badge>
            <h2
              className="font-mono text-5xl leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-7xl"
              data-testid="hero-title"
            >
              Dein FiveM UI —{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #fff 0%, #5EE9FF 55%, #B18BFF 100%)",
                }}
              >
                jetzt cinematic.
              </span>
            </h2>
            <p
              className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg"
              data-testid="hero-copy"
            >
              Das originale Garage-NUI komplett überarbeitet: sauberes
              Glass-Panel, animierte Status-LEDs, cyan-violette Farbwelt und
              feine Micro-Interaktionen — 100% kompatibel zum bestehenden
              Message-Protokoll.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={handleOpenPreview}
                className="bg-gradient-to-r from-cyan-400 to-violet-500 text-[#05070d] hover:brightness-110"
                data-testid="hero-preview-btn"
              >
                UI ansehen <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <a
                href="#files"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-cyan-400/40 hover:text-white"
                data-testid="hero-download-btn"
              >
                <Download className="h-4 w-4" /> Dateien herunterladen
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4" data-testid="hero-stats">
              {[
                { k: "1 Design-System", v: "Cyan × Violet" },
                { k: "12 Demo-Autos", v: "Web-Preview inkl." },
                { k: "100% Kompatibel", v: "NUI-API bleibt" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {s.k}
                  </p>
                  <p className="mt-1 font-mono text-sm text-white">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Small preview card */}
          <Card
            className="overflow-hidden border-white/10 bg-white/[0.03] backdrop-blur-xl"
            data-testid="hero-preview-card"
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70"></span>
                  <p className="ml-2 font-mono text-xs text-zinc-400">
                    lunar-garage.html
                  </p>
                </div>
                <button
                  onClick={handleOpenPreview}
                  className="text-xs text-cyan-300 hover:text-white"
                  data-testid="hero-open-fullscreen"
                >
                  Vollbild ↗
                </button>
              </div>
              <div className="relative aspect-[16/10] bg-black">
                <iframe
                  src="/garage/index.html"
                  title="Lunar Garage Preview"
                  className="h-full w-full"
                  data-testid="hero-iframe"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Big Preview */}
      <section
        id="preview"
        className="mx-auto max-w-7xl px-6 pb-20"
        data-testid="preview-section"
      >
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
              Live Preview
            </p>
            <h3 className="mt-2 font-mono text-3xl tracking-tight sm:text-4xl">
              Die neue Garage im Original-Format
            </h3>
          </div>
          <Button
            onClick={handleOpenPreview}
            variant="outline"
            className="hidden border-white/15 bg-white/5 text-white hover:bg-white/10 md:inline-flex"
            data-testid="preview-open-btn"
          >
            In neuem Tab <ExternalLink className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div
          className="overflow-hidden rounded-2xl border border-white/10"
          style={{
            boxShadow:
              "0 30px 60px -20px rgba(0,0,0,0.7), 0 0 60px rgba(94,233,255,0.08)",
          }}
        >
          <div className="relative aspect-[16/9] bg-black">
            <iframe
              src="/garage/index.html"
              title="Lunar Garage Full Preview"
              className="h-full w-full"
              data-testid="main-iframe"
            />
          </div>
        </div>
      </section>

      {/* Improvements */}
      <section
        id="improvements"
        className="mx-auto max-w-7xl px-6 pb-20"
        data-testid="improvements-section"
      >
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
            Was neu ist
          </p>
          <h3 className="mt-2 font-mono text-3xl tracking-tight sm:text-4xl">
            6 gezielte Upgrades. Kein Feature-Bloat.
          </h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {IMPROVEMENTS.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                className="group border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.05]"
                data-testid={`improvement-${i}`}
              >
                <CardContent className="p-6">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 transition group-hover:border-cyan-400/50"
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-5 font-mono text-lg tracking-tight text-white">
                    {f.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {f.text}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-10 border-white/10 bg-white/[0.03]" data-testid="changelog-card">
          <CardContent className="p-6 md:p-8">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#5EE9FF]" />
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-400">
                Changelog
              </p>
            </div>
            <ul className="grid gap-2 md:grid-cols-2">
              {CHANGE_LOG.map((c, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-zinc-300"
                  data-testid={`changelog-${i}`}
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Files */}
      <section
        id="files"
        className="mx-auto max-w-7xl px-6 pb-20"
        data-testid="files-section"
      >
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
            Deine Dateien
          </p>
          <h3 className="mt-2 font-mono text-3xl tracking-tight sm:text-4xl">
            Drop-in Ersatz für dein NUI-Resource
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Ersetze die vier Dateien in deinem FiveM-Resource-Ordner
            (<code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-cyan-300">html/</code>).
            Die JS-Logik verwendet exakt die gleichen NUI-Endpoints wie deine Originalversion.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {FILES.map((f) => (
            <Card
              key={f.name}
              className="border-white/10 bg-white/[0.03]"
              data-testid={`file-card-${f.name}`}
            >
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-black/40">
                    <span className="font-mono text-[10px] text-cyan-300">
                      {f.name.split(".").pop().toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-sm text-white">{f.name}</p>
                    <p className="text-xs text-zinc-500">{f.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CopyBtn text={window.location.origin + f.path} testid={`copy-${f.name}`} />
                  <a
                    href={f.path}
                    download={f.name}
                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200 transition hover:bg-cyan-400/20 hover:text-white"
                    data-testid={`download-${f.name}`}
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Integration */}
      <section
        id="integration"
        className="mx-auto max-w-7xl px-6 pb-24"
        data-testid="integration-section"
      >
        <Card className="overflow-hidden border-white/10 bg-white/[0.03]">
          <CardContent className="p-6 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
                  Integration
                </p>
                <h3 className="mt-2 font-mono text-3xl tracking-tight">
                  So baust du es ein
                </h3>
                <ol className="mt-6 space-y-4 text-sm text-zinc-300">
                  {[
                    "Lade die 4 Dateien herunter (index.html, style.css, script.js, fonts.css).",
                    "Ersetze sie im html-Ordner deines Garage-Resources.",
                    "Falls du eigene Fonts hast: lege sie unter assets/fonts/ ab (Namen bleiben identisch).",
                    "Sende wie gewohnt { action: 'open', vehicles: [...] } vom Client-Script.",
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-cyan-400/30 bg-cyan-400/10 font-mono text-xs text-cyan-200">
                        {i + 1}
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-8 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
                    Kompatibel bleibt
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    Alle NUI-POSTs (
                    <code className="font-mono text-cyan-200">close</code>,{" "}
                    <code className="font-mono text-cyan-200">
                      toggleFavourite
                    </code>
                    ,{" "}
                    <code className="font-mono text-cyan-200">renameVehicle</code>
                    ,{" "}
                    <code className="font-mono text-cyan-200">storeVehicle</code>
                    ,{" "}
                    <code className="font-mono text-cyan-200">spawnVehicle</code>
                    ) sind unverändert.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-zinc-400">
                  Beispiel · Client-Side
                </p>
                <pre
                  className="overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-5 font-mono text-[12px] leading-relaxed text-zinc-300"
                  data-testid="integration-code"
                >
{`SendNUIMessage({
  action = "open",
  context = "garage",         -- "garage" | "impound"
  title = "Garage",
  subtitle = "Lunar",
  vehicles = {
    { plate="LN-9F1X", label="Mitsubishi Evo X",
      category="Sport", stored=true, active=false, isFav=true },
    { plate="AU-R8V0", label="Audi R8 V10",
      category="Super", stored=false, active=true, isFav=true },
  }
})`}
                </pre>
                <div className="mt-4 flex items-center gap-2">
                  <CopyBtn
                    text={`SendNUIMessage({ action = "open", context = "garage", vehicles = { { plate="LN-9F1X", label="Mitsubishi Evo X", stored=true, active=false } } })`}
                    testid="copy-integration-code"
                  />
                  <span className="text-xs text-zinc-500">Lua Snippet</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer
        className="border-t border-white/10 bg-black/40"
        data-testid="site-footer"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-lg tracking-[0.18em]">LUNAR GARAGE</p>
            <p className="text-xs text-zinc-500">
              FiveM UI Redesign · Cyan × Violet
            </p>
          </div>
          <Button
            onClick={handleOpenPreview}
            className="bg-gradient-to-r from-cyan-400 to-violet-500 text-[#05070d] hover:brightness-110"
            data-testid="footer-cta"
          >
            <Zap className="mr-1 h-4 w-4" /> UI im Vollbild öffnen
          </Button>
        </div>
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
