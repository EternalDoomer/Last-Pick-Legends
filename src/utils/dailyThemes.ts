import type { Roster, TournamentResult } from '../types';
import { getTodayDateStr } from './draft';
import { getSeededRandom } from './rng';

export interface DailyTheme {
  id: string;
  title: string;
  desc: string;
  description?: string;
  budget: number;
  filter: (team: string, year: number) => boolean;
}

export interface DailyTask {
  id: string;
  desc: string;
  requiredPlayerId?: string;
  check: (
    res: TournamentResult,
    avgRating: number,
    savedBudget: number,
    startBudget: number,
    roster?: Roster
  ) => boolean;
}

const CIS_TEAMS = [
  'Natus Vincere',
  'NaVi',
  'Spirit',
  'Virtus',
  'VP',
  'BetBoom',
  '9Pandas',
  'Empire',
  'Vega',
  'Winstrike',
  'Gambit',
];

const CN_TEAMS = [
  'LGD',
  'Wings',
  'Newbee',
  'Vici',
  'Invictus',
  'iG',
  'EHOME',
  'CDEC',
  'Aster',
  'Xtreme',
  'Azure Ray',
];

const WEU_TEAMS = [
  'OG',
  'Liquid',
  'Secret',
  'Alliance',
  'Tundra',
  'Gaimin',
  'Falcons',
  'Nigma',
  'Entity',
];

const NA_SA_TEAMS = [
  'Evil Geniuses',
  'EG',
  'Digital Chaos',
  'beastcoast',
  'Thunder',
  'Quincy',
  'TSM',
  'Shopify',
  'nouns',
];

const SEA_TEAMS = [
  'Fnatic',
  'TNC',
  'Mineski',
  'Talon',
  'T1',
  'MVP',
  'BOOM',
];

const TI_WINNERS: Record<number, string[]> = {
  2011: ['Natus Vincere', 'NaVi'],
  2012: ['Invictus', 'iG'],
  2013: ['Alliance'],
  2014: ['Newbee'],
  2015: ['Evil Geniuses', 'EG'],
  2016: ['Wings'],
  2017: ['Liquid'],
  2018: ['OG'],
  2019: ['OG'],
  2021: ['Spirit'],
  2022: ['Tundra'],
  2023: ['Spirit'],
  2024: ['Liquid'],
};

const hasKeyword = (team: string, list: string[]) =>
  list.some((item) => team.toLowerCase().includes(item.toLowerCase()));

const hasPlayerInRoster = (roster: Roster | undefined, playerId: string): boolean => {
  if (!roster) return false;
  const key = playerId.toLowerCase();
  return Object.values(roster).some(
    (p) =>
      p !== null &&
      (p.id.toLowerCase() === key ||
        p.id.toLowerCase().startsWith(`${key}_`) ||
        p.nickname.toLowerCase().replace(/[^a-z0-9]/g, '') === key.replace(/[^a-z0-9]/g, ''))
  );
};

