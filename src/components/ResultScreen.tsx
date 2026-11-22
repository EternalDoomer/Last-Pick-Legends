import { useEffect, useState } from 'react';
import type { TournamentResult, GameMode, MatchSpeed } from '../types';
import { trackMatch } from '../utils/storage';
import { normalizePlacement } from '../utils/draft';
import TacticLabel from './TacticBadge';

const LEGACY_ROUND_MAP: Record<string, string> = {
  'Верхняя сетка: Четвертьфинал': 'Upper Bracket: Quarterfinal',
  'Верхняя сетка: Полуфинал': 'Upper Bracket: Semifinal',
  'Верхняя сетка: Финал': 'Upper Bracket: Final',
  'Нижняя сетка: Раунд 1': 'Lower Bracket: Round 1',
  'Нижняя сетка: Раунд 2': 'Lower Bracket: Round 2',
  'Нижняя сетка: Финал': 'Lower Bracket: Final',
  'Гранд-финал': 'Grand Final',
};

export default function ResultScreen({
  result,
  onRestart,
  speed,
  mode,
  avgRating = 0,
  savedBudget = 0,
}: {
  result: TournamentResult;
  onRestart: () => void;
  speed: MatchSpeed;
  mode: GameMode;
  avgRating?: number;
  savedBudget?: number;
}) {
  const [matchIdx, setMatchIdx] = useState(0);
  const [mapCount, setMapCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isFinished && mode !== 'free') {
      trackMatch(result, mode, avgRating, savedBudget);
    }
  }, [isFinished, result, mode, avgRating, savedBudget]);

  useEffect(() => {
    if (isFinished) return;
    if (matchIdx >= result.matches.length) {
      setIsFinished(true);
      return;
    }

    const currentMatch = result.matches[matchIdx];
    const delay = speed === 'super' ? 150 : speed === 'fast' ? 600 : 1500;

    const timer = setTimeout(() => {
      if (mapCount < currentMatch.maps.length) {
        setMapCount((prev) => prev + 1);
      } else if (matchIdx === result.matches.length - 1) {
        setIsFinished(true);
      } else {
        setMatchIdx((prev) => prev + 1);
        setMapCount(0);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [matchIdx, mapCount, isFinished, result.matches, speed]);

  const toggleMatch = (index: number) => {
    setExpandedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getScore = (match: TournamentResult['matches'][0], currentMapIdx: number) => {
    const playedMaps = match.maps.slice(0, currentMapIdx);
    const myScore = playedMaps.filter((m) => m.won).length;
    return { myScore, oppScore: playedMaps.length - myScore };
  };

  const handleSkip = () => {
    if (result.matches.length === 0) {
      setIsFinished(true);
      return;
    }
    const lastIdx = result.matches.length - 1;
    setMatchIdx(lastIdx);
    setMapCount(result.matches[lastIdx].maps.length);
    setIsFinished(true);
  };

  const placementLabel = normalizePlacement(result.placement);

  return (
    <div className="space-y-4 pb-6">
      <div
        className={`sticky top-2 z-20 rounded-2xl p-5 text-center transition-all duration-500 relative overflow-hidden border shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-md ${
          isFinished && result.champion
            ? 'bg-gradient-to-br from-amber-300 via-ti9-accent to-amber-500 text-ti9-dark border-amber-200'
            : isFinished
            ? 'bg-gradient-to-b from-ti9-panel to-ti9-dark/95 text-ti9-light border-ti9-accent/50'
            : 'bg-ti9-panel/95 text-ti9-light border-ti9-accent/30'
        }`}
      >
        {!result.champion && (
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-ti9-accent/15 blur-3xl rounded-full" />
        )}

        <div className="relative flex items-center justify-between mb-2">
          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest ${
              isFinished && result.champion
                ? 'bg-black/15 text-ti9-dark'
                : 'bg-ti9-teal/15 text-ti9-teal border border-ti9-teal/30'
            }`}
          >
            {isFinished ? 'Tournament Result' : 'Live Simulation'}
          </span>

          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
              isFinished && result.champion
                ? 'bg-black/15 text-ti9-dark'
                : 'bg-ti9-dark/80 text-ti9-accent border border-ti9-accent/30'
            }`}
          >
            <TacticLabel tactic={result.tactic} iconClass="w-3 h-3" />
          </span>
        </div>

        <div className="relative">
          <div
            className={`text-3xl md:text-4xl font-black tracking-tight leading-tight ${
              isFinished && !result.champion
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-ti9-accent'
                : ''
            }`}
          >
            {isFinished ? (
              <>
                {result.champion && <span className="mr-2">🏆</span>}
                {placementLabel}
              </>
            ) : (
              <span className="animate-pulse">Simulating Bracket...</span>
            )}
          </div>

          {!isFinished && (
            <div className="text-xs md:text-sm font-bold uppercase tracking-widest mt-1 text-ti9-teal/90">
              Match {Math.min(matchIdx + 1, result.matches.length)} of {result.matches.length}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {result.matches.map((m, index) => {
          if (index > matchIdx) return null;

          const isCurrent = index === matchIdx;
          const showMaps = isCurrent ? mapCount : m.maps.length;
          const { myScore, oppScore } = getScore(m, showMaps);
          const matchEnded = isCurrent ? mapCount === m.maps.length : true;
          const playedMaps = m.maps.slice(0, showMaps);

          const isExpanded = !matchEnded || expandedMatches.has(index);

          const bracketBadge =
            m.bracket === 'upper'
              ? { label: 'UPPER', cls: 'bg-sky-500/20 text-sky-300 border-sky-400/30' }
              : m.bracket === 'lower'
              ? { label: 'LOWER', cls: 'bg-orange-500/20 text-orange-300 border-orange-400/30' }
              : { label: 'GRAND FINAL', cls: 'bg-ti9-accent/20 text-ti9-accent border-ti9-accent/40' };

          const cardBorder = !matchEnded
            ? 'bg-ti9-panel border-ti9-accent/60 shadow-[0_0_20px_rgba(212,175,55,0.12)]'
            : m.won
            ? 'bg-emerald-950/25 border-emerald-500/30 hover:border-emerald-400/50'
            : 'bg-rose-950/25 border-rose-500/30 hover:border-rose-400/50';

          return (
            <div
              key={index}
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${cardBorder}`}
            >
              <div
                onClick={() => matchEnded && toggleMatch(index)}
                className={`p-3.5 flex items-center justify-between gap-3 ${
                  matchEnded ? 'cursor-pointer select-none' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${bracketBadge.cls}`}
                    >
                      {bracketBadge.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 truncate">
                      {LEGACY_ROUND_MAP[m.round] || m.round}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-base text-white truncate">
                      {m.opponent}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      OVR {m.opponentAvgRating}
                    </span>
                  </div>

                  {!matchEnded && isCurrent && (
                    <div className="text-xs font-semibold text-ti9-teal mt-1 animate-pulse">
                      Playing map {mapCount + 1}...
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`font-mono text-xl md:text-2xl font-black px-2.5 py-1 rounded-lg bg-ti9-dark/70 border border-white/5 ${
                      matchEnded
                        ? m.won
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                        : 'text-ti9-accent'
                    }`}
                  >
                    {myScore} : {oppScore}
                  </div>

                  {matchEnded && (
                    <span
                      className={`text-xs text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      ▼
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-2.5 border-t border-white/10 bg-ti9-dark/35 space-y-2">
                  {playedMaps.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">Drafting heroes...</div>
                  ) : (
                    playedMaps.map((map, i) => {
                      const isPositiveEvent = Boolean(map.shift && map.shift > 0);
                      const isNegativeEvent = Boolean(map.shift && map.shift < 0);
                      const isComebackDespiteEvent = map.won && isNegativeEvent;

                      return (
                        <div key={i} className="text-xs flex items-center gap-2.5">
                          <span
                            className={`w-24 inline-flex items-center justify-center font-mono font-bold py-0.5 rounded text-[10px] shrink-0 ${
                              map.won
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            MAP {i + 1} · {map.won ? 'WIN' : 'LOSS'}
                          </span>

                          {map.event ? (
                            <span
                              className={`font-semibold truncate ${
                                isPositiveEvent ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                              title={map.event}
                            >
                              ⚡ {map.event}
                              {isComebackDespiteEvent && (
                                <span className="ml-1.5 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                                  Comeback!
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic truncate">
                              Clean execution, no major swings.
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}

                  {matchEnded && !m.won && index !== result.matches.length - 1 && m.bracket === 'upper' && (
                    <div className="pt-1.5 text-xs text-orange-400 font-bold flex items-center gap-1">
                      <span>⬇</span>
                      <span>Dropped to Lower Bracket</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {!isFinished && (
          <button
            onClick={handleSkip}
            className="flex-1 bg-ti9-panel hover:bg-slate-700 rounded-xl py-3.5 font-bold border border-ti9-accent/30 transition"
          >
            Skip ⏩
          </button>
        )}

        <button
          onClick={onRestart}
          disabled={!isFinished}
          className="flex-1 bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl py-3.5 font-extrabold text-base transition shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          {isFinished ? 'Play Again' : 'Tournament in progress...'}
        </button>
      </div>
    </div>
  );
}
