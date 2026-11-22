import type { UserProfile } from './storage';
import type { AchievementIconKey } from '../components/AchievementIcon';

export type AchievementCategory = 'matches' | 'wins' | 'daily' | 'special';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  category: AchievementCategory;
  icon: AchievementIconKey;
  tier: 'bronze' | 'silver' | 'gold';
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // MATCHES
  { id: 'match_1', title: 'First Blood', desc: 'Play your first tournament', category: 'matches', icon: 'sword', tier: 'bronze' },
  { id: 'match_10', title: 'Warm-Up', desc: 'Play 10 tournaments', category: 'matches', icon: 'swords', tier: 'bronze' },
  { id: 'match_50', title: 'Regular', desc: 'Play 50 tournaments', category: 'matches', icon: 'shield', tier: 'silver' },
  { id: 'match_150', title: 'Veteran', desc: 'Play 150 tournaments', category: 'matches', icon: 'helmet', tier: 'silver' },
  { id: 'match_500', title: 'Ironman', desc: 'Play 500 tournaments', category: 'matches', icon: 'crown', tier: 'gold' },

  // VICTORIES
  { id: 'win_1', title: 'First Aegis', desc: 'Win 1 tournament', category: 'wins', icon: 'aegis', tier: 'bronze' },
  { id: 'win_2', title: 'Back-to-Back', desc: 'Win 2 tournaments', category: 'wins', icon: 'trophy', tier: 'bronze' },
  { id: 'win_10', title: 'Dynasty', desc: 'Win 10 tournaments', category: 'wins', icon: 'laurel', tier: 'silver' },
  { id: 'win_25', title: 'Hall of Famer', desc: 'Win 25 tournaments', category: 'wins', icon: 'crown', tier: 'gold' },
  { id: 'mem_win_1', title: 'Sharp Recall', desc: 'Win 1 Memory Game tournament', category: 'wins', icon: 'brain', tier: 'silver' },
  { id: 'mem_win_10', title: 'Photographic Memory', desc: 'Win 10 Memory Game tournaments', category: 'wins', icon: 'memory_grid', tier: 'gold' },

  // DAILY CHALLENGE
  { id: 'daily_1', title: 'Daily Contender', desc: 'Complete 1 Daily Challenge', category: 'daily', icon: 'calendar', tier: 'bronze' },
  { id: 'daily_7', title: 'Consistent', desc: 'Complete 7 Daily Challenges', category: 'daily', icon: 'flame', tier: 'silver' },
  { id: 'daily_30', title: 'Dedicated', desc: 'Complete 30 Daily Challenges', category: 'daily', icon: 'diamond', tier: 'gold' },
  { id: 'daily_win_1', title: 'Daily Champion', desc: 'Win a Daily Challenge tournament', category: 'daily', icon: 'star', tier: 'silver' },
  { id: 'daily_task_1', title: 'Eagle Eye', desc: 'Complete 1 Extra Task', category: 'daily', icon: 'eye', tier: 'bronze' },
  { id: 'daily_task_10', title: 'Oracle', desc: 'Complete 10 Extra Tasks', category: 'daily', icon: 'oracle', tier: 'gold' },

  // MASTERY & SPECIAL
  { id: 'spec_galacticos', title: 'Galacticos', desc: 'Draft a roster with 92+ Avg OVR', category: 'special', icon: 'star', tier: 'silver' },
  { id: 'spec_underdog', title: 'Cinderella Run', desc: 'Win a tournament with 82 or lower Avg OVR', category: 'special', icon: 'underdog', tier: 'gold' },
  { id: 'spec_moneyball', title: 'Moneyball', desc: 'Win Daily Challenge with $250+ saved', category: 'special', icon: 'coins', tier: 'gold' },
  { id: 'spec_tactician', title: 'Tactical Genius', desc: 'Win with Early, Mid, and Late tactics', category: 'special', icon: 'tactics', tier: 'silver' },
  { id: 'spec_upper', title: 'Flawless Run', desc: 'Win without dropping to Lower Bracket', category: 'special', icon: 'upper_arrow', tier: 'silver' },
  { id: 'spec_lower', title: 'Lower Bracket King', desc: 'Win after dropping in Upper Quarterfinal', category: 'special', icon: 'lower_phoenix', tier: 'gold' },
  { id: 'spec_scouter', title: 'Talent Scout', desc: 'Draft 50 unique players across runs', category: 'special', icon: 'scout', tier: 'silver' },
];

export function checkAchievements(profile: UserProfile): string[] {
  const unlocked = new Set(profile.unlockedAchievements);

  const unlock = (id: string, condition: boolean) => {
    if (condition) unlocked.add(id);
  };

  // Matches
  unlock('match_1', profile.matchesPlayed >= 1);
  unlock('match_10', profile.matchesPlayed >= 10);
  unlock('match_50', profile.matchesPlayed >= 50);
  unlock('match_150', profile.matchesPlayed >= 150);
  unlock('match_500', profile.matchesPlayed >= 500);

  // Wins
  unlock('win_1', profile.wins >= 1);
  unlock('win_2', profile.wins >= 2);
  unlock('win_10', profile.wins >= 10);
  unlock('win_25', profile.wins >= 25);
  unlock('mem_win_1', (profile.memoryWins || 0) >= 1);
  unlock('mem_win_10', (profile.memoryWins || 0) >= 10);

  // Daily
  const tasksCompleted = profile.dailyHistory.filter((d) => d.taskCompleted).length;
  unlock('daily_1', profile.dailyCompleted >= 1);
  unlock('daily_7', profile.dailyCompleted >= 7);
  unlock('daily_30', profile.dailyCompleted >= 30);
  unlock('daily_win_1', (profile.dailyWins || 0) >= 1);
  unlock('daily_task_1', tasksCompleted >= 1);
  unlock('daily_task_10', tasksCompleted >= 10);

  // Special / Mastery
  const uniqueDrafted = Object.keys(profile.favoritePlayers || {}).length;
  const tactics = profile.wonTactics || [];
  unlock('spec_galacticos', (profile.bestAvgRating || 0) >= 92);
  unlock(
    'spec_underdog',
    (profile.lowestWinAvgRating || 999) > 0 && (profile.lowestWinAvgRating || 999) <= 82
  );
  unlock('spec_moneyball', (profile.maxDailyWinSaved || 0) >= 250);
  unlock(
    'spec_tactician',
    tactics.includes('early') && tactics.includes('mid') && tactics.includes('late')
  );
  unlock('spec_upper', Boolean(profile.wonUpperRun));
  unlock('spec_lower', Boolean(profile.wonLowerRun));
  unlock('spec_scouter', uniqueDrafted >= 50);

  return Array.from(unlocked);
}
