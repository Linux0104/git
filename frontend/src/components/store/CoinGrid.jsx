import { CoinCard } from "./CoinCard";
import { Skeleton } from "@/components/ui/skeleton";

// Auto-assign "Beliebt" / "Bester Wert" badges when Tebex doesn't provide them
const withBadges = (packages) => {
  if (!packages.length) return packages;
  const hasBadge = packages.some((p) => p.best_value || p.popular);
  if (hasBadge) return packages;
  let bestId = null;
  let bestRatio = -1;
  packages.forEach((p) => {
    const ratio = p.coins && p.price ? p.coins / p.price : 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestId = p.id;
    }
  });
  const popularId = packages[1]?.id;
  return packages.map((p) => ({
    ...p,
    best_value: p.id === bestId,
    popular: p.id === popularId && p.id !== bestId,
  }));
};

export const CoinGrid = ({ packages, loading }) => {
  const items = withBadges(packages);
  return (
    <section id="shop" className="relative mx-auto max-w-7xl px-5 sm:px-8 py-24 scroll-mt-24">
      <div className="max-w-2xl">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Coin-Pakete</div>
        <h2 className="mt-3 font-heading text-4xl sm:text-5xl font-black tracking-tighter">
          Wähle dein Coin-Paket
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Alle Pakete werden nach der Zahlung automatisch und sofort auf deinen FiveM-Charakter gutgeschrieben.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[26rem] rounded-2xl bg-white/5" />
            ))
          : items.map((pkg, i) => <CoinCard key={pkg.id} pkg={pkg} index={i} />)}
      </div>
    </section>
  );
};
