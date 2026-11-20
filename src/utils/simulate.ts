import type { Position, Roster, TournamentResult, MatchResult, MapResult, Player, Tactic } from '../types';
import rawPlayers from '../data/players.json';

const PLAYERS = rawPlayers as Player[];

const TACTIC_WEIGHTS: Record<Tactic, Record<Position, number>> = {
  early: { 1: 0.7, 2: 0.9, 3: 1.0, 4: 1.4, 5: 1.4 },
  mid:   { 1: 1.1, 2: 1.1, 3: 1.0, 4: 1.0, 5: 1.0 },
  late:  { 1: 1.5, 2: 1.4, 3: 1.0, 4: 0.6, 5: 0.6 },
};

export function teamPower(roster: Roster, tactic: Tactic = 'mid'): number {
  const weights = TACTIC_WEIGHTS[tactic];
  let total = 0;
  
  ([1, 2, 3, 4, 5] as Position[]).forEach(pos => {
    const p = roster[pos];
    if (!p) return;
    const comfort = p.positions[0] === pos ? 1.05 : 1.0;
    total += p.rating * weights[pos] * comfort;
  });
  return total;
}

function applyForm(power: number): number {
  const form = 0.88 + Math.random() * 0.24;
  return power * form;
}

function winChance(pA: number, pB: number, K = 150): number {
  return 1 / (1 + Math.pow(10, (pB - pA) / K));
}

function simulateSeries(baseP: number, bo: 1 | 3 | 5): { won: boolean; maps: MapResult[] } {
  const need = Math.ceil(bo / 2);
  let a = 0, b = 0;
  const maps: MapResult[] = [];
  
  while (a < need && b < need) {
    let p = Math.max(0.03, Math.min(0.97, baseP)); 
    let eventText, casterText, shiftValue;
    
    if (Math.random() < 0.4) {
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      p = Math.max(0.05, Math.min(0.95, p + ev.shift));
      eventText = ev.text;
      shiftValue = ev.shift;
      if (Math.random() < 0.35) casterText = CASTER_PHRASES[Math.floor(Math.random() * CASTER_PHRASES.length)];
    }
    
    const mapWon = Math.random() < p;
    if (mapWon) a++; else b++;

    if (mapWon && baseP < 0.15 && !eventText) {
      eventText = '«Upset!» — Underdogs make history, favorites are in shock.';
      casterText = '«I can\'t believe it!» — Casters can\'t believe their eyes!';
    }

    maps.push({ won: mapWon, event: eventText, caster: casterText, shift: shiftValue });
  }
  return { won: a > b, maps };
}

const EVENTS = [
  { text: '«The Play» — Na\'Vi\'s perfect save breaks the enemy.', shift: 0.15 },
  { text: '«$6M Echo Slam» — UNiVeRsE wipes the entire enemy team.', shift: 0.18 },
  { text: '«Million Dollar Coil» — s4 catches the TPs and wins the fight.', shift: 0.15 },
  { text: '«OG Comeback» — you defend against Mega Creeps and turn it around.', shift: 0.16 },
  { text: '«Collapse RP» — your offlaner lands a game-winning Reverse Polarity.', shift: 0.14 },
  { text: '«Rat Dota» — your Nature\'s Prophet destroys the enemy base.', shift: 0.12 },
  { text: '«Aegis Denied» — the enemy panics and denies their own Aegis!', shift: 0.10 },
  { text: '«Ana-style 1v5» — your carry goes absolutely godlike.', shift: 0.13 },
  { text: '«Highground Throw» — your team wipes attacking the enemy base.', shift: -0.15 },
  { text: '«Carry Caught Out» — your pos 1 dies in the woods without BKB.', shift: -0.12 },
  { text: '«Outdrafted» — the enemy counters every single one of your picks.', shift: -0.10 },
  { text: '«Aegis Lost» — the enemy takes Roshan and the Aegis.', shift: -0.13 },
  { text: '«Smoke Broken» — the enemy reads your gank and sets a trap.', shift: -0.09 },
  { text: '«Team Tilted» — your players start arguing in the chat.', shift: -0.11 },
  { text: '«Buyback Wasted» — your core buys back and instantly dies again.', shift: -0.14 },
];

const CASTER_PHRASES = [
  '«It’s a disaster!» — TobiWan is losing his mind.',
  '«Oh my god, they did it!» — The caster loses his voice.',
  '«The Play!» — A legendary moment.',
  '«Six million dollar Echo Slam!» — LD is screaming.',
  '«They are all dead!» — Total team wipe.',
  '«What a bait!» — They fell for it completely.',
  '«He\'s got the BKB!» — OD Pixel is casting at 400 words per minute.',
  '«Unbelievable!» — The crowd goes wild.',
  '«He did it!» — An insane solo play.',
  '«Absolutely massive!» — A huge teamfight win.',
];

let cachedBots: { name: string; power: number; avgRating: number }[] | null = null;