export const DAILY_THEMES: DailyTheme[] = [
  // Standard $1000 themes (34 of 40)
  { id: 'classic_1000', title: 'The International Standard', desc: 'All rosters available. Classic $1000 salary cap.', budget: 1000, filter: () => true },
  { id: 'early_eras', title: 'Old School Legends', desc: 'Only rosters from TI1 to TI3 (2011–2013).', budget: 1000, filter: (_, y) => y >= 2011 && y <= 2013 },
  { id: 'golden_era', title: 'Golden Era', desc: 'Rosters from TI4 to TI6 (2014–2016).', budget: 1000, filter: (_, y) => y >= 2014 && y <= 2016 },
  { id: 'og_dynasty_era', title: 'Peak Dota Era', desc: 'Rosters from TI7 to TI9 (2017–2019).', budget: 1000, filter: (_, y) => y >= 2017 && y <= 2019 },
  { id: 'modern_era', title: 'New Gen Champions', desc: 'Rosters from TI10 to TI13 (2021–2024).', budget: 1000, filter: (_, y) => y >= 2021 },
  { id: 'odd_ti', title: 'Odd Editions', desc: 'Only odd-numbered TI tournaments.', budget: 1000, filter: (_, y) => [2011, 2013, 2015, 2017, 2019, 2022, 2024].includes(y) },
  { id: 'even_ti', title: 'Even Editions', desc: 'Only even-numbered TI tournaments.', budget: 1000, filter: (_, y) => [2012, 2014, 2016, 2018, 2021, 2023].includes(y) },
  { id: 'aegis_holders', title: 'Hall of Aegis', desc: 'Only championship-winning rosters from TI history.', budget: 1000, filter: (t, y) => hasKeyword(t, TI_WINNERS[y] || []) },
  { id: 'pre_covid', title: 'Arena Classics', desc: 'Pre-2020 The International rosters only.', budget: 1000, filter: (_, y) => y <= 2019 },
  { id: 'recent_3', title: 'Modern Meta', desc: 'Only teams from the last 3 TI editions.', budget: 1000, filter: (_, y) => y >= 2022 },

  { id: 'cis_pride', title: 'Eastern Europe Pride', desc: 'CIS & Eastern European organizations only.', budget: 1000, filter: (t) => hasKeyword(t, CIS_TEAMS) },
  { id: 'cn_dota', title: 'CN Dota Best Dota', desc: 'Chinese powerhouse organizations across all TI years.', budget: 1000, filter: (t) => hasKeyword(t, CN_TEAMS) },
  { id: 'weu_juggernauts', title: 'WEU Juggernauts', desc: 'Western European titans only.', budget: 1000, filter: (t) => hasKeyword(t, WEU_TEAMS) },
  { id: 'americas', title: 'Pan-American', desc: 'North and South American squads.', budget: 1000, filter: (t) => hasKeyword(t, NA_SA_TEAMS) },
  { id: 'sea_chaos', title: 'SEA Chaos', desc: 'Southeast Asian rosters only.', budget: 1000, filter: (t) => hasKeyword(t, SEA_TEAMS) },
  { id: 'west_vs_east_w', title: 'Occidental All-Stars', desc: 'WEU + NA + SA organizations combined.', budget: 1000, filter: (t) => hasKeyword(t, [...WEU_TEAMS, ...NA_SA_TEAMS]) },
  { id: 'east_alliance', title: 'Eastern Alliance', desc: 'China + SEA rosters combined.', budget: 1000, filter: (t) => hasKeyword(t, [...CN_TEAMS, ...SEA_TEAMS]) },
  { id: 'eurasia', title: 'Eurasian Clash', desc: 'CIS + China organizations only.', budget: 1000, filter: (t) => hasKeyword(t, [...CIS_TEAMS, ...CN_TEAMS]) },

  { id: 'el_clasico', title: 'El Clasico', desc: 'Natus Vincere vs Alliance across all editions.', budget: 1000, filter: (t) => hasKeyword(t, ['Natus Vincere', 'NaVi', 'Alliance']) },
  { id: 'ti8_ti9_finals', title: 'True Sight Rivalry', desc: 'OG vs Team Liquid / PSG.LGD rosters.', budget: 1000, filter: (t) => hasKeyword(t, ['OG', 'Liquid', 'LGD']) },
  { id: 'spirit_vp', title: 'CIS Kings', desc: 'Team Spirit & Virtus.pro rosters only.', budget: 1000, filter: (t) => hasKeyword(t, ['Spirit', 'Virtus', 'VP']) },
  { id: 'secret_liquid', title: 'European Royalty', desc: 'Team Secret & Team Liquid rosters.', budget: 1000, filter: (t) => hasKeyword(t, ['Secret', 'Liquid']) },
  { id: 'eg_og', title: 'Fly & n0tail Legacy', desc: 'Evil Geniuses & OG rosters across history.', budget: 1000, filter: (t) => hasKeyword(t, ['Evil Geniuses', 'EG', 'OG']) },
  { id: 'lgd_ig_vg', title: 'Chinese Big Three', desc: 'LGD, Invictus Gaming & Vici Gaming.', budget: 1000, filter: (t) => hasKeyword(t, ['LGD', 'Invictus', 'iG', 'Vici']) },
  { id: 'tundra_gg_falcons', title: 'New Era Superteams', desc: 'Tundra, Gaimin Gladiators & Falcons.', budget: 1000, filter: (t) => hasKeyword(t, ['Tundra', 'Gaimin', 'Falcons']) },
  { id: 'wings_newbee', title: 'CN Champions', desc: 'Wings Gaming, Newbee & Invictus Gaming.', budget: 1000, filter: (t) => hasKeyword(t, ['Wings', 'Newbee', 'Invictus', 'iG']) },
  { id: 'navi_spirit', title: 'Two Eras of Aegis', desc: 'Natus Vincere & Team Spirit rosters.', budget: 1000, filter: (t) => hasKeyword(t, ['Natus Vincere', 'NaVi', 'Spirit']) },
  { id: 'underdog_orgs', title: 'Dark Horses', desc: 'Exclude OG, Liquid, Secret, LGD, Spirit & EG.', budget: 1000, filter: (t) => !hasKeyword(t, ['OG', 'Liquid', 'Secret', 'LGD', 'Spirit', 'Evil Geniuses', 'EG']) },
  { id: 'vp_navi_empire', title: 'Old CIS School', desc: 'NaVi, Virtus.pro & Team Empire.', budget: 1000, filter: (t) => hasKeyword(t, ['Natus Vincere', 'NaVi', 'Virtus', 'VP', 'Empire']) },
  { id: 'fnatic_tnc', title: 'SEA Titans', desc: 'Fnatic, TNC Predator & Talon Esports.', budget: 1000, filter: (t) => hasKeyword(t, ['Fnatic', 'TNC', 'Talon']) },
  { id: 'china_west_finals', title: 'Grand Final Classics', desc: 'Rosters from TI1–TI13 with standard $1000 cap.', budget: 1000, filter: (_, y) => y >= 2011 && y <= 2024 },
  { id: 'ti6_ti10_mix', title: 'Six & Ten', desc: 'Rosters from TI6 and TI10.', budget: 1000, filter: (_, y) => y === 2016 || y === 2021 },
  { id: 'ti7_ti11_mix', title: 'Seven & Eleven', desc: 'Rosters from TI7 and TI11.', budget: 1000, filter: (_, y) => y === 2017 || y === 2022 },
  { id: 'ti8_ti12_mix', title: 'Eight & Twelve', desc: 'Rosters from TI8 and TI12.', budget: 1000, filter: (_, y) => y === 2018 || y === 2023 },

  // Occasional special budget themes (6 of 40)
  { id: 'budget_800', title: 'Tight Salary Cap', desc: 'Full pool with a strict $800 budget limit.', budget: 800, filter: () => true },
  { id: 'budget_850', title: 'Value Drafter', desc: '$850 cap across all TI rosters.', budget: 850, filter: () => true },
  { id: 'budget_1200', title: 'Luxury Roster', desc: 'Expanded $1200 budget to build a superteam.', budget: 1200, filter: () => true },
  { id: 'budget_cis_800', title: 'CIS Budget Run', desc: 'CIS teams with a tight $850 cap.', budget: 850, filter: (t) => hasKeyword(t, CIS_TEAMS) },
  { id: 'budget_weu_1200', title: 'WEU Galacticos', desc: 'WEU rosters with an expanded $1200 cap.', budget: 1200, filter: (t) => hasKeyword(t, WEU_TEAMS) },
  { id: 'budget_modern_1200', title: 'Modern All-Stars', desc: 'TI9–TI13 rosters with a $1200 budget.', budget: 1200, filter: (_, y) => y >= 2019 },
];

