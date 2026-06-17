import { useState, useCallback, useEffect, useMemo } from "react";
import { isDebug, useNuiEvent, fetchNui } from "@/hooks/useNui";
import {
  Shield,
  Star,
  HeartPulse,
  Landmark,
  Wrench,
  Users,
  X,
  Rocket,
  Activity,
  Signal,
} from "lucide-react";
import "@/App.css";

const departmentMeta = {
  police: { name: "Police", Icon: Shield, hue: "#38bdf8" },
  sheriff: { name: "Sheriff", Icon: Star, hue: "#7dd3fc" },
  medics: { name: "Medics", Icon: HeartPulse, hue: "#22d3ee" },
  gov: { name: "Gov", Icon: Landmark, hue: "#60a5fa" },
  bennys: { name: "Bennys", Icon: Wrench, hue: "#0ea5e9" },
};

const mockDepartments = [
  { id: "police", count: 12 },
  { id: "sheriff", count: 8 },
  { id: "medics", count: 5 },
  { id: "gov", count: 3 },
  { id: "bennys", count: 6 },
];

// ---------- helpers ----------
const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

const Clock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return (
    <span className="font-mono tracking-[0.18em] text-[11px] text-sky-300/80" data-testid="lunar-clock">
      {hh}:{mm}:<span className="text-sky-400">{ss}</span>
    </span>
  );
};

// ---------- department row ----------
const DeptRow = ({ dept, index }) => {
  const meta = departmentMeta[dept.id] || {
    name: dept.id,
    Icon: Users,
    hue: "#38bdf8",
  };
  const count = useCountUp(dept.count);
  const Icon = meta.Icon;
  return (
    <div
      className="dept-row group"
      style={{ animationDelay: `${index * 80}ms`, "--hue": meta.hue }}
      data-testid={`lunar-dept-${dept.id}`}
    >
      <div className="dept-row__rail" />
      <div className="dept-row__icon">
        <Icon size={20} strokeWidth={1.75} />
        <div className="dept-row__icon-glow" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="dept-row__name">{meta.name}</span>
          <span className="dept-row__id">/ {dept.id.toUpperCase()}</span>
        </div>
        <div className="dept-row__bar">
          <div
            className="dept-row__bar-fill"
            style={{ width: `${Math.min(100, dept.count * 6)}%` }}
          />
        </div>
      </div>

      <div className="dept-row__count">
        <Users size={12} className="opacity-50" strokeWidth={2} />
        <span className="dept-row__count-num" data-testid={`lunar-dept-${dept.id}-count`}>
          {String(count).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
};

// ---------- root ----------
export default function App() {
  const [visible, setVisible] = useState(true);
  const [departments, setDepartments] = useState(mockDepartments);

  useNuiEvent("open", (data) => {
    if (data && data.departments) setDepartments(data.departments);
    setVisible(true);
  });
  useNuiEvent("close", () => setVisible(false));

  const handleClose = useCallback(() => {
    setVisible(false);
    fetchNui("close", {});
    if (isDebug) setTimeout(() => setVisible(true), 250);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const total = useMemo(
    () => departments.reduce((acc, d) => acc + (d.count || 0), 0),
    [departments]
  );
  const totalAnim = useCountUp(total);

  if (!visible) return null;

  return (
    <div className="lunar-root" data-testid="lunar-root">
      <div className="lunar-bg-grid" />
      <div className="lunar-bg-glow lunar-bg-glow--a" />
      <div className="lunar-bg-glow lunar-bg-glow--b" />
      <div className="lunar-scanlines" />
      <div className="lunar-noise" />

      <div className="lunar-shell" data-testid="lunar-shell">
        <span className="corner corner--tl" />
        <span className="corner corner--tr" />
        <span className="corner corner--bl" />
        <span className="corner corner--br" />

        <header className="lunar-header">
          <div className="lunar-header__left">
            <div className="lunar-logo">
              <Rocket size={18} strokeWidth={1.75} />
              <div className="lunar-logo__ring" />
            </div>
            <div className="leading-tight">
              <div className="lunar-brand" data-testid="lunar-brand">
                LUNAR
                <span className="lunar-brand__dot" />
              </div>
              <div className="lunar-brand__sub">
                <span className="text-sky-300/80">SCOREBOARD</span>
                <span className="mx-2 text-white/20">·</span>
                <Clock />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="lunar-close"
            onClick={handleClose}
            aria-label="Close"
            data-testid="lunar-close-button"
          >
            <X size={14} strokeWidth={2} />
            <span className="text-[10px] tracking-[0.18em] ml-1.5">ESC</span>
          </button>
        </header>

        <div className="lunar-stats" data-testid="lunar-stats">
          <div className="lunar-stat">
            <div className="lunar-stat__label">Active Units</div>
            <div className="lunar-stat__value">
              {String(totalAnim).padStart(2, "0")}
            </div>
          </div>
          <div className="lunar-stats__divider" />
          <div className="lunar-stat">
            <div className="lunar-stat__label">Departments</div>
            <div className="lunar-stat__value">{departments.length}</div>
          </div>
          <div className="lunar-stats__divider" />
          <div className="lunar-stat lunar-stat--ping">
            <div className="lunar-stat__label flex items-center gap-1.5">
              <Signal size={11} className="text-sky-400" strokeWidth={2.25} />
              Ping
            </div>
            <div className="lunar-stat__value">
              28<span className="text-sky-400/70 text-xs ml-0.5">ms</span>
            </div>
          </div>
        </div>

        <div className="lunar-list" data-testid="lunar-list">
          {departments.map((dept, idx) => (
            <DeptRow dept={dept} index={idx} key={dept.id} />
          ))}
        </div>

        <footer className="lunar-footer">
          <div className="lunar-footer__status">
            <span className="lunar-pulse">
              <span className="lunar-pulse__dot" />
              <span className="lunar-pulse__ring" />
            </span>
            <span className="text-sky-300/90 tracking-[0.22em] text-[10px]">
              SERVER ONLINE
            </span>
          </div>
          <div className="lunar-footer__meta">
            <Activity size={11} className="text-sky-400/70" strokeWidth={2} />
            <span className="text-white/40 text-[10px] tracking-[0.22em]">
              LUNAR · v1.0.4
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
