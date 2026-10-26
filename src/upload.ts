/** Leest een gekozen bestand in en verkleint het, zodat opslag en tekenen snel blijven. */
export async function fileToDataUrl(file: File, alpha: boolean): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Dit bestand kan niet als afbeelding gelezen worden.'));
      i.src = url;
    });
    const max = alpha ? 1200 : 2200; // logo's kleiner, foto's (ook transparante) groter
    const scale = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const w = Math.max(1, Math.round(im.naturalWidth * scale));
    const h = Math.max(1, Math.round(im.naturalHeight * scale));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas niet beschikbaar');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, 0, 0, w, h);
    // JPEG kent geen transparantie (doorzichtig wordt zwart), dus transparante bestanden als PNG bewaren.
    const keepAlpha = alpha || (mayHaveAlpha(file) && hasTransparency(ctx, w, h));
    return keepAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function mayHaveAlpha(file: File): boolean {
  return /^image\/(png|webp|gif|avif|svg\+xml)$/.test(file.type) || /\.(png|webp|gif|avif|svg)$/i.test(file.name);
}

function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const data = ctx.getImageData(0, 0, w, h).data;
  // Elke 4e pixel bekijken is ruim genoeg en houdt het snel.
  for (let i = 3; i < data.length; i += 16) if (data[i] < 250) return true;
  return false;
}
