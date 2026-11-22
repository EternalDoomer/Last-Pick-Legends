import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ALL_ACHIEVEMENTS, checkAchievements } from './achievements';
import { getTodayDateStr, normalizePlacement } from './draft';
import type { GameMode, Tactic, TournamentResult } from '../types';

const VALID_ACHIEVEMENT_IDS = new Set(ALL_ACHIEVEMENTS.map((a) => a.id));

export interface DailyRecord {
  date: string;
  placement: string;
  taskCompleted: boolean;
  themeTitle?: string;
  avgRating?: number;
  moneySaved?: number;
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
  bestAvgRating: number;
  lowestWinAvgRating: number;
  maxDailyWinSaved: number;
  wonTactics: Tactic[];
  wonUpperRun: boolean;
  wonLowerRun: boolean;
}

function createEmptyProfile(email = '', nickname = ''): UserProfile {
  return {
    nickname,
    email,
    matchesPlayed: 0,
    wins: 0,
    dailyCompleted: 0,
    memoryWins: 0,
    dailyWins: 0,
    favoritePlayers: {},
    pinnedAchievements: [],
    unlockedAchievements: [],
    dailyHistory: [],
    friends: [],
    bestAvgRating: 0,
    lowestWinAvgRating: 0,
    maxDailyWinSaved: 0,
    wonTactics: [],
    wonUpperRun: false,
    wonLowerRun: false,
  };
}

function sanitizeAchievementIds(ids: string[] | undefined): string[] {
  if (!Array.isArray(ids)) return [];
  return Array.from(new Set(ids.filter((id) => VALID_ACHIEVEMENT_IDS.has(id))));
}

function hydrateProfile(raw: Partial<UserProfile>): UserProfile {
  const base = {
    ...createEmptyProfile(),
    ...raw,
    dailyHistory: raw.dailyHistory ?? [],
    friends: raw.friends ?? [],
    favoritePlayers: raw.favoritePlayers ?? {},
    wonTactics: raw.wonTactics ?? [],
  };

  const cleanUnlocked = sanitizeAchievementIds(raw.unlockedAchievements);
  const unlockedSet = new Set(cleanUnlocked);
  const cleanPinned = sanitizeAchievementIds(raw.pinnedAchievements)
    .filter((id) => unlockedSet.has(id))
    .slice(0, 3);

  return {
    ...base,
    unlockedAchievements: cleanUnlocked,
    pinnedAchievements: cleanPinned,
  };
}

function hasMeaningfulProgress(p: UserProfile): boolean {
  return Boolean(
    p.nickname ||
      p.matchesPlayed > 0 ||
      p.wins > 0 ||
      p.dailyCompleted > 0 ||
      p.unlockedAchievements.length > 0 ||
      p.dailyHistory.length > 0 ||
      Object.keys(p.favoritePlayers || {}).length > 0
  );
}

