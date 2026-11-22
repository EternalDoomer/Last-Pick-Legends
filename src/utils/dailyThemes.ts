import type { Tactic, TournamentResult } from '../types';
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
  check: (res: TournamentResult, avgRating: number, savedBudget: number, startBudget: number) => boolean;
}

const CIS_TEAMS = ['Natus Vincere', 'Team Spirit', 'Virtus.pro', 'BetBoom Team', '9Pandas', 'Empire', 'Vega Squadron', 'Winstrike', 'Gambit'];
const CN_TEAMS = ['PSG.LGD', 'LGD Gaming', 'Wings Gaming', 'Newbee', 'Vici Gaming', 'Invictus Gaming', 'EHOME', 'CDEC Gaming', 'Team Aster', 'Xtreme Gaming', 'Azure Ray'];
const WEU_TEAMS = ['OG', 'Team Liquid', 'Team Secret', 'Alliance', 'Tundra Esports', 'Gaimin Gladiators', 'Team Falcons', 'Nigma Galaxy', 'Entity'];
const NA_SA_TEAMS = ['Evil Geniuses', 'Digital Chaos', 'beastcoast', 'Thunder Awaken', 'Quincy Crew', 'TSM', 'Shopify Rebellion', 'nouns'];
const SEA_TEAMS = ['Fnatic', 'TNC Predator', 'Mineski', 'Talon Esports', 'T1', 'MVP Phoenix', 'BOOM Esports'];

const TI_WINNERS: Record<number, string[]> = {
  2011: ['Natus Vincere'],
  2012: ['Invictus Gaming'],
  2013: ['Alliance'],
  2014: ['Newbee'],
  2015: ['Evil Geniuses'],
  2016: ['Wings Gaming'],
  2017: ['Team Liquid'],
  2018: ['OG'],
  2019: ['OG'],
  2021: ['Team Spirit'],
  2022: ['Tundra Esports'],
  2023: ['Team Spirit'],
  2024: ['Team Liquid'],
};

const hasKeyword = (team: string, list: string[]) =>
  list.some((item) => team.toLowerCase().includes(item.toLowerCase()));

