function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Exporteren mislukt'))), 'image/png'),
  );
}

export function exportName(templateId: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `vvelspeet-${templateId}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.png`;
}

export function canShareFiles(): boolean {
  try {
    const f = new File([new Blob()], 'x.png', { type: 'image/png' });
    return !!navigator.canShare?.({ files: [f] });
  } catch {
    return false;
  }
}

/** Deelt de afbeelding via het deelmenu van de telefoon (opslaan in foto's, Instagram, WhatsApp…). */
export async function shareCanvas(canvas: HTMLCanvasElement, name: string): Promise<'shared' | 'cancelled'> {
  const blob = await toBlob(canvas);
  const file = new File([blob], name, { type: 'image/png' });
  try {
    await navigator.share({ files: [file], title: 'Media VV Elspeet' });
    return 'shared';
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    throw e;
  }
}

export async function downloadCanvas(canvas: HTMLCanvasElement, name: string) {
  const blob = await toBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
