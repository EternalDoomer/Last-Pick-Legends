import type { Position, Roster, TournamentResult, MatchResult, MapResult, Player, Tactic } from '../types';
import { ALL_PLAYERS, formatTeamLabel, getAverageRating } from './draft';

// Normalized weights (each tactic sums to 5.0 so no tactic gets a free stat inflation)
const TACTIC_WEIGHTS: Record<Tactic, Record<Position, number>> = {
  early: { 1: 0.65, 2: 0.85, 3: 1.0, 4: 1.25, 5: 1.25 },
  mid:   { 1: 1.0,  2: 1.0,  3: 1.0, 4: 1.0,  5: 1.0  },
  late:  { 1: 1.35, 2: 1.25, 3: 1.0, 4: 0.7,  5: 0.7  },
};

export function teamPower(roster: Roster, tactic: Tactic = 'mid'): number {
  const weights = TACTIC_WEIGHTS[tactic];
  let total = 0;

  ([1, 2, 3, 4, 5] as Position[]).forEach((pos) => {
    const p = roster[pos];
    if (!p) return;
    const comfort = p.positions[0] === pos ? 1.05 : 1.0;
    total += p.rating * weights[pos] * comfort;
  });
  return total;
}

function applyForm(power: number): number {
  // ±7% form swing: impactful in close series without erasing a large class gap
  const form = 0.93 + Math.random() * 0.14;
  return power * form;
}

function winChance(pA: number, pB: number, K = 100): number {
  // Clamped to [0.025, 0.975] so even heavy underdogs retain a tiny Cinderella chance
  const raw = 1 / (1 + Math.pow(10, (pB - pA) / K));
  return Math.max(0.025, Math.min(0.975, raw));
}

interface GameEvent {
  text: string;
  shift: number;
  weight: number;
  tactics?: Tactic[];
}

// Concise, iconic The International moments (single-line, high impact)
const EVENTS: GameEvent[] = [
  // Positive Legendary & Tactical TI Moments
  { text: "«The Play»", shift: 0.16, weight: 2 },
  { text: "«$6M Echo Slam» — Rosh pit wipe", shift: 0.17, weight: 2 },
  { text: "«Million Dollar Coil»", shift: 0.15, weight: 2 },
  { text: "«Ceeeeeeeeeb!»", shift: 0.16, weight: 2, tactics: ['late', 'mid'] },
  { text: "«Fountain Hook»", shift: 0.15, weight: 2, tactics: ['early', 'mid'] },
  { text: "«Collapse Horn Toss»", shift: 0.14, weight: 3, tactics: ['mid', 'late'] },
  { text: "«Ana Ember Dodge»", shift: 0.14, weight: 3, tactics: ['late'] },
  { text: "«Wings Unpredictable»", shift: 0.12, weight: 3 },
  { text: "«Miracle Arc Warden»", shift: 0.14, weight: 2, tactics: ['late'] },
  { text: "«17% Bash»", shift: 0.10, weight: 4, tactics: ['early', 'mid'] },

  // Negative Iconic TI Blunders & Throws
  { text: "«KyXy Aegis Deny»", shift: -0.16, weight: 2 },
  { text: "«322 Throw»", shift: -0.15, weight: 3 },
  { text: "«no[o]ne Item Delete»", shift: -0.14, weight: 2, tactics: ['late'] },
  { text: "«No TP Scroll»", shift: -0.12, weight: 3, tactics: ['late', 'mid'] },
  { text: "«Lvl 1 Rosh Disaster»", shift: -0.13, weight: 3, tactics: ['early'] },
  { text: "«Rapier Dropped»", shift: -0.15, weight: 2, tactics: ['late'] },
  { text: "«Smoke Into Five»", shift: -0.11, weight: 4, tactics: ['early', 'mid'] },
  { text: "«5-Man Black Hole»", shift: -0.15, weight: 2 },
];

function pickWeightedEvent(tactic: Tactic): GameEvent {
  const pool = EVENTS.map((ev) => {
    const tacticBoost = ev.tactics?.includes(tactic) ? 1.5 : 1.0;
    return { ev, effectiveWeight: ev.weight * tacticBoost };
  });

  const totalWeight = pool.reduce((sum, item) => sum + item.effectiveWeight, 0);
  let r = Math.random() * totalWeight;
  for (const item of pool) {
    r -= item.effectiveWeight;
    if (r <= 0) return item.ev;
  }
  return pool[pool.length - 1].ev;
}

function simulateSeries(baseP: number, bo: 1 | 3 | 5, tactic: Tactic): { won: boolean; maps: MapResult[] } {
  const need = Math.ceil(bo / 2);
  let a = 0;
  let b = 0;
  const maps: MapResult[] = [];

  while (a < need && b < need) {
    let p = baseP;
    let eventText: string | undefined;
    let shiftValue: number | undefined;

    if (Math.random() < 0.38) {
      const ev = pickWeightedEvent(tactic);
      p = Math.max(0.02, Math.min(0.98, p + ev.shift));
      eventText = ev.text;
      shiftValue = ev.shift;
    }

    const mapWon = Math.random() < p;
    if (mapWon) a++;
    else b++;

    if (mapWon && baseP < 0.14 && !eventText) {
      eventText = "«TI Cinderella Upset» — Underdogs shock the favorites";
      shiftValue = 0.2;
    }

    maps.push({ won: mapWon, event: eventText, shift: shiftValue });
  }
  return { won: a > b, maps };
}

let cachedBots: { name: string; power: number; avgRating: number }[] | null = null;

