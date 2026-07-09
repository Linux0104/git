import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { DiscordIcon } from "./DiscordIcon";
import { DISCORD_URL } from "@/lib/assets";
import { Button } from "@/components/ui/button";

export const DiscordBanner = () => {
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        data-testid="discord-banner"
        className="relative overflow-hidden rounded-3xl border border-[#5865F2]/40 bg-[#0b0d1c] p-8 sm:p-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(88,101,242,0.35),transparent_55%)]" />
        <div className="absolute -right-10 -top-10 opacity-10">
          <DiscordIcon className="h-64 w-64 text-[#5865F2]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#5865F2]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#8b95ff]">
              <Users className="h-3.5 w-3.5" /> Community
            </div>
            <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-black tracking-tighter">
              Tritt der Lunar Community bei
            </h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              Verbinde dich mit tausenden Spielern, erhalte Support, exklusive Aktionen und bleibe
              immer auf dem Laufenden – direkt auf unserem Discord.
            </p>
          </div>

          <Button
            asChild
            data-testid="discord-join-button"
            className="h-13 shrink-0 rounded-full bg-[#5865F2] px-8 py-6 text-base font-bold text-white hover:bg-[#4752c4] hover:shadow-[0_0_40px_-6px_rgba(88,101,242,0.9)] transition-all duration-300"
          >
            <a href={DISCORD_URL} target="_blank" rel="noreferrer">
              <DiscordIcon className="h-5 w-5" /> Discord beitreten <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
};
