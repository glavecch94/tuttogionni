import type { GoalCategory, GoalFrequency } from '../types';

export interface PreconfiguredGoal {
  key: string;
  name: string;
  description?: string;
  category: GoalCategory;
  frequency: GoalFrequency;
  frequencyConfig?: string[];
  icon: string;
  color: string;
}

export const preconfiguredGoals: PreconfiguredGoal[] = [
  // Salute
  { key: 'bere_acqua', name: 'Bere 2L di acqua', description: 'Mantieni una buona idratazione bevendo almeno 2 litri al giorno', category: 'SALUTE', frequency: 'DAILY', icon: '💧', color: '#0EA5E9' },
  { key: 'vitamine', name: 'Vitamine/Integratori', description: 'Prendi le vitamine e gli integratori quotidiani', category: 'SALUTE', frequency: 'DAILY', icon: '💊', color: '#F97316' },
  { key: 'skincare', name: 'Skincare routine', description: 'Segui la tua routine di cura della pelle', category: 'SALUTE', frequency: 'DAILY', icon: '✨', color: '#EC4899' },
  { key: 'checkup_medico', name: 'Checkup medico', description: 'Prenota e fai un controllo medico periodico', category: 'SALUTE', frequency: 'MONTHLY', frequencyConfig: ['1'], icon: '🏥', color: '#EF4444' },

  // Benessere
  { key: 'meditazione', name: 'Meditazione', description: 'Dedica 10-15 minuti alla meditazione', category: 'BENESSERE', frequency: 'DAILY', icon: '🧘', color: '#8B5CF6' },
  { key: 'journaling', name: 'Journaling', description: 'Scrivi i tuoi pensieri e riflessioni nel diario', category: 'BENESSERE', frequency: 'DAILY', icon: '📝', color: '#6366F1' },
  { key: 'passeggiata', name: 'Passeggiata', description: 'Fai una passeggiata di almeno 30 minuti', category: 'BENESSERE', frequency: 'DAILY', icon: '🚶', color: '#22C55E' },
  { key: 'digital_detox', name: 'Digital detox', description: 'Stacca dagli schermi per almeno 1 ora', category: 'BENESSERE', frequency: 'DAILY', icon: '📵', color: '#64748B' },
  { key: 'stretching', name: 'Stretching', description: 'Dedica 10-15 minuti allo stretching', category: 'BENESSERE', frequency: 'DAILY', icon: '🤸', color: '#10B981' },
  { key: 'dormire_bene', name: 'Dormire 7-8h', description: 'Assicurati di dormire almeno 7-8 ore a notte', category: 'BENESSERE', frequency: 'DAILY', icon: '😴', color: '#1E3A5F' },

  // Studio e Formazione
  { key: 'leggere', name: 'Leggere 30 min', description: 'Leggi per almeno 30 minuti al giorno', category: 'STUDIO_FORMAZIONE', frequency: 'DAILY', icon: '📚', color: '#B45309' },
  { key: 'corso_online', name: 'Corso online', description: 'Segui una lezione del tuo corso online', category: 'STUDIO_FORMAZIONE', frequency: 'WEEKLY', frequencyConfig: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], icon: '💻', color: '#0284C7' },
  { key: 'lingua_straniera', name: 'Lingua straniera', description: 'Pratica una lingua straniera per 15-20 minuti', category: 'STUDIO_FORMAZIONE', frequency: 'DAILY', icon: '🌍', color: '#059669' },
  { key: 'podcast_formativo', name: 'Podcast formativo', description: 'Ascolta un podcast educativo o formativo', category: 'STUDIO_FORMAZIONE', frequency: 'WEEKLY', frequencyConfig: ['TUESDAY', 'THURSDAY'], icon: '🎧', color: '#7C3AED' },
  { key: 'studiare', name: 'Studiare 30 minuti', description: 'Dedica almeno 30 minuti allo studio', category: 'STUDIO_FORMAZIONE', frequency: 'DAILY', icon: '📖', color: '#1D4ED8' },

  // Produttivit\u00e0
  { key: 'planning_settimanale', name: 'Planning settimanale', description: 'Pianifica la settimana: obiettivi, priorit\u00e0 e impegni', category: 'PRODUTTIVITA', frequency: 'WEEKLY', frequencyConfig: ['SUNDAY'], icon: '📋', color: '#2563EB' },
  { key: 'riordinare', name: 'Riordinare', description: 'Dedica tempo a riordinare il tuo spazio di lavoro o casa', category: 'PRODUTTIVITA', frequency: 'WEEKLY', frequencyConfig: ['SATURDAY'], icon: '🧹', color: '#CA8A04' },
  { key: 'task_prioritario', name: 'Completare task prioritario', description: 'Porta a termine almeno un task importante della giornata', category: 'PRODUTTIVITA', frequency: 'DAILY', icon: '🎯', color: '#DC2626' },

  // Finanza
  { key: 'tracciare_spese', name: 'Tracciare spese', description: 'Registra le spese della giornata', category: 'FINANZA', frequency: 'DAILY', icon: '💰', color: '#16A34A' },
  { key: 'revisione_budget', name: 'Revisione budget mensile', description: 'Rivedi il budget e le spese del mese', category: 'FINANZA', frequency: 'MONTHLY', frequencyConfig: ['28'], icon: '📊', color: '#0D9488' },

  // Sociale
  { key: 'chiamare_famiglia', name: 'Trascorrere un po\' di tempo con la famiglia', description: 'Dedica del tempo di qualità alla tua famiglia', category: 'SOCIALE', frequency: 'WEEKLY', frequencyConfig: ['SUNDAY'], icon: '👨‍👩‍👧‍👦', color: '#E11D48' },
  { key: 'uscire_amici', name: 'Uscire con amici', description: 'Organizza un\'uscita con gli amici', category: 'SOCIALE', frequency: 'WEEKLY', frequencyConfig: ['SATURDAY'], icon: '👥', color: '#9333EA' },

  // Intrattenimento
  { key: 'guardare_film', name: 'Guardare film', description: 'Guardati un bel film per rilassarti', category: 'INTRATTENIMENTO', frequency: 'WEEKLY', frequencyConfig: ['SATURDAY'], icon: '🎬', color: '#7C3AED' },
  { key: 'guardare_serie_tv', name: 'Guardare serie TV', description: 'Guarda un episodio della tua serie TV preferita', category: 'INTRATTENIMENTO', frequency: 'WEEKLY', frequencyConfig: ['FRIDAY', 'SATURDAY'], icon: '📺', color: '#6D28D9' },
  { key: 'ascoltare_musica', name: 'Ascoltare musica', description: 'Dedicati all\'ascolto di buona musica', category: 'INTRATTENIMENTO', frequency: 'DAILY', icon: '🎵', color: '#A855F7' },

  // Crescita Personale
  { key: 'gratitudine', name: 'Gratitudine', description: 'Scrivi 3 cose per cui sei grato oggi', category: 'CRESCITA_PERSONALE', frequency: 'DAILY', icon: '🙏', color: '#F59E0B' },
  { key: 'hobby', name: 'Hobby', description: 'Dedica tempo al tuo hobby preferito', category: 'CRESCITA_PERSONALE', frequency: 'WEEKLY', frequencyConfig: ['SATURDAY', 'SUNDAY'], icon: '🎨', color: '#D946EF' },
];