export const DAILY_THEMES: DailyTheme[] = [
  // 1-10: Classics & Eras
  { id: 'classic_1000', title: 'The International Standard', desc: 'All rosters available. Classic $1000 salary cap.', budget: 1000, filter: () => true },
  { id: 'early_eras', title: 'Old School Legends', desc: 'Only rosters from TI1 to TI3 (2011–2013).', budget: 950, filter: (_, y) => y >= 2011 && y <= 2013 },
  { id: 'golden_era', title: 'Golden Era', desc: 'Rosters from TI4 to TI6 (2014–2016).', budget: 1000, filter: (_, y) => y >= 2014 && y <= 2016 },
  { id: 'og_dynasty_era', title: 'Peak Dota Era', desc: 'Rosters from TI7 to TI9 (2017–2019).', budget: 1050, filter: (_, y) => y >= 2017 && y <= 2019 },
  { id: 'modern_era', title: 'New Gen Champions', desc: 'Rosters from TI10 to TI13 (2021–2024).', budget: 1050, filter: (_, y) => y >= 2021 },
  { id: 'odd_ti', title: 'Odd Editions', desc: 'Only odd-numbered TI tournaments (TI1, TI3, TI5, TI7, TI9, TI11, TI13).', budget: 1000, filter: (_, y) => [2011, 2013, 2015, 2017, 2019, 2022, 2024].includes(y) },
  { id: 'even_ti', title: 'Even Editions', desc: 'Only even-numbered TI tournaments (TI2, TI4, TI6, TI8, TI10, TI12).', budget: 1000, filter: (_, y) => [2012, 2014, 2016, 2018, 2021, 2023].includes(y) },
  { id: 'aegis_holders', title: 'Hall of Aegis', desc: 'Only championship-winning rosters from TI history.', budget: 1150, filter: (t, y) => hasKeyword(t, TI_WINNERS[y] || []) },
  { id: 'pre_covid', title: 'Arena Classics', desc: 'Pre-2020 The International rosters only.', budget: 1000, filter: (_, y) => y <= 2019 },
  { id: 'recent_3', title: 'Modern Meta', desc: 'Only teams from the last 3 TI editions.', budget: 1000, filter: (_, y) => y >= 2022 },

  // 11-18: Regions
  { id: 'cis_pride', title: 'Eastern Europe Pride', desc: 'CIS & Eastern European organizations only.', budget: 1000, filter: (t) => hasKeyword(t, CIS_TEAMS) },
  { id: 'cn_dota', title: 'CN Dota Best Dota', desc: 'Chinese powerhouse organizations across all TI years.', budget: 1050, filter: (t) => hasKeyword(t, CN_TEAMS) },
  { id: 'weu_juggernauts', title: 'WEU Juggernauts', desc: 'Western European titans only.', budget: 1050, filter: (t) => hasKeyword(t, WEU_TEAMS) },
  { id: 'americas', title: 'Pan-American', desc: 'North and South American squads.', budget: 950, filter: (t) => hasKeyword(t, NA_SA_TEAMS) },
  { id: 'sea_chaos', title: 'SEA Chaos', desc: 'Southeast Asian rosters only.', budget: 900, filter: (t) => hasKeyword(t, SEA_TEAMS) },
  { id: 'west_vs_east_w', title: 'Occidental All-Stars', desc: 'WEU + NA + SA organizations combined.', budget: 1000, filter: (t) => hasKeyword(t, [...WEU_TEAMS, ...NA_SA_TEAMS]) },
  { id: 'east_alliance', title: 'Eastern Alliance', desc: 'China + SEA rosters combined.', budget: 1000, filter: (t) => hasKeyword(t, [...CN_TEAMS, ...SEA_TEAMS]) },
  { id: 'eurasia', title: 'Eurasian Clash', desc: 'CIS + China organizations only.', budget: 1000, filter: (t) => hasKeyword(t, [...CIS_TEAMS, ...CN_TEAMS]) },

  // 19-30: Iconic Rivalries & Clubs
  { id: 'el_clasico', title: 'El Clasico', desc: 'Natus Vincere vs Alliance across all editions.', budget: 950, filter: (t) => hasKeyword(t, ['Natus Vincere', 'Alliance']) },
  { id: 'ti8_ti9_finals', title: 'True Sight Rivalry', desc: 'OG vs Team Liquid / PSG.LGD rosters.', budget: 1100, filter: (t) => hasKeyword(t, ['OG', 'Team Liquid', 'LGD']) },
  { id: 'spirit_vp', title: 'CIS Kings', desc: 'Team Spirit & Virtus.pro rosters only.', budget: 1050, filter: (t) => hasKeyword(t, ['Team Spirit', 'Virtus.pro']) },
  { id: 'secret_liquid', title: 'European Royalty', desc: 'Team Secret & Team Liquid rosters.', budget: 1050, filter: (t) => hasKeyword(t, ['Team Secret', 'Team Liquid']) },
  { id: 'eg_og', title: 'Fly & n0tail Legacy', desc: 'Evil Geniuses & OG rosters across history.', budget: 1050, filter: (t) => hasKeyword(t, ['Evil Geniuses', 'OG']) },
  { id: 'lgd_ig_vg', title: 'Chinese Big Three', desc: 'LGD, Invictus Gaming & Vici Gaming.', budget: 1050, filter: (t) => hasKeyword(t, ['LGD', 'Invictus Gaming', 'Vici Gaming']) },
  { id: 'tundra_gg_falcons', title: 'New Era Superteams', desc: 'Tundra, Gaimin Gladiators & Falcons.', budget: 1100, filter: (t) => hasKeyword(t, ['Tundra', 'Gaimin', 'Falcons']) },
  { id: 'wings_newbee', title: 'CN Champions', desc: 'Wings Gaming, Newbee & Invictus Gaming.', budget: 1000, filter: (t) => hasKeyword(t, ['Wings', 'Newbee', 'Invictus Gaming']) },
  { id: 'navi_spirit', title: 'Two Eras of Aegis', desc: 'Natus Vincere & Team Spirit rosters.', budget: 1000, filter: (t) => hasKeyword(t, ['Natus Vincere', 'Team Spirit']) },
  { id: 'underdog_orgs', title: 'Dark Horses', desc: 'Exclude OG, Liquid, Secret, LGD, Spirit & EG.', budget: 900, filter: (t) => !hasKeyword(t, ['OG', 'Team Liquid', 'Team Secret', 'LGD', 'Team Spirit', 'Evil Geniuses']) },
  { id: 'vp_navi_empire', title: 'Old CIS School', desc: 'NaVi, Virtus.pro & Team Empire.', budget: 950, filter: (t) => hasKeyword(t, ['Natus Vincere', 'Virtus.pro', 'Empire']) },
  { id: 'fnatic_tnc', title: 'SEA Titans', desc: 'Fnatic, TNC Predator & Talon Esports.', budget: 900, filter: (t) => hasKeyword(t, ['Fnatic', 'TNC', 'Talon']) },

  // 31-40: Economy & Cap Modifiers
  { id: 'budget_700', title: 'Hardcore Moneyball', desc: 'Full pool, but only $700 budget. Scout smart!', budget: 700, filter: () => true },
  { id: 'budget_800', title: 'Tight Salary Cap', desc: 'Full pool with a strict $800 budget limit.', budget: 800, filter: () => true },
  { id: 'budget_850', title: 'Value Drafter', desc: '$850 cap across all TI rosters.', budget: 850, filter: () => true },
  { id: 'budget_1200', title: 'Luxury Roster', desc: 'Expanded $1200 budget to build a superteam.', budget: 1200, filter: () => true },
  { id: 'budget_1350', title: 'Galacticos Unlimited', desc: 'Massive $1350 cap. Draft pure superstars!', budget: 1350, filter: () => true },
  { id: 'budget_cis_800', title: 'CIS Budget Run', desc: 'CIS teams with a tight $800 cap.', budget: 800, filter: (t) => hasKeyword(t, CIS_TEAMS) },
  { id: 'budget_weu_1200', title: 'WEU Galacticos', desc: 'WEU rosters with an expanded $1200 cap.', budget: 1200, filter: (t) => hasKeyword(t, WEU_TEAMS) },
  { id: 'budget_cn_850', title: 'CN Economy', desc: 'Chinese teams under an $850 salary cap.', budget: 850, filter: (t) => hasKeyword(t, CN_TEAMS) },
  { id: 'budget_retro_800', title: 'Retro Penny Pincher', desc: 'TI1–TI5 rosters with an $800 budget.', budget: 800, filter: (_, y) => y <= 2015 },
  { id: 'budget_modern_1250', title: 'Modern All-Stars', desc: 'TI9–TI13 rosters with a $1250 budget.', budget: 1250, filter: (_, y) => y >= 2019 },
];

