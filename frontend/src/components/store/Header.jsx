import { ShoppingCart, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ASSETS } from "@/lib/assets";
import { useCart } from "@/store/CartContext";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Shop", href: "#shop" },
  { label: "Vorteile", href: "#vorteile" },
  { label: "Community", href: "#community" },
  { label: "FAQ", href: "#faq" },
];

export const Header = () => {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 border-b ${
        scrolled ? "bg-[#08080c]/80 backdrop-blur-xl border-white/10" : "bg-transparent border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <a href="#top" data-testid="brand-logo" className="flex items-center gap-3 group">
            <img src={ASSETS.logo} alt="Lunar" className="h-11 w-auto drop-shadow-[0_0_18px_rgba(0,85,255,0.55)] transition-transform duration-300 group-hover:scale-105" />
            <span className="font-heading text-2xl font-extrabold tracking-tight text-primary text-glow">LUNAR</span>
          </a>

          <nav className="hidden md:flex items-center gap-9">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                data-testid={`nav-${n.label.toLowerCase()}`}
                className="relative text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-primary hover:after:w-full after:transition-all after:duration-300"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              data-testid="cart-trigger"
              onClick={() => setOpen(true)}
              className="relative rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/85 hover:shadow-[0_0_28px_-4px_rgba(0,85,255,0.8)] transition-all duration-300"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Warenkorb</span>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  data-testid="cart-count"
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-accent-foreground"
                >
                  {count}
                </motion.span>
              )}
            </Button>
            <button
              className="md:hidden rounded-full p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen((v) => !v)}
              data-testid="mobile-menu-toggle"
              aria-label="Menü"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-2" data-testid="mobile-menu">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
