import type { FormatId, Format } from '../formats';
import type { Palette, Variant } from '../theme';

export interface ImageValue {
  /** dataURL van de (verkleinde) upload. */
  src: string;
  /** 1 = vullend, hoger = inzoomen. */
  zoom: number;
  /** Focuspunt 0..1 (0 = links/boven). */
  x: number;
  y: number;
}

interface BaseField {
  key: string;
  label: string;
  hint?: string;
}

export interface TextField extends BaseField {
  type: 'text' | 'textarea' | 'date' | 'time' | 'url';
  placeholder?: string;
}

export interface SelectField extends BaseField {
  type: 'select';
  options: { value: string; label: string }[];
}

export interface ImageField extends BaseField {
  type: 'image';
  /** Bewaar transparantie (logo's) i.p.v. JPEG. */
  alpha?: boolean;
}

export interface ListColumn {
  key: string;
  label: string;
  type?: 'text' | 'time' | 'date' | 'number';
  placeholder?: string;
  /** Relatieve breedte van het invoerveld in de editor. */
  width?: number;
}

export interface ListField extends BaseField {
  type: 'list';
  itemLabel: string;
  columns: ListColumn[];
  max: number;
}

export type FieldDef = TextField | SelectField | ImageField | ListField;

export type ListItem = Record<string, string>;
export type FieldValue = string | ImageValue | ListItem[] | null;
export type TemplateData = Record<string, FieldValue>;

export interface Design {
  format: FormatId;
  variant: Variant;
  /** Donkerte van de laag over foto's, 0..1. */
  overlay: number;
  /** Vermenigvuldiger voor tekstgrootte. */
  textScale: number;
  showLogo: boolean;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  format: Format;
  design: Design;
  pal: Palette;
  /** Geladen afbeeldingen per veld-key. */
  images: Record<string, HTMLImageElement | undefined>;
  logo?: HTMLImageElement;
}

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  fields: FieldDef[];
  defaults: TemplateData;
  defaultDesign?: Partial<Design>;
  draw: (rc: RenderContext, data: TemplateData) => void;
}

export const baseDesign: Design = {
  format: 'post',
  variant: 'primary',
  overlay: 0.55,
  textScale: 1,
  showLogo: true,
};

/** Hulpjes om waarden veilig uit TemplateData te lezen. */
export const str = (d: TemplateData, k: string): string => {
  const v = d[k];
  return typeof v === 'string' ? v : '';
};
export const list = (d: TemplateData, k: string): ListItem[] => {
  const v = d[k];
  return Array.isArray(v) ? v : [];
};
export const img = (d: TemplateData, k: string): ImageValue | null => {
  const v = d[k];
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
};
