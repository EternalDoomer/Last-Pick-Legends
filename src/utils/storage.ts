import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { checkAchievements } from './achievements';

export interface DailyRecord {
  date: string;
  placement: string;
  taskCompleted: boolean;
}

export interface Friend {
  uid: string;
  nickname: string;
}

export interface UserProfile {
  nickname: string;
  email: string;
  matchesPlayed: number;
  wins: number;
  dailyCompleted: number;
  memoryWins: number;
  dailyWins: number;
  favoritePlayers: Record<string, number>;
  pinnedAchievements: string[];
  unlockedAchievements: string[];
  dailyHistory: DailyRecord[];
  friends: Friend[];
}

export const getProfile = (): UserProfile => {
  const data = localStorage.getItem('lpl_profile');
  if (data) {
    const parsed = JSON.parse(data);
    if (!parsed.dailyHistory) parsed.dailyHistory = [];
    if (!parsed.friends) parsed.friends = [];
    if (parsed.memoryWins === undefined) parsed.memoryWins = 0;
    if (parsed.dailyWins === undefined) parsed.dailyWins = 0;
    return parsed;
  }
  return {
    nickname: '', email: '', matchesPlayed: 0, wins: 0, dailyCompleted: 0,
    memoryWins: 0, dailyWins: 0,
    favoritePlayers: {}, pinnedAchievements: [], unlockedAchievements: [], dailyHistory: [], friends: []
  };
};

export const saveProfile = async (profile: UserProfile) => {
  const newUnlocked = checkAchievements(profile);
  if (newUnlocked.length > profile.unlockedAchievements.length) {
    profile.unlockedAchievements = newUnlocked;
  }
  localStorage.setItem('lpl_profile', JSON.stringify(profile));
  
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), profile);
    } catch (e) {
      console.error("Ошибка синхронизации с облаком", e);
    }
  }
};

const isNicknameTaken = async (nickname: string) => {
  const q = query(collection(db, "users"), where("nickname", "==", nickname));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const registerUser = async (email: string, password: string, nickname: string) => {
  if (await isNicknameTaken(nickname)) {
    throw new Error('Этот никнейм уже занят!');
  }
  
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  
  const newProfile: UserProfile = {
    nickname, email, matchesPlayed: 0, wins: 0, dailyCompleted: 0,
    memoryWins: 0, dailyWins: 0,
    favoritePlayers: {}, pinnedAchievements: [], unlockedAchievements: [], dailyHistory: [], friends: []
  };
  
  await setDoc(doc(db, "users", userCred.user.uid), newProfile);
  localStorage.setItem('lpl_profile', JSON.stringify(newProfile));
  return newProfile;
};

export const loginUser = async (email: string, password: string) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const docRef = doc(db, "users", userCred.user.uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const cloudProfile = docSnap.data() as UserProfile;
    if (!cloudProfile.friends) cloudProfile.friends = [];
    if (cloudProfile.memoryWins === undefined) cloudProfile.memoryWins = 0;
    if (cloudProfile.dailyWins === undefined) cloudProfile.dailyWins = 0;
    
    const newUnlocked = checkAchievements(cloudProfile);
    if (newUnlocked.length > cloudProfile.unlockedAchievements.length) {
      cloudProfile.unlockedAchievements = newUnlocked;
    }
    localStorage.setItem('lpl_profile', JSON.stringify(cloudProfile));
    return cloudProfile;
  }
  return getProfile();
};

export const logoutUser = async () => {
  await signOut(auth);
  localStorage.removeItem('lpl_profile');
};

export const trackDraft = (playerId: string) => {
  const profile = getProfile();
  profile.favoritePlayers[playerId] = (profile.favoritePlayers[playerId] || 0) + 1;
  saveProfile(profile);
};

export const trackMatch = (won: boolean, mode: 'normal' | 'memory' | 'daily' | 'free') => {
  const profile = getProfile();
  profile.matchesPlayed += 1;
  
  if (won) {
    profile.wins += 1;
    if (mode === 'memory') profile.memoryWins += 1;
    if (mode === 'daily') profile.dailyWins += 1;
  }
  
  saveProfile(profile);
};

export const hasPlayedDailyToday = (): boolean => {
  const profile = getProfile();
  const today = new Date().toISOString().split('T')[0];
  return profile.dailyHistory.some(r => r.date === today);
};

export const saveDailyResult = async (placement: string, taskCompleted: boolean) => {
  const profile = getProfile();
  const today = new Date().toISOString().split('T')[0];
  const existingIdx = profile.dailyHistory.findIndex(r => r.date === today);
  
  if (existingIdx !== -1) {
    profile.dailyHistory[existingIdx] = { date: today, placement, taskCompleted };
  } else {
    profile.dailyHistory.push({ date: today, placement, taskCompleted });
    profile.dailyCompleted += 1;
  }
  await saveProfile(profile);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, "daily_scores", `${today}_${auth.currentUser.uid}`), {
        date: today,
        nickname: profile.nickname || 'Аноним',
        placement: placement,
        taskCompleted: taskCompleted,
        uid: auth.currentUser.uid
      });
    } catch (e) {
      console.error("Ошибка сохранения в рейтинг", e);
    }
  }
};

export const getLeaderboard = async (dateStr: string) => {
  const results: { name: string; score: string; task: boolean }[] = [];
  
  try {
    const q = query(collection(db, "daily_scores"), where("date", "==", dateStr));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      results.push({ 
        name: data.nickname, 
        score: data.placement, 
        task: data.taskCompleted 
      });
    });
  } catch (e) {
    console.error("Ошибка загрузки рейтинга", e);
  }
  
  if (results.length === 0) {
    const profile = getProfile();
    const myRecord = profile.dailyHistory.find(r => r.date === dateStr);
    if (myRecord && profile.nickname) {
      results.push({ name: profile.nickname, score: myRecord.placement, task: myRecord.taskCompleted });
    }
  }
  
  return results.sort((a, b) => {
     const getScoreValue = (s: string) => s.includes('1-е') ? 1 : s.includes('2-е') ? 2 : s.includes('3') ? 3 : 5;
     return getScoreValue(a.score) - getScoreValue(b.score);
  });
};

export const searchUserByNickname = async (nickname: string): Promise<Friend | null> => {
  const q = query(collection(db, "users"), where("nickname", "==", nickname));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0].data();
  return { uid: snapshot.docs[0].id, nickname: docData.nickname };
};

export const addFriendToProfile = async (friend: Friend) => {
  const profile = getProfile();
  if (!profile.friends.some(f => f.uid === friend.uid)) {
    profile.friends.push(friend);
    await saveProfile(profile);
  }
};

export const removeFriendFromProfile = async (friendUid: string) => {
  const profile = getProfile();
  profile.friends = profile.friends.filter(f => f.uid !== friendUid);
  await saveProfile(profile);
};

export const getFriendProfileById = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};