import { useState, useMemo, useEffect } from 'react';
import {
  getProfile,
  saveProfile,
  registerUser,
  loginUser,
  logoutUser,
  searchUserByNickname,
  addFriendToProfile,
  removeFriendFromProfile,
  getFriendProfileById,
} from '../utils/storage';
import type { UserProfile, Friend } from '../utils/storage';
import { ALL_ACHIEVEMENTS } from '../utils/achievements';
import type { AchievementCategory } from '../utils/achievements';
import { ALL_PLAYERS, normalizePlacement } from '../utils/draft';
import type { Player, Position } from '../types';
import { auth } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AchievementIcon from './AchievementIcon';

const CATEGORY_TABS: { id: AchievementCategory; label: string }[] = [
  { id: 'matches', label: 'Matches' },
  { id: 'wins', label: 'Victories' },
  { id: 'daily', label: 'Daily' },
  { id: 'special', label: 'Mastery' },
];

const TIER_STYLES = {
  bronze: {
    badge: 'border-amber-600/40 bg-amber-950/30 text-amber-300',
    tag: 'BRONZE',
  },
  silver: {
    badge: 'border-ti9-teal/40 bg-ti9-teal/10 text-ti9-teal',
    tag: 'SILVER',
  },
  gold: {
    badge: 'border-ti9-accent/60 bg-ti9-accent/15 text-ti9-accent',
    tag: 'GOLD',
  },
};

type FavoriteSlot = { player: Player; count: number } | null;

function computeTopLineup(favoritePlayers: Record<string, number>): FavoriteSlot[] {
  const allSelected = Object.entries(favoritePlayers || {})
    .map(([id, count]) => ({ player: ALL_PLAYERS.find((p) => p.id === id), count }))
    .filter((item): item is { player: Player; count: number } => item.player !== undefined)
    .sort((a, b) => b.count - a.count);

  const slots: FavoriteSlot[] = [null, null, null, null, null];
  for (const item of allSelected) {
    for (let i = 0; i < 5; i++) {
      if (slots[i] === null && item.player.positions.includes((i + 1) as Position)) {
        slots[i] = item;
        break;
      }
    }
  }
  return slots;
}

function getPlacementBadgeStyle(placement: string): string {
  const norm = normalizePlacement(placement);
  if (norm === 'Champion') {
    return 'bg-ti9-accent/20 text-ti9-accent border-ti9-accent/50';
  }
  if (norm === 'Finalist' || norm === 'Top 3') {
    return 'bg-ti9-teal/15 text-ti9-teal border-ti9-teal/40';
  }
  return 'bg-white/5 text-slate-300 border-white/10';
}

