import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { canShareFiles, downloadCanvas, downloadCanvases, exportName, shareCanvas, shareCanvases } from '../export';
import { fontsReady, loadImage, loadLogo, renderTemplate } from '../render/render';
import { clearDraft, loadDraft, saveDraft } from '../storage';
import {
  baseDesign,
  slides as readSlides,
  type Design,
  type FieldDef,
  type FieldValue,
  type ImageValue,
  type SlideItem,
  type TemplateData,
  type TemplateDef,
} from '../templates/types';
import { DesignPanel } from './DesignPanel';
import { FieldInput } from './FieldInput';
import { FullscreenViewer } from './FullscreenViewer';
import { SheetHandle, type SheetState } from './SheetHandle';
import { SlideBar } from './SlideBar';

type Tab = 'inhoud' | 'fotos' | 'ontwerp';

const initialDesign = (tpl: TemplateDef): Design => ({ ...baseDesign, ...tpl.defaultDesign });

type Images = Record<string, HTMLImageElement | undefined>;

/** Laadt de afbeeldingen van de gegeven beeldvelden uit een set waarden. */
async function loadFieldImages(fields: FieldDef[], values: Record<string, unknown>): Promise<Images> {
  const entries = await Promise.all(
    fields.map(async (f) => {
      const v = values[f.key] as ImageValue | null | undefined;
      if (!v?.src) return [f.key, undefined] as const;
      try {
        return [f.key, await loadImage(v.src)] as const;
      } catch {
        return [f.key, undefined] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

const isImage = (f: FieldDef) => f.type === 'image';

export function Editor({ tpl, onBack }: { tpl: TemplateDef; onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<TemplateData>(tpl.defaults);
  const [design, setDesign] = useState<Design>(() => initialDesign(tpl));
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [logo, setLogo] = useState<HTMLImageElement>();
  const [images, setImages] = useState<Images>({});
  const [slideImages, setSlideImages] = useState<Images[]>([]);
  const [slide, setSlide] = useState(0);
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

  const imageFields = tpl.fields.filter(isImage);
  const contentFields = tpl.fields.filter((f) => !isImage(f));

  // Carrousel (alleen bij templates met dia's)
  const sd = tpl.slides;
  const slideList = sd ? readSlides(data, sd.key) : [];
  const slideCount = sd ? Math.max(1, slideList.length) : 1;
  const current = Math.min(slide, slideCount - 1);
  const slideImageFields = sd ? sd.fields.filter(isImage) : [];
  const slideContentFields = sd ? sd.fields.filter((f) => !isImage(f)) : [];

  /** Gegevens en afbeeldingen voor dia i, samengevoegd met de gewone velden. */
  const slideData = (i: number): TemplateData => (sd ? { ...data, ...(slideList[i] ?? {}) } : data);
  const slideImgs = (i: number): Images => (sd ? { ...images, ...(slideImages[i] ?? {}) } : images);

  // Concept van vorige keer laden
  useEffect(() => {
    let alive = true;
    loadDraft(tpl.id).then((draft) => {
      if (!alive) return;
      if (draft) {
        // Eerst omzetten (oude velden), dan aanvullen met standaardwaarden voor nieuwe velden.
        setData({ ...tpl.defaults, ...(tpl.migrate ? tpl.migrate(draft.data) : draft.data) });
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

  // Geüploade afbeeldingen laden (gewone velden en die van elke dia)
  const imageSrcs = imageFields.map((f) => (data[f.key] as ImageValue | null)?.src ?? '').join('|');
  const slideSrcs = slideList
    .map((it) => slideImageFields.map((f) => (it[f.key] as ImageValue | null)?.src ?? '').join(','))
    .join('|');
  useEffect(() => {
    let alive = true;
    loadFieldImages(imageFields, data).then((m) => alive && setImages(m));
    return () => {
      alive = false;
    };
  }, [imageSrcs]);
  useEffect(() => {
    let alive = true;
    Promise.all(slideList.map((it) => loadFieldImages(slideImageFields, it))).then(
      (m) => alive && setSlideImages(m),
    );
    return () => {
      alive = false;
    };
  }, [slideSrcs]);

  // Tekenen
  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) renderTemplate(canvasRef.current, tpl, slideData(current), design, slideImgs(current), logo);
    });
    return () => cancelAnimationFrame(id);
  }, [ready, tpl, data, design, images, slideImages, current, logo]);

  const setField = (key: string, v: FieldValue) => setData((d) => ({ ...d, [key]: v }));

  // ---- Dia's bewerken ----
  const setSlides = (fn: (list: SlideItem[]) => SlideItem[]) =>
    sd && setData((d) => ({ ...d, [sd.key]: fn(readSlides(d, sd.key)) }));
  const setSlideField = (key: string, v: FieldValue) =>
    setSlides((list) => list.map((it, i) => (i === current ? { ...it, [key]: v as SlideItem[string] } : it)));
  const addSlide = () => {
    if (!sd) return;
    setSlides((list) => [...list, sd.create()]);
    setSlide(slideCount);
  };
  const duplicateSlide = () => {
    setSlides((list) => [...list.slice(0, current + 1), { ...list[current] }, ...list.slice(current + 1)]);
    setSlide(current + 1);
  };
  const removeSlide = () => {
    if (slideCount <= 1 || !confirm(`${sd?.label ?? 'Dia'} ${current + 1} verwijderen?`)) return;
    setSlides((list) => list.filter((_, i) => i !== current));
    setSlide(Math.max(0, current - 1));
  };
  const moveSlide = (dir: -1 | 1) => {
    const j = current + dir;
    if (j < 0 || j >= slideCount) return;
    setSlides((list) => {
      const next = [...list];
      [next[current], next[j]] = [next[j], next[current]];
      return next;
    });
    setSlide(j);
  };

  const slideBar = sd && (
    <SlideBar
      label={sd.label}
      count={slideCount}
      index={current}
      max={sd.max}
      onSelect={setSlide}
      onAdd={addSlide}
      onDuplicate={duplicateSlide}
      onRemove={removeSlide}
      onMove={moveSlide}
    />
  );

  /** Alle dia's apart tekenen voor de export. */
  function renderAllSlides(): HTMLCanvasElement[] {
    return Array.from({ length: slideCount }, (_, i) => {
      const c = document.createElement('canvas');
      renderTemplate(c, tpl, slideData(i), design, slideImgs(i), logo);
      return c;
    });
  }

  async function onExport(mode: 'share' | 'download') {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setStatus('');
    try {
      const name = exportName(tpl.id);
      if (slideCount > 1) {
        const canvases = renderAllSlides();
        const names = canvases.map((_, i) => name.replace(/\.png$/, `-${i + 1}.png`));
        if (mode === 'share') {
          const r = await shareCanvases(canvases, names);
          if (r === 'shared') setStatus(`${canvases.length} afbeeldingen gedeeld ✓`);
        } else {
          await downloadCanvases(canvases, names);
          setStatus(`${canvases.length} afbeeldingen gedownload ✓`);
        }
        return;
      }
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
    setSlide(0);
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
        {slideCount > 1 && (
          <div className="preview-slides">
            <button onClick={() => setSlide(Math.max(0, current - 1))} disabled={current === 0} aria-label="Vorige">
              ‹
            </button>
            <span>
              {current + 1} / {slideCount}
            </span>
            <button
              onClick={() => setSlide(Math.min(slideCount - 1, current + 1))}
              disabled={current === slideCount - 1}
              aria-label="Volgende"
            >
              ›
            </button>
          </div>
        )}
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
        {sd && tab !== 'ontwerp' && (
          <section className="slide-section">
            {slideBar}
            {(tab === 'inhoud' ? slideContentFields : slideImageFields).map((f) => (
              <FieldInput
                key={`${current}-${f.key}`}
                field={f}
                value={(slideList[current]?.[f.key] as FieldValue) ?? null}
                onChange={(v) => setSlideField(f.key, v)}
              />
            ))}
          </section>
        )}
        {tab === 'ontwerp' && <DesignPanel design={design} onChange={setDesign} />}
      </main>

      <footer className="export-bar">
        {status && <span className="status">{status}</span>}
        <div className="export-buttons">
          {shareable && (
            <button className="btn btn-primary" onClick={() => onExport('share')}>
              {slideCount > 1 ? `Delen (${slideCount})` : 'Delen / opslaan'}
            </button>
          )}
          <button className={`btn ${shareable ? '' : 'btn-primary'}`} onClick={() => onExport('download')}>
            {slideCount > 1 ? `Download ${slideCount} PNG's` : 'Download PNG'}
          </button>
        </div>
      </footer>
    </div>
  );
}
