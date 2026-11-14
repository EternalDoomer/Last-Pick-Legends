import type { UserProfile } from './storage';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  category: 'matches' | 'wins' | 'daily' | 'special';
  icon: string;
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Матчи
  { id: 'match_1', title: 'Первые шаги', desc: 'Сыграйте 1 матч', category: 'matches', icon: '👣' },
  { id: 'match_10', title: 'Новичок', desc: 'Сыграйте 10 матчей', category: 'matches', icon: '🌱' },
  { id: 'match_50', title: 'Опытный', desc: 'Сыграйте 50 матчей', category: 'matches', icon: '⚔️' },
  { id: 'match_100', title: 'Ветеран', desc: 'Сыграйте 100 матчей', category: 'matches', icon: '🛡️' },
  { id: 'match_500', title: 'Легенда', desc: 'Сыграйте 500 матчей', category: 'matches', icon: '👑' },
  
  // Победы
  { id: 'win_1', title: 'Вкус победы', desc: 'Выиграйте 1 турнир', category: 'wins', icon: '🥇' },
  { id: 'win_5', title: 'Чемпион', desc: 'Выиграйте 5 турниров', category: 'wins', icon: '🏆' },
  { id: 'win_20', title: 'Династия', desc: 'Выиграйте 20 турниров', category: 'wins', icon: '🏰' },
  { id: 'win_50', title: 'Бессмертный', desc: 'Выиграйте 50 турниров', category: 'wins', icon: '✨' },

  // Daily Challenge
  { id: 'daily_1', title: 'Испытатель', desc: 'Пройти 1 испытание', category: 'daily', icon: '📅' },
  { id: 'daily_7', title: 'Постоянство', desc: 'Пройти 7 испытаний', category: 'daily', icon: '🔥' },
  { id: 'daily_30', title: 'Преданный', desc: 'Пройти 30 испытаний', category: 'daily', icon: '💎' },
  { id: 'daily_task_1', title: 'Зоркий глаз', desc: 'Выполнить задание дня (👁️)', category: 'daily', icon: '👁️' },
  { id: 'daily_task_5', title: 'Ясновидец', desc: 'Выполнить 5 заданий дня', category: 'daily', icon: '🔮' },
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