function getAllBots() {
  if (cachedBots) return cachedBots;

  const teamMap = new Map<string, Player[]>();
  for (const p of ALL_PLAYERS) {
    const key = formatTeamLabel(p.team, p.year);
    if (!teamMap.has(key)) teamMap.set(key, []);
    teamMap.get(key)!.push(p);
  }

  const bots: { name: string; power: number; avgRating: number }[] = [];

  for (const [name, players] of teamMap.entries()) {
    const roster: Roster = { 1: null, 2: null, 3: null, 4: null, 5: null };
    const remaining = [...players].sort((a, b) => b.rating - a.rating);

    for (let pos = 1; pos <= 5; pos++) {
      const idx = remaining.findIndex((p) => p.positions.includes(pos as Position));
      if (idx !== -1) {
        roster[pos as Position] = remaining[idx];
        remaining.splice(idx, 1);
      }
    }
    for (let pos = 1; pos <= 5; pos++) {
      if (!roster[pos as Position] && remaining.length > 0) {
        roster[pos as Position] = remaining.pop()!;
      }
    }

    if (roster[1] && roster[2] && roster[3] && roster[4] && roster[5]) {
      bots.push({
        name,
        power: teamPower(roster, 'mid'),
        avgRating: getAverageRating(roster),
      });
    }
  }

  cachedBots = bots.sort((a, b) => b.power - a.power);
  return cachedBots;
}

export function simulateTournament(roster: Roster, tactic: Tactic): TournamentResult {
  const myPower = teamPower(roster, tactic);
  const myForm = applyForm(myPower);

  const allBots = getAllBots();
  const matches: MatchResult[] = [];
  const facedOpponents = new Set<string>();

  let currentStage = 'Upper Bracket: Quarterfinal';
  let bo: 1 | 3 | 5 = 3;
  let isEliminated = false;

  const pickOpponent = (minPct: number, maxPct: number) => {
    const pool = allBots.slice(
      Math.floor(allBots.length * minPct),
      Math.floor(allBots.length * maxPct)
    );
    const available = pool.filter((b) => !facedOpponents.has(b.name));
    const source = available.length > 0 ? available : pool;

    const opp = source[Math.floor(Math.random() * source.length)];
    facedOpponents.add(opp.name);
    return opp;
  };

  while (!isEliminated) {
    let opp: { name: string; power: number; avgRating: number };

    if (currentStage === 'Upper Bracket: Quarterfinal' || currentStage === 'Lower Bracket: Round 1') {
      opp = pickOpponent(0.6, 1.0);
    } else if (currentStage === 'Upper Bracket: Semifinal' || currentStage === 'Lower Bracket: Round 2') {
      opp = pickOpponent(0.2, 0.6);
    } else if (currentStage === 'Upper Bracket: Final' || currentStage === 'Lower Bracket: Final') {
      opp = pickOpponent(0.05, 0.2);
    } else {
      opp = pickOpponent(0.0, 0.05);
    }

    const p = winChance(myForm, applyForm(opp.power));
    const { won, maps } = simulateSeries(p, bo, tactic);

    const bracket = currentStage.startsWith('Upper')
      ? 'upper'
      : currentStage === 'Grand Final'
      ? 'grand'
      : 'lower';

    matches.push({
      round: currentStage,
      opponent: opp.name,
      opponentPower: opp.power,
      opponentAvgRating: opp.avgRating,
      maps,
      won,
      bracket,
    });

    if (won) {
      if (currentStage === 'Upper Bracket: Quarterfinal') currentStage = 'Upper Bracket: Semifinal';
      else if (currentStage === 'Upper Bracket: Semifinal') currentStage = 'Upper Bracket: Final';
      else if (currentStage === 'Upper Bracket: Final') {
        currentStage = 'Grand Final';
        bo = 5;
      } else if (currentStage === 'Lower Bracket: Round 1') currentStage = 'Lower Bracket: Round 2';
      else if (currentStage === 'Lower Bracket: Round 2') currentStage = 'Lower Bracket: Final';
      else if (currentStage === 'Lower Bracket: Final') {
        currentStage = 'Grand Final';
        bo = 5;
      } else if (currentStage === 'Grand Final') {
        break;
      }
    } else {
      if (currentStage === 'Upper Bracket: Quarterfinal') currentStage = 'Lower Bracket: Round 1';
      else if (currentStage === 'Upper Bracket: Semifinal') currentStage = 'Lower Bracket: Round 2';
      else if (currentStage === 'Upper Bracket: Final') currentStage = 'Lower Bracket: Final';
      else if (
        currentStage === 'Lower Bracket: Round 1' ||
        currentStage === 'Lower Bracket: Round 2' ||
        currentStage === 'Lower Bracket: Final'
      ) {
        isEliminated = true;
      } else if (currentStage === 'Grand Final') {
        break;
      }
    }
  }

  const last = matches[matches.length - 1];
  let placement = 'Top 8';
  let champion = false;

  if (last.round === 'Grand Final' && last.won) {
    placement = 'Champion';
    champion = true;
  } else if (last.round === 'Grand Final') {
    placement = 'Finalist';
  } else if (last.round === 'Lower Bracket: Final' || last.round === 'Upper Bracket: Final') {
    placement = 'Top 3';
  } else if (last.round === 'Lower Bracket: Round 2' || last.round === 'Upper Bracket: Semifinal') {
    placement = 'Top 4';
  } else if (last.round === 'Lower Bracket: Round 1' || last.round === 'Upper Bracket: Quarterfinal') {
    placement = 'Top 6';
  }

  return { matches, placement, champion, tactic };
}