export const goalCategoryLabels: Record<GoalCategory, string> = {
  SALUTE: 'Salute',
  BENESSERE: 'Benessere',
  STUDIO_FORMAZIONE: 'Studio e Formazione',
  PRODUTTIVITA: 'Produttivit\u00e0',
  FINANZA: 'Finanza',
  SOCIALE: 'Sociale',
  CRESCITA_PERSONALE: 'Crescita Personale',
  INTRATTENIMENTO: 'Intrattenimento',
  ALTRO: 'Altro',
};

export const goalCategoryColors: Record<GoalCategory, string> = {
  SALUTE: 'bg-red-100 text-red-700',
  BENESSERE: 'bg-purple-100 text-purple-700',
  STUDIO_FORMAZIONE: 'bg-blue-100 text-blue-700',
  PRODUTTIVITA: 'bg-orange-100 text-orange-700',
  FINANZA: 'bg-emerald-100 text-emerald-700',
  SOCIALE: 'bg-pink-100 text-pink-700',
  CRESCITA_PERSONALE: 'bg-amber-100 text-amber-700',
  INTRATTENIMENTO: 'bg-violet-100 text-violet-700',
  ALTRO: 'bg-gray-100 text-gray-700',
};

export const goalFrequencyLabels: Record<string, string> = {
  DAILY: 'Giornaliero',
  WEEKLY: 'Settimanale',
  BIWEEKLY: 'Bisettimanale',
  MONTHLY: 'Mensile',
};

export const dayOfWeekLabels: Record<string, string> = {
  MONDAY: 'Luned\u00ec',
  TUESDAY: 'Marted\u00ec',
  WEDNESDAY: 'Mercoled\u00ec',
  THURSDAY: 'Gioved\u00ec',
  FRIDAY: 'Venerd\u00ec',
  SATURDAY: 'Sabato',
  SUNDAY: 'Domenica',
};
