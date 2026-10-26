import { formats, type FormatId } from '../formats';
import { palette, type Variant } from '../theme';
import type { Design } from '../templates/types';
import { Slider } from './ImageInput';

const variants: { id: Variant; label: string }[] = [
  { id: 'primary', label: 'Club' },
  { id: 'secondary', label: 'Licht' },
  { id: 'dark', label: 'Donker' },
];

export function DesignPanel({ design, onChange }: { design: Design; onChange: (d: Design) => void }) {
  const set = (patch: Partial<Design>) => onChange({ ...design, ...patch });
  return (
    <div className="design">
      <div className="field">
        <span className="label">Formaat</span>
        <div className="segmented">
          {(Object.keys(formats) as FormatId[]).map((id) => (
            <button key={id} className={design.format === id ? 'active' : ''} onClick={() => set({ format: id })}>
              <span className={`ratio ratio-${id}`} />
              {formats[id].label}
              <small>
                {formats[id].width}×{formats[id].height}
              </small>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="label">Kleurstijl</span>
        <div className="segmented">
          {variants.map((v) => {
            const p = palette(v.id);
            return (
              <button key={v.id} className={design.variant === v.id ? 'active' : ''} onClick={() => set({ variant: v.id })}>
                <span className="swatch" style={{ background: p.bg, borderColor: p.accent }} />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
      <Slider
        label="Donkere laag over foto"
        min={0}
        max={0.9}
        step={0.01}
        value={design.overlay}
        onChange={(overlay) => set({ overlay })}
      />
      <Slider
        label="Tekstgrootte"
        min={0.75}
        max={1.3}
        step={0.01}
        value={design.textScale}
        onChange={(textScale) => set({ textScale })}
      />
      <label className="toggle">
        <input type="checkbox" checked={design.showLogo} onChange={(e) => set({ showLogo: e.target.checked })} />
        <span>Clublogo tonen</span>
      </label>
    </div>
  );
}
