import type { UserProfile } from './storage';

export interface Achievement {
  id: string;
  title: { ru: string; en: string };
  desc: { ru: string; en: string };
  category: 'matches' | 'wins' | 'daily' | 'special';
  icon: string;
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Матчи
  { id: 'match_1', title: { ru: 'Первые шаги', en: 'First Steps' }, desc: { ru: 'Сыграйте 1 матч', en: 'Play 1 match' }, category: 'matches', icon: '👣' },
  { id: 'match_10', title: { ru: 'Новичок', en: 'Beginner' }, desc: { ru: 'Сыграйте 10 матчей', en: 'Play 10 matches' }, category: 'matches', icon: '🌱' },
  { id: 'match_50', title: { ru: 'Опытный', en: 'Experienced' }, desc: { ru: 'Сыграйте 50 матчей', en: 'Play 50 matches' }, category: 'matches', icon: '⚔️' },
  { id: 'match_100', title: { ru: 'Ветеран', en: 'Veteran' }, desc: { ru: 'Сыграйте 100 матчей', en: 'Play 100 matches' }, category: 'matches', icon: '🛡️' },
  { id: 'match_500', title: { ru: 'Легенда', en: 'Legend' }, desc: { ru: 'Сыграйте 500 матчей', en: 'Play 500 matches' }, category: 'matches', icon: '👑' },
  
  // Победы
  { id: 'win_1', title: { ru: 'Вкус победы', en: 'Taste of Victory' }, desc: { ru: 'Выиграйте 1 турнир', en: 'Win 1 tournament' }, category: 'wins', icon: '🥇' },
  { id: 'win_5', title: { ru: 'Чемпион', en: 'Champion' }, desc: { ru: 'Выиграйте 5 турниров', en: 'Win 5 tournaments' }, category: 'wins', icon: '🏆' },
  { id: 'win_20', title: { ru: 'Династия', en: 'Dynasty' }, desc: { ru: 'Выиграйте 20 турниров', en: 'Win 20 tournaments' }, category: 'wins', icon: '🏰' },
  { id: 'win_50', title: { ru: 'Бессмертный', en: 'Immortal' }, desc: { ru: 'Выиграйте 50 турниров', en: 'Win 50 tournaments' }, category: 'wins', icon: '✨' },

  // Daily Challenge
  { id: 'daily_1', title: { ru: 'Испытатель', en: 'Challenger' }, desc: { ru: 'Пройти 1 испытание', en: 'Complete 1 challenge' }, category: 'daily', icon: '📅' },
  { id: 'daily_7', title: { ru: 'Постоянство', en: 'Consistent' }, desc: { ru: 'Пройти 7 испытаний', en: 'Complete 7 challenges' }, category: 'daily', icon: '🔥' },
  { id: 'daily_30', title: { ru: 'Преданный', en: 'Devoted' }, desc: { ru: 'Пройти 30 испытаний', en: 'Complete 30 challenges' }, category: 'daily', icon: '💎' },
  { id: 'daily_task_1', title: { ru: 'Зоркий глаз', en: 'Eagle Eye' }, desc: { ru: 'Выполнить задание дня (👁️)', en: 'Complete the daily task (👁️)' }, category: 'daily', icon: '👁️' },
  { id: 'daily_task_5', title: { ru: 'Ясновидец', en: 'Seer' }, desc: { ru: 'Выполнить 5 заданий дня', en: 'Complete 5 daily tasks' }, category: 'daily', icon: '🔮' },
];

export function checkAchievements(profile: UserProfile): string[] {
  const unlocked = new Set(profile.unlockedAchievements);

  const unlock = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) {
      unlocked.add(id);
    }
  };

  unlock('match_1', profile.matchesPlayed >= 1);
  unlock('match_10', profile.matchesPlayed >= 10);
  unlock('match_50', profile.matchesPlayed >= 50);
  unlock('match_100', profile.matchesPlayed >= 100);
  unlock('match_500', profile.matchesPlayed >= 500);

  unlock('win_1', profile.wins >= 1);
  unlock('win_5', profile.wins >= 5);
  unlock('win_20', profile.wins >= 20);
  unlock('win_50', profile.wins >= 50);

  unlock('daily_1', profile.dailyCompleted >= 1);
  unlock('daily_7', profile.dailyCompleted >= 7);
  unlock('daily_30', profile.dailyCompleted >= 30);

  const tasksCompleted = profile.dailyHistory.filter(d => d.taskCompleted).length;
  unlock('daily_task_1', tasksCompleted >= 1);
  unlock('daily_task_5', tasksCompleted >= 5);

  return Array.from(unlocked);
}