const DAILY_TASKS: DailyTask[] = [
  {
    id: 'draft_puppey_top3',
    desc: 'Draft Puppey and finish Top 3 or better',
    requiredPlayerId: 'puppey',
    check: (r, _, __, ___, roster) =>
      hasPlayerInRoster(roster, 'puppey') && ['Champion', 'Finalist', 'Top 3'].includes(r.placement),
  },
  {
    id: 'draft_notail_win',
    desc: 'Draft N0tail and win the tournament',
    requiredPlayerId: 'notail',
    check: (r, _, __, ___, roster) => hasPlayerInRoster(roster, 'notail') && r.champion,
  },
  {
    id: 'draft_yatoro_late',
    desc: 'Draft Yatoro and win using LATE tactic',
    requiredPlayerId: 'yatoro',
    check: (r, _, __, ___, roster) =>
      hasPlayerInRoster(roster, 'yatoro') && r.champion && r.tactic === 'late',
  },
  {
    id: 'draft_miracle_final',
    desc: 'Draft Miracle- and reach the Grand Final',
    requiredPlayerId: 'miracle',
    check: (r, _, __, ___, roster) =>
      hasPlayerInRoster(roster, 'miracle') && (r.placement === 'Champion' || r.placement === 'Finalist'),
  },
  {
    id: 'draft_collapse_top3',
    desc: 'Draft Collapse and finish Top 3 or better',
    requiredPlayerId: 'collapse',
    check: (r, _, __, ___, roster) =>
      hasPlayerInRoster(roster, 'collapse') && ['Champion', 'Finalist', 'Top 3'].includes(r.placement),
  },
  {
    id: 'draft_ame_top3',
    desc: 'Draft Ame and finish Top 3 or better',
    requiredPlayerId: 'ame',
    check: (r, _, __, ___, roster) =>
      hasPlayerInRoster(roster, 'ame') && ['Champion', 'Finalist', 'Top 3'].includes(r.placement),
  },
  {
    id: 'win_early',
    desc: 'Win the tournament using EARLY tactic',
    check: (r) => r.champion && r.tactic === 'early',
  },
  {
    id: 'win_mid',
    desc: 'Win the tournament using MID tactic',
    check: (r) => r.champion && r.tactic === 'mid',
  },
  {
    id: 'win_late',
    desc: 'Win the tournament using LATE tactic',
    check: (r) => r.champion && r.tactic === 'late',
  },
  {
    id: 'win_upper_clean',
    desc: 'Win without dropping to Lower Bracket',
    check: (r) => r.champion && !r.matches.some((m) => m.bracket === 'lower'),
  },
  {
    id: 'win_underdog_85',
    desc: 'Win the tournament with 85 or lower Avg OVR',
    check: (r, avg) => r.champion && avg <= 85,
  },
  {
    id: 'win_save_150',
    desc: 'Win the tournament with $150+ unspent budget',
    check: (r, _, saved) => r.champion && saved >= 150,
  },
];

