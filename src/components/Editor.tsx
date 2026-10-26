import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { canShareFiles, downloadCanvas, exportName, shareCanvas } from '../export';
import { fontsReady, loadImage, loadLogo, renderTemplate } from '../render/render';
import { clearDraft, loadDraft, saveDraft } from '../storage';
import { baseDesign, type Design, type FieldValue, type ImageValue, type TemplateData, type TemplateDef } from '../templates/types';
import { DesignPanel } from './DesignPanel';
import { FieldInput } from './FieldInput';
import { FullscreenViewer } from './FullscreenViewer';
import { SheetHandle, type SheetState } from './SheetHandle';

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
  const [fullscreen, setFullscreen] = useState(false);
  const [sheet, setSheet] = useState<SheetState>('half');
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<Record<SheetState, number> | null>(null);

  // Hoogtes van het voorbeeld per stand berekenen (en bijwerken bij draaien/resize).
  useLayoutEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const measure = () => {
      if (window.innerWidth >= 900) return setHeights(null); // brede layout: naast elkaar, geen greep
      const h = (sel: string) => (ed.querySelector(sel) as HTMLElement | null)?.offsetHeight ?? 0;
      const handle = ed.querySelector('.sheet-handle');
      const overlap = handle ? -parseFloat(getComputedStyle(handle).marginTop) || 0 : 0; // greep schuift iets over het voorbeeld
      const full = ed.clientHeight - h('.bar') - h('.sheet-handle') - h('.export-bar') + overlap;
      setHeights({ input: 0, half: Math.round(Math.max(220, ed.clientHeight * 0.4)), preview: Math.max(0, full) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ed);
    return () => ro.disconnect();
  }, []);
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
        const merged = { ...initialDesign(tpl), ...draft.design };
        // Oude concepten kunnen een kleurstijl hebben die niet meer bestaat.
        if (!['primary', 'secondary', 'gold'].includes(merged.variant)) merged.variant = 'primary';
        setDesign(merged);
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
    <div className={`editor sheet-${sheet}`} ref={editorRef}>
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

      <div
        className="preview"
        ref={previewRef}
        aria-hidden={sheet === 'input'}
        style={heights ? { height: heights[sheet], minHeight: 0 } : undefined}
      >
        <canvas
          ref={canvasRef}
          className={`canvas canvas-${design.format}`}
          onClick={() => ready && setFullscreen(true)}
          title="Tik om in te zoomen"
        />
        {!ready && <div className="preview-loading">Laden…</div>}
      </div>
      {fullscreen && canvasRef.current && (
        <FullscreenViewer canvas={canvasRef.current} onClose={() => setFullscreen(false)} />
      )}

      <SheetHandle
        state={sheet}
        onChange={setSheet}
        previewRef={previewRef}
        heights={heights ?? { input: 0, half: 0, preview: 0 }}
      />

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
