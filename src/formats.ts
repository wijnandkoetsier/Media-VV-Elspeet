export type FormatId = 'post' | 'square' | 'story';

export interface Format {
  id: FormatId;
  label: string;
  width: number;
  height: number;
}

export const formats: Record<FormatId, Format> = {
  post: { id: 'post', label: 'Post 4:5', width: 1080, height: 1350 },
  square: { id: 'square', label: 'Vierkant', width: 1080, height: 1080 },
  story: { id: 'story', label: 'Story 9:16', width: 1080, height: 1920 },
};
