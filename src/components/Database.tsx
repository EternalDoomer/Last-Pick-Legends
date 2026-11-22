import { useState, useMemo } from 'react';
import { ALL_PLAYERS, ALL_TEAMS, formatTiEdition } from '../utils/draft';
import type { Player, Tactic } from '../types';
import AchievementIcon from './AchievementIcon';
import { TacticIcon } from './TacticBadge';

type DbTab = 'years' | 'teams' | 'modes';

const GAME_MODES_INFO = [
  {
    icon: 'swords' as const,
    tag: 'STANDARD · 3 REROLLS',
    title: 'Normal Game',
    desc: 'Classic draft across the full TI pool. Player ratings and positions are visible.',
  },
  {
    icon: 'brain' as const,
    tag: 'HARDCORE · 1 REROLL',
    title: 'Memory Game',
    desc: 'Player ratings are hidden. Rely on your knowledge of legendary TI rosters.',
  },
  {
    icon: 'scout' as const,
    tag: 'CUSTOM · 3 REROLLS',
    title: 'Free Draft',
    desc: 'Hand-pick at least 8 teams by TI edition or organization to build your own pool.',
  },
  {
    icon: 'calendar' as const,
    tag: '$1000 CAP · 1 REROLL',
    title: 'Daily Challenge',
    desc: 'Daily themed pool, fixed player prices, hidden OVR, and an optional Extra Task for leaderboard stars.',
  },
];

const TACTICS_INFO: { tactic: Tactic; title: string; tag: string; desc: string }[] = [
  {
    tactic: 'early',
    title: 'EARLY',
    tag: 'POS 4 & 5 FOCUS',
    desc: 'Empowers aggressive supports (1.25x) to snowball early fights; carry impact is reduced (0.65x).',
  },
  {
    tactic: 'mid',
    title: 'MID',
    tag: 'BALANCED · 1.0X',
    desc: 'Equal weight across all five roles. Pure roster rating and position comfort decide the game.',
  },
  {
    tactic: 'late',
    title: 'LATE',
    tag: 'POS 1 & 2 FOCUS',
    desc: 'Heavily scales carry (1.35x) and mid (1.25x) for late-game teamfights; supports scale less (0.7x).',
  },
];