const DAILY_TASKS: DailyTask[] = [
  { id: 'win_save_100', desc: 'Win the tournament with $100+ unspent budget', check: (r, _, saved) => r.champion && saved >= 100 },
  { id: 'win_save_200', desc: 'Win the tournament with $200+ unspent budget', check: (r, _, saved) => r.champion && saved >= 200 },
  { id: 'win_early', desc: 'Win the tournament using EARLY tactic', check: (r) => r.champion && r.tactic === 'early' },
  { id: 'win_mid', desc: 'Win the tournament using MID tactic', check: (r) => r.champion && r.tactic === 'mid' },
  { id: 'win_late', desc: 'Win the tournament using LATE tactic', check: (r) => r.champion && r.tactic === 'late' },
  { id: 'win_underdog_85', desc: 'Win the tournament with 85 or lower Avg OVR', check: (r, avg) => r.champion && avg <= 85 },
  { id: 'win_power_89', desc: 'Win the tournament with 89+ Avg OVR', check: (r, avg) => r.champion && avg >= 89 },
  { id: 'win_upper_clean', desc: 'Win without dropping to Lower Bracket', check: (r) => r.champion && !r.matches.some((m) => m.bracket === 'lower') },
  { id: 'finalist_save_150', desc: 'Reach Grand Final with $150+ saved', check: (r, _, saved) => (r.placement === 'Champion' || r.placement === 'Finalist') && saved >= 150 },
  { id: 'top3_underdog_84', desc: 'Finish Top 3 or better with 84 or lower Avg OVR', check: (r, avg) => ['Champion', 'Finalist', 'Top 3'].includes(r.placement) && avg <= 84 },
  { id: 'win_save_15pct', desc: 'Win saving at least 15% of starting budget', check: (r, _, saved, start) => r.champion && saved >= Math.round(start * 0.15) },
  { id: 'top3_late', desc: 'Finish Top 3 or better using LATE tactic', check: (r) => ['Champion', 'Finalist', 'Top 3'].includes(r.placement) && r.tactic === 'late' },
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
  const dateStr = getTodayDateStr();
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  // Coprime step (17) mod 40 guarantees zero repeats within any 40-day window
  const index = (dayNumber * 17) % DAILY_THEMES.length;
  const theme = DAILY_THEMES[index];
  return { ...theme, description: theme.desc };
}

export function getTodayTask(theme?: DailyTheme): DailyTask {
  const activeTheme = theme ?? getTodayTheme();
  const rng = getSeededRandom(`task_${getTodayDateStr()}_${activeTheme.id}`);
  return DAILY_TASKS[Math.floor(rng() * DAILY_TASKS.length)];
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