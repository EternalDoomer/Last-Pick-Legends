import type { Player, Position, Roster, TeamRoll } from '../types';
import raw from '../data/players.json';

const PLAYERS = raw as Player[];

export const ALL_PLAYERS = PLAYERS;

export function getTeams(): { team: string; year: number }[] {
  const seen = new Set<string>();
  const result: { team: string; year: number }[] = [];
  for (const p of PLAYERS) {
    const key = `${p.team}|${p.year}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ team: p.team, year: p.year });
    }
  }
  return result;
}

export const ALL_TEAMS = getTeams();

export function emptyRoster(): Roster {
  return { 1: null, 2: null, 3: null, 4: null, 5: null };
}

export function countFilled(roster: Roster): number {
  return Object.values(roster).filter(Boolean).length;
}

// 🔥 ИЗМЕНЕНИЕ: Теперь проверяем по никнейму, а не по ID
export function isAlreadyDrafted(p: Player, roster: Roster): boolean {
  return Object.values(roster).some(x => x?.nickname.toLowerCase() === p.nickname.toLowerCase());
}

export function getAvailableSlots(p: Player, roster: Roster): Position[] {
  return p.positions.filter(pos => roster[pos] === null);
}

export function hasValidPicks(team: Player[], roster: Roster): boolean {
  return team.some(p => !isAlreadyDrafted(p, roster) && getAvailableSlots(p, roster).length > 0);
}

export function selectPlayer(p: Player, roster: Roster, pos: Position): Roster {
  return { ...roster, [pos]: p };
}

export function playersOfTeam(team: string, year: number): Player[] {
  return PLAYERS.filter(p => p.team === team && p.year === year);
}

export function rollTeam(): TeamRoll {
  const pick = ALL_TEAMS[Math.floor(Math.random() * ALL_TEAMS.length)];
  return { ...pick, players: playersOfTeam(pick.team, pick.year) };
}