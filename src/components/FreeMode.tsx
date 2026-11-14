import { useState, useMemo } from 'react';
import rawPlayers from '../data/players.json';
import type { Player } from '../types';
import { translations } from '../utils/i18n';

interface TeamOption {
  team: string;
  year: number;
  label: string;
}

export default function FreeMode({ 
  onStart, 
  onBack,
  lang
}: { 
  onStart: (selectedTeams: { team: string; year: number }[]) => void; 
  onBack: () => void;
  lang: 'ru' | 'en';
}) {
  const t = translations[lang];
  const players = rawPlayers as Player[];
  const [tab, setTab] = useState<'years' | 'teams'>('years');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TeamOption[]>([]);
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const allTeams = useMemo(() => {
    return Array.from(new Set(players.map(p => `${p.team}|${p.year}`))).map(str => {
      const [team, year] = str.split('|');
      return { 
        team, 
        year: Number(year), 
        label: `${team} (TI${Number(year) === 2011 ? '1' : Number(year) - 2010})` 
      };
    }).sort((a, b) => a.team.localeCompare(b.team));
  }, [players]);

  const filteredTeams = allTeams.filter(t => 
    t.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByYear = useMemo(() => {
    const groups: Record<number, TeamOption[]> = {};
    filteredTeams.forEach(t => {
      if (!groups[t.year]) groups[t.year] = [];
      groups[t.year].push(t);
    });
    return groups;
  }, [filteredTeams]);

  const groupedByTeam = useMemo(() => {
    const groups: Record<string, TeamOption[]> = {};
    filteredTeams.forEach(t => {
      if (!groups[t.team]) groups[t.team] = [];
      groups[t.team].push(t);
    });
    return groups;
  }, [filteredTeams]);

  const toggleGroup = (key: string) => {
    const next = new Set(expandedGroups);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedGroups(next);
  };

  const toggleTeam = (team: TeamOption) => {
    if (selected.some(t => t.team === team.team && t.year === team.year)) {
      setSelected(selected.filter(t => !(t.team === team.team && t.year === team.year)));
    } else {
      setSelected([...selected, team]);
    }
  };

  const isValid = selected.length >= 8;

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light flex flex-col h-screen">
      <div className="p-4 pb-2 shrink-0">
        <button onClick={onBack} className="mb-4 text-ti9-accent hover:underline self-start">← {t.back}</button>
        <h2 className="text-2xl font-bold mb-1">{t.freeDraft}</h2>
        <p className="text-sm opacity-70 mb-4">{t.selectMinTeams}</p>
        
        <input 
          type="text" 
          placeholder={t.searchTeam} 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-ti9-panel p-3 rounded-lg border border-ti9-accent/30 text-white outline-none focus:border-ti9-accent transition mb-3"
        />

        <div className="flex gap-2">
          <button 
            onClick={() => setTab('years')} 
            className={`flex-1 py-2 rounded font-bold transition ${tab === 'years' ? 'bg-ti9-accent text-ti9-dark' : 'bg-ti9-panel hover:bg-ti9-panel/80'}`}
          >
            {t.byYears}
          </button>
          <button 
            onClick={() => setTab('teams')} 
            className={`flex-1 py-2 rounded font-bold transition ${tab === 'teams' ? 'bg-ti9-accent text-ti9-dark' : 'bg-ti9-panel hover:bg-ti9-panel/80'}`}
          >
            {t.byTeams}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {tab === 'years' && Object.keys(groupedByYear).sort((a, b) => Number(a) - Number(b)).map(yearStr => {
          const year = Number(yearStr);
          const teams = groupedByYear[year];
          const isExpanded = expandedGroups.has(`year-${year}`);
          const selectedInGroup = teams.filter(t => selected.some(s => s.team === t.team && s.year === t.year)).length;

          return (
            <div key={year} className="bg-ti9-panel rounded-lg border border-ti9-accent/20 overflow-hidden">
              <button 
                onClick={() => toggleGroup(`year-${year}`)}
                className="w-full p-3 flex justify-between items-center bg-ti9-panel hover:bg-ti9-panel/80 transition"
              >
                <span className="font-bold">TI{year === 2011 ? '1' : year - 2010} <span className="text-xs opacity-50 font-normal ml-2">({teams.length} {lang === 'ru' ? 'команд' : 'teams'})</span></span>
                <span className="flex items-center gap-2">
                  {selectedInGroup > 0 && <span className="text-xs bg-ti9-accent text-ti9-dark px-2 py-0.5 rounded-full font-bold">{selectedInGroup}</span>}
                  <span className="text-xs transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </span>
              </button>
              {isExpanded && (
                <div className="p-2 space-y-1 bg-ti9-dark/30">
                  {teams.map(t => {
                    const isSelected = selected.some(s => s.team === t.team && s.year === t.year);
                    return (
                      <button
                        key={t.label}
                        onClick={() => toggleTeam(t)}
                        className={`w-full text-left p-2 rounded transition flex justify-between items-center text-sm ${
                          isSelected ? 'bg-ti9-accent/20 text-ti9-accent font-bold' : 'hover:bg-ti9-panel/50'
                        }`}
                      >
                        <span>{t.team}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {tab === 'teams' && Object.keys(groupedByTeam).sort().map(teamName => {
          const teams = groupedByTeam[teamName];
          const isExpanded = expandedGroups.has(`team-${teamName}`);
          const selectedInGroup = teams.filter(t => selected.some(s => s.team === t.team && s.year === t.year)).length;

          return (
            <div key={teamName} className="bg-ti9-panel rounded-lg border border-ti9-accent/20 overflow-hidden">
              <button 
                onClick={() => toggleGroup(`team-${teamName}`)}
                className="w-full p-3 flex justify-between items-center bg-ti9-panel hover:bg-ti9-panel/80 transition"
              >
                <span className="font-bold">{teamName} <span className="text-xs opacity-50 font-normal ml-2">({teams.length} {lang === 'ru' ? (teams.length > 1 ? 'состава' : 'состав') : (teams.length > 1 ? 'rosters' : 'roster')})</span></span>
                <span className="flex items-center gap-2">
                  {selectedInGroup > 0 && <span className="text-xs bg-ti9-accent text-ti9-dark px-2 py-0.5 rounded-full font-bold">{selectedInGroup}</span>}
                  <span className="text-xs transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </span>
              </button>
              {isExpanded && (
                <div className="p-2 space-y-1 bg-ti9-dark/30">
                  {teams.sort((a,b) => a.year - b.year).map(t => {
                    const isSelected = selected.some(s => s.team === t.team && s.year === t.year);
                    return (
                      <button
                        key={t.label}
                        onClick={() => toggleTeam(t)}
                        className={`w-full text-left p-2 rounded transition flex justify-between items-center text-sm ${
                          isSelected ? 'bg-ti9-accent/20 text-ti9-accent font-bold' : 'hover:bg-ti9-panel/50'
                        }`}
                      >
                        <span>TI{t.year === 2011 ? '1' : t.year - 2010} ({t.year})</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="text-center opacity-50 py-10">{t.nothingFound}</div>
        )}
      </div>

      <div className="bg-ti9-panel p-4 rounded-t-xl border-t border-ti9-accent/30 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm">{t.selected}</span>
          <span className={`font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>{selected.length} / 8</span>
        </div>
        <button 
          onClick={() => onStart(selected.map(s => ({ team: s.team, year: s.year })))}
          disabled={!isValid}
          className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg py-3 font-bold transition"
        >
          {isValid ? t.startDraft : t.selectMin8}
        </button>
      </div>
    </div>
  );
}