import { motion } from "framer-motion";
import { Plus, Coins, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/CartContext";
import { formatPrice } from "@/lib/api";
import { toast } from "sonner";

export const CoinCard = ({ pkg, index }) => {
  const { addItem } = useCart();
  const featured = pkg.best_value;

  const onAdd = () => {
    addItem(pkg);
    toast.success(`${pkg.name} zum Warenkorb hinzugefügt`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      data-testid={`coin-card-${pkg.id}`}
      className={`group relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 ${
        featured
          ? "border-primary/60 shadow-[0_0_50px_-12px_rgba(0,85,255,0.6)]"
          : "border-white/[0.07] hover:border-primary/40"
      }`}
    >
      {(pkg.best_value || pkg.popular) && (
        <div
          className={`absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${
            pkg.best_value ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
          }`}
        >
          <Star className="h-3 w-3 fill-current" />
          {pkg.best_value ? "Bester Wert" : "Beliebt"}
        </div>
      )}

      <div className="relative mx-auto mb-5 aspect-square w-full max-w-[190px] overflow-hidden rounded-xl bg-[#0b0b12]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,85,255,0.35),transparent_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <img
          src={pkg.image}
          alt={pkg.name}
          loading="lazy"
          className="relative h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <h3 className="font-heading text-xl font-bold tracking-tight">{pkg.name}</h3>
      {pkg.coins != null && (
        <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          <Coins className="h-4 w-4" /> {pkg.coins.toLocaleString("de-DE")} Coins
        </div>
      )}
      {pkg.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{pkg.description}</p>
      )}

      <div className="mt-6 flex items-end justify-between gap-3 pt-2 border-t border-white/5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Preis</div>
          <div className="font-heading text-2xl font-extrabold text-foreground">
            {formatPrice(pkg.price, pkg.currency)}
          </div>
        </div>
        <Button
          data-testid={`add-to-cart-${pkg.id}`}
          onClick={onAdd}
          className="rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/85 hover:shadow-[0_0_24px_-4px_rgba(0,85,255,0.9)] transition-all duration-300"
        >
          <Plus className="h-4 w-4" /> Kaufen
        </Button>
      </div>
    </motion.div>
  );
};