export default function Database({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<DbTab>('years');
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const years = useMemo(
    () => Array.from(new Set(ALL_PLAYERS.map((p) => p.year))).sort((a, b) => a - b),
    []
  );

  const teams = useMemo(
    () => Array.from(new Set(ALL_PLAYERS.map((p) => p.team))).sort((a, b) => a.localeCompare(b)),
    []
  );

  const filteredYears = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return years;
    return years.filter(
      (y) => formatTiEdition(y).toLowerCase().includes(q) || String(y).includes(q)
    );
  }, [years, search]);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.toLowerCase().includes(q));
  }, [teams, search]);

  const isDetailView = selectedYear !== null || selectedTeam !== null;

  const handleBack = () => {
    if (selectedYear !== null) {
      setSelectedYear(null);
      return;
    }
    if (selectedTeam !== null) {
      setSelectedTeam(null);
      return;
    }
    onBack();
  };

  const renderCompactRoster = (key: string | number, heading: string, roster: Player[]) => {
    const sorted = [...roster].sort((a, b) => a.positions[0] - b.positions[0]);
    const avgOvr =
      sorted.length > 0
        ? Math.round(sorted.reduce((sum, p) => sum + p.rating, 0) / sorted.length)
        : 0;

    return (
      <div
        key={key}
        className="bg-ti9-panel rounded-xl border border-white/10 overflow-hidden"
      >
        <div className="px-3.5 py-2.5 bg-ti9-dark/60 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white">{heading}</h3>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-ti9-teal/15 text-ti9-teal border border-ti9-teal/30">
            AVG {avgOvr}
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {sorted.map((p) => (
            <div
              key={p.id}
              className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-[10px] font-bold text-ti9-teal bg-ti9-dark px-1.5 py-0.5 rounded border border-white/5 w-14 text-center shrink-0">
                  POS {p.positions.join('/')}
                </span>
                <span className="font-bold text-white truncate">{p.nickname}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono">
                {p.price && (
                  <span className="text-[11px] text-emerald-400/80">${p.price}</span>
                )}
                <span className="font-black text-ti9-accent w-6 text-right">{p.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBack} className="text-ti9-accent hover:underline font-bold">
          ← {isDetailView ? 'All' : 'Back'}
        </button>
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          {selectedYear !== null
            ? `${formatTiEdition(selectedYear)} (${selectedYear})`
            : selectedTeam !== null
            ? selectedTeam
            : 'Database'}
        </span>
        <div className="w-12" />
      </div>

      {!isDetailView && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-3 gap-1.5 bg-ti9-dark/90 p-1.5 rounded-2xl border border-ti9-accent/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {(
              [
                { id: 'years', label: 'By TI' },
                { id: 'teams', label: 'By Teams' },
                { id: 'modes', label: 'Rules & Tactics' },
              ] as const
            ).map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setSearch('');
                  }}
                  className={`py-2.5 px-2 rounded-xl font-extrabold text-xs tracking-wide transition-all ${
                    active
                      ? 'bg-gradient-to-b from-amber-300 to-ti9-accent text-ti9-dark shadow-[0_2px_12px_rgba(212,175,55,0.35)] border border-amber-200/70'
                      : 'bg-ti9-panel/70 text-slate-300 border border-white/5 hover:border-ti9-accent/35 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {tab !== 'modes' && (
            <div className="relative">
              <input
                type="text"
                placeholder={
                  tab === 'years' ? 'Filter TI edition or year...' : 'Search organization...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-ti9-panel px-3.5 py-2.5 pr-8 rounded-xl border border-ti9-accent/25 text-xs text-white outline-none focus:border-ti9-accent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!isDetailView && tab === 'years' && (
        <div className="grid grid-cols-3 gap-2">
          {filteredYears.map((year) => {
            const teamCount = ALL_TEAMS.filter((t) => t.year === year).length;
            return (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark group transition p-3 rounded-xl border border-white/10 hover:border-ti9-accent text-center"
              >
                <div className="font-black text-base text-ti9-accent group-hover:text-ti9-dark">
                  {formatTiEdition(year)}
                </div>
                <div className="font-mono text-[11px] opacity-75">{year}</div>
                <div className="text-[10px] opacity-50 mt-1">{teamCount} teams</div>
              </button>
            );
          })}
        </div>
      )}

      {!isDetailView && tab === 'teams' && (
        <div className="grid grid-cols-2 gap-2">
          {filteredTeams.map((team) => {
            const appearances = ALL_TEAMS.filter((t) => t.team === team).length;
            return (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark group transition px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-ti9-accent flex items-center justify-between gap-2 text-left"
              >
                <span className="font-bold text-xs truncate">{team}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-ti9-dark/60 text-ti9-teal group-hover:bg-black/15 group-hover:text-ti9-dark shrink-0">
                  {appearances} TI
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!isDetailView && tab === 'modes' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-ti9-accent px-1">
              Game Modes
            </h3>
            {GAME_MODES_INFO.map((mode) => (
              <div
                key={mode.title}
                className="bg-ti9-panel rounded-xl p-3.5 border border-white/10 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-ti9-dark border border-ti9-accent/30 text-ti9-accent flex items-center justify-center shrink-0 mt-0.5">
                  <AchievementIcon icon={mode.icon} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white truncate">{mode.title}</span>
                    <span className="w-36 h-5 inline-flex items-center justify-center text-[9px] font-mono font-bold tracking-wider text-ti9-teal bg-ti9-teal/10 rounded border border-ti9-teal/25 shrink-0">
                      {mode.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mode.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-ti9-accent px-1">
              Draft Tactics
            </h3>
            {TACTICS_INFO.map((tac) => (
              <div
                key={tac.tactic}
                className="bg-ti9-panel rounded-xl p-3.5 border border-white/10 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-ti9-dark border border-ti9-accent/30 text-ti9-accent flex items-center justify-center shrink-0 mt-0.5">
                  <TacticIcon tactic={tac.tactic} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white truncate">{tac.title}</span>
                    <span className="w-36 h-5 inline-flex items-center justify-center text-[9px] font-mono font-bold tracking-wider text-ti9-teal bg-ti9-teal/10 rounded border border-ti9-teal/25 shrink-0">
                      {tac.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tac.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedYear !== null && (
        <div className="space-y-3">
          {Object.entries(
            ALL_PLAYERS.filter((p) => p.year === selectedYear).reduce((acc, p) => {
              if (!acc[p.team]) acc[p.team] = [];
              acc[p.team].push(p);
              return acc;
            }, {} as Record<string, Player[]>)
          )
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([team, roster]) => renderCompactRoster(team, team, roster))}
        </div>
      )}

      {selectedTeam !== null && (
        <div className="space-y-3">
          {Object.entries(
            ALL_PLAYERS.filter((p) => p.team === selectedTeam).reduce((acc, p) => {
              if (!acc[p.year]) acc[p.year] = [];
              acc[p.year].push(p);
              return acc;
            }, {} as Record<number, Player[]>)
          )
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([year, roster]) =>
              renderCompactRoster(year, `${formatTiEdition(Number(year))} (${year})`, roster)
            )}
        </div>
      )}
    </div>
  );
}
