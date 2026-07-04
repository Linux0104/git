import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ArrowRight, ChevronRight, Clock3, CloudMoon, Crown, MapPinned, Menu, MessageSquareText, ShieldCheck, Sparkles, Users2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster, toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "@/App.css";

const highlights = [
  { label: "Live Server", value: "24/7", note: "Stabil, schnell, bereit" },
  { label: "Aktive Spieler", value: "128+", note: "Starke Community" },
  { label: "Custom Systems", value: "12", note: "Jobs, Cars, RP" },
];

const features = [
  { icon: ShieldCheck, title: "Sicheres RP", text: "Moderation, Anti-Cheat und klare Regeln halten das Erlebnis sauber." },
  { icon: Sparkles, title: "Premium Feeling", text: "Dunkles Cinatic-Design mit Neon-Akzenten und hochwertiger Typo." },
  { icon: MapPinned, title: "Eigene City", text: "Stadtleben, Fraktionen, Immobilien und Events in einer starken Welt." },
  { icon: Users2, title: "Community First", text: "Events, Feedback und Teamarbeit stehen im Zentrum des Servers." },
];

const agenda = [
  { time: "20:00", title: "Server Opening", text: "Einlass, kurze Ansprache, direkte Action." },
  { time: "20:30", title: "City Tour", text: "Fraktionen, Jobs und Einstieg für neue Spieler." },
  { time: "21:15", title: "Car Meet", text: "Showcars, Meetups und Content für Screenshots." },
  { time: "22:00", title: "Heist Night", text: "Große Missionen und Teamplay mit Belohnungen." },
];

