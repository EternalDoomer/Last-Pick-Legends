export interface DailyTheme {
  id: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  filter: (team: string, year: number) => boolean;
}

export const DAILY_THEMES: DailyTheme[] = [
  {
    id: 'ti1_3',
    title: { ru: 'Легенды старой школы', en: 'Old School Legends' },
    description: { ru: 'Только команды первых трех The International (2011-2013).', en: 'Only teams from the first three The Internationals (2011-2013).' },
    filter: (team, year) => year >= 2011 && year <= 2013
  },
  {
    id: 'cis',
    title: { ru: 'СНГ-доминация', en: 'CIS Domination' },
    description: { ru: 'Только команды из СНГ (NaVi, Spirit, VP, Empire, BB).', en: 'Only CIS teams (NaVi, Spirit, VP, Empire, BB).' },
    filter: (team) => ['NaVi', 'Spirit', 'VP', 'Empire', 'BB'].includes(team)
  },
  {
    id: 'china',
    title: { ru: 'Китайская стена', en: 'Chinese Wall' },
    description: { ru: 'Только китайские команды (LGD, iG, Newbee, Wings, XG, VG).', en: 'Only Chinese teams (LGD, iG, Newbee, Wings, XG, VG).' },
    filter: (team) => ['LGD', 'iG', 'Newbee', 'Wings', 'XG', 'VG', 'CDEC'].includes(team)
  },
  {
    id: 'winners',
    title: { ru: 'Зал славы', en: 'Hall of Fame' },
    description: { ru: 'Только команды, которые брали Аегис.', en: 'Only teams that have lifted the Aegis.' },
    filter: (team) => {
      const champs = ['NaVi', 'iG', 'Alliance', 'Newbee', 'EG', 'Wings', 'Liquid', 'OG', 'Spirit', 'Tundra'];
      return champs.includes(team);
    }
  }
];

export function getTodayTheme(): DailyTheme {
  const today = new Date().toISOString().split('T')[0];
  const hash = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  return DAILY_THEMES[hash % DAILY_THEMES.length];
}