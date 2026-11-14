import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

export interface DailyRecord {
  date: string;
  placement: string;
  taskCompleted: boolean;
}

export interface UserProfile {
  nickname: string;
  email: string;
  matchesPlayed: number;
  wins: number;
  dailyCompleted: number;
  favoritePlayers: Record<string, number>;
  pinnedAchievements: string[];
  unlockedAchievements: string[];
  dailyHistory: DailyRecord[];
}

// Читаем из localStorage для мгновенного отображения
export const getProfile = (): UserProfile => {
  const data = localStorage.getItem('lpl_profile');
  if (data) {
    const parsed = JSON.parse(data);
    if (!parsed.dailyHistory) parsed.dailyHistory = [];
    return parsed;
  }
  return {
    nickname: '', email: '', matchesPlayed: 0, wins: 0, dailyCompleted: 0,
    favoritePlayers: {}, pinnedAchievements: [], unlockedAchievements: [], dailyHistory: []
  };
};

// Сохраняем локально И в облако, если авторизованы
export const saveProfile = async (profile: UserProfile) => {
  localStorage.setItem('lpl_profile', JSON.stringify(profile));
  
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), profile);
    } catch (e) {
      console.error("Ошибка синхронизации с облаком", e);
    }
  }
};

// Проверка, занят ли ник
const isNicknameTaken = async (nickname: string) => {
  const q = query(collection(db, "users"), where("nickname", "==", nickname));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Регистрация
export const registerUser = async (email: string, password: string, nickname: string) => {
  if (await isNicknameTaken(nickname)) {
    throw new Error('Этот никнейм уже занят!');
  }
  
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  
  const newProfile: UserProfile = {
    nickname, email, matchesPlayed: 0, wins: 0, dailyCompleted: 0,
    favoritePlayers: {}, pinnedAchievements: [], unlockedAchievements: [], dailyHistory: []
  };
  
  await setDoc(doc(db, "users", userCred.user.uid), newProfile);
  localStorage.setItem('lpl_profile', JSON.stringify(newProfile));
  return newProfile;
};

// Вход
export const loginUser = async (email: string, password: string) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const docRef = doc(db, "users", userCred.user.uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const cloudProfile = docSnap.data() as UserProfile;
    localStorage.setItem('lpl_profile', JSON.stringify(cloudProfile));
    return cloudProfile;
  }
  return getProfile();
};

// Выход
export const logoutUser = async () => {
  await signOut(auth);
  localStorage.removeItem('lpl_profile');
};

// Обновление статистики (с синхронизацией)
export const trackDraft = (playerId: string) => {
  const profile = getProfile();
  profile.favoritePlayers[playerId] = (profile.favoritePlayers[playerId] || 0) + 1;
  saveProfile(profile);
};

export const trackMatch = (won: boolean) => {
  const profile = getProfile();
  profile.matchesPlayed += 1;
  if (won) profile.wins += 1;
  saveProfile(profile);
};

export const hasPlayedDailyToday = (): boolean => {
  const profile = getProfile();
  const today = new Date().toISOString().split('T')[0];
  return profile.dailyHistory.some(r => r.date === today);
};

export const saveDailyResult = (placement: string, taskCompleted: boolean) => {
  const profile = getProfile();
  const today = new Date().toISOString().split('T')[0];
  const existingIdx = profile.dailyHistory.findIndex(r => r.date === today);
  
  if (existingIdx !== -1) {
    profile.dailyHistory[existingIdx] = { date: today, placement, taskCompleted };
  } else {
    profile.dailyHistory.push({ date: today, placement, taskCompleted });
    profile.dailyCompleted += 1;
  }
  saveProfile(profile);
};

export const getMockLeaderboard = (dateStr: string) => {
  // В реальной игре здесь был бы запрос к Firestore (collection 'daily_scores')
  const baseScores = [
    { name: 'MiracleFan', score: '1-е место', task: true },
    { name: 'DotaGod', score: '1-е место', task: true },
    { name: 'PuppeyEnjoyer', score: '2-е место', task: true },
    { name: 'Smurf_99', score: 'Топ-4', task: false },
    { name: 'CarryOnly', score: 'Топ-6', task: false },
  ];
  
  const profile = getProfile();
  const myRecord = profile.dailyHistory.find(r => r.date === dateStr);
  if (myRecord && profile.nickname) {
    baseScores.push({ name: profile.nickname, score: myRecord.placement, task: myRecord.taskCompleted });
  }
  return baseScores;
};