import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, Link2, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/CartContext";
import { createBasket, formatPrice } from "@/lib/api";
import { toast } from "sonner";

const PENDING_KEY = "lunar_pending";

export const CartDrawer = () => {
  const { items, open, setOpen, removeItem, updateQty, total, currency } = useCart();
  const [step, setStep] = useState("cart"); // cart | link
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const res = await createBasket(`${origin}/?tebex_return=1`, origin);
      if (res.demo || !res.ident) {
        toast.info(
          "Demo-Modus aktiv: Hinterlege einen gültigen Tebex Public Token, um echte Zahlungen zu aktivieren."
        );
        setLoading(false);
        return;
      }
      const payload = {
        ident: res.ident,
        items: items.map((i) => ({ package_id: i.id, quantity: i.quantity })),
      };
      localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
      const authUrl = Array.isArray(res.auth_urls) && res.auth_urls[0]?.url;
      if (authUrl) {
        window.location.href = authUrl;
      } else if (res.links?.checkout) {
        window.location.href = res.links.checkout;
      } else {
        toast.error("Checkout konnte nicht gestartet werden.");
        setLoading(false);
      }
    } catch (e) {
      toast.error("Fehler beim Start des Checkouts. Bitte versuche es erneut.");
      setLoading(false);
    }
  };

  const empty = items.length === 0;

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep("cart"); }}>
      <SheetContent
        data-testid="cart-drawer"
        className="w-full sm:max-w-md border-l border-white/10 bg-[#0a0a10]/95 backdrop-blur-xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-5 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 font-heading text-xl font-bold">
            {step === "link" ? (
              <button onClick={() => setStep("cart")} data-testid="back-to-cart" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <ShoppingCart className="h-5 w-5 text-primary" />
            )}
            {step === "link" ? "FiveM verknüpfen" : "Dein Warenkorb"}
          </SheetTitle>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {step === "cart" ? (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col min-h-0"
            >
              {empty ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-heading text-lg font-semibold">Dein Warenkorb ist leer</p>
                  <p className="text-sm text-muted-foreground">Füge Coin-Pakete hinzu, um loszulegen.</p>
                  <Button onClick={() => setOpen(false)} variant="secondary" className="mt-2 rounded-full">
                    Weiter shoppen
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        data-testid={`cart-item-${it.id}`}
                        className="flex gap-3 rounded-xl border border-white/[0.07] bg-card p-3"
                      >
                        <img src={it.image} alt={it.name} className="h-16 w-16 rounded-lg object-contain bg-[#0b0b12] p-1" />
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-heading text-sm font-bold leading-tight">{it.name}</span>
                            <button
                              onClick={() => removeItem(it.id)}
                              data-testid={`remove-item-${it.id}`}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Entfernen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full border border-white/10">
                              <button
                                onClick={() => updateQty(it.id, it.quantity - 1)}
                                data-testid={`decrease-${it.id}`}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold" data-testid={`qty-${it.id}`}>{it.quantity}</span>
                              <button
                                onClick={() => updateQty(it.id, it.quantity + 1)}
                                data-testid={`increase-${it.id}`}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-heading text-sm font-extrabold text-primary">
                              {formatPrice(it.price * it.quantity, it.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Zwischensumme</span>
                      <span data-testid="cart-total" className="font-heading text-2xl font-black">{formatPrice(total, currency)}</span>
                    </div>
                    <Button
                      onClick={() => setStep("link")}
                      data-testid="checkout-button"
                      className="w-full rounded-full bg-primary py-6 text-base font-bold text-primary-foreground hover:bg-primary/85 hover:shadow-[0_0_32px_-6px_rgba(0,85,255,0.9)] transition-all duration-300"
                    >
                      Zur Kasse
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">Sichere Zahlung über Tebex</p>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="link"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Link2 className="h-7 w-7" />
                </div>
                <h3 className="mt-5 font-heading text-2xl font-black tracking-tight">
                  Verknüpfe deinen FiveM-Account
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Damit deine Coins dem richtigen Charakter gutgeschrieben werden, wirst du zu Tebex
                  weitergeleitet, um dich einmalig mit deinem <span className="text-foreground font-semibold">Cfx.re / FiveM-Account</span> anzumelden.
                  Danach geht es direkt zur sicheren Bezahlung.
                </p>

                <ul className="mt-6 space-y-3">
                  {["FiveM-Account bei Tebex anmelden", "Coins werden deinem Charakter zugeordnet", "Sichere Bezahlung abschließen"].map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">{i + 1}</span>
                      <span className="text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                  Deine Zahlungsdaten werden ausschließlich sicher von Tebex verarbeitet.
                </div>
              </div>

              <div className="border-t border-white/10 px-6 py-5">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gesamt</span>
                  <span className="font-heading text-xl font-black">{formatPrice(total, currency)}</span>
                </div>
                <Button
                  onClick={startCheckout}
                  disabled={loading}
                  data-testid="confirm-link-button"
                  className="w-full rounded-full bg-primary py-6 text-base font-bold text-primary-foreground hover:bg-primary/85 hover:shadow-[0_0_32px_-6px_rgba(0,85,255,0.9)] transition-all duration-300"
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Weiterleiten…</>
                  ) : (
                    <>Weiter & FiveM verknüpfen</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};
