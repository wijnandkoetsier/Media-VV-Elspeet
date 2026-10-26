import { useRef } from 'react';

interface Props {
  expanded: boolean;
  onChange: (expanded: boolean) => void;
  /** Het voorbeeld-element waarvan de hoogte tijdens het slepen meebeweegt. */
  previewRef: React.RefObject<HTMLDivElement | null>;
}

const THRESHOLD = 50; // px slepen om te wisselen
const FLICK = 0.4; // px/ms: snelle veeg telt ook

/**
 * Greep tussen voorbeeld en invoervelden. Omhoog vegen = invoer op het hele scherm,
 * omlaag vegen = terug naar half. Tikken wisselt ook.
 */
export function SheetHandle({ expanded, onChange, previewRef }: Props) {
  const drag = useRef<{ y: number; t: number; startH: number; maxH: number; moved: boolean } | null>(null);

  const normalHeight = () => Math.max(220, window.innerHeight * 0.4);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = previewRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, t: Date.now(), startH: el.offsetHeight, maxH: normalHeight(), moved: false };
    el.classList.add('dragging');
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = previewRef.current;
    if (!d || !el) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 6) d.moved = true;
    const h = Math.min(d.maxH, Math.max(0, d.startH + dy));
    el.style.height = `${h}px`;
    el.style.minHeight = '0';
  };

  const finish = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = previewRef.current;
    drag.current = null;
    if (!d || !el) return;
    el.classList.remove('dragging');
    el.style.height = '';
    el.style.minHeight = '';
    const dy = e.clientY - d.y;
    const v = dy / Math.max(1, Date.now() - d.t);
    if (!d.moved) onChange(!expanded);
    else if (dy < -THRESHOLD || v < -FLICK) onChange(true);
    else if (dy > THRESHOLD || v > FLICK) onChange(false);
  };

  return (
    <div
      className="sheet-handle"
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={expanded ? 'Voorbeeld tonen' : 'Invoer op volledig scherm'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(!expanded)}
    >
      <span className="sheet-grip" />
      <span className="sheet-label">{expanded ? '▼ Voorbeeld tonen' : '▲ Veeg omhoog voor meer ruimte'}</span>
    </div>
  );
}
