import { useEffect, useMemo, useRef, useState } from 'react';
import { canShareFiles, downloadCanvas, exportName, shareCanvas } from '../export';
import { fontsReady, loadImage, loadLogo, renderTemplate } from '../render/render';
import { clearDraft, loadDraft, saveDraft } from '../storage';
import { baseDesign, type Design, type FieldValue, type ImageValue, type TemplateData, type TemplateDef } from '../templates/types';
import { DesignPanel } from './DesignPanel';
import { FieldInput } from './FieldInput';

type Tab = 'inhoud' | 'fotos' | 'ontwerp';

const initialDesign = (tpl: TemplateDef): Design => ({ ...baseDesign, ...tpl.defaultDesign });

export function Editor({ tpl, onBack }: { tpl: TemplateDef; onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<TemplateData>(tpl.defaults);
  const [design, setDesign] = useState<Design>(() => initialDesign(tpl));
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [logo, setLogo] = useState<HTMLImageElement>();
  const [images, setImages] = useState<Record<string, HTMLImageElement | undefined>>({});
  const [tab, setTab] = useState<Tab>('inhoud');
  const [status, setStatus] = useState('');
  const shareable = useMemo(canShareFiles, []);

  const imageFields = tpl.fields.filter((f) => f.type === 'image');
  const contentFields = tpl.fields.filter((f) => f.type !== 'image');

  // Concept van vorige keer laden
  useEffect(() => {
    let alive = true;
    loadDraft(tpl.id).then((draft) => {
      if (!alive) return;
      if (draft) {
        setData({ ...tpl.defaults, ...draft.data });
        setDesign({ ...initialDesign(tpl), ...draft.design });
      }
      setLoaded(true);
    });
    Promise.all([fontsReady(), loadLogo()]).then(([, l]) => {
      if (!alive) return;
      setLogo(l);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [tpl]);

  // Automatisch opslaan
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => saveDraft(tpl.id, { data, design }), 400);
    return () => clearTimeout(t);
  }, [data, design, loaded, tpl.id]);

  // Geüploade afbeeldingen laden
  const imageSrcs = imageFields.map((f) => (data[f.key] as ImageValue | null)?.src ?? '').join('|');
  useEffect(() => {
    let alive = true;
    Promise.all(
      imageFields.map(async (f) => {
        const v = data[f.key] as ImageValue | null;
        if (!v?.src) return [f.key, undefined] as const;
        try {
          return [f.key, await loadImage(v.src)] as const;
        } catch {
          return [f.key, undefined] as const;
        }
      }),
    ).then((entries) => alive && setImages(Object.fromEntries(entries)));
    return () => {
      alive = false;
    };
  }, [imageSrcs]);

  // Tekenen
  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) renderTemplate(canvasRef.current, tpl, data, design, images, logo);
    });
    return () => cancelAnimationFrame(id);
  }, [ready, tpl, data, design, images, logo]);

  const setField = (key: string, v: FieldValue) => setData((d) => ({ ...d, [key]: v }));

  async function onExport(mode: 'share' | 'download') {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setStatus('');
    try {
      const name = exportName(tpl.id);
      if (mode === 'share') {
        const r = await shareCanvas(canvas, name);
        if (r === 'shared') setStatus('Gedeeld ✓');
      } else {
        await downloadCanvas(canvas, name);
        setStatus('Afbeelding gedownload ✓');
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Exporteren mislukt');
    }
  }

  async function onReset() {
    if (!confirm('Alle wijzigingen voor dit template wissen?')) return;
    await clearDraft(tpl.id);
    setData(tpl.defaults);
    setDesign(initialDesign(tpl));
  }

  return (
    <div className="editor">
      <header className="bar">
        <button className="icon-btn" onClick={onBack} aria-label="Terug">
          ←
        </button>
        <h1>
          <span aria-hidden>{tpl.emoji}</span> {tpl.name}
        </h1>
        <button className="icon-btn small" onClick={onReset}>
          Reset
        </button>
      </header>

      <div className="preview">
        <canvas ref={canvasRef} className={`canvas canvas-${design.format}`} />
        {!ready && <div className="preview-loading">Laden…</div>}
      </div>

      <nav className="tabs">
        <button className={tab === 'inhoud' ? 'active' : ''} onClick={() => setTab('inhoud')}>
          Inhoud
        </button>
        <button className={tab === 'fotos' ? 'active' : ''} onClick={() => setTab('fotos')}>
          Afbeeldingen
        </button>
        <button className={tab === 'ontwerp' ? 'active' : ''} onClick={() => setTab('ontwerp')}>
          Ontwerp
        </button>
      </nav>

      <main className="panel">
        {tab === 'inhoud' &&
          contentFields.map((f) => (
            <FieldInput key={f.key} field={f} value={data[f.key] ?? null} onChange={(v) => setField(f.key, v)} />
          ))}
        {tab === 'fotos' &&
          imageFields.map((f) => (
            <FieldInput key={f.key} field={f} value={data[f.key] ?? null} onChange={(v) => setField(f.key, v)} />
          ))}
        {tab === 'ontwerp' && <DesignPanel design={design} onChange={setDesign} />}
      </main>

      <footer className="export-bar">
        {status && <span className="status">{status}</span>}
        <div className="export-buttons">
          {shareable && (
            <button className="btn btn-primary" onClick={() => onExport('share')}>
              Delen / opslaan
            </button>
          )}
          <button className={`btn ${shareable ? '' : 'btn-primary'}`} onClick={() => onExport('download')}>
            Download PNG
          </button>
        </div>
      </footer>
    </div>
  );
}
