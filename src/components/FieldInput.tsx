import type { FieldDef, FieldValue } from '../templates/types';
import { ImageInput } from './ImageInput';
import { ListInput } from './ListInput';

interface Props {
  field: FieldDef;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
}

export function FieldInput({ field, value, onChange }: Props) {
  switch (field.type) {
    case 'image':
      return (
        <ImageInput
          field={field}
          value={value && typeof value === 'object' && !Array.isArray(value) ? value : null}
          onChange={onChange}
        />
      );
    case 'list':
      return <ListInput field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case 'select':
      return (
        <label className="field">
          <span className="label">{field.label}</span>
          <select value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );
    case 'textarea':
      return (
        <label className="field">
          <span className="label">{field.label}</span>
          <textarea
            rows={3}
            placeholder={field.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );
    default:
      return (
        <label className="field">
          <span className="label">{field.label}</span>
          {field.hint && <span className="hint">{field.hint}</span>}
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );
  }
}