const galleryTabs = [
  { value: "cars", label: "Cars" },
  { value: "city", label: "City" },
  { value: "community", label: "Community" },
];

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "FiveM Elite Landing";
  }, []);

  const handleJoin = () => toast("Server-CTA angeklickt", { description: "Hier kannst du später Discord, IP oder Whitelist verlinken." });

  const stats = useMemo(() => highlights, []);

  return (
    <main className="min-h-screen bg-[var(--fivem-bg)] text-white" data-testid="landing-page-root">
      <Toaster />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-xl" data-testid="site-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#FF3B30]">FiveM Server</p>
            <h1 className="font-display text-2xl tracking-[0.2em] uppercase">Night Shift RP</h1>
          </div>
          <nav className="hidden items-center gap-6 md:flex" data-testid="desktop-nav">
            {['Features', 'Agenda', 'Gallery'].map((item) => <a key={item} className="text-sm text-zinc-300 transition hover:text-white" href={`#${item.toLowerCase()}`} data-testid={`nav-${item.toLowerCase()}`}>{item}</a>)}
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden border-white/15 bg-white/5 text-white hover:bg-white/10 md:inline-flex" data-testid="header-discord-btn" onClick={handleJoin}><MessageSquareText className="h-4 w-4" /> Discord</Button>
            <Button size="icon" variant="outline" className="border-white/10 bg-white/5 text-white md:hidden" data-testid="mobile-menu-btn" onClick={() => setMenuOpen((v) => !v)}><Menu className="h-4 w-4" /></Button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-white/10 bg-black/80 px-4 py-4 md:hidden" data-testid="mobile-menu"><div className="flex flex-col gap-3">{['Features', 'Agenda', 'Gallery'].map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-zinc-300" data-testid={`mobile-nav-${item.toLowerCase()}`}>{item}</a>)}</div></div>}
      </header>

      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/27703377/pexels-photo-27703377.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=1600')] bg-cover bg-center opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/25" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div className="max-w-3xl">
            <Badge className="mb-5 border border-[#FF3B30]/30 bg-[#FF3B30]/10 px-3 py-1 text-[#FF7A72]" data-testid="hero-badge"><CloudMoon className="mr-2 h-3.5 w-3.5" /> Night roleplay experience</Badge>
            <h2 className="font-display text-5xl uppercase tracking-tight sm:text-6xl lg:text-7xl" data-testid="hero-title">FIVE M UI<br />MIT STYLE</h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg" data-testid="hero-copy">Ein edles, dunkles FiveM-Landing-Layout mit Neon-Kante, starker Hierarchie und echter Server-Atmosphäre.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button className="bg-[#FF3B30] text-white hover:bg-[#D63028]" data-testid="hero-join-btn" onClick={handleJoin}>Jetzt beitreten <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" data-testid="hero-learn-btn" onClick={handleJoin}>Mehr sehen <ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3" data-testid="hero-stats-grid">{stats.map((item) => <Card key={item.label} className="border-white/10 bg-white/5 backdrop-blur-xl"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{item.label}</p><p className="mt-2 font-display text-3xl uppercase">{item.value}</p><p className="mt-1 text-sm text-zinc-400">{item.note}</p></CardContent></Card>)}</div>
          </div>

          <Card className="border-white/10 bg-white/8 backdrop-blur-xl" data-testid="hero-side-card">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div><p className="text-xs uppercase tracking-[0.2em] text-[#FF3B30]">Command Panel</p><h3 className="mt-2 font-display text-3xl uppercase">Server Status</h3></div>
                <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Online</div>
              </div>
              <div className="mt-6 space-y-4">
                {[{ label: 'Ping', value: '18ms' }, { label: 'Whitelist', value: 'Open' }, { label: 'Events', value: 'Tonight' }].map((row) => <div key={row.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3"><span className="text-sm text-zinc-400">{row.label}</span><span className="font-medium">{row.value}</span></div>)}
              </div>
              <div className="mt-6 rounded-2xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#FF7A72]">Quick Tip</p>
                <p className="mt-2 text-sm text-zinc-200">Hier kannst du Server-IP, Discord oder Whitelist-Infos einbauen.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/60" data-testid="marquee-section">
        <div className="overflow-hidden whitespace-nowrap py-4 text-sm uppercase tracking-[0.45em] text-white/20"><div className="animate-[marquee_24s_linear_infinite] inline-block">NO PIXEL • RP • CUSTOM CARS • HEISTS • NO PIXEL • RP • CUSTOM CARS • HEISTS •</div></div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-8" data-testid="features-section">
        <div className="mb-10 flex items-end justify-between gap-6"><div><p className="text-xs uppercase tracking-[0.25em] text-[#FF3B30]">Features</p><h3 className="mt-2 font-display text-4xl uppercase sm:text-5xl">Was den Server stark macht</h3></div><Badge variant="outline" className="border-white/10 text-zinc-300">Premium Layout</Badge></div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{features.map((item) => { const Icon = item.icon; return <Card key={item.title} className="border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:bg-white/8"><CardContent className="p-6"><Icon className="h-6 w-6 text-[#FF3B30]" /><h4 className="mt-4 font-display text-2xl uppercase">{item.title}</h4><p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.text}</p></CardContent></Card>; })}</div>
      </section>

      <section id="agenda" className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 md:px-8 lg:grid-cols-[0.95fr_1.05fr]" data-testid="agenda-section">
        <Card className="border-white/10 bg-white/5"><CardContent className="p-6 md:p-8"><p className="text-xs uppercase tracking-[0.25em] text-[#FF3B30]">Agenda</p><h3 className="mt-2 font-display text-4xl uppercase">Nächste Highlights</h3><div className="mt-6 space-y-4">{agenda.map((item) => <div key={item.time} className="flex gap-4 rounded-2xl border border-white/10 bg-black/25 p-4"><div className="min-w-16 font-display text-2xl text-[#FF3B30]">{item.time}</div><div><p className="font-medium text-white">{item.title}</p><p className="text-sm text-zinc-400">{item.text}</p></div></div>)}</div></CardContent></Card>
        <Card className="overflow-hidden border-white/10 bg-white/5" data-testid="gallery-card"><Tabs defaultValue="cars" className="p-6 md:p-8"><TabsList className="grid grid-cols-3 bg-black/40" data-testid="gallery-tabs">{galleryTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value} data-testid={`gallery-tab-${tab.value}`}>{tab.label}</TabsTrigger>)}</TabsList><TabsContent value="cars" className="mt-6"><div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-[url('https://images.pexels.com/photos/30641513/pexels-photo-30641513.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200')] bg-cover bg-center p-6 min-h-56" /><div className="rounded-2xl border border-white/10 bg-black/30 p-6"><p className="text-xs uppercase tracking-[0.25em] text-[#FF3B30]">Cinema</p><h4 className="mt-3 font-display text-3xl uppercase">Nachtstadt & Neon</h4><p className="mt-3 text-sm text-zinc-400">Perfekt für Screenshot-Sections und Server-Storytelling.</p></div></div></TabsContent><TabsContent value="city" className="mt-6"><div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-zinc-300">Stadt, Wirtschaft, Fraktionen und RP-Schwerpunkt in einem technischen Layout.</div></TabsContent><TabsContent value="community" className="mt-6"><div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-zinc-300">Events, Teamspeak/Discord und Community-Fokus als visuelles Highlight.</div></TabsContent></Tabs></Card>
      </section>

      <footer className="border-t border-white/10 bg-black/70 py-10" data-testid="site-footer"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 md:px-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-display text-2xl uppercase">Night Shift RP</p><p className="text-sm text-zinc-500">FiveM landing page redesign</p></div><Button className="w-fit bg-[#FF3B30] text-white hover:bg-[#D63028]" data-testid="footer-cta-btn" onClick={handleJoin}><Zap className="h-4 w-4" /> Join the city</Button></div></footer>
    </main>
  );
}

export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Home />} /></Routes></BrowserRouter>;
}
