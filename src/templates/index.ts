import { agenda } from './agenda';
import { matchday } from './matchday';
import { nieuws } from './nieuws';
import { programma } from './programma';
import { pupil } from './pupil';
import { sponsoring } from './sponsoring';
import { uitslagen } from './uitslagen';
import type { TemplateDef } from './types';

export const templates: TemplateDef[] = [matchday, pupil, uitslagen, programma, sponsoring, nieuws, agenda];

export const templateById = (id: string) => templates.find((t) => t.id === id);
