import { useEffect, useRef, useState } from "react";
import { hand } from "./handState";
import { appView } from "./appStore";
import { APPS } from "./Home";
import { blip } from "./boot";

// Experimental menu: floating "browser windows" you can drag + resize to your liking (persisted).
// Hand: hover a window then PINCH or hold ~0.7s to open. Mouse: drag the title bar to move,
// drag the corner to resize, click the body to open. Enable with ?windows.
// Floating-window menu is the DEFAULT now. The old grab carousel is still reachable via ?carousel.
export const WINDOW_MENU =
  typeof location === "undefined" || !/carousel|spin/i.test(location.search + location.hash + location.pathname);

const HOLD = 0.7;
const LS_KEY = "winmenu-layouts-v3";
type L = { x: number; y: number; w: number; h: number; ry: number; rx: number };

// Balanced, centered layout: Music centered up top, the rest symmetric left/right.
// left = margin from left edge, right = margin from right edge, center = horizontally centered.
const DEFAULTS: Array<Record<string, any>> = [
  { center: true, fy: 0.07, w: 480, h: 300, ry: 0,   rx: -5 }, // Music — centered, top, big
  { left: 0.05,   fy: 0.40, w: 348, h: 244, ry: 14,  rx: -3 }, // upper-left
  { left: 0.05,   fy: 0.68, w: 348, h: 244, ry: 14,  rx: 3 },  // lower-left
  { right: 0.05,  fy: 0.40, w: 348, h: 244, ry: -14, rx: -3 }, // upper-right
  { right: 0.05,  fy: 0.68, w: 348, h: 244, ry: -14, rx: 3 },  // lower-right
  { center: true, fy: 0.70, w: 360, h: 236, ry: 0,   rx: 6 },  // spare (centered) for a future app
];

function initialLayouts(): L[] {
  const W = window.innerWidth;
  const defs = APPS.map((_, i) => {
    const d = DEFAULTS[i % DEFAULTS.length];
    const x = d.center ? (W - d.w) / 2 : d.right != null ? W - d.w - d.right * W : (d.left ?? 0) * W;
    return { x, y: d.fy * window.innerHeight, w: d.w, h: d.h, ry: d.ry, rx: d.rx };
  });
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (Array.isArray(saved) && saved.length === defs.length) return saved;
  } catch {}
  return defs;
}

export default function WindowMenu() {
  const [layouts, setLayouts] = useState<L[]>(initialLayouts);
  const layoutsRef = useRef(layouts); layoutsRef.current = layouts;
  const winRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cursor = useRef<HTMLDivElement>(null);

  const save = (l: L[]) => { try { localStorage.setItem(LS_KEY, JSON.stringify(l)); } catch {} };

  const open = (i: number) => {
    if (APPS[i].soon) { blip(420); return; } // teaser tile — not openable yet
    const el = winRefs.current[i];
    blip(900);
    if (el) { el.style.transition = "scale .26s ease, opacity .26s ease"; el.style.scale = "1.5"; el.style.opacity = "0"; }
    setTimeout(() => appView.set(APPS[i].view), 240);
  };

  // mouse: drag by title bar, resize by corner handle
  const startDrag = (i: number, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const s = { px: e.clientX, py: e.clientY, x: layoutsRef.current[i].x, y: layoutsRef.current[i].y };
    const move = (ev: PointerEvent) => setLayouts((L) => { const n = [...L]; n[i] = { ...n[i], x: s.x + (ev.clientX - s.px), y: s.y + (ev.clientY - s.py) }; return n; });
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); save(layoutsRef.current); };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
  };
  const startResize = (i: number, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const s = { px: e.clientX, py: e.clientY, w: layoutsRef.current[i].w, h: layoutsRef.current[i].h };
    const move = (ev: PointerEvent) => setLayouts((L) => { const n = [...L]; n[i] = { ...n[i], w: Math.max(170, s.w + (ev.clientX - s.px)), h: Math.max(120, s.h + (ev.clientY - s.py)) }; return n; });
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); save(layoutsRef.current); };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
  };

  // hand: hover + pinch / dwell to open
  useEffect(() => {
    let raf = 0, hovered = -1, held = 0, fired = false, last = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      const cx = hand.x * innerWidth, cy = hand.y * innerHeight;
      if (cursor.current) {
        cursor.current.style.left = cx + "px"; cursor.current.style.top = cy + "px";
        cursor.current.style.opacity = hand.present ? "1" : "0";
        cursor.current.classList.toggle("pinch", hand.pinch);
      }
      let hv = -1;
      if (hand.present) for (let i = 0; i < APPS.length; i++) {
        const el = winRefs.current[i]; if (!el) continue;
        const r = el.getBoundingClientRect();
        if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) { hv = i; break; }
      }
      if (hv !== hovered) { hovered = hv; held = 0; fired = false; }
      winRefs.current.forEach((el, i) => {
        if (!el) return;
        el.classList.toggle("hov", i === hovered);
        el.style.scale = i === hovered ? "1.05" : "1";
        if (i !== hovered) el.style.setProperty("--p", "0");
      });
      const speed = Math.hypot(hand.vx, hand.vy);
      if (hovered >= 0 && !fired) {
        if (hand.pinch) { fired = true; open(hovered); }
        else if (speed < 0.03) {
          held += dt;
          winRefs.current[hovered]?.style.setProperty("--p", String(Math.min(1, held / HOLD)));
          if (held >= HOLD) { fired = true; open(hovered); }
        } else held = Math.max(0, held - dt * 2);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="winmenu">
      {APPS.map((a, i) => {
        const L = layouts[i];
        return (
          <div
            key={i}
            ref={(el) => { winRefs.current[i] = el; }}
            className="winmenu-win"
            style={{
              left: L.x, top: L.y, width: L.w, height: L.h,
              ["--c" as any]: a.color,
              transform: `perspective(1000px) rotateY(${L.ry}deg) rotateX(${L.rx}deg)`,
            }}
          >
            <div className="wm-bar" onPointerDown={(e) => startDrag(i, e)}>
              <i /><i /><i /><span>{a.label.toLowerCase().replace(/\s+/g, "-")}.blankspace</span>
            </div>
            <div className="wm-body" onClick={() => open(i)} style={a.soon ? { opacity: 0.62 } : undefined}>
              <a.Icon size={Math.round(L.h * 0.27)} strokeWidth={1.5} />
              <div className="wm-label">{a.label}</div>
              {a.soon && <div style={{ marginTop: 6, fontSize: 9, fontWeight: 900, letterSpacing: ".16em",
                color: "#04120b", background: a.color, borderRadius: 20, padding: "3px 10px" }}>COMING SOON</div>}
            </div>
            <div className="wm-prog" />
            <div className="wm-resize" onPointerDown={(e) => startResize(i, e)} />
          </div>
        );
      })}
      <div ref={cursor} className="winmenu-cursor" />
    </div>
  );
}