function mergeProfiles(cloud: UserProfile, local: UserProfile, fallbackEmail: string): UserProfile {
  if (!hasMeaningfulProgress(cloud) && hasMeaningfulProgress(local)) {
    return hydrateProfile({
      ...local,
      email: local.email || fallbackEmail,
    });
  }

  const mergedFavs: Record<string, number> = { ...(cloud.favoritePlayers || {}) };
  for (const [playerId, count] of Object.entries(local.favoritePlayers || {})) {
    mergedFavs[playerId] = Math.max(mergedFavs[playerId] || 0, count);
  }

  const historyByDate = new Map<string, DailyRecord>();
  for (const rec of local.dailyHistory || []) historyByDate.set(rec.date, rec);
  for (const rec of cloud.dailyHistory || []) historyByDate.set(rec.date, rec);

  const friendsByUid = new Map<string, Friend>();
  for (const fr of local.friends || []) friendsByUid.set(fr.uid, fr);
  for (const fr of cloud.friends || []) friendsByUid.set(fr.uid, fr);

  const unlocked = Array.from(
    new Set([
      ...sanitizeAchievementIds(cloud.unlockedAchievements),
      ...sanitizeAchievementIds(local.unlockedAchievements),
    ])
  );

  const pinned = Array.from(
    new Set([
      ...sanitizeAchievementIds(cloud.pinnedAchievements),
      ...sanitizeAchievementIds(local.pinnedAchievements),
    ])
  )
    .filter((id) => unlocked.includes(id))
    .slice(0, 3);

  const wonTactics = Array.from(
    new Set<Tactic>([...(cloud.wonTactics || []), ...(local.wonTactics || [])])
  );

  const validLocalLow = (local.lowestWinAvgRating || 0) > 0 ? local.lowestWinAvgRating : Infinity;
  const validCloudLow = (cloud.lowestWinAvgRating || 0) > 0 ? cloud.lowestWinAvgRating : Infinity;
  const minLow = Math.min(validLocalLow, validCloudLow);

  return hydrateProfile({
    nickname: cloud.nickname || local.nickname || '',
    email: cloud.email || local.email || fallbackEmail,
    matchesPlayed: Math.max(cloud.matchesPlayed || 0, local.matchesPlayed || 0),
    wins: Math.max(cloud.wins || 0, local.wins || 0),
    dailyCompleted: Math.max(cloud.dailyCompleted || 0, local.dailyCompleted || 0),
    memoryWins: Math.max(cloud.memoryWins || 0, local.memoryWins || 0),
    dailyWins: Math.max(cloud.dailyWins || 0, local.dailyWins || 0),
    favoritePlayers: mergedFavs,
    pinnedAchievements: pinned,
    unlockedAchievements: unlocked,
    dailyHistory: Array.from(historyByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    friends: Array.from(friendsByUid.values()),
    bestAvgRating: Math.max(cloud.bestAvgRating || 0, local.bestAvgRating || 0),
    lowestWinAvgRating: Number.isFinite(minLow) ? minLow : 0,
    maxDailyWinSaved: Math.max(cloud.maxDailyWinSaved || 0, local.maxDailyWinSaved || 0),
    wonTactics,
    wonUpperRun: Boolean(cloud.wonUpperRun || local.wonUpperRun),
    wonLowerRun: Boolean(cloud.wonLowerRun || local.wonLowerRun),
  });
}

export const getProfile = (): UserProfile => {
  const data = localStorage.getItem('lpl_profile');
  if (!data) return createEmptyProfile();
  return hydrateProfile(JSON.parse(data));
};

export const saveProfile = async (profile: UserProfile) => {
  const cleanProfile = hydrateProfile(profile);
  const newUnlocked = checkAchievements(cleanProfile);
  if (newUnlocked.length > cleanProfile.unlockedAchievements.length) {
    cleanProfile.unlockedAchievements = newUnlocked;
  }
  localStorage.setItem('lpl_profile', JSON.stringify(cleanProfile));

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), cleanProfile, { merge: true });
    } catch (e) {
      console.error('Failed to sync profile with cloud:', e);
    }
  }
};

