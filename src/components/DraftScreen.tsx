import { useState, useRef, useEffect } from 'react';
import type {
  Player,
  Position,
  Roster,
  TeamRoll,
  TournamentResult,
  Tactic,
  GameMode,
  MatchSpeed,
  TeamOption,
} from '../types';
import {
  emptyRoster,
  countFilled,
  getAverageRating,
  getPlayerCost,
  isAlreadyDrafted,
  canPickPlayer,
  selectPlayer,
  playersOfTeam,
  formatTiEdition,
  getTodayDateStr,
  ALL_PLAYERS,
  ALL_TEAMS,
} from '../utils/draft';
import { simulateTournament } from '../utils/simulate';
import { trackDraft } from '../utils/storage';
import { getSeededRandom } from '../utils/rng';
import { getTodayTheme, getThemeForDate, getTaskForDate } from '../utils/dailyThemes';
import TacticLabel from './TacticBadge';

interface DraftScreenProps {
  mode: GameMode;
  speed: MatchSpeed;
  setSpeed: (s: MatchSpeed) => void;
  onFinish: (r: TournamentResult, avg: number, saved: number, roster?: Roster) => void;
  customPool?: TeamOption[];
  budget?: number;
  dailyDate?: string;
}

export default function DraftScreen({
  mode,
  speed,
  setSpeed,
  onFinish,
  customPool,
  budget,
  dailyDate,
}: DraftScreenProps) {
  const INITIAL_REROLLS = mode === 'memory' || mode === 'daily' ? 1 : 3;

  const [roster, setRoster] = useState<Roster>(emptyRoster());
  const [currentTeam, setCurrentTeam] = useState<TeamRoll | null>(null);
  const [rerollsLeft, setRerollsLeft] = useState(INITIAL_REROLLS);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [spentBudget, setSpentBudget] = useState(0);
  const [rollCount, setRollCount] = useState(0);
  const [tactic, setTactic] = useState<Tactic>('mid');

  const [isRolling, setIsRolling] = useState(false);
  const [rollingTeamName, setRollingTeamName] = useState('???');
  const pendingTeamRef = useRef<TeamRoll | null>(null);
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!speedOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(e.target as Node)) {
        setSpeedOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [speedOpen]);

  const filled = countFilled(roster);
  const isComplete = filled === 5;
  const avgRating = getAverageRating(roster);
  const remainingBudget = budget !== undefined ? budget - spentBudget : undefined;
  const hideRatings = mode === 'memory' || mode === 'daily';

  const effectiveDate = dailyDate ?? getTodayDateStr();
  const effectiveTheme = dailyDate ? getThemeForDate(dailyDate) : getTodayTheme();
  const effectiveTask = mode === 'daily' ? getTaskForDate(effectiveDate, effectiveTheme) : null;
  const targetPlayerKey = effectiveTask?.requiredPlayerId?.toLowerCase();

  const matchesTargetPlayer = (p: Player): boolean => {
    if (!targetPlayerKey) return false;
    return (
      p.id.toLowerCase() === targetPlayerKey ||
      p.id.toLowerCase().startsWith(`${targetPlayerKey}_`) ||
      p.nickname.toLowerCase().replace(/[^a-z0-9]/g, '') ===
        targetPlayerKey.replace(/[^a-z0-9]/g, '')
    );
  };

  const getModePool = (): TeamOption[] => {
    if (customPool) return customPool;
    if (mode === 'daily') {
      return ALL_TEAMS.filter((t) => effectiveTheme.filter(t.team, t.year));
    }
    return ALL_TEAMS;
  };

  const getNextTeamData = (
    currentRoster: Roster,
    currentRemainingBudget: number | undefined,
    attemptIndex: number,
    excludeTeam?: TeamOption
  ): TeamRoll | null => {
    const modePool = getModePool();

    let validTeams = modePool.filter((t) =>
      playersOfTeam(t.team, t.year).some((p) =>
        canPickPlayer(p, currentRoster, currentRemainingBudget)
      )
    );

    if (excludeTeam && validTeams.length > 1) {
      const filtered = validTeams.filter(
        (t) => !(t.team === excludeTeam.team && t.year === excludeTeam.year)
      );
      if (filtered.length > 0) validTeams = filtered;
    }

    if (validTeams.length === 0) return null;

    if (mode === 'daily' && targetPlayerKey) {
      const alreadyPicked = Object.values(currentRoster).some(
        (p) => p && matchesTargetPlayer(p)
      );
      if (!alreadyPicked) {
        const guaranteedTeams = validTeams.filter((t) =>
          playersOfTeam(t.team, t.year).some(
            (p) =>
              matchesTargetPlayer(p) &&
              canPickPlayer(p, currentRoster, currentRemainingBudget)
          )
        );
        if (guaranteedTeams.length > 0 && attemptIndex >= 2) {
          const seedKey = `${effectiveDate}_target_${attemptIndex}`;
          const rVal = getSeededRandom(seedKey)();
          const pick = guaranteedTeams[Math.floor(rVal * guaranteedTeams.length)];
          return { ...pick, players: playersOfTeam(pick.team, pick.year) };
        }
      }
    }

    let randomVal = Math.random();
    if (mode === 'daily') {
      const seedKey = `${effectiveDate}_s${countFilled(currentRoster)}_r${attemptIndex}`;
      randomVal = getSeededRandom(seedKey)();
    }

    const pick = validTeams[Math.floor(randomVal * validTeams.length)];
    return { ...pick, players: playersOfTeam(pick.team, pick.year) };
  };

  const executeRoll = (isReroll: boolean) => {
    if (isRolling || isComplete) return;
    if (isReroll && rerollsLeft === 0) return;

    const nextAttempt = rollCount + 1;
    const exclude = currentTeam ? { team: currentTeam.team, year: currentTeam.year } : undefined;
    const nextTeam = getNextTeamData(roster, remainingBudget, nextAttempt, exclude);

    if (!nextTeam) return;

    setRollCount(nextAttempt);
    if (isReroll) setRerollsLeft((n) => n - 1);

    pendingTeamRef.current = nextTeam;
    setIsRolling(true);
    setCurrentTeam(null);

    const poolNames = Array.from(new Set(getModePool().map((t) => t.team)));
    const possibleNames = poolNames.length > 0 ? poolNames : ALL_TEAMS.map((t) => t.team);

    let ticks = 0;
    const interval = setInterval(() => {
      setRollingTeamName(possibleNames[Math.floor(Math.random() * possibleNames.length)]);
      ticks++;

      if (ticks >= 20) {
        clearInterval(interval);
        setCurrentTeam(pendingTeamRef.current);
        setIsRolling(false);
      }
    }, 60);
  };

  const handlePlayerClick = (p: Player) => {
    if (isAlreadyDrafted(p, roster)) return;
    if (remainingBudget !== undefined && getPlayerCost(p) > remainingBudget) {
      alert('Not enough budget for this player!');
      return;
    }
    setSelectedPlayer(selectedPlayer?.id === p.id ? null : p);
  };

  const handleSlotClick = (pos: Position) => {
    if (roster[pos] !== null || !selectedPlayer) return;
    if (!selectedPlayer.positions.includes(pos)) {
      alert(`${selectedPlayer.nickname} cannot play position ${pos}.`);
      return;
    }

    setRoster(selectPlayer(selectedPlayer, roster, pos));

    if (mode !== 'free' && !dailyDate) trackDraft(selectedPlayer.id);
    if (mode === 'daily') setSpentBudget((prev) => prev + getPlayerCost(selectedPlayer));

    setSelectedPlayer(null);
    setCurrentTeam(null);
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex justify-between items-center bg-ti9-panel px-3.5 py-2.5 rounded-xl border border-ti9-accent/20">
        <div className="text-xs font-extrabold uppercase tracking-widest text-ti9-accent">
          {dailyDate ? `Daily Practice · ${dailyDate}` : mode}
        </div>

        {mode === 'daily' && remainingBudget !== undefined ? (
          <div className="text-sm font-bold">
            Budget:{' '}
            <span className={remainingBudget > 0 ? 'text-green-400' : 'text-red-400'}>
              ${remainingBudget}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Match Speed
            </span>

            <div ref={speedDropdownRef} className="relative w-32">
              <button
                type="button"
                onClick={() => setSpeedOpen((o) => !o)}
                className={`w-full bg-ti9-dark hover:bg-[#171226] border border-ti9-accent/40 hover:border-ti9-accent px-3 py-1.5 text-xs font-extrabold text-ti9-teal flex items-center justify-between gap-2 transition cursor-pointer ${
                  speedOpen
                    ? 'rounded-t-xl rounded-b-none border-b-white/10'
                    : 'rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                }`}
              >
                <span className="flex-1 text-center truncate">
                  {speed === 'normal' ? 'Normal' : speed === 'fast' ? 'Fast' : 'Super Fast'}
                </span>
                <svg
                  className={`w-3 h-3 text-ti9-accent shrink-0 transition-transform duration-200 ${
                    speedOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {speedOpen && (
                <div className="absolute right-0 left-0 top-full z-30 bg-[#151024] border border-t-0 border-ti9-accent/45 rounded-b-xl shadow-[0_12px_28px_rgba(0,0,0,0.65)] overflow-hidden">
                  {(
                    [
                      { value: 'normal', label: 'Normal' },
                      { value: 'fast', label: 'Fast' },
                      { value: 'super', label: 'Super Fast' },
                    ] as { value: MatchSpeed; label: string }[]
                  ).map((opt) => {
                    const active = speed === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSpeed(opt.value);
                          setSpeedOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-xs font-bold text-center transition flex items-center justify-center ${
                          active
                            ? 'bg-ti9-accent/20 text-ti9-accent font-extrabold'
                            : 'text-slate-200 hover:bg-ti9-panel hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-ti9-panel p-1.5 rounded-xl border border-ti9-accent/20 flex gap-1">
        {(['early', 'mid', 'late'] as Tactic[]).map((item) => (
          <button
            key={item}
            onClick={() => setTactic(item)}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold tracking-wider transition ${
              tactic === item
                ? 'bg-ti9-accent text-ti9-dark shadow-sm'
                : 'hover:bg-ti9-dark/50 text-slate-400'
            }`}
          >
            <TacticLabel tactic={item} />
          </button>
        ))}
      </div>

      <div className="text-center text-sm opacity-70 h-5">
        {selectedPlayer
          ? `Selected ${selectedPlayer.nickname}. Click on an empty slot (POS).`
          : 'Click on a player to select them.'}
      </div>

      {!isComplete && (
        <div className="bg-ti9-panel rounded-lg p-4 border border-ti9-accent/20">
          <h3 className="font-bold mb-3 flex justify-between items-center">
            <span>
              Rolled:{' '}
              <span className="text-ti9-accent font-mono uppercase tracking-wider">
                {isRolling ? rollingTeamName : currentTeam ? currentTeam.team : '???'}
              </span>
              {!isRolling && currentTeam && (
                <span className="text-ti9-light opacity-80">
                  {' '}
                  · {formatTiEdition(currentTeam.year)}
                </span>
              )}
            </span>
            <span className="text-sm opacity-70">🎲 Rerolls: {rerollsLeft}</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 min-h-[90px]">
            {(isRolling || !currentTeam) &&
              [1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`rounded p-3 border-2 border-dashed flex flex-col justify-center items-center h-full ${
                    isRolling
                      ? 'border-ti9-accent/20 bg-ti9-dark/30'
                      : 'border-ti9-accent/10 bg-ti9-dark/10'
                  }`}
                >
                  {isRolling ? (
                    <div className="text-2xl text-ti9-accent/30 animate-pulse font-bold">?</div>
                  ) : (
                    <div className="text-slate-500 font-bold">—</div>
                  )}
                </div>
              ))}

            {!isRolling &&
              currentTeam &&
              currentTeam.players.map((p) => {
                const disabled = !canPickPlayer(p, roster, remainingBudget);
                const affordable =
                  remainingBudget === undefined || getPlayerCost(p) <= remainingBudget;
                const isSelected = selectedPlayer?.id === p.id;
                const isTarget = matchesTargetPlayer(p);

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
                        : isTarget
                        ? 'bg-ti9-dark border-amber-400/60 hover:border-amber-300'
                        : 'bg-ti9-dark border-transparent hover:border-ti9-accent/50'
                    }`}
                  >
                    <div className="text-xs opacity-60 mb-1 flex items-center justify-between">
                      <span>{p.positions.map((pos) => `POS ${pos}`).join(' · ')}</span>
                      {isTarget && <span className="text-[10px] text-amber-300 font-bold">★</span>}
                    </div>
                    <div className="font-bold truncate text-ti9-light">{p.nickname}</div>

                    {mode === 'daily' ? (
                      <div
                        className={`font-bold text-sm ${
                          affordable ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        ${getPlayerCost(p)}
                      </div>
                    ) : (
                      <div
                        className={`font-bold text-lg ${
                          mode === 'memory' ? 'text-purple-400' : 'text-ti9-teal'
                        }`}
                      >
                        {hideRatings ? '?' : p.rating}
                      </div>
                    )}
                  </button>
                );
              })}
          </div>

          <div>
            {!isRolling && !currentTeam && (
              <button
                onClick={() => executeRoll(false)}
                className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 rounded-lg py-3 font-bold text-lg shadow-[0_0_15px_rgba(212,175,55,0.3)] transition transform active:scale-95"
              >
                🎲 Roll Team
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
                Rolling...
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-ti9-panel rounded-lg p-4 border border-ti9-accent/20">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-ti9-accent">Your Roster: {filled}/5</h2>

          {(!hideRatings ? filled > 0 : true) && (
            <div className="text-xs font-bold bg-ti9-dark px-2.5 py-1 rounded-md border border-ti9-accent/20 shadow-sm">
              Avg OVR:{' '}
              {!hideRatings || isComplete ? (
                <span className="text-ti9-teal text-sm ml-1">{avgRating}</span>
              ) : (
                <span className="text-purple-400 text-sm ml-1">?</span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as Position[]).map((pos) => {
            const p = roster[pos];
            const canPlaceHere =
              selectedPlayer && !p && selectedPlayer.positions.includes(pos);

            return (
              <div
                key={pos}
                onClick={() => handleSlotClick(pos)}
                className={`rounded p-2 text-center text-xs transition border-2 ${
                  p
                    ? 'bg-ti9-dark border-ti9-accent/30'
                    : canPlaceHere
                    ? 'bg-green-900/40 border-green-500 cursor-pointer hover:bg-green-800/50'
                    : 'bg-ti9-dark border-ti9-accent/10 border-dashed'
                }`}
              >
                <div className="font-bold opacity-70 mb-1">POS {pos}</div>
                {p ? (
                  <>
                    <div className="truncate font-bold text-ti9-light">{p.nickname}</div>
                    {mode === 'daily' ? (
                      <div className="text-xs text-green-400 font-bold">
                        ${getPlayerCost(p)}
                      </div>
                    ) : (
                      <div
                        className={`font-bold text-sm ${
                          mode === 'memory' ? 'text-purple-400' : 'text-ti9-teal'
                        }`}
                      >
                        {hideRatings ? '?' : p.rating}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-500 py-2">{canPlaceHere ? 'Place' : '—'}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() =>
          onFinish(
            simulateTournament(roster, tactic),
            avgRating,
            remainingBudget ?? 0,
            roster
          )
        }
        disabled={!isComplete}
        className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg transition"
      >
        {isComplete ? 'Start Tournament' : `Fill the roster (${filled}/5)`}
      </button>
    </div>
  );
}