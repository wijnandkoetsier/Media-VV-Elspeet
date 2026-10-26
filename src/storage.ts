import { del, get, set } from 'idb-keyval';
import type { Design, TemplateData } from './templates/types';

export interface Draft {
  data: TemplateData;
  design: Design;
}

const key = (id: string) => `draft:${id}`;

export async function loadDraft(id: string): Promise<Draft | undefined> {
  try {
    return await get<Draft>(key(id));
  } catch {
    return undefined;
  }
}

export async function saveDraft(id: string, draft: Draft) {
  try {
    await set(key(id), draft);
  } catch {
    // Opslaan is een gemak; als het mislukt (privé-modus) werkt de app gewoon door.
  }
}

export async function clearDraft(id: string) {
  try {
    await del(key(id));
  } catch {
    /* negeren */
  }
}
