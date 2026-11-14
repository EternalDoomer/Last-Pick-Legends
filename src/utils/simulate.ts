import type { Position, Roster, TournamentResult, MatchResult, MapResult, Player } from '../types';
import rawPlayers from '../data/players.json';

const PLAYERS = rawPlayers as Player[];

const SLOT_WEIGHTS: Record<Position, number> = {
  1: 1.2, 2: 1.2, 3: 1.0, 4: 0.8, 5: 0.8,
};

export function teamPower(roster: Roster): number {
  let total = 0;
  ([1, 2, 3, 4, 5] as Position[]).forEach(pos => {
    const p = roster[pos];
    if (!p) return;
    const comfort = p.positions[0] === pos ? 1.05 : 1.0;
    total += p.rating * SLOT_WEIGHTS[pos] * comfort;
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
    // Гарантируем, что даже у самого слабого состава есть минимум 3% шанс выиграть карту
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

    // Если шанс был меньше 15%, а мы выиграли — добавляем флейвор "Сенсации"
    if (mapWon && baseP < 0.15 && !eventText) {
      eventText = '«Сенсация!» — андердоги творят историю, фавориты в шоке.';
      casterText = '«I can\'t believe it!» — комментаторы не верят своим глазам!';
    }

    maps.push({ won: mapWon, event: eventText, caster: casterText, shift: shiftValue });
  }
  return { won: a > b, maps };
}

const EVENTS = [
  { text: '«The Play» — идеальный сейв от Na\'Vi на TI2 полностью ломает драфт соперника.', shift: 0.15 },
  { text: '«Эхо-слэм на $6 миллионов» — UNiVeRsE ловит всех героев врага ультой Earthshaker на TI5.', shift: 0.18 },
  { text: '«Dream Coil на миллион» — s4 ловит телепорты Alliance и выигрывает TI3.', shift: 0.15 },
  { text: '«Камбэк OG» — ваша команда переворачивает игру с мегакрипами, как OG в финале TI8.', shift: 0.16 },
  { text: '«РП на хайграунде» — идеальный Reverse Polarity от вашего оффлейнера в стиле Collapse (TI10).', shift: 0.14 },
  { text: '«Рат-дота» — Nature\'s Prophet вашего игрока разбирает базу врагов, как у AdmiralBulldog (TI3).', shift: 0.12 },
  { text: '«Денай Аегиса» — враг в панике денаит свой же Аегис, как Kyxy в TI3!', shift: 0.10 },
  { text: '«Ана на Эмбер Спирите» — невероятный 1v5 в исполнении вашего керри (TI8).', shift: 0.13 },
  { text: '«Сгорели на хайграунде» — бездарный штурм базы заканчивается вайпом.', shift: -0.15 },
  { text: '«Керри закинули» — враги поймали вашего главного кора без БКБ в лесу.', shift: -0.12 },
  { text: '«Проиграли пик» — драфт полностью разобран соперником, играть невозможно.', shift: -0.10 },
  { text: '«Потеряли Аегис» — враги сделали Рошана и забрали Аегис, у вас нет шансов.', shift: -0.13 },
  { text: '«Смок сломан» — враги прочитали ваш закуп и вышли на варды.', shift: -0.09 },
  { text: '«Тильт» — ваши игроки начали спорить в чате, игра развалилась.', shift: -0.11 },
  { text: '«Байбек в никуда» — ваш керри умер, купил байбек и снова умер.', shift: -0.14 },
];

const CASTER_PHRASES = [
  '«It’s a disaster!» — Тобиван не может сдержать эмоций!',
  '«Oh my god, they did it!» — комментатор срывает голос!',
  '«The Play!» — легендарная фраза Тобивана.',
  '«Six million dollar Echo Slam!» — ЛД в восторге от ульты!',
  '«They are all dead!» — залп комментатора после идеальной драки.',
  '«What a bait!» — враги купились на приманку!',
  '«He\'s got the BKB!» — ОДПиксель кричит от восторга.',
  '«Это просто невероятно!» — трибуны в восторге от происходящего на карте.',
  '«Он сделал это!» — невероятный камбэк в исполнении вашей команды.',
];

let cachedBots: { name: string; power: number }[] | null = null;

function getAllBots() {
  if (cachedBots) return cachedBots;
  
  const teamMap = new Map<string, Player[]>();
  for (const p of PLAYERS) {
    const key = `${p.team} (TI${p.year === 2011 ? '1' : p.year - 2010})`;
    if (!teamMap.has(key)) teamMap.set(key, []);
    teamMap.get(key)!.push(p);
  }

  const bots: { name: string; power: number }[] = [];
  
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
      bots.push({ name, power: teamPower(roster) });
    }
  }
  
  cachedBots = bots.sort((a, b) => b.power - a.power);
return cachedBots;
}

export function simulateTournament(roster: Roster): TournamentResult {
  const myPower = teamPower(roster);
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
    let opp: { name: string; power: number };
    
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

  return { matches, placement, title, champion };
}