import type { ImageSegmenter } from '@mediapipe/tasks-vision';
import { loadImage } from './render/render';

// Het AI-model (MediaPipe, Google) wordt pas geladen als iemand de functie gebruikt.
// Het herkent personen (haar, gezicht, huid, kleding) en maakt de rest transparant.
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

let segmenter: Promise<ImageSegmenter> | null = null;

async function create(delegate: 'GPU' | 'CPU'): Promise<ImageSegmenter> {
  const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  return ImageSegmenter.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'IMAGE',
    outputConfidenceMasks: true,
    outputCategoryMask: false,
  });
}

function getSegmenter(): Promise<ImageSegmenter> {
  if (!segmenter) {
    segmenter = create('GPU').catch(() => create('CPU'));
    segmenter.catch(() => (segmenter = null));
  }
  return segmenter;
}

/** Zachte overgang: onzekere randpixels worden half doorzichtig i.p.v. hard afgesneden. */
const smooth = (v: number) => {
  const t = Math.min(1, Math.max(0, (v - 0.25) / 0.5));
  return t * t * (3 - 2 * t);
};

/** Verwijdert de achtergrond rond personen; geeft een PNG-dataURL met transparantie terug. */
export async function removeBackground(src: string): Promise<string> {
  let image: HTMLImageElement;
  let seg: ImageSegmenter;
  try {
    [image, seg] = await Promise.all([loadImage(src), getSegmenter()]);
  } catch {
    throw new Error('Kon de achtergrond-verwijderaar niet laden. Controleer je internetverbinding.');
  }

  const result = seg.segment(image);
  const bg = result.confidenceMasks?.[0];
  if (!bg) {
    result.close();
    throw new Error('Geen persoon gevonden op de foto.');
  }
  const mw = bg.width;
  const mh = bg.height;
  const probs = bg.getAsFloat32Array();

  // Masker als canvas: alfa = kans dat het pixel bij de persoon hoort.
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = mw;
  maskCanvas.height = mh;
  const mctx = maskCanvas.getContext('2d')!;
  const md = mctx.createImageData(mw, mh);
  let fgCount = 0;
  for (let i = 0; i < probs.length; i++) {
    const a = smooth(1 - probs[i]);
    if (a > 0.5) fgCount++;
    md.data[i * 4 + 3] = Math.round(a * 255);
  }
  mctx.putImageData(md, 0, 0);
  result.close();
  if (fgCount < probs.length * 0.01) throw new Error('Geen persoon gevonden op de foto.');

  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(image, 0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(maskCanvas, 0, 0, w, h);
  return out.toDataURL('image/png');
}

