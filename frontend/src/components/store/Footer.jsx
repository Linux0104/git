import { ASSETS, DISCORD_URL } from "@/lib/assets";

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#070709]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src={ASSETS.logo} alt="Lunar" className="h-10 w-auto" />
              <span className="font-heading text-xl font-extrabold tracking-tight text-primary">LUNAR</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Der offizielle Coin-Store des Lunar FiveM RP-Servers. Sichere dir Coins und
              erlebe das RP-Leben in vollen Zügen.
            </p>
          </div>

          <div>
            <div className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">Store</div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><a href="#shop" className="hover:text-primary transition-colors">Coin-Pakete</a></li>
              <li><a href="#vorteile" className="hover:text-primary transition-colors">Vorteile</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <div className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">Rechtliches</div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">AGB</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Rückgabebedingungen</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Datenschutz</a></li>
              <li><a href={DISCORD_URL} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Discord</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Lunar Coins. Alle Rechte vorbehalten.</span>
          <span>Zahlungsabwicklung sicher über Tebex.</span>
        </div>
      </div>
    </footer>
  );
};
