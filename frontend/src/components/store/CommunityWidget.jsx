import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, ShoppingBag, Sparkles } from "lucide-react";
import { fetchSidebar } from "@/lib/api";

const Avatar = ({ url, name }) => {
  const [failed, setFailed] = useState(false);
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return url && !failed ? (
    <img
      src={url}
      alt={name}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30"
    />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-2 ring-primary/30">
      {initials}
    </div>
  );
};

export const CommunityWidget = () => {
  const [modules, setModules] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchSidebar()
      .then((d) => setModules(d.modules || []))
      .catch(() => setModules([]))
      .finally(() => setLoaded(true));
  }, []);

  const topCustomer = modules.find((m) => m.type === "top_customer");
  const recent = modules.find((m) => m.type === "recent_payments");
  const tc = topCustomer?.data;
  const payments = recent?.data?.payments || [];

  if (loaded && !tc && payments.length === 0) return null;

  return (
    <section id="community" className="mx-auto max-w-7xl px-5 sm:px-8 py-16 scroll-mt-24">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Top customer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          data-testid="top-customer-widget"
          className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-[#12100a] to-[#0a0a10] p-7"
        >
          <div className="absolute -right-6 -top-6 opacity-20">
            <Crown className="h-40 w-40 text-amber-400" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">
              <Crown className="h-3.5 w-3.5" /> Top-Kunde des Monats
            </div>
            {tc?.username ? (
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/15 text-2xl font-black text-amber-300 ring-2 ring-amber-400/40">
                  {tc.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-heading text-2xl font-black">{tc.username}</div>
                  {tc.total != null && (
                    <div className="text-sm text-muted-foreground">
                      {tc.total} {tc.total === 1 ? "Kauf" : "Käufe"} diesen Monat
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Sparkles className="h-6 w-6 text-amber-300" />
                  <p className="text-sm leading-relaxed">
                    Noch kein Top-Kunde diesen Monat.
                    <br />
                    <span className="font-semibold text-foreground">Werde du der Nächste!</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          data-testid="recent-payments-widget"
          className="rounded-2xl border border-white/[0.07] bg-card p-7"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-lg font-bold">Neueste Käufe</h3>
            <span className="ml-2 flex h-2 w-2 items-center justify-center">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Diese Spieler haben gerade aufgeladen</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {payments.length === 0 && loaded ? (
              <p className="text-sm text-muted-foreground">Noch keine Käufe – sei der Erste!</p>
            ) : (
              payments.slice(0, 6).map((p, i) => (
                <div
                  key={`${p.username_id}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                >
                  <Avatar url={p.avatar_url} name={p.username} />
                  <div className="min-w-0">
                    <div className="truncate font-heading text-sm font-bold">{p.username}</div>
                    <div className="text-xs text-primary">hat gerade eingekauft</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
