import { useRef } from 'react';

/** preview = groot voorbeeld, half = half/half, input = invoer op het hele scherm. */
export type SheetState = 'preview' | 'half' | 'input';

interface Props {
  state: SheetState;
  onChange: (s: SheetState) => void;
  /** Het voorbeeld-element waarvan de hoogte tijdens het slepen meebeweegt. */
  previewRef: React.RefObject<HTMLDivElement | null>;
  /** Hoogtes van het voorbeeld per stand (px). */
  heights: Record<SheetState, number>;
}

const order: SheetState[] = ['input', 'half', 'preview'];

/**
 * Greep tussen voorbeeld en invoervelden.
 * Omlaag vegen = voorbeeld groter (tot volledig scherm), omhoog = invoer groter.
 * Het voorbeeld volgt de vinger en klikt bij loslaten naar de dichtstbijzijnde stand.
 */
export function SheetHandle({ state, onChange, previewRef, heights }: Props) {
  const drag = useRef<{ y: number; t: number; startH: number; lastY: number; lastT: number; moved: boolean } | null>(
    null,
  );

  const onPointerDown = (e: React.PointerEvent) => {
    const el = previewRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = Date.now();
    drag.current = { y: e.clientY, t: now, startH: el.offsetHeight, lastY: e.clientY, lastT: now, moved: false };
    el.classList.add('dragging');
  };

  const heightFor = (clientY: number) => {
    const d = drag.current!;
    return Math.min(heights.preview, Math.max(0, d.startH + (clientY - d.y)));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = previewRef.current;
    if (!d || !el) return;
    if (Math.abs(e.clientY - d.y) > 6) d.moved = true;
    el.style.height = `${heightFor(e.clientY)}px`;
    el.style.minHeight = '0';
    d.lastY = e.clientY;
    d.lastT = Date.now();
  };

  const finish = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = previewRef.current;
    if (!d || !el) return;
    const h = heightFor(e.clientY);
    drag.current = null;
    el.classList.remove('dragging');

    let next: SheetState;
    if (!d.moved) {
      // Tikken: half → invoer, anders terug naar half
      next = state === 'half' ? 'input' : 'half';
    } else {
      // Snelheid meenemen, zodat een korte veeg ook naar de volgende stand gaat
      const v = (e.clientY - d.y) / Math.max(1, Date.now() - d.t);
      const projected = h + v * 220;
      next = order.reduce((best, s) =>
        Math.abs(heights[s] - projected) < Math.abs(heights[best] - projected) ? s : best,
      );
      // Nooit in één veeg twee standen overslaan, tenzij echt zo ver gesleept
      const from = order.indexOf(state);
      const to = order.indexOf(next);
      if (Math.abs(to - from) > 1 && Math.abs(h - heights[state]) < (heights.preview - heights.input) * 0.6) {
        next = order[from + Math.sign(to - from)];
      }
    }
    // Vanaf de gesleepte hoogte naar de nieuwe stand animeren
    el.style.height = `${h}px`;
    void el.offsetHeight;
    el.style.height = `${heights[next]}px`;
    el.style.minHeight = '0';
    onChange(next);
  };

  const label =
    state === 'half' ? '↓ groot voorbeeld · ↑ meer invoer' : state === 'input' ? '↓ Voorbeeld tonen' : '↑ Invoer tonen';

  return (
    <div
      className="sheet-handle"
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') onChange(order[Math.max(0, order.indexOf(state) - 1)]);
        if (e.key === 'ArrowDown') onChange(order[Math.min(2, order.indexOf(state) + 1)]);
      }}
    >
      <span className="sheet-grip" />
      <span className="sheet-label">{label}</span>
    </div>
  );
}
