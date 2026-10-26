import { useId, useState } from 'react';
import type { ImageField, ImageValue } from '../templates/types';
import { removeBackground } from '../bgremove';
import { addToGallery } from '../gallery';
import { fileToDataUrl } from '../upload';
import { GalleryPicker } from './Gallery';

interface Props {
  field: ImageField;
  value: ImageValue | null;
  onChange: (v: ImageValue | null) => void;
}

export function ImageInput({ field, value, onChange }: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const src = await fileToDataUrl(file, !!field.alpha);
      onChange({ src, zoom: 1, x: 0.5, y: 0.5 });
      addToGallery(src, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uploaden mislukt');
    } finally {
      setBusy(false);
    }
  }

  const set = (patch: Partial<ImageValue>) => value && onChange({ ...value, ...patch });

  async function onRemoveBackground() {
    if (!value) return;
    setRemoving(true);
    setError('');
    try {
      const src = await removeBackground(value.src);
      onChange({ ...value, src, original: value.src });
      addToGallery(src, 'Zonder achtergrond');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Achtergrond verwijderen mislukt');
    } finally {
      setRemoving(false);
    }
  }

  const restore = () => value?.original && onChange({ ...value, src: value.original, original: undefined });

  return (
    <div className="field image-field">
      <span className="label">{field.label}</span>
      {field.hint && <span className="hint">{field.hint}</span>}
      <div className="image-row">
        <div className={`thumb ${field.alpha ? 'thumb-alpha' : ''} ${value?.src.startsWith('data:image/png') ? 'thumb-cutout' : ''}`}>
          {value ? <img src={value.src} alt="" /> : <span>Geen</span>}
        </div>
        <div className="image-actions">
          <label htmlFor={id} className="btn">
            {busy ? 'Bezig…' : value ? 'Vervangen' : 'Kies afbeelding'}
          </label>
          <input id={id} type="file" accept="image/*" onChange={onFile} hidden />
          <button className="btn" onClick={() => setPicking(true)}>
            🖼️ Galerij
          </button>
          {value && (
            <button className="btn btn-ghost" onClick={() => onChange(null)}>
              Verwijderen
            </button>
          )}
        </div>
      </div>
      {value && !field.alpha && (
        <div className="bg-remove">
          {value.original ? (
            <button className="btn btn-ghost" onClick={restore}>
              ↺ Achtergrond terugzetten
            </button>
          ) : (
            <button className="btn btn-magic" onClick={onRemoveBackground} disabled={removing}>
              {removing ? 'Achtergrond verwijderen…' : '✨ Achtergrond verwijderen'}
            </button>
          )}
          {removing && <span className="hint">De eerste keer duurt dit even (model laden).</span>}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {picking && (
        <GalleryPicker
          preferTransparent={field.alpha}
          onClose={() => setPicking(false)}
          onPick={(src) => {
            onChange({ src, zoom: 1, x: 0.5, y: 0.5 });
            setPicking(false);
          }}
        />
      )}
      {value && !field.alpha && (
        <div className="sliders">
          <Slider
            label={`Zoom ${value.zoom.toFixed(2).replace('.', ',')}×`}
            min={0.3}
            max={3}
            step={0.01}
            value={value.zoom}
            onChange={(zoom) => set({ zoom: Math.abs(zoom - 1) < 0.03 ? 1 : zoom })}
          />
          <span className="hint">Links = kleiner (uitzoomen), rechts = groter</span>
          <Slider label="Links ↔ rechts" min={0} max={1} step={0.01} value={value.x} onChange={(x) => set({ x })} />
          <Slider label="Boven ↕ onder" min={0} max={1} step={0.01} value={value.y} onChange={(y) => set({ y })} />
        </div>
      )}
    </div>
  );
}

export function Slider(props: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="slider">
      <span>{props.label}</span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}