const isNicknameTaken = async (nickname: string) => {
  const q = query(collection(db, 'users'), where('nickname', '==', nickname));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const registerUser = async (email: string, password: string, nickname: string) => {
  if (await isNicknameTaken(nickname)) {
    throw new Error('This nickname is already taken!');
  }

  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const localData = getProfile();
  const newProfile = hydrateProfile({
    ...createEmptyProfile(email, nickname),
    matchesPlayed: localData.matchesPlayed,
    wins: localData.wins,
    dailyCompleted: localData.dailyCompleted,
    memoryWins: localData.memoryWins,
    dailyWins: localData.dailyWins,
    favoritePlayers: localData.favoritePlayers,
    pinnedAchievements: localData.pinnedAchievements,
    unlockedAchievements: localData.unlockedAchievements,
    dailyHistory: localData.dailyHistory,
    friends: localData.friends,
    bestAvgRating: localData.bestAvgRating,
    lowestWinAvgRating: localData.lowestWinAvgRating,
    maxDailyWinSaved: localData.maxDailyWinSaved,
    wonTactics: localData.wonTactics,
    wonUpperRun: localData.wonUpperRun,
    wonLowerRun: localData.wonLowerRun,
  });

  await setDoc(doc(db, 'users', userCred.user.uid), newProfile);
  localStorage.setItem('lpl_profile', JSON.stringify(newProfile));
  return newProfile;
};

export const loginUser = async (email: string, password: string) => {
  const localProfile = getProfile();
  const userCred = await signInWithEmailAndPassword(auth, email, password);

  let rawCloud: Partial<UserProfile> | null = null;
  const docSnap = await getDoc(doc(db, 'users', userCred.user.uid));

  if (docSnap.exists()) {
    rawCloud = docSnap.data() as Partial<UserProfile>;
  } else {
    const emailQuery = query(collection(db, 'users'), where('email', '==', email));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      rawCloud = emailSnap.docs[0].data() as Partial<UserProfile>;
    }
  }

  const cloudHydrated = hydrateProfile(rawCloud ?? createEmptyProfile(email, ''));
  const resolvedProfile = mergeProfiles(cloudHydrated, localProfile, email);

  const newUnlocked = checkAchievements(resolvedProfile);
  if (newUnlocked.length > resolvedProfile.unlockedAchievements.length) {
    resolvedProfile.unlockedAchievements = newUnlocked;
  }

  await saveProfile(resolvedProfile);
  return resolvedProfile;
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

export const recordRosterDrafted = (avgRating: number) => {
  const profile = getProfile();
  if (avgRating > (profile.bestAvgRating || 0)) {
    profile.bestAvgRating = avgRating;
    saveProfile(profile);
  }
};

export const trackMatch = (
  result: TournamentResult,
  mode: GameMode,
  avgRating = 0,
  savedBudget = 0
) => {
  const profile = getProfile();
  profile.matchesPlayed += 1;

  if (avgRating > (profile.bestAvgRating || 0)) {
    profile.bestAvgRating = avgRating;
  }

  if (result.champion) {
    profile.wins += 1;
    if (mode === 'memory') profile.memoryWins += 1;
    if (mode === 'daily') {
      profile.dailyWins += 1;
      if (savedBudget > (profile.maxDailyWinSaved || 0)) {
        profile.maxDailyWinSaved = savedBudget;
      }
    }

    if (avgRating > 0 && (!profile.lowestWinAvgRating || avgRating < profile.lowestWinAvgRating)) {
      profile.lowestWinAvgRating = avgRating;
    }

    if (!profile.wonTactics.includes(result.tactic)) {
      profile.wonTactics.push(result.tactic);
    }

    const hadLowerMatches = result.matches.some((m) => m.bracket === 'lower');
    if (!hadLowerMatches) {
      profile.wonUpperRun = true;
    }

    const droppedInFirstMatch = result.matches.length > 0 && !result.matches[0].won;
    if (droppedInFirstMatch) {
      profile.wonLowerRun = true;
    }
  }

  saveProfile(profile);
};

export const hasPlayedDailyToday = (): boolean => {
  const profile = getProfile();
  const today = getTodayDateStr();
  return profile.dailyHistory.some((r) => r.date === today);
};

export const saveDailyResult = async (
  placement: string,
  taskCompleted: boolean,
  teamPower: number,
  moneySaved: number,
  themeTitle?: string
) => {
  const profile = getProfile();
  const today = getTodayDateStr();
  const cleanPlacement = normalizePlacement(placement);
  const existingIdx = profile.dailyHistory.findIndex((r) => r.date === today);

  const record: DailyRecord = {
    date: today,
    placement: cleanPlacement,
    taskCompleted,
    themeTitle,
    avgRating: teamPower,
    moneySaved,
  };

  if (existingIdx !== -1) {
    profile.dailyHistory[existingIdx] = record;
  } else {
    profile.dailyHistory.push(record);
    profile.dailyCompleted += 1;
  }
  await saveProfile(profile);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'daily_scores', `${today}_${auth.currentUser.uid}`), {
        date: today,
        nickname: profile.nickname || 'Anonymous',
        placement: cleanPlacement,
        taskCompleted,
        uid: auth.currentUser.uid,
        teamPower,
        moneySaved,
      });
    } catch (e) {
      console.error('Failed to save daily score:', e);
    }
  }
};

export const getLeaderboard = async (dateStr: string) => {
  const results: { name: string; score: string; task: boolean; power: number; saved: number }[] = [];

  try {
    const q = query(collection(db, 'daily_scores'), where('date', '==', dateStr));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        name: data.nickname,
        score: normalizePlacement(data.placement || ''),
        task: Boolean(data.taskCompleted),
        power: data.teamPower || 0,
        saved: data.moneySaved || 0,
      });
    });
  } catch (e) {
    console.error('Failed to load leaderboard:', e);
  }

  if (results.length === 0) {
    const profile = getProfile();
    const myRecord = profile.dailyHistory.find((r) => r.date === dateStr);
    if (myRecord && profile.nickname) {
      results.push({
        name: profile.nickname,
        score: normalizePlacement(myRecord.placement),
        task: myRecord.taskCompleted,
        power: myRecord.avgRating || 0,
        saved: myRecord.moneySaved || 0,
      });
    }
  }

  return results;
};

export const searchUserByNickname = async (nickname: string): Promise<Friend | null> => {
  const q = query(collection(db, 'users'), where('nickname', '==', nickname));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0].data();
  return { uid: snapshot.docs[0].id, nickname: docData.nickname };
};

export const addFriendToProfile = async (friend: Friend) => {
  const profile = getProfile();
  if (!profile.friends.some((f) => f.uid === friend.uid)) {
    profile.friends.push(friend);
    await saveProfile(profile);
  }
};

export const removeFriendFromProfile = async (friendUid: string) => {
  const profile = getProfile();
  profile.friends = profile.friends.filter((f) => f.uid !== friendUid);
  await saveProfile(profile);
};

export const getFriendProfileById = async (uid: string): Promise<UserProfile | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return hydrateProfile(docSnap.data() as Partial<UserProfile>);
  }
  return null;
};
