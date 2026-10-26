import type { ListField, ListItem } from '../templates/types';

interface Props {
  field: ListField;
  value: ListItem[];
  onChange: (v: ListItem[]) => void;
}

export function ListInput({ field, value, onChange }: Props) {
  const update = (i: number, key: string, v: string) =>
    onChange(value.map((item, j) => (j === i ? { ...item, [key]: v } : item)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
  const add = () => {
    const last = value[value.length - 1];
    // Neem datum/tijd van de vorige rij over; dat scheelt typen.
    const item: ListItem = {};
    for (const c of field.columns) item[c.key] = c.type === 'date' || c.type === 'time' ? (last?.[c.key] ?? '') : '';
    onChange([...value, item]);
  };

  const template = field.columns.map((c) => `${c.width ?? 1}fr`).join(' ');

  return (
    <div className="field">
      <span className="label">{field.label}</span>
      <div className="list">
        {value.map((item, i) => (
          <div className="list-item" key={i}>
            <div className="list-item-head">
              <span>
                {field.itemLabel} {i + 1}
              </span>
              <div className="list-tools">
                <button aria-label="Omhoog" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button aria-label="Omlaag" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                  ↓
                </button>
                <button aria-label="Verwijderen" onClick={() => remove(i)}>
                  ✕
                </button>
              </div>
            </div>
            <div className="list-cols" style={{ gridTemplateColumns: template }}>
              {field.columns.map((c) => (
                <label key={c.key} className="list-col">
                  {c.label && <span>{c.label}</span>}
                  <input
                    type={c.type === 'number' ? 'text' : (c.type ?? 'text')}
                    inputMode={c.type === 'number' ? 'numeric' : undefined}
                    placeholder={c.placeholder}
                    value={item[c.key] ?? ''}
                    onChange={(e) => update(i, c.key, e.target.value)}
                    aria-label={c.label || c.placeholder}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
        {value.length < field.max && (
          <button className="btn btn-add" onClick={add}>
            + {field.itemLabel} toevoegen
          </button>
        )}
      </div>
    </div>
  );
}
