import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN = 1;
const MAX = 6;
const DOUBLE_TAP_ZOOM = 2.5;

interface View {
  s: number;
  x: number;
  y: number;
}

const clampScale = (s: number) => Math.min(MAX, Math.max(MIN, s));

/**
 * Toont de creatie schermvullend. Knijpen, dubbel tikken, scrollen of de +/− knoppen
 * zoomen in; slepen verschuift. Sluiten met ✕, Escape of de terugknop van de telefoon.
 */
export function FullscreenViewer({ canvas, onClose }: { canvas: HTMLCanvasElement; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState('');
  const [natural, setNatural] = useState({ w: canvas.width, h: canvas.height });
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 });
  const [animate, setAnimate] = useState(false);

  // Momentopname van het canvas op volle resolutie
  useEffect(() => {
    let objectUrl = '';
    setNatural({ w: canvas.width, h: canvas.height });
    canvas.toBlob((b) => {
      if (!b) return;
      objectUrl = URL.createObjectURL(b);
      setUrl(objectUrl);
    }, 'image/png');
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [canvas]);

  // Afmetingen van het beeldvlak volgen (draaien van de telefoon, volledig scherm aan/uit)
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = stage.w && stage.h ? Math.min(stage.w / natural.w, stage.h / natural.h) : 0;
  const baseW = natural.w * fit;
  const baseH = natural.h * fit;

  /** Houdt de afbeelding binnen beeld. */
  const clamp = useCallback(
    (v: View): View => {
      const maxX = Math.max(0, (baseW * v.s - stage.w) / 2);
      const maxY = Math.max(0, (baseH * v.s - stage.h) / 2);
      return { s: v.s, x: Math.min(maxX, Math.max(-maxX, v.x)), y: Math.min(maxY, Math.max(-maxY, v.y)) };
    },
    [baseW, baseH, stage.w, stage.h],
  );

  /** Zoomt naar schaal `s`, waarbij punt (px, py) (t.o.v. het midden) op zijn plek blijft. */
  const zoomAt = useCallback(
    (v: View, s: number, px: number, py: number): View => {
      const ns = clampScale(s);
      const k = ns / v.s;
      return clamp({ s: ns, x: px - (px - v.x) * k, y: py - (py - v.y) * k });
    },
    [clamp],
  );

  // Sluiten via de terugknop: bij openen een geschiedenis-stap toevoegen.
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    history.back(); // triggert popstate → onClose
  }, []);

  useEffect(() => {
    history.pushState({ viewer: true }, '');
    const onPop = () => {
      closing.current = true;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);

    // Echt volledig scherm waar mogelijk (Android); op iPhone blijft het een schermvullende laag.
    let entered = false;
    const onFsChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered) close(); // terugknop verliet volledig scherm: viewer ook sluiten
    };
    document.addEventListener('fullscreenchange', onFsChange);
    rootRef.current?.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => undefined);

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [close, onClose]);

  // ---- Aanraken: knijpen, slepen, dubbel tikken ----
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; mx: number; my: number } | null>(null);
  const tap = useRef<{ t: number; x: number; y: number; moved: boolean }>({ t: 0, x: 0, y: 0, moved: false });
  const lastTap = useRef({ t: 0, x: 0, y: 0 });

  const rel = (x: number, y: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: x - r.left - r.width / 2, y: y - r.top - r.height / 2 };
  };

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    } else if (pts.length === 1) {
      gesture.current = { dist: 0, mx: pts[0].x, my: pts[0].y };
    } else gesture.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) tap.current = { t: Date.now(), x: e.clientX, y: e.clientY, moved: false };
    else tap.current.moved = true;
    setAnimate(false);
    startGesture();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.hypot(e.clientX - tap.current.x, e.clientY - tap.current.y) > 10) tap.current.moved = true;
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const p = rel(mx, my);
      setView((v) => {
        const zoomed = zoomAt(v, v.s * (dist / (g.dist || dist)), p.x, p.y);
        return clamp({ ...zoomed, x: zoomed.x + (mx - g.mx), y: zoomed.y + (my - g.my) });
      });
      gesture.current = { dist, mx, my };
    } else {
      const [a] = pts;
      setView((v) => clamp({ ...v, x: v.x + (a.x - g.mx), y: v.y + (a.y - g.my) }));
      gesture.current = { dist: 0, mx: a.x, my: a.y };
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    startGesture();
    if (pointers.current.size > 0 || tap.current.moved || Date.now() - tap.current.t > 300) return;
    // Dubbel tikken?
    const now = Date.now();
    const lt = lastTap.current;
    if (now - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 40) {
      const p = rel(e.clientX, e.clientY);
      setAnimate(true);
      setView((v) => (v.s > 1.05 ? { s: 1, x: 0, y: 0 } : zoomAt(v, DOUBLE_TAP_ZOOM, p.x, p.y)));
      lastTap.current = { t: 0, x: 0, y: 0 };
    } else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
  };

  const onWheel = (e: React.WheelEvent) => {
    const p = rel(e.clientX, e.clientY);
    setAnimate(false);
    setView((v) => zoomAt(v, v.s * Math.exp(-e.deltaY * 0.0015), p.x, p.y));
  };

  const step = (factor: number) => {
    setAnimate(true);
    setView((v) => zoomAt(v, v.s * factor, 0, 0));
  };

  // Bij formaatwijziging opnieuw begrenzen
  useEffect(() => setView((v) => clamp(v)), [clamp]);

  return createPortal(
    <div className="viewer" ref={rootRef} role="dialog" aria-label="Volledig scherm">
      <div
        className="viewer-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {url && fit > 0 && (
          <img
            src={url}
            alt="Voorbeeld op volle grootte"
            draggable={false}
            className={animate ? 'viewer-img animate' : 'viewer-img'}
            style={{
              width: baseW,
              height: baseH,
              transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.s})`,
            }}
          />
        )}
      </div>

      <button className="viewer-close" onClick={close} aria-label="Sluiten">
        ✕
      </button>

      <div className="viewer-bar">
        <button onClick={() => step(1 / 1.5)} disabled={view.s <= MIN} aria-label="Uitzoomen">
          −
        </button>
        <button
          className="viewer-level"
          onClick={() => {
            setAnimate(true);
            setView({ s: 1, x: 0, y: 0 });
          }}
          aria-label="Passend maken"
        >
          {Math.round(view.s * 100)}%
        </button>
        <button onClick={() => step(1.5)} disabled={view.s >= MAX} aria-label="Inzoomen">
          +
        </button>
      </div>
      {view.s === 1 && <p className="viewer-hint">Knijp of tik twee keer om in te zoomen</p>}
    </div>,
    document.body,
  );
}
