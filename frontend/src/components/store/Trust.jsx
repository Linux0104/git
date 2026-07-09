import { motion } from "framer-motion";
import { Zap, ShieldCheck, Headphones, RefreshCw } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Sofortige Lieferung", text: "Coins landen automatisch innerhalb von Sekunden auf deinem Charakter." },
  { icon: ShieldCheck, title: "Sichere Bezahlung", text: "Abwicklung über Tebex – PayPal, Kreditkarte, Klarna & mehr." },
  { icon: Headphones, title: "24/7 Support", text: "Unser Team hilft dir jederzeit über unseren Discord weiter." },
  { icon: RefreshCw, title: "Faire Rückgabe", text: "Transparente Bedingungen und schnelle Bearbeitung bei Problemen." },
];

export const Trust = () => {
  return (
    <section id="vorteile" className="relative border-y border-white/5 bg-[#0a0a10] scroll-mt-24">
      <div className="absolute inset-0 lunar-grid opacity-30" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-24">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Warum Lunar</div>
          <h2 className="mt-3 font-heading text-4xl sm:text-5xl font-black tracking-tighter">
            Der schnellste Weg zu mehr Coins
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-2xl border border-white/[0.07] bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_24px_-4px_rgba(0,85,255,0.9)]">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
