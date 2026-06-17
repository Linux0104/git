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
  ChevronDown,
  Radio,
} from "lucide-react";
import "@/App.css";

const departmentMeta = {
  police: { name: "Police", Icon: Shield, hue: "#38bdf8" },
  sheriff: { name: "Sheriff", Icon: Star, hue: "#7dd3fc" },
  medics: { name: "Medics", Icon: HeartPulse, hue: "#22d3ee" },
  gov: { name: "Gov", Icon: Landmark, hue: "#60a5fa" },
  bennys: { name: "Bennys", Icon: Wrench, hue: "#0ea5e9" },
};

const STATUS = {
  on_duty: { label: "On Duty", color: "#22c55e", short: "ON" },
  available: { label: "Available", color: "#38bdf8", short: "AV" },
  off_duty: { label: "Off Duty", color: "#6b7280", short: "OFF" },
};

// mock members per department (only used in preview / when NUI omits members)
const mockMembers = {
  police: [
    { id: 1, name: "J. Marston", callsign: "P-101", status: "on_duty", rank: "Sgt" },
    { id: 2, name: "L. Reyes", callsign: "P-102", status: "available", rank: "Off" },
    { id: 3, name: "K. Holloway", callsign: "P-103", status: "on_duty", rank: "Off" },
    { id: 4, name: "M. Tanaka", callsign: "P-104", status: "off_duty", rank: "Lt" },
  ],
  sheriff: [
    { id: 1, name: "R. Callahan", callsign: "S-201", status: "on_duty", rank: "Dep" },
    { id: 2, name: "D. Vega", callsign: "S-202", status: "available", rank: "Dep" },
    { id: 3, name: "H. Nakamura", callsign: "S-203", status: "off_duty", rank: "Sgt" },
  ],
  medics: [
    { id: 1, name: "S. Carter", callsign: "M-301", status: "on_duty", rank: "EMT" },
    { id: 2, name: "P. Dahl", callsign: "M-302", status: "on_duty", rank: "Med" },
  ],
  gov: [
    { id: 1, name: "A. Whitlock", callsign: "G-401", status: "available", rank: "Off" },
    { id: 2, name: "T. Bellamy", callsign: "G-402", status: "off_duty", rank: "Adm" },
  ],
  bennys: [
    { id: 1, name: "B. Sanchez", callsign: "B-501", status: "on_duty", rank: "Mech" },
    { id: 2, name: "C. Yoon", callsign: "B-502", status: "available", rank: "Mech" },
    { id: 3, name: "R. Iverson", callsign: "B-503", status: "off_duty", rank: "Lead" },
  ],
};

const mockDepartments = [
  { id: "police", count: 12, members: mockMembers.police },
  { id: "sheriff", count: 8, members: mockMembers.sheriff },
  { id: "medics", count: 5, members: mockMembers.medics },
  { id: "gov", count: 3, members: mockMembers.gov },
  { id: "bennys", count: 6, members: mockMembers.bennys },
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

// ---------- member row ----------
const MemberRow = ({ member, index, hue }) => {
  const s = STATUS[member.status] || STATUS.off_duty;
  return (
    <div
      className="member-row"
      style={{ animationDelay: `${index * 40}ms`, "--statusColor": s.color }}
      data-testid={`lunar-member-${member.id}`}
    >
      <div className="member-row__status">
        <span className="member-row__dot" />
        <span className="member-row__dot-ring" />
      </div>

      <div className="member-row__callsign" style={{ borderColor: `${hue}40` }}>
        {member.callsign}
      </div>

      <div className="flex-1 min-w-0">
        <div className="member-row__name">{member.name}</div>
        <div className="member-row__rank">
          {member.rank} · <span style={{ color: s.color }}>{s.label}</span>
        </div>
      </div>

      <button
        type="button"
        className="member-row__radio"
        data-testid={`lunar-member-${member.id}-radio`}
        aria-label={`Radio ${member.callsign}`}
      >
        <Radio size={12} strokeWidth={2} />
      </button>
    </div>
  );
};

// ---------- department row ----------
const DeptRow = ({ dept, index, isOpen, onToggle }) => {
  const meta = departmentMeta[dept.id] || {
    name: dept.id,
    Icon: Users,
    hue: "#38bdf8",
  };
  const count = useCountUp(dept.count);
  const Icon = meta.Icon;
  const members = dept.members || mockMembers[dept.id] || [];

  const statusCounts = useMemo(() => {
    const c = { on_duty: 0, available: 0, off_duty: 0 };
    members.forEach((m) => {
      if (c[m.status] !== undefined) c[m.status]++;
    });
    return c;
  }, [members]);

  return (
    <div
      className={`dept-row group ${isOpen ? "dept-row--open" : ""}`}
      style={{ animationDelay: `${index * 80}ms`, "--hue": meta.hue }}
      data-testid={`lunar-dept-${dept.id}`}
    >
      <button
        type="button"
        className="dept-row__head"
        onClick={() => onToggle(dept.id)}
        aria-expanded={isOpen}
        data-testid={`lunar-dept-${dept.id}-toggle`}
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

        <div className="dept-row__meta">
          <div className="dept-row__count">
            <Users size={12} className="opacity-50" strokeWidth={2} />
            <span className="dept-row__count-num" data-testid={`lunar-dept-${dept.id}-count`}>
              {String(count).padStart(2, "0")}
            </span>
          </div>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={`dept-row__chev ${isOpen ? "dept-row__chev--open" : ""}`}
          />
        </div>
      </button>

      {/* Member panel */}
      <div
        className={`dept-row__panel ${isOpen ? "dept-row__panel--open" : ""}`}
        data-testid={`lunar-dept-${dept.id}-panel`}
      >
        <div className="dept-row__panel-inner">
          {/* status summary */}
          <div className="dept-row__summary">
            <div className="dept-row__chip" data-status="on_duty">
              <span className="dept-row__chip-dot" style={{ background: STATUS.on_duty.color, boxShadow: `0 0 8px ${STATUS.on_duty.color}` }} />
              On Duty
              <span className="dept-row__chip-num">{statusCounts.on_duty}</span>
            </div>
            <div className="dept-row__chip" data-status="available">
              <span className="dept-row__chip-dot" style={{ background: STATUS.available.color, boxShadow: `0 0 8px ${STATUS.available.color}` }} />
              Available
              <span className="dept-row__chip-num">{statusCounts.available}</span>
            </div>
            <div className="dept-row__chip" data-status="off_duty">
              <span className="dept-row__chip-dot" style={{ background: STATUS.off_duty.color }} />
              Off Duty
              <span className="dept-row__chip-num">{statusCounts.off_duty}</span>
            </div>
          </div>

          {/* members list */}
          {members.length > 0 ? (
            <div className="dept-row__members">
              {members.map((m, i) => (
                <MemberRow key={m.id} member={m} index={i} hue={meta.hue} />
              ))}
            </div>
          ) : (
            <div className="dept-row__empty">No personnel data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- root ----------
export default function App() {
  const [visible, setVisible] = useState(true);
  const [departments, setDepartments] = useState(mockDepartments);
  const [openId, setOpenId] = useState(null);

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

  const handleToggle = useCallback((id) => {
    setOpenId((current) => (current === id ? null : id));
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
            <DeptRow
              dept={dept}
              index={idx}
              key={dept.id}
              isOpen={openId === dept.id}
              onToggle={handleToggle}
            />
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