function getAllBots() {
  if (cachedBots) return cachedBots;
  
  const teamMap = new Map<string, Player[]>();
  for (const p of PLAYERS) {
    const key = `${p.team} (TI${p.year === 2011 ? '1' : p.year - 2010})`;
    if (!teamMap.has(key)) teamMap.set(key, []);
    teamMap.get(key)!.push(p);
  }

  const bots: { name: string; power: number; avgRating: number }[] = [];
  
  for (const [name, players] of teamMap.entries()) {
    const roster: Roster = { 1: null, 2: null, 3: null, 4: null, 5: null };
    const remaining = [...players];
    
    for (let pos = 1; pos <= 5; pos++) {
      const idx = remaining.findIndex(p => p.positions.includes(pos as Position));
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
      const avgRating = Math.round(
        (roster[1].rating + roster[2].rating + roster[3].rating + roster[4].rating + roster[5].rating) / 5
      );
      bots.push({ name, power: teamPower(roster, 'mid'), avgRating });
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
  
  let currentStage = 'Верхняя сетка: Четвертьфинал';
  let bo: 1 | 3 | 5 = 3;
  let isEliminated = false;

  const pick = (minPct: number, maxPct: number) => {
    let pool = allBots.slice(Math.floor(allBots.length * minPct), Math.floor(allBots.length * maxPct));
    let available = pool.filter(b => !facedOpponents.has(b.name));
    if (available.length === 0) available = pool;
    
    const opp = available[Math.floor(Math.random() * available.length)];
    facedOpponents.add(opp.name);
    return opp;
  };

  while (!isEliminated) {
    let opp: { name: string; power: number; avgRating: number };
    
    if (currentStage === 'Верхняя сетка: Четвертьфинал' || currentStage === 'Нижняя сетка: Раунд 1') {
      opp = pick(0.6, 1.0);
    } else if (currentStage === 'Верхняя сетка: Полуфинал' || currentStage === 'Нижняя сетка: Раунд 2') {
      opp = pick(0.2, 0.6);
    } else if (currentStage === 'Верхняя сетка: Финал' || currentStage === 'Нижняя сетка: Финал') {
      opp = pick(0.05, 0.2);
    } else {
      opp = pick(0.0, 0.05);
    }

    const p = winChance(myForm, applyForm(opp.power));
    const { won, maps } = simulateSeries(p, bo);
    
    const isUpper = currentStage.includes('Верхняя');
    const bracket = isUpper ? 'upper' : (currentStage === 'Гранд-финал' ? 'grand' : 'lower');

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
      if (currentStage === 'Верхняя сетка: Четвертьфинал') currentStage = 'Верхняя сетка: Полуфинал';
      else if (currentStage === 'Верхняя сетка: Полуфинал') currentStage = 'Верхняя сетка: Финал';
      else if (currentStage === 'Верхняя сетка: Финал') { currentStage = 'Гранд-финал'; bo = 5; }
      else if (currentStage === 'Нижняя сетка: Раунд 1') currentStage = 'Нижняя сетка: Раунд 2';
      else if (currentStage === 'Нижняя сетка: Раунд 2') currentStage = 'Нижняя сетка: Финал';
      else if (currentStage === 'Нижняя сетка: Финал') { currentStage = 'Гранд-финал'; bo = 5; }
      else if (currentStage === 'Гранд-финал') { break; }
    } else {
      if (currentStage === 'Верхняя сетка: Четвертьфинал') currentStage = 'Нижняя сетка: Раунд 1';
      else if (currentStage === 'Верхняя сетка: Полуфинал') currentStage = 'Нижняя сетка: Раунд 2';
      else if (currentStage === 'Верхняя сетка: Финал') currentStage = 'Нижняя сетка: Финал';
      else if (currentStage === 'Нижняя сетка: Раунд 1' || currentStage === 'Нижняя сетка: Раунд 2' || currentStage === 'Нижняя сетка: Финал') {
        isEliminated = true;
      } else if (currentStage === 'Гранд-финал') {
        break;
      }
    }
  }
  
  const last = matches[matches.length - 1];
  let placement = 'Топ-8';
  let title = 'Challenger';
  let champion = false;

  if (last.round === 'Гранд-финал' && last.won) {
    placement = 'Чемпион'; title = 'Aegis Guardian'; champion = true;
  } else if (last.round === 'Гранд-финал') {
    placement = 'Финалист'; title = 'Grand Finalist';
  } else if (last.round === 'Нижняя сетка: Финал' || last.round === 'Верхняя сетка: Финал') {
    placement = 'Топ-3'; title = 'Bronze'; 
  } else if (last.round === 'Нижняя сетка: Раунд 2' || last.round === 'Верхняя сетка: Полуфинал') {
    placement = 'Топ-4'; title = 'Contender';
  } else if (last.round === 'Нижняя сетка: Раунд 1' || last.round === 'Верхняя сетка: Четвертьфинал') {
    placement = 'Топ-6'; title = 'Survivor';
  }

  return { matches, placement, title, champion, tactic };
}