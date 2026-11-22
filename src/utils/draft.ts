import type { Player, Position, Roster, TeamOption } from '../types';
import raw from '../data/players.json';

export const ALL_PLAYERS = raw as Player[];

export function formatTiEdition(year: number): string {
  return `TI${year === 2011 ? '1' : year - 2010}`;
}

export function formatTeamLabel(team: string, year: number): string {
  return `${team} (${formatTiEdition(year)})`;
}

export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayDateStr(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

export const ALL_TEAMS: TeamOption[] = (() => {
  const seen = new Set<string>();
  const result: TeamOption[] = [];
  for (const p of ALL_PLAYERS) {
    const key = `${p.team}|${p.year}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ team: p.team, year: p.year });
    }
  }
  return result;
})();

export function emptyRoster(): Roster {
  return { 1: null, 2: null, 3: null, 4: null, 5: null };
}

export function countFilled(roster: Roster): number {
  return Object.values(roster).filter(Boolean).length;
}

export function getAverageRating(roster: Roster): number {
  const drafted = Object.values(roster).filter(Boolean) as Player[];
  if (drafted.length === 0) return 0;
  return Math.round(drafted.reduce((sum, p) => sum + p.rating, 0) / drafted.length);
}

export function getPlayerCost(p: Player): number {
  return Number(p.price) || 150;
}

export function isAlreadyDrafted(p: Player, roster: Roster): boolean {
  return Object.values(roster).some(
    (x) => x?.nickname.toLowerCase() === p.nickname.toLowerCase()
  );
}

export function getAvailableSlots(p: Player, roster: Roster): Position[] {
  return p.positions.filter((pos) => roster[pos] === null);
}

export function canPickPlayer(
  p: Player,
  roster: Roster,
  remainingBudget?: number
): boolean {
  if (isAlreadyDrafted(p, roster)) return false;
  if (getAvailableSlots(p, roster).length === 0) return false;
  if (remainingBudget !== undefined && getPlayerCost(p) > remainingBudget) {
    return false;
  }
  return true;
}

export function selectPlayer(p: Player, roster: Roster, pos: Position): Roster {
  return { ...roster, [pos]: p };
}

export function playersOfTeam(team: string, year: number): Player[] {
  return ALL_PLAYERS.filter((p) => p.team === team && p.year === year);
}

// Retroactive normalization for legacy Russian placement records in Firebase/localStorage
const LEGACY_PLACEMENT_MAP: Record<string, string> = {
  'чемпион': 'Champion',
  'финалист': 'Finalist',
  'топ-3': 'Top 3',
  'топ-4': 'Top 4',
  'топ-6': 'Top 6',
  'топ-8': 'Top 8',
};

export function normalizePlacement(rawPlacement: string): string {
  const key = rawPlacement.trim().toLowerCase();
  return LEGACY_PLACEMENT_MAP[key] || rawPlacement.trim();
}

export function getPlacementRank(rawPlacement: string): number {
  const normalized = normalizePlacement(rawPlacement).toLowerCase();
  if (normalized === 'champion') return 1;
  if (normalized === 'finalist') return 2;
  if (normalized === 'top 3') return 3;
  if (normalized === 'top 4') return 4;
  if (normalized === 'top 6') return 5;
  if (normalized === 'top 8') return 6;
  return 99;
}
