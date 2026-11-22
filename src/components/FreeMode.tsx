import { useState, useMemo } from 'react';
import { ALL_TEAMS, formatTiEdition, formatTeamLabel } from '../utils/draft';
import type { TeamOption } from '../types';

interface TeamOptionLabeled extends TeamOption {
  label: string;
}

export default function FreeMode({
  onStart,
  onBack,
}: {
  onStart: (selectedTeams: TeamOption[]) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'years' | 'teams'>('years');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TeamOption[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const allTeams: TeamOptionLabeled[] = useMemo(() => {
    return ALL_TEAMS.map((t) => ({
      ...t,
      label: formatTeamLabel(t.team, t.year),
    })).sort((a, b) => a.team.localeCompare(b.team));
  }, []);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTeams;
    return allTeams.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        String(t.year).includes(q)
    );
  }, [allTeams, search]);

  const groupedByYear = useMemo(() => {
    const groups: Record<number, TeamOptionLabeled[]> = {};
    filteredTeams.forEach((t) => {
      if (!groups[t.year]) groups[t.year] = [];
      groups[t.year].push(t);
    });
    return groups;
  }, [filteredTeams]);

  const groupedByTeam = useMemo(() => {
    const groups: Record<string, TeamOptionLabeled[]> = {};
    filteredTeams.forEach((t) => {
      if (!groups[t.team]) groups[t.team] = [];
      groups[t.team].push(t);
    });
    return groups;
  }, [filteredTeams]);

  const isTeamSelected = (t: TeamOption) =>
    selected.some((s) => s.team === t.team && s.year === t.year);

  const toggleGroup = (key: string) => {
    const next = new Set(expandedGroups);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedGroups(next);
  };

  const toggleTeam = (team: TeamOption) => {
    if (isTeamSelected(team)) {
      setSelected(selected.filter((t) => !(t.team === team.team && t.year === team.year)));
    } else {
      setSelected([...selected, { team: team.team, year: team.year }]);
    }
  };

  const toggleBatch = (items: TeamOption[]) => {
    const allChosen = items.every(isTeamSelected);
    if (allChosen) {
      setSelected((prev) =>
        prev.filter((s) => !items.some((it) => it.team === s.team && it.year === s.year))
      );
    } else {
      const additions = items
        .filter((it) => !isTeamSelected(it))
        .map((it) => ({ team: it.team, year: it.year }));
      setSelected((prev) => [...prev, ...additions]);
    }
  };

  const fillRandomUpTo8 = () => {
    const remaining = ALL_TEAMS.filter((t) => !isTeamSelected(t));
    const need = Math.max(0, 8 - selected.length);
    if (need === 0 || remaining.length === 0) return;

    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, need).map((t) => ({ team: t.team, year: t.year }));
    setSelected((prev) => [...prev, ...picked]);
  };

  const isValid = selected.length >= 8;

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light flex flex-col h-screen">
      {/* TOP BAR */}
      <div className="p-4 pb-2.5 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="font-bold text-ti9-accent hover:underline">
            ← Back
          </button>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Free Draft Setup
          </span>
          <div className="w-12" />
        </div>

        {/* SEARCH + QUICK ACTIONS */}
        <div className="flex gap-2 mb-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search team, TI, or year..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-ti9-panel px-3.5 py-2.5 pr-8 rounded-xl border border-ti9-accent/30 text-xs text-white outline-none focus:border-ti9-accent transition"
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

          {!isValid && (
            <button
              onClick={fillRandomUpTo8}
              title="Auto-fill remaining slots to reach 8 teams"
              className="px-3 py-2 rounded-xl bg-ti9-panel hover:bg-ti9-accent/20 text-ti9-teal border border-ti9-teal/30 text-[11px] font-extrabold uppercase tracking-wider shrink-0 transition"
            >
              + Random
            </button>
          )}
        </div>

        {/* SORT TABS (BY TI / BY TEAMS) */}
        <div className="flex bg-ti9-panel p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setTab('years')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
              tab === 'years' ? 'bg-ti9-accent text-ti9-dark' : 'text-slate-400 hover:text-white'
            }`}
          >
            By years (TI)
          </button>
          <button
            onClick={() => setTab('teams')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
              tab === 'teams' ? 'bg-ti9-accent text-ti9-dark' : 'text-slate-400 hover:text-white'
            }`}
          >
            By teams
          </button>
        </div>
      </div>

      {/* SCROLLABLE ACCORDION LIST */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {tab === 'years' &&
          Object.keys(groupedByYear)
            .sort((a, b) => Number(a) - Number(b))
            .map((yearStr) => {
              const year = Number(yearStr);
              const teams = groupedByYear[year];
              const isExpanded = search.trim().length > 0 || expandedGroups.has(`year-${year}`);
              const selectedInGroup = teams.filter(isTeamSelected).length;
              const allInGroupSelected = selectedInGroup === teams.length && teams.length > 0;

              return (
                <div
                  key={year}
                  className="bg-ti9-panel rounded-xl border border-white/10 overflow-hidden"
                >
                  <div className="flex items-center justify-between bg-ti9-panel hover:bg-white/[0.02] transition">
                    <button
                      onClick={() => toggleGroup(`year-${year}`)}
                      className="flex-1 p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          {formatTiEdition(year)}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{year}</span>
                        <span className="text-[10px] text-slate-500">({teams.length})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedInGroup > 0 && (
                          <span className="text-[10px] font-mono bg-ti9-accent text-ti9-dark px-2 py-0.5 rounded-full font-extrabold">
                            {selectedInGroup}/{teams.length}
                          </span>
                        )}
                        <span
                          className={`text-[10px] text-slate-400 transform transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : 'rotate-0'
                          }`}
                        >
                          ▼
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => toggleBatch(teams)}
                      className={`mr-2.5 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition shrink-0 ${
                        allInGroupSelected
                          ? 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/50'
                          : 'bg-ti9-dark/70 text-ti9-teal border-ti9-teal/30 hover:bg-ti9-teal/15'
                      }`}
                    >
                      {allInGroupSelected ? 'Clear' : 'All'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-2 grid grid-cols-2 gap-1.5 bg-ti9-dark/40 border-t border-white/5">
                      {teams.map((t) => {
                        const active = isTeamSelected(t);
                        return (
                          <button
                            key={t.label}
                            onClick={() => toggleTeam(t)}
                            className={`text-left px-2.5 py-2 rounded-lg transition flex justify-between items-center text-xs border ${
                              active
                                ? 'bg-ti9-accent/20 border-ti9-accent text-white font-bold'
                                : 'bg-ti9-panel/60 border-transparent text-slate-300 hover:border-white/15'
                            }`}
                          >
                            <span className="truncate">{t.team}</span>
                            {active && <span className="text-ti9-accent ml-1 shrink-0">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

        {tab === 'teams' &&
          Object.keys(groupedByTeam)
            .sort()
            .map((teamName) => {
              const teams = groupedByTeam[teamName];
              const isExpanded =
                search.trim().length > 0 || expandedGroups.has(`team-${teamName}`);
              const selectedInGroup = teams.filter(isTeamSelected).length;
              const allInGroupSelected = selectedInGroup === teams.length && teams.length > 0;

              return (
                <div
                  key={teamName}
                  className="bg-ti9-panel rounded-xl border border-white/10 overflow-hidden"
                >
                  <div className="flex items-center justify-between bg-ti9-panel hover:bg-white/[0.02] transition">
                    <button
                      onClick={() => toggleGroup(`team-${teamName}`)}
                      className="flex-1 p-3 flex items-center justify-between text-left min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-extrabold text-sm text-white truncate">
                          {teamName}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          ({teams.length})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {selectedInGroup > 0 && (
                          <span className="text-[10px] font-mono bg-ti9-accent text-ti9-dark px-2 py-0.5 rounded-full font-extrabold">
                            {selectedInGroup}/{teams.length}
                          </span>
                        )}
                        <span
                          className={`text-[10px] text-slate-400 transform transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : 'rotate-0'
                          }`}
                        >
                          ▼
                        </span>
                      </div>
                    </button>

                    {teams.length > 1 && (
                      <button
                        onClick={() => toggleBatch(teams)}
                        className={`mr-2.5 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition shrink-0 ${
                          allInGroupSelected
                            ? 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/50'
                            : 'bg-ti9-dark/70 text-ti9-teal border-ti9-teal/30 hover:bg-ti9-teal/15'
                        }`}
                      >
                        {allInGroupSelected ? 'Clear' : 'All'}
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="p-2 grid grid-cols-2 gap-1.5 bg-ti9-dark/40 border-t border-white/5">
                      {[...teams]
                        .sort((a, b) => a.year - b.year)
                        .map((t) => {
                          const active = isTeamSelected(t);
                          return (
                            <button
                              key={t.label}
                              onClick={() => toggleTeam(t)}
                              className={`text-left px-2.5 py-2 rounded-lg transition flex justify-between items-center text-xs border ${
                                active
                                  ? 'bg-ti9-accent/20 border-ti9-accent text-white font-bold'
                                  : 'bg-ti9-panel/60 border-transparent text-slate-300 hover:border-white/15'
                              }`}
                            >
                              <span>
                                {formatTiEdition(t.year)}{' '}
                                <span className="font-mono text-[10px] opacity-60">({t.year})</span>
                              </span>
                              {active && <span className="text-ti9-accent ml-1 shrink-0">✓</span>}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}

        {filteredTeams.length === 0 && (
          <div className="text-center text-xs text-slate-500 py-10">Nothing found</div>
        )}
      </div>

      {/* BOTTOM SELECTED POOL DRAWER */}
      <div className="bg-ti9-panel p-3.5 rounded-t-2xl border-t border-ti9-accent/30 shrink-0 shadow-[0_-10px_25px_rgba(0,0,0,0.45)]">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
              Pool
            </span>
            <span
              className={`font-mono text-xs font-black ${
                isValid ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {selected.length} / 8 min
            </span>
          </div>

          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300"
            >
              Clear all
            </button>
          )}
        </div>

        {/* HORIZONTAL REMOVABLE CHIPS */}
        {selected.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-1 scrollbar-none">
            {selected.map((item) => (
              <button
                key={`${item.team}_${item.year}`}
                onClick={() => toggleTeam(item)}
                title="Click to remove"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-ti9-dark border border-ti9-accent/30 text-[11px] font-bold text-white hover:border-rose-400/60 hover:text-rose-200 shrink-0 transition"
              >
                <span>{formatTeamLabel(item.team, item.year)}</span>
                <span className="text-slate-400 text-xs">×</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => onStart(selected)}
          disabled={!isValid}
          className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl py-3 font-extrabold text-sm uppercase tracking-wider transition"
        >
          {isValid
            ? `Start Draft (${selected.length} teams)`
            : `Select ${8 - selected.length} more ${8 - selected.length === 1 ? 'team' : 'teams'}`}
        </button>
      </div>
    </div>
  );
}
