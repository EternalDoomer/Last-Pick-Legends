import { ALL_PLAYERS, ALL_TEAMS } from '../utils/draft';
import AchievementIcon from './AchievementIcon';

export default function HomeScreen({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  return (
    <div className="relative flex flex-col min-h-screen bg-ti9-dark text-ti9-light pb-8 overflow-hidden">
      {/* SUBTLE AMBIENT TOP GLOW */}
      <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-52 bg-ti9-accent/15 blur-3xl rounded-full" />

      {/* BRAND HEADER */}
      <div className="relative px-4 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ti9-panel/90 border border-ti9-accent/30 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ti9-teal mb-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-ti9-teal" />
          <span>The International Draft Simulator</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-ti9-accent">
          LAST PICK LEGENDS
        </h1>

        <p className="text-xs md:text-sm text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Assemble an all-time Dota 2 dream roster and conquer the TI bracket.
        </p>
      </div>

      {/* 2x2 MODE GRID (CLEAN, NO SUBTITLES) */}
      <div className="relative grid grid-cols-2 gap-3 px-4 mb-5">
        <button
          onClick={() => onNavigate('draft_normal')}
          className="group relative overflow-hidden bg-gradient-to-b from-ti9-panel to-ti9-dark/90 hover:from-ti9-accent hover:to-amber-400 hover:text-ti9-dark transition-all duration-200 p-4 rounded-2xl border border-ti9-accent/30 hover:border-amber-200 text-left shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="w-10 h-10 rounded-xl bg-ti9-dark/80 group-hover:bg-black/15 border border-ti9-accent/30 group-hover:border-transparent flex items-center justify-center mb-3 text-ti9-accent group-hover:text-ti9-dark transition">
            <AchievementIcon icon="swords" className="w-5 h-5" />
          </div>
          <div className="font-black text-base tracking-wide">NORMAL GAME</div>
        </button>

        <button
          onClick={() => onNavigate('draft_memory')}
          className="group relative overflow-hidden bg-gradient-to-b from-ti9-panel to-ti9-dark/90 hover:from-ti9-accent hover:to-amber-400 hover:text-ti9-dark transition-all duration-200 p-4 rounded-2xl border border-ti9-accent/30 hover:border-amber-200 text-left shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="w-10 h-10 rounded-xl bg-ti9-dark/80 group-hover:bg-black/15 border border-ti9-accent/30 group-hover:border-transparent flex items-center justify-center mb-3 text-ti9-accent group-hover:text-ti9-dark transition">
            <AchievementIcon icon="brain" className="w-5 h-5" />
          </div>
          <div className="font-black text-base tracking-wide">MEMORY GAME</div>
        </button>

        <button
          onClick={() => onNavigate('free_setup')}
          className="group relative overflow-hidden bg-gradient-to-b from-ti9-panel to-ti9-dark/90 hover:from-ti9-accent hover:to-amber-400 hover:text-ti9-dark transition-all duration-200 p-4 rounded-2xl border border-ti9-accent/30 hover:border-amber-200 text-left shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="w-10 h-10 rounded-xl bg-ti9-dark/80 group-hover:bg-black/15 border border-ti9-accent/30 group-hover:border-transparent flex items-center justify-center mb-3 text-ti9-accent group-hover:text-ti9-dark transition">
            <AchievementIcon icon="scout" className="w-5 h-5" />
          </div>
          <div className="font-black text-base tracking-wide">FREE DRAFT</div>
        </button>

        <button
          onClick={() => onNavigate('daily_setup')}
          className="group relative overflow-hidden bg-gradient-to-br from-ti9-panel via-ti9-panel to-ti9-accent/15 hover:from-ti9-accent hover:to-amber-400 hover:text-ti9-dark transition-all duration-200 p-4 rounded-2xl border border-ti9-accent/55 hover:border-amber-200 text-left shadow-[0_6px_24px_rgba(212,175,55,0.14)]"
        >
          <div className="w-10 h-10 rounded-xl bg-ti9-accent/15 group-hover:bg-black/15 border border-ti9-accent/40 group-hover:border-transparent flex items-center justify-center mb-3 text-ti9-accent group-hover:text-ti9-dark transition">
            <AchievementIcon icon="trophy" className="w-5 h-5" />
          </div>
          <div className="font-black text-base tracking-wide">DAILY CHALLENGE</div>
          <div className="absolute top-3 right-3 text-[9px] font-extrabold tracking-widest uppercase bg-ti9-teal/20 text-ti9-teal group-hover:bg-black/15 group-hover:text-ti9-dark border border-ti9-teal/40 group-hover:border-transparent px-1.5 py-0.5 rounded-full">
            LIVE
          </div>
        </button>
      </div>

      {/* DOTA MINIMAP */}
      <div className="px-4 mb-5 flex justify-center">
        <div className="w-full max-w-[340px] aspect-square bg-[#181326] rounded-2xl border border-ti9-accent/20 relative overflow-hidden shadow-[0_12px_28px_rgba(7,4,15,0.65)] flex items-center justify-center select-none">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 14% 86%, rgba(16, 185, 129, 0.12) 0%, transparent 46%),
                radial-gradient(circle at 86% 14%, rgba(244, 63, 94, 0.12) 0%, transparent 46%),
                radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.07) 0%, transparent 65%)
              `,
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.045] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #e9d5ff 1px, transparent 1px), linear-gradient(to bottom, #e9d5ff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.10" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.10" />
              </linearGradient>
            </defs>

            <polygon points="22,68 42,68 22,48" fill="#c4b5fd" opacity="0.025" />
            <polygon points="78,32 58,32 78,52" fill="#c4b5fd" opacity="0.025" />
            <circle cx="33" cy="28" r="9" fill="#34d399" opacity="0.025" />
            <circle cx="67" cy="72" r="9" fill="#fb7185" opacity="0.025" />

            <path
              d="M -5 5 C 25 20, 35 45, 50 50 C 65 55, 75 80, 105 95"
              fill="none"
              stroke="url(#riverGrad)"
              strokeWidth="6.5"
              strokeLinecap="round"
            />

            <circle cx="34" cy="33" r="3.4" fill="#181326" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.45" />
            <circle cx="34" cy="33" r="1.1" fill="#7dd3fc" opacity="0.4" />

            <g stroke="#e9d5ff" strokeOpacity="0.045" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 12 88 L 12 18 Q 12 12 18 12 L 88 12" />
              <path d="M 14 86 L 86 14" />
              <path d="M 12 88 L 82 88 Q 88 88 88 82 L 88 12" />
            </g>

            <g stroke="#cbd5e1" strokeOpacity="0.22" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 12 88 L 12 18 Q 12 12 18 12 L 88 12" />
              <path d="M 14 86 L 86 14" />
              <path d="M 12 88 L 82 88 Q 88 88 88 82 L 88 12" />
            </g>
          </svg>

          <div className="absolute bottom-2.5 left-2.5 w-11 h-11 rounded-full bg-[#122620]/90 border border-emerald-400/40 flex flex-col items-center justify-center">
            <div className="w-3 h-3 rotate-45 bg-emerald-400/15 border border-emerald-400/80 mb-0.5" />
            <span className="text-[6.5px] tracking-wider font-extrabold text-emerald-300/90">RADIANT</span>
          </div>

          <div className="absolute top-2.5 right-2.5 w-11 h-11 rounded-full bg-[#29131c]/90 border border-rose-400/40 flex flex-col items-center justify-center">
            <div className="w-3 h-3 rotate-45 bg-rose-400/15 border border-rose-400/80 mb-0.5" />
            <span className="text-[6.5px] tracking-wider font-extrabold text-rose-300/90">DIRE</span>
          </div>

          {[
            { pos: 1, style: 'bottom-[11%] left-[45%]' },
            { pos: 2, style: 'bottom-[36%] left-[36%]' },
            { pos: 3, style: 'top-[14%] left-[14%]' },
            { pos: 4, style: 'bottom-[54%] left-[11%]' },
            { pos: 5, style: 'bottom-[11%] left-[23%]' },
          ].map((p) => (
            <div
              key={`rad-${p.pos}`}
              title={`Radiant Pos ${p.pos}`}
              className={`absolute ${p.style} -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-slate-950 ring-2 ring-[#181326] shadow-md flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition-transform duration-200 hover:scale-125 hover:z-10`}
            >
              {p.pos}
            </div>
          ))}

          {[
            { pos: 1, style: 'top-[11%] right-[45%]' },
            { pos: 2, style: 'top-[36%] right-[36%]' },
            { pos: 3, style: 'bottom-[14%] right-[14%]' },
            { pos: 4, style: 'top-[54%] right-[11%]' },
            { pos: 5, style: 'top-[11%] right-[23%]' },
          ].map((p) => (
            <div
              key={`dire-${p.pos}`}
              title={`Dire Pos ${p.pos}`}
              className={`absolute ${p.style} translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-red-700 text-white ring-2 ring-[#181326] shadow-md flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition-transform duration-200 hover:scale-125 hover:z-10`}
            >
              {p.pos}
            </div>
          ))}
        </div>
      </div>

      {/* COMPACT TELEMETRY STATS BAR */}
      <div className="grid grid-cols-3 gap-2 px-4 text-center mb-6">
        <div className="bg-ti9-panel/90 p-2.5 rounded-xl border border-white/5">
          <div className="font-mono text-ti9-teal font-black text-base">{ALL_PLAYERS.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Players</div>
        </div>
        <div className="bg-ti9-panel/90 p-2.5 rounded-xl border border-white/5">
          <div className="font-mono text-ti9-accent font-black text-base">{ALL_TEAMS.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Rosters</div>
        </div>
        <div className="bg-ti9-panel/90 p-2.5 rounded-xl border border-white/5">
          <div className="font-mono text-purple-300 font-black text-base">TI1–14</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Eras</div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="mt-auto px-4 flex gap-2.5">
        <button
          onClick={() => onNavigate('profile')}
          className="flex-1 bg-ti9-panel hover:bg-ti9-teal/15 py-3.5 rounded-xl font-extrabold text-sm tracking-wider border border-ti9-teal/35 text-white transition flex items-center justify-center gap-2"
        >
          <AchievementIcon icon="aegis" className="w-4 h-4 text-ti9-teal" />
          <span>PROFILE</span>
        </button>

        <button
          onClick={() => onNavigate('database')}
          className="flex-1 bg-ti9-panel hover:bg-ti9-accent/15 py-3.5 rounded-xl font-extrabold text-sm tracking-wider border border-ti9-accent/35 text-white transition flex items-center justify-center gap-2"
        >
          <AchievementIcon icon="laurel" className="w-4 h-4 text-ti9-accent" />
          <span>DATABASE</span>
        </button>
      </div>

      <div className="text-center text-[11px] text-slate-500 mt-5 px-4">
        Non-commercial fan project dedicated to The International history.
      </div>
    </div>
  );
}