export function getThemeForDate(dateStr: string): DailyTheme {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const index = (dayNumber * 17) % DAILY_THEMES.length;
  const theme = DAILY_THEMES[index];
  return { ...theme, description: theme.desc };
}

export function getTaskForDate(dateStr: string, theme?: DailyTheme): DailyTask {
  const activeTheme = theme ?? getThemeForDate(dateStr);
  const rng = getSeededRandom(`task_${dateStr}_${activeTheme.id}`);
  return DAILY_TASKS[Math.floor(rng() * DAILY_TASKS.length)];
}

export function getTodayTheme(): DailyTheme {
  return getThemeForDate(getTodayDateStr());
}

export function getTodayTask(theme?: DailyTheme): DailyTask {
  const today = getTodayDateStr();
  return getTaskForDate(today, theme ?? getThemeForDate(today));
}

export function getRecentDailyDates(days = 14): string[] {
  const todayStr = getTodayDateStr();
  const [y, m, d] = todayStr.split('-').map(Number);
  const baseUtc = Date.UTC(y, m - 1, d);
  const list: string[] = [];

  for (let offset = 1; offset <= days; offset++) {
    const dt = new Date(baseUtc - offset * 86400000);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    list.push(`${yyyy}-${mm}-${dd}`);
  }
  return list;
}