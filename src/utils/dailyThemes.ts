import { getTodayDateStr } from './draft';

export interface DailyTask {
  id: string;
  desc: string;
  check: (champion: boolean, avgRating: number, moneySaved: number) => boolean;
}

export interface DailyTheme {
  id: string;
  title: string;
  description: string;
  filter: (team: string, year: number) => boolean;
  tasks: DailyTask[];
}

export const DAILY_THEMES: DailyTheme[] = [
  {
    id: 'ti1_3',
    title: 'Old School Legends',
    description: 'Only teams from the first three The Internationals (2011-2013).',
    filter: (_team, year) => year >= 2011 && year <= 2013,
    tasks: [
      { id: 'win', desc: 'Win the tournament.', check: (c) => c },
      { id: 'avg85', desc: 'Build a team with avg rating 85+.', check: (_, avg) => avg >= 85 },
    ],
  },
  {
    id: 'cis',
    title: 'CIS Domination',
    description: 'Only CIS teams (NaVi, Spirit, VP, Empire, BB).',
    filter: (team) => ['NaVi', 'Spirit', 'VP', 'Empire', 'BB'].includes(team),
    tasks: [
      { id: 'win', desc: 'Win the tournament.', check: (c) => c },
      { id: 'save200', desc: 'Save at least $200 of budget.', check: (_, __, saved) => saved >= 200 },
    ],
  },
  {
    id: 'china',
    title: 'Chinese Wall',
    description: 'Only Chinese teams (LGD, iG, Newbee, Wings, XG, VG, CDEC).',
    filter: (team) => ['LGD', 'iG', 'Newbee', 'Wings', 'XG', 'VG', 'CDEC'].includes(team),
    tasks: [
      { id: 'win', desc: 'Win the tournament.', check: (c) => c },
      { id: 'avg80', desc: 'Build a team with avg rating 80+.', check: (_, avg) => avg >= 80 },
    ],
  },
  {
    id: 'winners',
    title: 'Hall of Fame',
    description: 'Only teams that lifted the Aegis.',
    filter: (team) =>
      ['NaVi', 'iG', 'Alliance', 'Newbee', 'EG', 'Wings', 'Liquid', 'OG', 'Spirit', 'Tundra'].includes(team),
    tasks: [
      { id: 'win', desc: 'Win the tournament.', check: (c) => c },
      { id: 'avg90', desc: 'Build a team with avg rating 90+.', check: (_, avg) => avg >= 90 },
    ],
  },
];

function getDateHash(dateStr = getTodayDateStr()): number {
  return dateStr.split('-').reduce((acc, val) => acc + parseInt(val, 10), 0);
}

export function getTodayTheme(): DailyTheme {
  return DAILY_THEMES[getDateHash() % DAILY_THEMES.length];
}

export function getTodayTask(theme: DailyTheme): DailyTask {
  return theme.tasks[getDateHash() % theme.tasks.length];
}
