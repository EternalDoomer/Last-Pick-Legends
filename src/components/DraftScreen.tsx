import { useState, useRef } from 'react';
import type { Player, Position, Roster, TeamRoll, TournamentResult, Tactic } from '../types';
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
  onFinish: (r: TournamentResult, avg: number, saved: number) => void;
  customPool?: { team: string; year: number }[];
  budget?: number;
}

export default function DraftScreen({ 
  mode, lang, speed, setSpeed, onFinish, customPool, budget 
}: DraftScreenProps) {
  const t = translations[lang];
  const INITIAL_REROLLS = mode === 'memory' || mode === 'daily' ? 1 : 3;

  const [roster, setRoster] = useState<Roster>(emptyRoster());
  const [currentTeam, setCurrentTeam] = useState<TeamRoll | null>(null);
  const [rerollsLeft, setRerollsLeft] = useState(INITIAL_REROLLS);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [spentBudget, setSpentBudget] = useState(0);
  
  const [tactic, setTactic] = useState<Tactic>('mid');

  const [isRolling, setIsRolling] = useState(false);
  const [rollingTeamName, setRollingTeamName] = useState('???');
  const pendingTeamRef = useRef<TeamRoll | null>(null);

  const filled = countFilled(roster);
  const isComplete = filled === 5;

  const draftedPlayers = Object.values(roster).filter(Boolean) as Player[];
  const averageRating = draftedPlayers.length > 0
    ? Math.round(draftedPlayers.reduce((sum, p) => sum + p.rating, 0) / draftedPlayers.length).toString()
    : '0';

  const getPlayerCost = (p: Player) => p.price || 150;
  
  const canAfford = (p: Player) => {
    if (mode !== 'daily' || !budget) return true;
    return spentBudget + getPlayerCost(p) <= budget;
  };

  const getNextTeamData = (currentRoster: Roster, excludeTeamName?: string): TeamRoll | null => {
    let availableTeams = ALL_PLAYERS.map(p => ({ team: p.team, year: p.year }));
    
    if (customPool) {
      availableTeams = customPool;
    } else if (mode === 'daily') {
      const theme = getTodayTheme();
      availableTeams = availableTeams.filter(t => theme.filter(t.team, t.year));
    }

    availableTeams = Array.from(new Set(availableTeams.map(t => JSON.stringify(t)))).map(s => JSON.parse(s));

    let validTeams = availableTeams.filter(t => {
      const teamPlayers = playersOfTeam(t.team, t.year);
      return hasValidPicks(teamPlayers, currentRoster);
    });

    if (excludeTeamName) {
      const withoutExcluded = validTeams.filter(t => t.team !== excludeTeamName);
      if (withoutExcluded.length > 0) {
        validTeams = withoutExcluded;
      }
    }

    if (validTeams.length === 0) return null;

    let randomVal = Math.random();
    if (mode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      const rng = getSeededRandom(today + filled); 
      randomVal = rng();
    }

    const pick = validTeams[Math.floor(randomVal * validTeams.length)];
    return { ...pick, players: playersOfTeam(pick.team, pick.year) };
  };

  const executeRoll = (isReroll: boolean) => {
    if (isRolling || isComplete) return;
    if (isReroll && rerollsLeft === 0) return;

    const nextTeam = getNextTeamData(roster, currentTeam?.team);
    if (!nextTeam) return;

    if (isReroll) {
      setRerollsLeft(n => n - 1);
    }

    pendingTeamRef.current = nextTeam;
    setIsRolling(true);
    setCurrentTeam(null);

    const possibleNames = Array.from(new Set(ALL_PLAYERS.map(p => p.team)));
    let ticks = 0;
    const maxTicks = 20;

    const interval = setInterval(() => {
      setRollingTeamName(possibleNames[Math.floor(Math.random() * possibleNames.length)]);
      ticks++;

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setCurrentTeam(pendingTeamRef.current);
        setIsRolling(false);
      }
    }, 60);
  };

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
    
    if (mode !== 'free') {
      trackDraft(selectedPlayer.id);
    }
    
    if (mode === 'daily') {
      setSpentBudget(prev => prev + getPlayerCost(selectedPlayer));
    }

    setSelectedPlayer(null);
    setCurrentTeam(null);
  }

  const displayRating = (rating: number) => {
    return (mode === 'memory' || mode === 'daily') ? '?' : rating;
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex justify-between items-center bg-ti9-panel p-3 rounded-lg border border-ti9-accent/20">
        <div className="text-sm">
          <span className="text-ti9-accent font-bold uppercase">{mode}</span>
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

      <div className="bg-ti9-panel p-2 rounded-lg border border-ti9-accent/20 flex gap-1">
        <button 
          onClick={() => setTactic('early')} 
          className={`flex-1 py-1.5 rounded text-xs font-bold transition ${tactic === 'early' ? 'bg-ti9-accent text-ti9-dark' : 'hover:bg-ti9-dark/50 text-slate-400'}`}
        >
          ⚔️ EARLY
        </button>
        <button 
          onClick={() => setTactic('mid')} 
          className={`flex-1 py-1.5 rounded text-xs font-bold transition ${tactic === 'mid' ? 'bg-ti9-accent text-ti9-dark' : 'hover:bg-ti9-dark/50 text-slate-400'}`}
        >
          ⚖️ MID
        </button>
        <button 
          onClick={() => setTactic('late')} 
          className={`flex-1 py-1.5 rounded text-xs font-bold transition ${tactic === 'late' ? 'bg-ti9-accent text-ti9-dark' : 'hover:bg-ti9-dark/50 text-slate-400'}`}
        >
          🛡️ LATE
        </button>
      </div>

      <div className="text-center text-sm opacity-70 h-5">
        {selectedPlayer 
          ? `${t.pickedPlayer} ${selectedPlayer.nickname}. ${t.pickSlot}`
          : t.pickPlayer}
      </div>

      {!isComplete && (
        <div className="bg-ti9-panel rounded-lg p-4 border border-ti9-accent/20">
          
          <h3 className="font-bold mb-3 flex justify-between items-center">
            <span>
              {t.rolled}: <span className="text-ti9-accent font-mono uppercase tracking-wider">
                {isRolling ? rollingTeamName : (currentTeam ? currentTeam.team : '???')}
              </span>
              {!isRolling && currentTeam && <span className="text-ti9-light opacity-80"> · TI{currentTeam.year === 2011 ? '1' : currentTeam.year - 2010}</span>}
            </span>
            <span className="text-sm opacity-70">🎲 {t.rerolls}: {rerollsLeft}</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 min-h-[90px]">
            {isRolling && (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="rounded p-3 border-2 border-dashed border-ti9-accent/20 bg-ti9-dark/30 flex flex-col justify-center items-center h-full">
                  <div className="text-2xl text-ti9-accent/30 animate-pulse font-bold">?</div>
                </div>
              ))
            )}

            {!isRolling && !currentTeam && (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="rounded p-3 border-2 border-dashed border-ti9-accent/10 bg-ti9-dark/10 flex flex-col justify-center items-center h-full">
                  <div className="text-slate-500 font-bold">—</div>
                </div>
              ))
            )}

            {!isRolling && currentTeam && (
              currentTeam.players.map(p => {
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
                    className={`rounded p-3 text-left text-sm transition border-2 relative h-full ${
                      disabled
                        ? 'bg-ti9-dark/50 border-transparent opacity-40 cursor-not-allowed'
                        : isSelected
                          ? 'bg-ti9-accent/20 border-ti9-accent ring-2 ring-ti9-accent'
                          : 'bg-ti9-dark border-transparent hover:border-ti9-accent/50'
                    }`}
                  >
                    <div className="text-xs opacity-60 mb-1">
                      {p.positions.map((pos: Position) => `${t.pos} ${pos}`).join(' · ')}
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
                  </button>
                );
              })
            )}
          </div>
          
          <div>
            {!isRolling && !currentTeam && (
              <button
                onClick={() => executeRoll(false)}
                className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 rounded-lg py-3 font-bold text-lg shadow-[0_0_15px_rgba(212,175,55,0.3)] transition transform active:scale-95"
              >
                🎲 {t.rollTeam}
              </button>
            )}

            {!isRolling && currentTeam && (
              <button
                onClick={() => executeRoll(true)}
                disabled={rerollsLeft === 0}
                className="w-full bg-ti9-dark hover:bg-ti9-panel disabled:opacity-30 disabled:cursor-not-allowed rounded-lg py-3 text-lg font-bold border border-ti9-accent/30 transition transform active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
              >
                🎲 Reroll ({rerollsLeft})
              </button>
            )}

            {isRolling && (
              <button
                disabled
                className="w-full bg-ti9-dark/50 text-ti9-accent/50 rounded-lg py-3 text-lg font-bold border border-ti9-accent/20 cursor-wait animate-pulse"
              >
                {t.rolling}...
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-ti9-panel rounded-lg p-4 border border-ti9-accent/20">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-ti9-accent">{t.yourRoster}: {filled}/5</h2>
          
          {(mode === 'normal' || mode === 'free') && filled > 0 && (
            <div className="text-xs font-bold bg-ti9-dark px-2.5 py-1 rounded-md border border-ti9-accent/20 shadow-sm">
              Avg OVR: <span className="text-ti9-teal text-sm ml-1">{averageRating}</span>
            </div>
          )}

          {(mode === 'memory' || mode === 'daily') && (
            <div className="text-xs font-bold bg-ti9-dark px-2.5 py-1 rounded-md border border-ti9-accent/20 shadow-sm">
              Avg OVR: {isComplete ? (
                <span className="text-ti9-teal text-sm ml-1">{averageRating}</span>
              ) : (
                <span className="text-purple-400 text-sm ml-1">?</span>
              )}
            </div>
          )}
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

      <button
        onClick={() => onFinish(simulateTournament(roster, tactic), Number(averageRating), mode === 'daily' && budget ? budget - spentBudget : 0)}
        disabled={!isComplete}
        className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg transition"
      >
        {isComplete ? t.finishDraft : `${t.fillRoster} (${filled}/5)`}
      </button>

    </div>
  );
}