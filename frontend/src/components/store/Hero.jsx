import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { ASSETS } from "@/lib/assets";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section id="top" className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* background */}
      <div className="absolute inset-0">
        <img src={ASSETS.banner} alt="" className="h-full w-full object-cover object-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080c]/70 via-[#08080c]/85 to-[#08080c]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,85,255,0.25),transparent_55%)]" />
      </div>
      <div className="absolute inset-0 lunar-grid opacity-40" />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-5 sm:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] items-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Offizieller FiveM Coin Store
            </div>

            <h1 className="mt-6 font-heading text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tighter">
              Lade deine
              <span className="block text-primary text-glow">Lunar Coins</span>
              in Sekunden auf.
            </h1>

            <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Sichere dir Coins für den Lunar RP-Server – sofortige Lieferung direkt auf deinen
              Charakter, sichere Bezahlung über Tebex und 24/7 Support.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                data-testid="hero-shop-cta"
                className="h-13 rounded-full bg-primary px-8 py-6 text-base font-bold text-primary-foreground hover:bg-primary/85 hover:shadow-[0_0_40px_-6px_rgba(0,85,255,0.9)] transition-all duration-300"
              >
                <a href="#shop">
                  Coins kaufen <ArrowRight className="ml-1 h-5 w-5" />
                </a>
              </Button>
              <div className="flex items-center gap-5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Sofort</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Sicher</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:flex justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl" />
              <img
                src={ASSETS.coin}
                alt="Lunar Coin"
                className="relative w-[26rem] max-w-full rounded-2xl animate-float-slow drop-shadow-[0_0_60px_rgba(0,85,255,0.5)]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
