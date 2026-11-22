export type Position = 1 | 2 | 3 | 4 | 5;
export type Tactic = 'early' | 'mid' | 'late';
export type GameMode = 'normal' | 'memory' | 'daily' | 'free';
export type MatchSpeed = 'normal' | 'fast' | 'super';

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

export interface TeamOption {
  team: string;
  year: number;
}

export interface TeamRoll extends TeamOption {
  players: Player[];
}

export interface MapResult {
  won: boolean;
  event?: string;
  shift?: number;
}

export interface MatchResult {
  round: string;
  opponent: string;
  opponentPower: number;
  opponentAvgRating: number;
  maps: MapResult[];
  won: boolean;
  bracket: 'upper' | 'lower' | 'grand';
}

export interface TournamentResult {
  matches: MatchResult[];
  placement: string;
  champion: boolean;
  tactic: Tactic;
}