function formatShortDay(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProfileStatsGrid({ profile, compact = false }: { profile: UserProfile; compact?: boolean }) {
  const items = [
    { value: profile.matchesPlayed, label: 'Matches', color: 'text-ti9-teal' },
    { value: profile.wins, label: 'Wins', color: 'text-ti9-accent' },
    { value: profile.memoryWins || 0, label: 'Memory W', color: 'text-purple-400' },
    { value: profile.dailyWins || 0, label: 'Daily W', color: 'text-sky-400' },
  ];

  return (
    <div className={`grid grid-cols-4 ${compact ? 'gap-1.5 mb-4' : 'gap-2 mb-5'}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-ti9-panel p-2.5 rounded-xl text-center border border-white/5"
        >
          <div
            className={`font-mono font-black ${item.color} ${
              compact ? 'text-base' : 'text-lg md:text-xl'
            }`}
          >
            {item.value}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function AchievementShowcase({
  pinnedIds,
  compact = false,
}: {
  pinnedIds: string[];
  compact?: boolean;
}) {
  const validPinned = pinnedIds.filter((id) => ALL_ACHIEVEMENTS.some((a) => a.id === id));

  return (
    <div className={`grid grid-cols-3 ${compact ? 'gap-2 mb-4' : 'gap-2.5'}`}>
      {[0, 1, 2].map((i) => {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === validPinned[i]);
        const tier = ach ? TIER_STYLES[ach.tier] : null;

        return (
          <div
            key={i}
            title={ach ? `${ach.title} — ${ach.desc}` : 'Empty showcase slot'}
            className={`rounded-xl border flex flex-col items-center justify-center text-center transition ${
              compact ? 'p-2.5 min-h-[72px]' : 'p-3 min-h-[92px]'
            } ${
              ach && tier
                ? `${tier.badge} shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`
                : 'bg-ti9-dark/60 border-dashed border-white/10 text-slate-500'
            }`}
          >
            {ach ? (
              <>
                <div className="mb-1.5">
                  <AchievementIcon icon={ach.icon} className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
                </div>
                <div
                  className={`font-bold leading-tight text-white line-clamp-1 ${
                    compact ? 'text-[10px]' : 'text-[11px]'
                  }`}
                >
                  {ach.title}
                </div>
              </>
            ) : (
              <span className="text-[10px] uppercase tracking-wider opacity-40">Empty</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FavoriteLineupGrid({
  slots,
  compact = false,
}: {
  slots: FavoriteSlot[];
  compact?: boolean;
}) {
  if (slots.every((p) => p === null)) {
    return <p className="text-xs text-slate-500">No players drafted yet.</p>;
  }

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {slots.map((found, index) => {
        const pos = index + 1;
        return (
          <div
            key={pos}
            className={`${
              compact ? 'bg-ti9-panel p-1.5' : 'bg-ti9-dark/80 p-2'
            } rounded-lg text-center border border-white/5`}
          >
            <div className="text-[9px] font-mono font-bold text-ti9-teal mb-1">POS {pos}</div>
            {found ? (
              <>
                <div className="font-bold text-xs text-white truncate">{found.player.nickname}</div>
                <div className="text-[10px] font-mono text-ti9-accent mt-0.5">{found.count}x</div>
              </>
            ) : (
              <div className="text-xs opacity-30 py-2">—</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Profile({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth.currentUser);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [formData, setFormData] = useState({ nickname: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'achievements' | 'daily' | 'friends'>('achievements');
  const [achCategory, setAchCategory] = useState<AchievementCategory>('matches');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const [searchNick, setSearchNick] = useState('');
  const [searchResult, setSearchResult] = useState<Friend | null>(null);
  const [searchError, setSearchError] = useState('');
  const [viewingFriend, setViewingFriend] = useState<UserProfile | null>(null);

  useEffect(() => {
    const initial = getProfile();
    setProfile(initial);
    if (auth.currentUser) {
      saveProfile(initial);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      const current = getProfile();
      setProfile(current);
      if (user) {
        saveProfile(current);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuthAction = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (isLoginMode) {
        await loginUser(formData.email, formData.password);
      } else {
        if (!formData.nickname.trim()) throw new Error('Enter a nickname');
        await registerUser(formData.email, formData.password, formData.nickname.trim());
      }
      setProfile(getProfile());
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setErrorMsg('Email already in use');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')
        setErrorMsg('Invalid email or password');
      else if (err.code === 'auth/user-not-found') setErrorMsg('User not found');
      else if (err.code === 'auth/weak-password')
        setErrorMsg('Password must be at least 6 characters');
      else setErrorMsg(err.message || 'Authentication error');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setProfile(getProfile());
    setFormData({ nickname: '', email: '', password: '' });
  };

  const handleSearchFriend = async () => {
    if (!searchNick.trim()) return;
    setSearchError('');
    setSearchResult(null);

    if (searchNick.trim() === profile.nickname) {
      setSearchError('This is your nickname');
      return;
    }

    const found = await searchUserByNickname(searchNick.trim());
    if (found) setSearchResult(found);
    else setSearchError('Player not found');
  };

  const handleAddFriend = async (friend: Friend) => {
    await addFriendToProfile(friend);
    setProfile(getProfile());
    setSearchResult(null);
    setSearchNick('');
  };

  const handleRemoveFriend = async (uid: string) => {
    if (confirm('Remove friend?')) {
      await removeFriendFromProfile(uid);
      setProfile(getProfile());
    }
  };

  const handleViewFriend = async (uid: string) => {
    const friendProfile = await getFriendProfileById(uid);
    if (friendProfile) setViewingFriend(friendProfile);
  };

  const topPlayers = useMemo(
    () => computeTopLineup(profile.favoritePlayers),
    [profile.favoritePlayers]
  );

  const friendTopPlayers = useMemo(
    () => (viewingFriend ? computeTopLineup(viewingFriend.favoritePlayers) : []),
    [viewingFriend]
  );

  const validPinnedIds = useMemo(
    () => profile.pinnedAchievements.filter((id) => ALL_ACHIEVEMENTS.some((a) => a.id === id)),
    [profile.pinnedAchievements]
  );

  const togglePin = (id: string) => {
    let newPinned = [...validPinnedIds];
    if (newPinned.includes(id)) {
      newPinned = newPinned.filter((p) => p !== id);
    } else {
      if (newPinned.length >= 3) {
        alert('You can pin up to 3 achievements!');
        return;
      }
      newPinned.push(id);
    }
    const newProfile = { ...profile, pinnedAchievements: newPinned };
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const filteredAchievements = useMemo(
    () => ALL_ACHIEVEMENTS.filter((a) => a.category === achCategory),
    [achCategory]
  );

  const unlockedCount = profile.unlockedAchievements.length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const progressPct = Math.round((unlockedCount / totalCount) * 100);

  const dailySummary = useMemo(() => {
    const total = profile.dailyHistory.length;
    const wins = profile.dailyHistory.filter(
      (r) => normalizePlacement(r.placement) === 'Champion'
    ).length;
    const tasks = profile.dailyHistory.filter((r) => r.taskCompleted).length;
    return { total, wins, tasks };
  }, [profile.dailyHistory]);

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light p-4 pb-20">
      <div className="flex justify-between items-center mb-5">
        <button onClick={onBack} className="text-ti9-accent hover:underline font-bold">
          ← Back
        </button>
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          Player Profile
        </span>
        <div className="w-12" />
      </div>

      {!isLoggedIn ? (
        <div className="bg-ti9-panel p-6 rounded-2xl border border-ti9-accent/30 mb-4 max-w-sm mx-auto shadow-xl">
          <h2 className="text-xl font-black mb-4 text-center text-white">
            {isLoginMode ? 'Sign In' : 'Create Account'}
          </h2>
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs p-2.5 rounded-lg mb-3">
              {errorMsg}
            </div>
          )}
          <div className="space-y-3">
            {!isLoginMode && (
              <input
                type="text"
                placeholder="Nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full bg-ti9-dark p-2.5 rounded-lg border border-ti9-accent/30 text-sm text-white outline-none focus:border-ti9-accent"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-ti9-dark p-2.5 rounded-lg border border-ti9-accent/30 text-sm text-white outline-none focus:border-ti9-accent"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-ti9-dark p-2.5 rounded-lg border border-ti9-accent/30 text-sm text-white outline-none focus:border-ti9-accent"
            />
            <button
              onClick={handleAuthAction}
              disabled={loading}
              className="w-full bg-ti9-accent text-ti9-dark font-extrabold py-2.5 rounded-lg hover:bg-amber-400 transition"
            >
              {loading ? '...' : isLoginMode ? 'Sign In' : 'Register'}
            </button>
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrorMsg('');
              }}
              className="text-xs font-semibold text-ti9-teal hover:underline"
            >
              {isLoginMode ? 'No account? Register' : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden bg-gradient-to-b from-ti9-panel to-ti9-dark/95 p-5 rounded-2xl border border-ti9-accent/40 mb-4 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-xl bg-ti9-dark border border-ti9-accent/50 flex items-center justify-center text-ti9-accent shrink-0">
                <AchievementIcon icon="aegis" className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black text-white truncate">{profile.nickname}</h2>
                <div className="text-xs text-slate-400 truncate">{profile.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg bg-rose-950/30 border border-rose-500/20 shrink-0 transition"
            >
              Logout
            </button>
          </div>

          <ProfileStatsGrid profile={profile} />

          <div className="bg-ti9-panel p-4 rounded-2xl mb-4 border border-ti9-accent/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-ti9-accent">
                Pinned Showcase
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {validPinnedIds.length}/3
              </span>
            </div>
            <AchievementShowcase pinnedIds={validPinnedIds} />
          </div>

          <div className="bg-ti9-panel p-4 rounded-2xl mb-5 border border-white/5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
              Most Drafted Lineup
            </h3>
            <FavoriteLineupGrid slots={topPlayers} />
          </div>

          <div className="flex bg-ti9-panel p-1 rounded-xl border border-white/5 mb-4">
            {(
              [
                { id: 'achievements', label: 'Achievements' },
                { id: 'daily', label: 'Daily Log' },
                { id: 'friends', label: `Friends (${profile.friends.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${
                  activeTab === tab.id
                    ? 'bg-ti9-accent text-ti9-dark shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <div className="bg-ti9-panel p-3.5 rounded-xl border border-ti9-accent/20">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="uppercase tracking-wider text-slate-300">Completion</span>
                  <span className="font-mono text-ti9-accent">
                    {unlockedCount} / {totalCount} ({progressPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-ti9-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ti9-teal to-ti9-accent transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORY_TABS.map((cat) => {
                  const catItems = ALL_ACHIEVEMENTS.filter((a) => a.category === cat.id);
                  const catUnlocked = catItems.filter((a) =>
                    profile.unlockedAchievements.includes(a.id)
                  ).length;
                  const isActive = achCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setAchCategory(cat.id)}
                      className={`py-2 px-1 rounded-lg border text-center transition ${
                        isActive
                          ? 'bg-ti9-accent/15 border-ti9-accent text-white'
                          : 'bg-ti9-panel/60 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{cat.label}</div>
                      <div className="text-[10px] font-mono opacity-75">
                        {catUnlocked}/{catItems.length}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                {filteredAchievements.map((ach) => {
                  const isUnlocked = profile.unlockedAchievements.includes(ach.id);
                  const isPinned = validPinnedIds.includes(ach.id);
                  const tier = TIER_STYLES[ach.tier];

                  return (
                    <div
                      key={ach.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                        isUnlocked
                          ? 'bg-ti9-panel border-white/10'
                          : 'bg-ti9-panel/40 border-white/5 opacity-45'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                          isUnlocked
                            ? tier.badge
                            : 'bg-ti9-dark border-white/10 text-slate-500'
                        }`}
                      >
                        <AchievementIcon icon={ach.icon} className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {ach.title}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded border ${tier.badge}`}
                          >
                            {tier.tag}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                          {ach.desc}
                        </div>
                      </div>

                      {isUnlocked && (
                        <button
                          onClick={() => togglePin(ach.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition border shrink-0 ${
                            isPinned
                              ? 'bg-ti9-accent text-ti9-dark border-ti9-accent'
                              : 'bg-ti9-dark/60 text-ti9-accent border-ti9-accent/40 hover:bg-ti9-accent/15'
                          }`}
                        >
                          {isPinned ? 'Pinned' : 'Pin'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-4">
              <div className="bg-ti9-panel p-4 rounded-xl border border-ti9-accent/20">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search player by nickname..."
                    value={searchNick}
                    onChange={(e) => setSearchNick(e.target.value)}
                    className="flex-1 bg-ti9-dark p-2.5 rounded-lg border border-ti9-accent/30 text-sm text-white outline-none focus:border-ti9-accent"
                  />
                  <button
                    onClick={handleSearchFriend}
                    className="bg-ti9-accent text-ti9-dark font-extrabold px-4 rounded-lg text-xs uppercase tracking-wider hover:bg-amber-400 transition"
                  >
                    Find
                  </button>
                </div>
                {searchError && <div className="text-rose-400 text-xs mt-2">{searchError}</div>}

                {searchResult && (
                  <div className="mt-3 p-3 bg-ti9-dark rounded-lg border border-ti9-accent/30 flex justify-between items-center">
                    <span className="font-bold text-sm">{searchResult.nickname}</span>
                    {profile.friends.some((f) => f.uid === searchResult.uid) ? (
                      <span className="text-xs text-slate-400">Already added</span>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(searchResult)}
                        className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-500"
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-ti9-panel rounded-xl border border-white/5 overflow-hidden">
                {profile.friends.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Your friends list is empty.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {profile.friends.map((friend) => (
                      <div
                        key={friend.uid}
                        className="p-3.5 flex justify-between items-center hover:bg-white/[0.02]"
                      >
                        <span className="font-bold text-sm">{friend.nickname}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewFriend(friend.uid)}
                            className="text-xs font-bold bg-ti9-dark border border-ti9-accent/30 text-ti9-accent px-2.5 py-1 rounded-lg hover:bg-ti9-accent hover:text-ti9-dark transition"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => handleRemoveFriend(friend.uid)}
                            className="text-xs text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg hover:bg-rose-950/40 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DAILY LOG TAB */}
          {activeTab === 'daily' && (
            <div className="space-y-3">
              {profile.dailyHistory.length === 0 ? (
                <div className="bg-ti9-panel p-6 text-center text-xs text-slate-400 rounded-xl border border-white/5">
                  No Daily Challenges played yet.
                </div>
              ) : (
                <>
                  {/* COMPACT SUMMARY BAR */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-ti9-panel px-3 py-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Played
                      </span>
                      <span className="font-mono font-black text-sm text-white">
                        {dailySummary.total}
                      </span>
                    </div>
                    <div className="bg-ti9-panel px-3 py-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Aegis
                      </span>
                      <span className="font-mono font-black text-sm text-ti9-accent">
                        {dailySummary.wins}
                      </span>
                    </div>
                    <div className="bg-ti9-panel px-3 py-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Tasks
                      </span>
                      <span className="font-mono font-black text-sm text-ti9-teal">
                        {dailySummary.tasks}
                      </span>
                    </div>
                  </div>

                  {/* COLLAPSIBLE MONTHS (NEWEST OPEN BY DEFAULT) */}
                  {Object.entries(
                    profile.dailyHistory.reduce((acc, record) => {
                      const parts = record.date.split('-');
                      const date =
                        parts.length === 3
                          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
                          : new Date(record.date);
                      const monthYear = date.toLocaleString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      });
                      const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(record);
                      return acc;
                    }, {} as Record<string, typeof profile.dailyHistory>)
                  )
                    .reverse()
                    .map(([month, records], monthIdx) => {
                      const isExpanded =
                        expandedMonths[month] !== undefined
                          ? expandedMonths[month]
                          : monthIdx === 0;
                      const monthWins = records.filter(
                        (r) => normalizePlacement(r.placement) === 'Champion'
                      ).length;

                      return (
                        <div
                          key={month}
                          className="bg-ti9-panel rounded-2xl overflow-hidden border border-white/5"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMonths((prev) => ({
                                ...prev,
                                [month]: !isExpanded,
                              }))
                            }
                            className="w-full bg-ti9-dark/60 hover:bg-ti9-dark/80 px-3.5 py-2.5 flex items-center justify-between transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[11px] uppercase tracking-widest text-ti9-accent">
                                {month}
                              </span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                                {records.length} {records.length === 1 ? 'run' : 'runs'}
                              </span>
                              {monthWins > 0 && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-ti9-accent/15 text-ti9-accent border border-ti9-accent/30">
                                  {monthWins}W
                                </span>
                              )}
                            </div>

                            <span
                              className={`text-[10px] text-slate-400 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : 'rotate-0'
                              }`}
                            >
                              ▼
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="divide-y divide-white/5 border-t border-white/5">
                              {[...records].reverse().map((record, i) => {
                                const placement = normalizePlacement(record.placement);
                                const isChamp = placement === 'Champion';
                                const badgeStyle = getPlacementBadgeStyle(placement);
                                const hasMetrics =
                                  (record.avgRating && record.avgRating > 0) ||
                                  (record.moneySaved !== undefined && record.moneySaved > 0);

                                return (
                                  <div
                                    key={i}
                                    className="px-3.5 py-2.5 flex items-center justify-between gap-2.5 hover:bg-white/[0.015] transition"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                                          {formatShortDay(record.date)}
                                        </span>
                                        <span className="font-bold text-xs text-white truncate">
                                          {record.themeTitle || 'Daily Challenge'}
                                        </span>
                                      </div>

                                      {hasMetrics && (
                                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                                          {record.avgRating && record.avgRating > 0 && (
                                            <span>OVR {record.avgRating}</span>
                                          )}
                                          {record.avgRating &&
                                            record.avgRating > 0 &&
                                            record.moneySaved !== undefined &&
                                            record.moneySaved > 0 && <span>·</span>}
                                          {record.moneySaved !== undefined &&
                                            record.moneySaved > 0 && (
                                              <span className="text-emerald-400/90">
                                                ${record.moneySaved} saved
                                              </span>
                                            )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {record.taskCompleted && (
                                        <span
                                          title="Extra task completed"
                                          className="w-6 h-6 rounded-lg bg-amber-400/15 border border-amber-400/35 text-amber-300 inline-flex items-center justify-center"
                                        >
                                          <AchievementIcon icon="star" className="w-3.5 h-3.5" />
                                        </span>
                                      )}

                                      <span
                                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${badgeStyle}`}
                                      >
                                        {isChamp && (
                                          <AchievementIcon icon="aegis" className="w-3 h-3" />
                                        )}
                                        <span>{placement}</span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </>
              )}
            </div>
          )}
        </>
      )}

      {viewingFriend && (
        <div
          onClick={() => setViewingFriend(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-ti9-dark w-full max-w-sm rounded-2xl border border-ti9-accent/60 p-5 relative max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <button
              onClick={() => setViewingFriend(null)}
              className="absolute top-3 right-4 text-xl text-slate-400 hover:text-white"
            >
              ×
            </button>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
              <div className="w-12 h-12 rounded-xl bg-ti9-panel border border-ti9-accent/50 flex items-center justify-center text-ti9-accent">
                <AchievementIcon icon="aegis" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{viewingFriend.nickname}</h3>
                <div className="text-[11px] font-mono text-slate-400">
                  Achievements: {viewingFriend.unlockedAchievements.length}/{totalCount}
                </div>
              </div>
            </div>

            <ProfileStatsGrid profile={viewingFriend} compact />

            <div className="mb-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-ti9-accent">
                Pinned Showcase
              </h4>
            </div>
            <AchievementShowcase pinnedIds={viewingFriend.pinnedAchievements} compact />

            <div className="mb-4">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                Most Drafted Lineup
              </h4>
              <FavoriteLineupGrid slots={friendTopPlayers} compact />
            </div>

            <button
              onClick={() => setViewingFriend(null)}
              className="w-full bg-ti9-panel py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-ti9-accent/30 hover:bg-ti9-accent hover:text-ti9-dark transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
