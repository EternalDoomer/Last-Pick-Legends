import type { Tactic } from '../types';

export function TacticIcon({
  tactic,
  className = 'w-4 h-4',
}: {
  tactic: Tactic;
  className?: string;
}) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (tactic === 'early') {
    // Crossed blades for aggressive early tempo
    return (
      <svg {...props}>
        <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
        <path d="M9.5 17.5 21 6V3h-3L6.5 14.5" />
        <path d="M11 19l-6-6" />
      </svg>
    );
  }

  if (tactic === 'mid') {
    // Balanced scales for Mid tempo
    return (
      <svg {...props}>
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M5 7l-2.5 5.5h5L5 7z" />
        <path d="M19 7l-2.5 5.5h5L19 7z" />
        <path d="M8.5 21h7" />
      </svg>
    );
  }

  // Heavy citadel shield for Late game
  return (
    <svg {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 7v10" />
      <path d="M8.5 11h7" />
    </svg>
  );
}

export default function TacticLabel({
  tactic,
  iconClass = 'w-3.5 h-3.5',
}: {
  tactic: Tactic;
  iconClass?: string;
}) {
  const label = tactic === 'early' ? 'EARLY' : tactic === 'mid' ? 'MID' : 'LATE';
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      <TacticIcon tactic={tactic} className={iconClass} />
      <span>{label}</span>
    </span>
  );
}
