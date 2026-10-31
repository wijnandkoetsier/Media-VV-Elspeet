interface Props {
  label: string;
  count: number;
  index: number;
  max: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

/** Kiezen, toevoegen, dupliceren, verplaatsen en verwijderen van dia's in een carrousel. */
export function SlideBar({ label, count, index, max, onSelect, onAdd, onDuplicate, onRemove, onMove }: Props) {
  return (
    <div className="slidebar">
      <div className="slidebar-head">
        <span className="label">
          Carrousel · {count} {count === 1 ? 'afbeelding' : 'afbeeldingen'}
        </span>
      </div>
      <div className="slidebar-chips">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} className={i === index ? 'active' : ''} onClick={() => onSelect(i)}>
            {label} {i + 1}
          </button>
        ))}
        {count < max && (
          <button className="slidebar-add" onClick={onAdd}>
            + {label}
          </button>
        )}
      </div>
      <div className="slidebar-tools">
        <button onClick={() => onMove(-1)} disabled={index === 0} aria-label="Naar links">
          ←
        </button>
        <button onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Naar rechts">
          →
        </button>
        <button onClick={onDuplicate} disabled={count >= max}>
          ⧉ Dupliceren
        </button>
        <button onClick={onRemove} disabled={count <= 1} className="danger">
          ✕ Verwijderen
        </button>
      </div>
    </div>
  );
}
