import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Wie erhalte ich meine Coins?",
    a: "Nach erfolgreicher Zahlung werden deine Lunar Coins automatisch und sofort deinem verknüpften FiveM-Charakter gutgeschrieben. Ein Neustart ist in der Regel nicht nötig.",
  },
  {
    q: "Warum muss ich meinen FiveM-Account verknüpfen?",
    a: "Damit wir die Coins dem richtigen Charakter zuweisen können, verlangt Tebex vor dem Kauf eine einmalige Verknüpfung deines Cfx.re/FiveM-Accounts. Das dauert nur wenige Sekunden.",
  },
  {
    q: "Welche Zahlungsmethoden werden akzeptiert?",
    a: "Die Zahlung läuft sicher über Tebex. Verfügbar sind unter anderem PayPal, Kredit- und Debitkarten, Klarna sowie weitere lokale Zahlungsmethoden.",
  },
  {
    q: "Ich habe meine Coins nicht erhalten – was tun?",
    a: "Sollte etwas nicht wie erwartet funktionieren, öffne bitte ein Ticket in unserem Discord. Halte deine Transaktions-ID bereit, damit wir dir schnell helfen können.",
  },
  {
    q: "Sind Rückerstattungen möglich?",
    a: "Da es sich um digitale Güter handelt, sind Coins nach Gutschrift grundsätzlich nicht erstattungsfähig. Bei technischen Problemen findest du in unseren Rückgabebedingungen alle Details.",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 sm:px-8 py-24 scroll-mt-24">
      <div className="text-center">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Support</div>
        <h2 className="mt-3 font-heading text-4xl sm:text-5xl font-black tracking-tighter">
          Häufige Fragen
        </h2>
      </div>

      <Accordion type="single" collapsible className="mt-10 w-full space-y-3" data-testid="faq-accordion">
        {FAQS.map((f, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="rounded-xl border border-white/[0.07] bg-card px-5 data-[state=open]:border-primary/40"
          >
            <AccordionTrigger className="text-left font-heading text-base font-semibold hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
