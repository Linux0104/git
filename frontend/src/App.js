import { useEffect, useState } from "react";
import "@/App.css";
import { Loader2 } from "lucide-react";
import { CartProvider, useCart } from "@/store/CartContext";
import { fetchStore, addItemsToBasket } from "@/lib/api";
import { Header } from "@/components/store/Header";
import { Hero } from "@/components/store/Hero";
import { CoinGrid } from "@/components/store/CoinGrid";
import { Trust } from "@/components/store/Trust";
import { FAQ } from "@/components/store/FAQ";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { DiscordBanner } from "@/components/store/DiscordBanner";
import { CommunityWidget } from "@/components/store/CommunityWidget";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const PENDING_KEY = "lunar_pending";

const ReturnOverlay = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#08080c]/95 backdrop-blur-sm" data-testid="checkout-processing">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="font-heading text-lg font-bold">Weiterleitung zur Bezahlung…</p>
    <p className="text-sm text-muted-foreground">Einen Moment, wir bereiten deinen Warenkorb vor.</p>
  </div>
);

const StoreApp = () => {
  const [store, setStore] = useState({ packages: [], demo: false });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { clear } = useCart();

  useEffect(() => {
    fetchStore()
      .then(setStore)
      .catch(() => toast.error("Store konnte nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  // Handle return from Tebex FiveM auth -> add items & redirect to checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tebex_return") !== "1") return;
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) {
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    setProcessing(true);
    const pending = JSON.parse(raw);
    addItemsToBasket(pending.ident, pending.items)
      .then((res) => {
        localStorage.removeItem(PENDING_KEY);
        clear();
        if (res.checkout_url) {
          window.location.href = res.checkout_url;
        } else {
          setProcessing(false);
          toast.error("Checkout-Link nicht verfügbar.");
        }
      })
      .catch(() => {
        localStorage.removeItem(PENDING_KEY);
        setProcessing(false);
        window.history.replaceState({}, "", window.location.pathname);
        toast.error("Warenkorb konnte nicht abgeschlossen werden.");
      });
  }, [clear]);

  return (
    <div className="App relative min-h-screen bg-background text-foreground antialiased">
      {processing && <ReturnOverlay />}
      <Header />
      <main>
        <Hero />
        <CoinGrid packages={store.packages} loading={loading} />
        <Trust />
        <CommunityWidget />
        <DiscordBanner />
        <FAQ />
      </main>
      <Footer />
      <CartDrawer />
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
};

function App() {
  return (
    <CartProvider>
      <StoreApp />
    </CartProvider>
  );
}

export default App;
