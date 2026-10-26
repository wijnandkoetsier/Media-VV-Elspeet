import { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  addToGallery,
  getGallerySrc,
  listGallery,
  onGalleryChange,
  removeFromGallery,
  renameGalleryItem,
  type GalleryItem,
} from '../gallery';
import { fileToDataUrl } from '../upload';

type Filter = 'alle' | 'fotos' | 'transparant';

function useGallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => listGallery().then((l) => alive && setItems(l));
    load();
    const off = onGalleryChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return items;
}

interface GridProps {
  /** Bij kiezen: geeft de volledige afbeelding terug. Zonder: beheermodus. */
  onPick?: (src: string, item: GalleryItem) => void;
  initialFilter?: Filter;
}

export function GalleryGrid({ onPick, initialFilter = 'alle' }: GridProps) {
  const items = useGallery();
  const inputId = useId();
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (i) =>
        (filter === 'alle' || (filter === 'transparant') === i.transparent) &&
        (!q || i.name.toLowerCase().includes(q)),
    );
  }, [items, filter, query]);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    setError('');
    for (let n = 0; n < files.length; n++) {
      setBusy(`Toevoegen ${n + 1}/${files.length}…`);
      try {
        await addToGallery(await fileToDataUrl(files[n], false), files[n].name);
      } catch {
        setError(`"${files[n].name}" kon niet worden toegevoegd.`);
      }
    }
    setBusy('');
  }

  async function onTile(item: GalleryItem) {
    if (editing || !onPick) {
      const name = prompt('Naam van de afbeelding', item.name);
      if (name !== null && name.trim()) await renameGalleryItem(item.id, name.trim());
      return;
    }
    const src = await getGallerySrc(item.id);
    if (src) onPick(src, item);
    else setError('Deze afbeelding is niet meer beschikbaar.');
  }

  async function onDelete(item: GalleryItem) {
    if (confirm(`"${item.name}" uit de galerij verwijderen?`)) await removeFromGallery(item.id);
  }

  return (
    <div className="gallery">
      <div className="gallery-tools">
        <input
          type="search"
          placeholder="Zoeken op naam…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Zoeken"
        />
        <div className="chips">
          {(
            [
              ['alle', 'Alles'],
              ['fotos', "Foto's"],
              ['transparant', 'Transparant / logo'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="gallery-actions">
          <label htmlFor={inputId} className="btn">
            {busy || '+ Toevoegen'}
          </label>
          <input id={inputId} type="file" accept="image/*" multiple onChange={onFiles} hidden />
          {!!items?.length && (
            <button className={`btn btn-ghost ${editing ? 'active' : ''}`} onClick={() => setEditing((v) => !v)}>
              {editing ? 'Klaar' : 'Bewerken'}
            </button>
          )}
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {items === null ? (
        <p className="gallery-empty">Laden…</p>
      ) : shown.length === 0 ? (
        <p className="gallery-empty">
          {items.length
            ? 'Geen afbeeldingen gevonden.'
            : 'De galerij is nog leeg. Afbeeldingen die je uploadt komen hier automatisch in.'}
        </p>
      ) : (
        <div className="gallery-grid">
          {shown.map((item) => (
            <div key={item.id} className="gallery-tile">
              <button
                className={`gallery-img ${item.transparent ? 'thumb-cutout' : ''}`}
                onClick={() => onTile(item)}
                aria-label={item.name}
              >
                <img src={item.thumb} alt="" loading="lazy" />
              </button>
              <span className="gallery-name">{item.name}</span>
              {editing && (
                <button className="gallery-del" onClick={() => onDelete(item)} aria-label="Verwijderen">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {editing && <p className="hint">Tik op een afbeelding om de naam te wijzigen.</p>}
    </div>
  );
}

/** Schuifpaneel om in de editor snel een afbeelding uit de galerij te kiezen. */
export function GalleryPicker({
  onPick,
  onClose,
  preferTransparent,
}: {
  onPick: (src: string, item: GalleryItem) => void;
  onClose: () => void;
  preferTransparent?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Via een portal direct in <body>, zodat het paneel altijd boven alles ligt.
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Galerij">
        <div className="sheet-head">
          <h2>Kies uit galerij</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Sluiten">
            ✕
          </button>
        </div>
        <div className="sheet-body">
          <GalleryGrid onPick={onPick} initialFilter={preferTransparent ? 'transparant' : 'alle'} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function GalleryPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="editor gallery-page">
      <header className="bar">
        <button className="icon-btn" onClick={onBack} aria-label="Terug">
          ←
        </button>
        <h1>
          <span aria-hidden>🖼️</span> Galerij
        </h1>
      </header>
      <main className="panel">
        <GalleryGrid />
      </main>
    </div>
  );
}
