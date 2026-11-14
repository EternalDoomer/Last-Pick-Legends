import { useEffect, useState } from 'react';
import type { Player, Position, Roster, TeamRoll, TournamentResult } from '../types';
import {
  emptyRoster, countFilled, isAlreadyDrafted, getAvailableSlots,
  hasValidPicks, selectPlayer, playersOfTeam, ALL_PLAYERS
} from '../utils/draft';
import { simulateTournament } from '../utils/simulate';
import { trackDraft } from '../utils/storage';
import { translations } from '../utils/i18n';
import { getSeededRandom } from '../utils/rng';
import { getTodayTheme } from '../utils/dailyThemes';

interface DraftScreenProps {
  mode: 'normal' | 'memory' | 'daily' | 'free';
  lang: 'ru' | 'en';
  speed: 'normal' | 'fast' | 'super';
  setSpeed: (s: 'normal' | 'fast' | 'super') => void;
  onFinish: (r: TournamentResult) => void;
  customPool?: { team: string; year: number }[];
  budget?: number;
}

export default function DraftScreen({ 
  mode, lang, speed, setSpeed, onFinish, customPool, budget 
}: DraftScreenProps) {
  const t = translations[lang];
  // В обычном и свободном режиме - 3 реролла, в остальных - 1
  const INITIAL_REROLLS = mode === 'memory' || mode === 'daily' ? 1 : 3;

  const [roster, setRoster] = useState<Roster>(emptyRoster());
  const [currentTeam, setCurrentTeam] = useState<TeamRoll | null>(null);
  const [rerollsLeft, setRerollsLeft] = useState(INITIAL_REROLLS);
  const [log, setLog] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [spentBudget, setSpentBudget] = useState(0);

  const filled = countFilled(roster);
  const isComplete = filled === 5;

  const getPlayerCost = (p: Player) => p.price || 150;
  
  const canAfford = (p: Player) => {
    if (mode !== 'daily' || !budget) return true;
    return spentBudget + getPlayerCost(p) <= budget;
  };

  const rollNextTeam = (currentRoster: Roster): TeamRoll | null => {
    let availableTeams = ALL_PLAYERS.map(p => ({ team: p.team, year: p.year }));
    
    // Применяем фильтры для разных режимов
    if (customPool) {
      availableTeams = customPool;
    } else if (mode === 'daily') {
      const theme = getTodayTheme();
      availableTeams = availableTeams.filter(t => theme.filter(t.team, t.year));
    }

    // Убираем дубликаты команд (так как ALL_PLAYERS имеет по 5 записей на каждую команду)
    availableTeams = Array.from(new Set(availableTeams.map(t => JSON.stringify(t)))).map(s => JSON.parse(s));

    // Оставляем только те команды, где есть хотя бы один доступный игрок
    const validTeams = availableTeams.filter(t => {
      const teamPlayers = playersOfTeam(t.team, t.year);
      return hasValidPicks(teamPlayers, currentRoster);
    });

    if (validTeams.length === 0) return null;

    let randomVal = Math.random();
    // Для Daily используем сид, чтобы у всех игроков выпадали одни и те же команды
    if (mode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      const rng = getSeededRandom(today + filled); 
      randomVal = rng();
    }

    const pick = validTeams[Math.floor(randomVal * validTeams.length)];
    return { ...pick, players: playersOfTeam(pick.team, pick.year) };
  };

  // Первичный ролл
  useEffect(() => {
    if (!currentTeam) {
      setCurrentTeam(rollNextTeam(roster));
    }
  }, []);

  // Авто-реролл, если выпавшая команда не имеет доступных слотов
  useEffect(() => {
    if (isComplete || !currentTeam) return;
    if (hasValidPicks(currentTeam.players, roster)) return;

    const next = rollNextTeam(roster);
    if (next) {
      setCurrentTeam(next);
      setLog(l => [...l, `${t.autoReroll}: ${currentTeam.team} → ${next.team}`]);
    }
  }, [currentTeam, roster, isComplete]);

  function handlePlayerClick(p: Player) {
    if (isAlreadyDrafted(p, roster)) return;
    if (!canAfford(p)) {
      alert(lang === 'ru' ? 'Недостаточно бюджета для этого игрока!' : 'Not enough budget for this player!');
      return;
    }
    if (selectedPlayer?.id === p.id) {
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer(p);
    }
  }

  function handleSlotClick(pos: Position) {
    if (roster[pos] !== null || !selectedPlayer) return;
    if (!selectedPlayer.positions.includes(pos)) {
      alert(lang === 'ru' 
        ? `${selectedPlayer.nickname} не может играть на позиции ${pos}.` 
        : `${selectedPlayer.nickname} cannot play position ${pos}.`);
      return;
    }
    
    const newRoster = selectPlayer(selectedPlayer, roster, pos);
    setRoster(newRoster);
    trackDraft(selectedPlayer.id);
    
    if (mode === 'daily') {
      setSpentBudget(prev => prev + getPlayerCost(selectedPlayer));
    }

    setLog(l => [...l, `${lang === 'ru' ? 'Взяли' : 'Picked'} ${selectedPlayer.nickname} (${t.pos} ${pos})`]);
    setSelectedPlayer(null);
    
    if (filled + 1 < 5) {
      const next = rollNextTeam(newRoster);
      if (next) setCurrentTeam(next);
    } else {
      setCurrentTeam(null);
    }
  }

  function handleReroll() {
    if (rerollsLeft === 0 || isComplete) return;
    
    if (rerollsLeft === 1 && currentTeam && hasValidPicks(currentTeam.players, roster)) {
      if (!confirm(t.confirmReroll)) return;
    }
    
    const next = rollNextTeam(roster);
    if (next) {
      setLog(l => [...l, `${t.manualReroll}: ${currentTeam?.team} → ${next.team}`]);
      setRerollsLeft(n => n - 1);
      setCurrentTeam(next);
      setSelectedPlayer(null);
    }
  }

  function handleFinish() {
    if (!isComplete) return;
    onFinish(simulateTournament(roster));
  }

  const displayRating = (rating: number) => {
    return (mode === 'memory' || mode === 'daily') ? '?' : rating;
  };

  if (!currentTeam && !isComplete) {
    return <div className="text-center p-10 animate-pulse">{lang === 'ru' ? 'Генерация команд...' : 'Generating teams...'}</div>;
  }

  return (
    <div className="space-y-4 pb-10">
      {/* Шапка драфта */}
      <div className="flex justify-between items-center bg-ti9-panel p-3 rounded-lg border border-ti9-accent/20">
        <div className="text-xs">
          {t.play}: <span className="text-ti9-accent font-bold uppercase">{mode}</span>
        </div>
        
        {mode === 'daily' && budget && (
          <div className="text-sm font-bold">
            {t.budget}: <span className={budget - spentBudget > 0 ? 'text-green-400' : 'text-red-400'}>
              ${budget - spentBudget}
            </span>
          </div>
        )}

        {mode !== 'daily' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="opacity-70">{t.matchSpeed}:</span>
            <select 
              value={speed} 
              onChange={(e) => setSpeed(e.target.value as any)}
              className="bg-ti9-dark border border-ti9-accent/30 rounded p-1 text-white outline-none cursor-pointer"
            >
              <option value="normal">{t.speedNormal}</option>
              <option value="fast">{t.speedFast}</option>
              <option value="super">{t.speedSuper}</option>
            </select>
          </div>
        )}
      </div>

      {/* Подсказка */}
      <div className="text-center text-sm opacity-70 h-5">
        {selectedPlayer 
          ? `${t.pickedPlayer} ${selectedPlayer.nickname}. ${t.pickSlot}`
          : t.pickPlayer}
      </div>

      {/* Выпавшая команда */}
      {!isComplete && currentTeam && (
        <div className="bg-ti9-panel rounded-lg p-4 border border-ti9-accent/20">
          <h3 className="font-bold mb-3 flex justify-between items-center">
            <span>
              {t.rolled}: <span className="text-ti9-accent">{currentTeam.team}</span> · TI{currentTeam.year === 2011 ? '1' : currentTeam.year - 2010}
            </span>
            <span className="text-sm opacity-70">🎲 {t.rerolls}: {rerollsLeft}</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {currentTeam.players.map(p => {
              const taken = isAlreadyDrafted(p, roster);
              const slots = getAvailableSlots(p, roster);
              const affordable = canAfford(p);
              const disabled = taken || slots.length === 0 || !affordable;
              const isSelected = selectedPlayer?.id === p.id;
              
              return (
                <button
                  key={p.id}
                  onClick={() => handlePlayerClick(p)}
                  disabled={disabled}
                  className={`rounded p-3 text-left text-sm transition border-2 relative ${
                    disabled
                      ? 'bg-ti9-dark/50 border-transparent opacity-40 cursor-not-allowed'
                      : isSelected
                        ? 'bg-ti9-accent/20 border-ti9-accent ring-2 ring-ti9-accent'
                        : 'bg-ti9-dark border-transparent hover:border-ti9-accent/50'
                  }`}
                >
                  <div className="text-xs opacity-60 mb-1">
                    {p.positions.map(pos => `${t.pos} ${pos}`).join(' · ')}
                  </div>
                  <div className="font-bold truncate text-ti9-light">{p.nickname}</div>
                  
                  {mode === 'daily' ? (
                    <div className={`font-bold text-sm ${budget && spentBudget + getPlayerCost(p) > budget ? 'text-red-400' : 'text-green-400'}`}>
                      ${getPlayerCost(p)}
                    </div>
                  ) : (
                    <div className={`font-bold text-lg ${mode === 'memory' ? 'text-purple-400' : 'text-ti9-teal'}`}>
                      {displayRating(p.rating)}
                    </div>
                  )}

                  {!affordable && <div className="text-[10px] text-red-400 font-bold mt-1">{t.noMoney}</div>}
                </button>
              );
            })}
          </div>
          
          <div className="mt-3">
             <button
                onClick={handleReroll}
                disabled={rerollsLeft === 0 || isComplete}
                className="w-full bg-ti9-dark hover:bg-ti9-panel disabled:opacity-30 disabled:cursor-not-allowed rounded-lg py-2 text-sm font-bold border border-ti9-accent/30 transition"
              >
                🎲 Reroll ({rerollsLeft})
              </button>
          </div>
        </div>
      )}

      {/* Твой состав */}
      <div className="bg-ti9-panel rounded-lg p-4 border border-ti9-accent/20">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-ti9-accent">{t.yourRoster}: {filled}/5</h2>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(pos => {
            const p = roster[pos as Position];
            const canPlaceHere = selectedPlayer && !p && selectedPlayer.positions.includes(pos as Position);
            
            return (
              <div 
                key={pos} 
                onClick={() => handleSlotClick(pos as Position)}
                className={`rounded p-2 text-center text-xs transition border-2 ${
                  p 
                    ? 'bg-ti9-dark border-ti9-accent/30' 
                    : canPlaceHere
                      ? 'bg-green-900/40 border-green-500 cursor-pointer hover:bg-green-800/50'
                      : 'bg-ti9-dark border-ti9-accent/10 border-dashed'
                }`}
              >
                <div className="font-bold opacity-70 mb-1">{t.pos} {pos}</div>
                {p ? (
                  <>
                    <div className="truncate font-bold text-ti9-light">{p.nickname}</div>
                    {mode === 'daily' ? (
                      <div className="text-xs text-green-400 font-bold">${getPlayerCost(p)}</div>
                    ) : (
                      <div className={`font-bold text-sm ${mode === 'memory' ? 'text-purple-400' : 'text-ti9-teal'}`}>
                        {displayRating(p.rating)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-500 py-2">{canPlaceHere ? (lang === 'ru' ? 'Ставь' : 'Place') : '—'}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Кнопка завершения */}
      <button
        onClick={handleFinish}
        disabled={!isComplete}
        className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg transition"
      >
        {isComplete ? t.finishDraft : `${t.fillRoster} (${filled}/5)`}
      </button>

      {/* Лог событий */}
      {log.length > 0 && (
        <div className="bg-ti9-panel rounded-lg p-3 text-xs opacity-60 max-h-32 overflow-y-auto">
          {log.slice().reverse().map((entry, i) => (
            <div key={i} className="mb-1">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}