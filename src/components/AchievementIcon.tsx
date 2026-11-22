export type AchievementIconKey =
  | 'sword'
  | 'swords'
  | 'shield'
  | 'helmet'
  | 'crown'
  | 'aegis'
  | 'trophy'
  | 'laurel'
  | 'star'
  | 'brain'
  | 'memory_grid'
  | 'calendar'
  | 'flame'
  | 'diamond'
  | 'eye'
  | 'oracle'
  | 'coins'
  | 'underdog'
  | 'tactics'
  | 'upper_arrow'
  | 'lower_phoenix'
  | 'scout';

export default function AchievementIcon({
  icon,
  className = 'w-6 h-6',
}: {
  icon: AchievementIconKey;
  className?: string;
}) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (icon) {
    case 'sword':
      return (
        <svg {...props}>
          <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
          <path d="M13 19l6-6" />
          <path d="M16 16l4 4" />
          <path d="M19 21l2-2" />
        </svg>
      );
    case 'swords':
      return (
        <svg {...props}>
          <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
          <path d="M13 19l6-6" />
          <path d="M9.5 17.5 21 6V3h-3L6.5 14.5" />
          <path d="M11 19l-6-6" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
    case 'helmet':
      return (
        <svg {...props}>
          <path d="M12 3a7 7 0 0 0-7 7v5l3 3h8l3-3v-5a7 7 0 0 0-7-7z" />
          <path d="M9 12h6" />
          <path d="M12 12v6" />
        </svg>
      );
    case 'crown':
      return (
        <svg {...props}>
          <path d="M3 18h18" />
          <path d="M4 15l2-9 6 5 6-5 2 9H4z" />
        </svg>
      );
    case 'aegis':
      return (
        <svg {...props}>
          <path d="M12 2 4 6v6c0 5.2 3.4 9.6 8 11 4.6-1.4 8-5.8 8-11V6l-8-4z" />
          <circle cx="12" cy="11" r="3" />
          <path d="M12 14v4" />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...props}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case 'laurel':
      return (
        <svg {...props}>
          <path d="M7 20c-2.5-2-4-5.5-4-9.5C3 6.5 5 3.5 8 2" />
          <path d="M17 20c2.5-2 4-5.5 4-9.5 0-4-2-7-5-8.5" />
          <path d="M12 7l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4L12 7z" />
        </svg>
      );
    case 'star':
      return (
        <svg {...props}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'brain':
      return (
        <svg {...props}>
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
        </svg>
      );
    case 'memory_grid':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <path d="M17.5 14v7" />
          <path d="M14 17.5h7" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="M9 16l2 2 4-4" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...props}>
          <path d="M12 2c.5 3.5-1.5 5.5-3 7.5-1.5 2-2 4.5-.5 7A5.5 5.5 0 0 0 18 14c0-3.5-2.5-6-3.5-8-.5 1.5-1.5 2.5-2.5 2.5V2z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg {...props}>
          <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
          <path d="M2 9h20" />
          <path d="M12 21 8 9l4-6 4 6-4 12z" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...props}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'oracle':
      return (
        <svg {...props}>
          <circle cx="12" cy="11" r="7" />
          <path d="M7 21h10" />
          <path d="M9 18h6" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      );
    case 'coins':
      return (
        <svg {...props}>
          <circle cx="9" cy="10" r="6" />
          <path d="M9 7v6" />
          <path d="M15.5 9.5A6 6 0 1 1 11 19.7" />
        </svg>
      );
    case 'underdog':
      return (
        <svg {...props}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case 'tactics':
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="12" cy="18" r="2.5" />
          <path d="M8 7.5 10.5 16" />
          <path d="M16 7.5 13.5 16" />
          <path d="M8.5 6h7" />
        </svg>
      );
    case 'upper_arrow':
      return (
        <svg {...props}>
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
          <path d="M5 19h14" />
        </svg>
      );
    case 'lower_phoenix':
      return (
        <svg {...props}>
          <path d="M4 14l8 6 8-6" />
          <path d="M4 8l8 6 8-6" />
          <path d="M12 3v11" />
        </svg>
      );
    case 'scout':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </svg>
      );
  }
}
