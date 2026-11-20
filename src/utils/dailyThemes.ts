export interface DailyTask {
  id: string;
  desc: { ru: string; en: string };
  check: (champion: boolean, avgRating: number, moneySaved: number) => boolean;
}

export interface DailyTheme {
  id: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  filter: (team: string, year: number) => boolean;
  tasks: DailyTask[];
}

export const DAILY_THEMES: DailyTheme[] = [
  {
    id: 'ti1_3',
    title: { ru: 'Легенды старой школы', en: 'Old School Legends' },
    description: { ru: 'Только команды первых трех The International (2011-2013).', en: 'Only teams from the first three The Internationals (2011-2013).' },
    // 🔥 ИСПРАВЛЕНО: добавили _ к team
    filter: (_team, year) => year >= 2011 && year <= 2013,
    tasks: [
      { id: 'win', desc: { ru: 'Выиграть турнир.', en: 'Win the tournament.' }, check: (c) => c },
      { id: 'avg85', desc: { ru: 'Собрать состав со средним рейтингом 85+.', en: 'Build a team with avg rating 85+.' }, check: (_, avg) => avg >= 85 },
    ]
  },
  {
    id: 'cis',
    title: { ru: 'СНГ-доминация', en: 'CIS Domination' },
    description: { ru: 'Только команды из СНГ (NaVi, Spirit, VP, Empire, BB).', en: 'Only CIS teams.' },
    filter: (team) => ['NaVi', 'Spirit', 'VP', 'Empire', 'BB'].includes(team),
    tasks: [
      { id: 'win', desc: { ru: 'Выиграть турнир.', en: 'Win the tournament.' }, check: (c) => c },
      { id: 'save200', desc: { ru: 'Сэкономить минимум $200 бюджета.', en: 'Save at least $200.' }, check: (_, __, saved) => saved >= 200 },
    ]
  },
  {
    id: 'china',
    title: { ru: 'Китайская стена', en: 'Chinese Wall' },
    description: { ru: 'Только китайские команды (LGD, iG, Newbee, Wings, XG, VG).', en: 'Only Chinese teams.' },
    filter: (team) => ['LGD', 'iG', 'Newbee', 'Wings', 'XG', 'VG', 'CDEC'].includes(team),
    tasks: [
      { id: 'win', desc: { ru: 'Выиграть турнир.', en: 'Win the tournament.' }, check: (c) => c },
      { id: 'avg80', desc: { ru: 'Собрать состав со средним рейтингом 80+.', en: 'Build a team with avg rating 80+.' }, check: (_, avg) => avg >= 80 },
    ]
  },
  {
    id: 'winners',
    title: { ru: 'Зал славы', en: 'Hall of Fame' },
    description: { ru: 'Только команды, которые брали Аегис.', en: 'Only teams that lifted the Aegis.' },
    filter: (team) => ['NaVi', 'iG', 'Alliance', 'Newbee', 'EG', 'Wings', 'Liquid', 'OG', 'Spirit', 'Tundra'].includes(team),
    tasks: [
      { id: 'win', desc: { ru: 'Выиграть турнир.', en: 'Win the tournament.' }, check: (c) => c },
      { id: 'avg90', desc: { ru: 'Собрать состав со средним рейтингом 90+.', en: 'Build a team with avg rating 90+.' }, check: (_, avg) => avg >= 90 },
    ]
  }
];

export function getTodayTheme(): DailyTheme {
  const today = new Date().toISOString().split('T')[0];
  const hash = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  return DAILY_THEMES[hash % DAILY_THEMES.length];
}

export function getTodayTask(theme: DailyTheme): DailyTask {
  const today = new Date().toISOString().split('T')[0];
  const hash = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  return theme.tasks[hash % theme.tasks.length];
}