import { useEffect } from 'react';
import AchievementIcon from './AchievementIcon';
import type { Achievement } from '../utils/achievements';

export interface UnlockedAchievementToastItem {
  id: string;
  title: string;
  icon?: Achievement['icon'];
}

export default function AchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: UnlockedAchievementToastItem | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!achievement) return;

    const timer = window.setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-sm bg-gradient-to-r from-[#1b1430]/95 via-ti9-panel/95 to-[#151024]/95 border border-ti9-accent/70 rounded-xl px-3.5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.65),0_0_16px_rgba(212,175,55,0.2)] flex items-center gap-3 backdrop-blur-md transition-all duration-300">
        <div className="w-9 h-9 rounded-lg bg-ti9-accent/15 border border-ti9-accent/45 text-ti9-accent flex items-center justify-center shrink-0">
          <AchievementIcon icon={achievement.icon ?? 'trophy'} className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-ti9-teal leading-none mb-1">
            Achievement Unlocked
          </div>
          <div className="text-sm font-black text-white truncate leading-tight">
            {achievement.title}
          </div>
        </div>
      </div>
    </div>
  );
}