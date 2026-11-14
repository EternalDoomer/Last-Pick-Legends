export type Position = 1 | 2 | 3 | 4 | 5;

export interface Player {
  id: string;
  nickname: string;
  team: string;
  year: number;
  positions: Position[];
  rating: number;
  price?: number;
}

export type Roster = Record<Position, Player | null>;

export interface TeamRoll {
  team: string;
  year: number;
  players: Player[];
}

export interface MapResult {
  won: boolean;
  event?: string;
  caster?: string;
  shift?: number;
}

export interface MatchResult {
  round: string;
  opponent: string;
  opponentPower: number;
  maps: MapResult[];
  won: boolean;
  bracket: 'upper' | 'lower' | 'grand';
}

export interface TournamentResult {
  matches: MatchResult[];
  placement: string;
  title: string;
  champion: boolean;
}