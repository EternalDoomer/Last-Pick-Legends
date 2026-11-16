import { useState, useMemo, useEffect } from 'react';
import { 
  getProfile, saveProfile, registerUser, loginUser, logoutUser,
  searchUserByNickname, addFriendToProfile, removeFriendFromProfile, getFriendProfileById 
} from '../utils/storage';
import type { UserProfile, Friend } from '../utils/storage';
import { ALL_ACHIEVEMENTS } from '../utils/achievements';
import rawPlayers from '../data/players.json';
import type { Player, Position } from '../types';
import { auth } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { translations } from '../utils/i18n';

const getTimesWord = (count: number) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'раз';
  if (lastDigit === 1) return 'раз';
  if (lastDigit >= 2 && lastDigit <= 4) return 'раза';
  return 'раз';
};

export default function Profile({ onBack, lang }: { onBack: () => void; lang: 'ru' | 'en' }) {
  const t = translations[lang];
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth.currentUser);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [formData, setFormData] = useState({ nickname: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'daily' | 'friends'>('achievements');
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [searchNick, setSearchNick] = useState('');
  const [searchResult, setSearchResult] = useState<Friend | null>(null);
  const [searchError, setSearchError] = useState('');
  const [viewingFriend, setViewingFriend] = useState<UserProfile | null>(null);

  const players = rawPlayers as Player[];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setProfile(getProfile());
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
        if (!formData.nickname) throw new Error(lang === 'ru' ? "Введите никнейм" : "Enter nickname");
        await registerUser(formData.email, formData.password, formData.nickname);
      }
      setProfile(getProfile());
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setErrorMsg(lang === 'ru' ? 'Этот Email уже используется' : 'Email already in use');
      else if (err.code === 'auth/wrong-password') setErrorMsg(lang === 'ru' ? 'Неверный пароль' : 'Wrong password');
      else if (err.code === 'auth/user-not-found') setErrorMsg(lang === 'ru' ? 'Пользователь не найден' : 'User not found');
      else if (err.code === 'auth/weak-password') setErrorMsg(lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : 'Password must be at least 6 characters');
      else setErrorMsg(err.message || (lang === 'ru' ? 'Ошибка авторизации' : 'Auth error'));
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
      setSearchError(lang === 'ru' ? 'Это ваш никнейм' : 'This is your nickname');
      return;
    }

    const found = await searchUserByNickname(searchNick.trim());
    if (found) {
      setSearchResult(found);
    } else {
      setSearchError(t.userNotFound);
    }
  };

  const handleAddFriend = async (friend: Friend) => {
    await addFriendToProfile(friend);
    setProfile(getProfile());
    setSearchResult(null);
    setSearchNick('');
  };

  const handleRemoveFriend = async (uid: string) => {
    if (confirm(lang === 'ru' ? 'Удалить из друзей?' : 'Remove friend?')) {
      await removeFriendFromProfile(uid);
      setProfile(getProfile());
    }
  };

  const handleViewFriend = async (uid: string) => {
    const friendProfile = await getFriendProfileById(uid);
    if (friendProfile) {
      setViewingFriend(friendProfile);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // 🔥 ВОЗВРАЩЕННЫЙ БЛОК ЛЮБИМЫХ ИГРОКОВ
  const topPlayers = useMemo(() => {
    const allSelected = Object.entries(profile.favoritePlayers)
      .map(([id, count]) => ({ player: players.find(p => p.id === id), count }))
      .filter(item => item.player !== undefined)
      .sort((a, b) => b.count - a.count);

    const slots: ({ player: Player | undefined; count: number } | null)[] = [null, null, null, null, null];
    for (const item of allSelected) {
      if (!item.player) continue;
      for (let i = 0; i < 5; i++) {
        if (slots[i] === null && item.player.positions.includes((i + 1) as Position)) {
          slots[i] = item;
          break;
        }
      }
    }
    return slots;
  }, [profile.favoritePlayers, players]);

  const togglePin = (id: string) => {
    let newPinned = [...profile.pinnedAchievements];
    if (newPinned.includes(id)) {
      newPinned = newPinned.filter(p => p !== id);
    } else {
      if (newPinned.length >= 3) {
        alert(lang === 'ru' ? 'Можно закрепить не более 3 достижений!' : 'You can pin up to 3 achievements!');
        return;
      }
      newPinned.push(id);
    }
    const newProfile = { ...profile, pinnedAchievements: newPinned };
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const groupedAchievements = useMemo(() => {
    const groups: Record<string, typeof ALL_ACHIEVEMENTS> = { matches: [], wins: [], daily: [], special: [] };
    ALL_ACHIEVEMENTS.forEach(a => groups[a.category].push(a));
    return groups;
  }, []);

  const categoryNames = {
    matches: lang === 'ru' ? 'Количество матчей' : 'Matches played',
    wins: lang === 'ru' ? 'Победы в турнирах' : 'Tournament wins',
    daily: lang === 'ru' ? 'Ежедневные испытания' : 'Daily challenges',
    special: lang === 'ru' ? 'Особые' : 'Special'
  };

  const totalUnlocked = profile.unlockedAchievements.length;
  const totalAch = ALL_ACHIEVEMENTS.length;

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-ti9-accent hover:underline font-bold">← {t.back}</button>
        <h2 className="text-xl font-bold">{t.profile}</h2>
        <div className="w-16"></div>
      </div>
      
      {!isLoggedIn ? (
        <div className="bg-ti9-panel p-6 rounded-xl border border-ti9-accent/20 mb-4 max-w-sm mx-auto">
          <h2 className="text-xl font-bold mb-4 text-center">
            {isLoginMode ? (lang === 'ru' ? 'Вход в аккаунт' : 'Login') : (lang === 'ru' ? 'Регистрация' : 'Register')}
          </h2>
          {errorMsg && <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm p-2 rounded mb-3">{errorMsg}</div>}
          <div className="space-y-3">
            {!isLoginMode && (
              <input type="text" placeholder={lang === 'ru' ? "Никнейм" : "Nickname"} value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full bg-ti9-dark p-2 rounded border border-ti9-accent/30 text-white outline-none" />
            )}
            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-ti9-dark p-2 rounded border border-ti9-accent/30 text-white outline-none" />
            <input type="password" placeholder={lang === 'ru' ? "Пароль" : "Password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-ti9-dark p-2 rounded border border-ti9-accent/30 text-white outline-none" />
            <button onClick={handleAuthAction} disabled={loading} className="w-full bg-ti9-accent text-ti9-dark font-bold py-2 rounded hover:bg-amber-400 transition">
              {loading ? '...' : (isLoginMode ? (lang === 'ru' ? 'Войти' : 'Login') : (lang === 'ru' ? 'Зарегистрироваться' : 'Register'))}
            </button>
          </div>
          <div className="text-center mt-4">
            <button onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }} className="text-sm text-ti9-teal hover:underline">
              {isLoginMode ? (lang === 'ru' ? 'Нет аккаунта? Зарегистрируйтесь' : 'No account? Register') : (lang === 'ru' ? 'Уже есть аккаунт? Войти' : 'Have an account? Login')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-ti9-panel p-6 rounded-xl border border-ti9-accent/20 mb-4 text-center">
            <div className="w-20 h-20 bg-ti9-dark rounded-full mx-auto mb-3 flex items-center justify-center text-3xl border-2 border-ti9-accent">👤</div>
            <h2 className="text-2xl font-bold mb-1">{profile.nickname}</h2>
            <div className="text-xs opacity-50 mb-3">{profile.email}</div>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:underline">{lang === 'ru' ? 'Выйти' : 'Logout'}</button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-ti9-panel p-2 rounded-lg text-center border border-ti9-accent/10">
              <div className="text-ti9-teal font-bold text-lg md:text-xl">{profile.matchesPlayed}</div>
              <div className="text-[10px] md:text-xs opacity-70 leading-tight">{lang === 'ru' ? 'Матчей' : 'Matches'}</div>
            </div>
            <div className="bg-ti9-panel p-2 rounded-lg text-center border border-ti9-accent/10">
              <div className="text-ti9-accent font-bold text-lg md:text-xl">{profile.wins}</div>
              <div className="text-[10px] md:text-xs opacity-70 leading-tight">{lang === 'ru' ? 'Побед' : 'Wins'}</div>
            </div>
            <div className="bg-ti9-panel p-2 rounded-lg text-center border border-ti9-accent/10">
              <div className="text-purple-400 font-bold text-lg md:text-xl">{profile.memoryWins || 0}</div>
              <div className="text-[10px] md:text-xs opacity-70 leading-tight">{lang === 'ru' ? 'По памяти' : 'Memory W'}</div>
            </div>
            <div className="bg-ti9-panel p-2 rounded-lg text-center border border-ti9-accent/10">
              <div className="text-blue-400 font-bold text-lg md:text-xl">{profile.dailyWins || 0}</div>
              <div className="text-[10px] md:text-xs opacity-70 leading-tight">{lang === 'ru' ? 'Ежедневные' : 'Daily W'}</div>
            </div>
          </div>

          <div className="bg-ti9-panel p-4 rounded-xl mb-6 border border-ti9-accent/10 text-center">
            <h3 className="font-bold mb-3 text-ti9-accent text-sm uppercase tracking-wider">
              {lang === 'ru' ? 'Витрина достижений' : 'Achievement Showcase'}
            </h3>
            <div className="flex gap-4 justify-center">
              {[0, 1, 2].map(i => {
                const achId = profile.pinnedAchievements[i];
                const ach = ALL_ACHIEVEMENTS.find(a => a.id === achId);
                return (
                  <div key={i} className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition ${
                    ach ? 'bg-ti9-accent/20 border-ti9-accent' : 'bg-ti9-dark border-dashed border-ti9-accent/30'
                  }`}>
                    {ach ? <span className="text-2xl">{ach.icon}</span> : <span className="text-xs opacity-30">{lang === 'ru' ? 'Пусто' : 'Empty'}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🔥 ВОЗВРАЩЕННЫЙ БЛОК ТОП-5 ИГРОКОВ */}
          <div className="bg-ti9-panel p-4 rounded-xl mb-6 border border-ti9-accent/10">
            <h3 className="font-bold mb-3 text-ti9-accent">{lang === 'ru' ? 'Ваши любимые игроки' : 'Your favorite players'}</h3>
            {topPlayers.every(p => p === null) ? (
              <p className="text-sm opacity-50">{lang === 'ru' ? 'Вы пока никого не выбрали. Сыграйте драфт!' : 'No players selected yet. Play a draft!'}</p>
            ) : (
              <div className="flex justify-between gap-1">
                {topPlayers.map((found, index) => {
                  const pos = index + 1;
                  return (
                    <div key={pos} className="bg-ti9-dark p-2 rounded text-center flex-1 border border-ti9-accent/10 relative">
                      <div className="text-[10px] text-ti9-teal mb-1">{lang === 'ru' ? 'ПОЗ' : 'POS'} {pos}</div>
                      {found ? (
                        <>
                          <div className="font-bold text-xs truncate">{found.player?.nickname}</div>
                          <div className="text-[10px] text-ti9-accent">
                            {found.count} {lang === 'ru' ? getTimesWord(found.count) : 'times'}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs opacity-30 py-2">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('achievements')} className={`flex-1 py-2 rounded font-bold text-xs transition ${activeTab === 'achievements' ? 'bg-ti9-accent text-ti9-dark' : 'bg-ti9-panel hover:bg-ti9-panel/80'}`}>{lang === 'ru' ? 'Достижения' : 'Achievements'}</button>
            <button onClick={() => setActiveTab('daily')} className={`flex-1 py-2 rounded font-bold text-xs transition ${activeTab === 'daily' ? 'bg-ti9-accent text-ti9-dark' : 'bg-ti9-panel hover:bg-ti9-panel/80'}`}>{lang === 'ru' ? 'История' : 'History'}</button>
            <button onClick={() => setActiveTab('friends')} className={`flex-1 py-2 rounded font-bold text-xs transition ${activeTab === 'friends' ? 'bg-ti9-accent text-ti9-dark' : 'bg-ti9-panel hover:bg-ti9-panel/80'}`}>{t.friends} ({profile.friends.length})</button>
          </div>

          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <div className="bg-ti9-panel p-3 rounded-lg border border-ti9-accent/20 flex justify-between items-center text-sm font-bold shadow-md">
                <span>{lang === 'ru' ? 'Открыто:' : 'Unlocked:'}</span>
                <span className="text-ti9-accent">{totalUnlocked} <span className="text-slate-500 text-xs">/ {totalAch}</span></span>
              </div>
              {Object.entries(groupedAchievements).map(([category, achs]) => {
                if (achs.length === 0) return null;
                const isExpanded = !!expandedCategories[category];
                const unlockedInCat = achs.filter(a => profile.unlockedAchievements.includes(a.id)).length;
                return (
                  <div key={category} className="bg-ti9-panel rounded-xl overflow-hidden border border-ti9-accent/10">
                    <button onClick={() => toggleCategory(category)} className="w-full bg-ti9-dark/50 p-3 flex justify-between items-center hover:bg-ti9-dark/80 transition">
                      <div className="font-bold text-sm text-ti9-accent flex items-center gap-2">
                        {categoryNames[category as keyof typeof categoryNames]}
                        <span className="text-[10px] bg-ti9-dark px-2 py-0.5 rounded-full opacity-70 border border-ti9-accent/20">{unlockedInCat} / {achs.length}</span>
                      </div>
                      <span className={`text-xs transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                    </button>
                    {isExpanded && (
                      <div className="p-2 space-y-2 border-t border-ti9-accent/10">
                        {achs.map(ach => {
                          const isUnlocked = profile.unlockedAchievements.includes(ach.id);
                          const isPinned = profile.pinnedAchievements.includes(ach.id);
                          return (
                            <div key={ach.id} className={`flex items-center gap-3 p-2 rounded transition ${isUnlocked ? 'bg-ti9-dark/40' : 'opacity-40 grayscale'}`}>
                              <div className="text-2xl w-10 text-center">{ach.icon}</div>
                              <div className="flex-1">
                                <div className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>{ach.title[lang]}</div>
                                <div className="text-xs text-slate-400">{ach.desc[lang]}</div>
                              </div>
                              {isUnlocked && (
                                <button onClick={() => togglePin(ach.id)} className={`px-3 py-1 rounded text-xs font-bold transition border ${isPinned ? 'bg-ti9-accent text-ti9-dark border-ti9-accent' : 'bg-transparent text-ti9-accent border-ti9-accent/50 hover:bg-ti9-accent/10'}`}>
                                  {isPinned ? (lang === 'ru' ? 'Закреплено' : 'Pinned') : (lang === 'ru' ? 'Закрепить' : 'Pin')}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-4">
              <div className="bg-ti9-panel p-4 rounded-xl border border-ti9-accent/20">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t.searchFriend} 
                    value={searchNick} 
                    onChange={e => setSearchNick(e.target.value)}
                    className="flex-1 bg-ti9-dark p-2 rounded border border-ti9-accent/30 text-white outline-none"
                  />
                  <button onClick={handleSearchFriend} className="bg-ti9-accent text-ti9-dark font-bold px-4 rounded hover:bg-amber-400 transition">
                    {t.add}
                  </button>
                </div>
                {searchError && <div className="text-red-400 text-xs mt-2">{searchError}</div>}
                
                {searchResult && (
                  <div className="mt-4 p-3 bg-ti9-dark rounded border border-ti9-accent/30 flex justify-between items-center">
                    <span className="font-bold">{searchResult.nickname}</span>
                    {profile.friends.some(f => f.uid === searchResult.uid) ? (
                      <span className="text-xs text-slate-400">{t.alreadyFriend}</span>
                    ) : (
                      <button onClick={() => handleAddFriend(searchResult)} className="bg-green-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-green-500">
                        {t.add}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-ti9-panel rounded-xl border border-ti9-accent/20 overflow-hidden">
                {profile.friends.length === 0 ? (
                  <div className="p-6 text-center text-sm opacity-50">{lang === 'ru' ? 'У вас пока нет друзей.' : 'You have no friends yet.'}</div>
                ) : (
                  <div className="divide-y divide-ti9-accent/10">
                    {profile.friends.map(friend => (
                      <div key={friend.uid} className="p-3 flex justify-between items-center bg-ti9-dark/20">
                        <span className="font-bold">{friend.nickname}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleViewFriend(friend.uid)} className="text-xs bg-ti9-panel border border-ti9-accent/30 px-2 py-1 rounded hover:bg-ti9-accent hover:text-ti9-dark transition">
                            {t.viewProfile}
                          </button>
                          <button onClick={() => handleRemoveFriend(friend.uid)} className="text-xs text-red-400 border border-red-900 px-2 py-1 rounded hover:bg-red-900/30 transition">
                            {t.remove}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'daily' && (
            <div className="space-y-4">
              {profile.dailyHistory.length === 0 ? (
                <div className="bg-ti9-panel p-6 text-center text-sm opacity-50 rounded-xl border border-ti9-accent/10">{lang === 'ru' ? 'Вы еще не проходили испытания.' : 'You haven\'t completed any challenges yet.'}</div>
              ) : (
                Object.entries(profile.dailyHistory.reduce((acc, record) => {
                  const date = new Date(record.date);
                  const monthYear = date.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' });
                  const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(record);
                  return acc;
                }, {} as Record<string, typeof profile.dailyHistory>)).map(([month, records]) => (
                  <div key={month} className="bg-ti9-panel rounded-xl overflow-hidden border border-ti9-accent/10">
                    <div className="bg-ti9-dark/50 p-3 font-bold text-sm text-ti9-accent">{month}</div>
                    <div className="divide-y divide-ti9-accent/10">
                      {records.reverse().map((record, i) => (
                        <div key={i} className="p-3 flex justify-between items-center text-sm">
                          <div>
                            <div className="font-bold">{record.date}</div>
                            <div className="text-xs opacity-60">{lang === 'ru' ? 'Результат' : 'Result'}: {record.placement}</div>
                          </div>
                          {record.taskCompleted ? <span className="text-lg" title="Task completed">👁️</span> : <span className="text-xs text-slate-500">{lang === 'ru' ? 'Без задания' : 'No task'}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {viewingFriend && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-ti9-dark w-full max-w-sm rounded-xl border border-ti9-accent p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setViewingFriend(null)} className="absolute top-2 right-4 text-2xl text-slate-400 hover:text-white">&times;</button>
            
            <div className="text-center mb-6 border-b border-ti9-accent/20 pb-4">
              <div className="w-16 h-16 bg-ti9-panel rounded-full mx-auto mb-2 flex items-center justify-center text-2xl border border-ti9-accent/50">👤</div>
              <h3 className="text-xl font-bold text-ti9-accent">{viewingFriend.nickname}</h3>
            </div>

            <div className="grid grid-cols-4 gap-1 mb-6">
              <div className="bg-ti9-panel p-2 rounded text-center">
                <div className="text-ti9-teal font-bold text-sm md:text-base">{viewingFriend.matchesPlayed}</div>
                <div className="text-[9px] opacity-60">{lang === 'ru' ? 'Матчей' : 'Matches'}</div>
              </div>
              <div className="bg-ti9-panel p-2 rounded text-center">
                <div className="text-ti9-accent font-bold text-sm md:text-base">{viewingFriend.wins}</div>
                <div className="text-[9px] opacity-60">{lang === 'ru' ? 'Побед' : 'Wins'}</div>
              </div>
              <div className="bg-ti9-panel p-2 rounded text-center">
                <div className="text-purple-400 font-bold text-sm md:text-base">{viewingFriend.memoryWins || 0}</div>
                <div className="text-[9px] opacity-60">{lang === 'ru' ? 'По памяти' : 'Memory W'}</div>
              </div>
              <div className="bg-ti9-panel p-2 rounded text-center">
                <div className="text-blue-400 font-bold text-sm md:text-base">{viewingFriend.dailyWins || 0}</div>
                <div className="text-[9px] opacity-60">{lang === 'ru' ? 'Ежедневные' : 'Daily W'}</div>
              </div>
            </div>

            <h4 className="text-sm font-bold text-ti9-accent mb-2">{lang === 'ru' ? 'Витрина достижений' : 'Achievements Showcase'}</h4>
            <div className="flex gap-2 justify-center mb-6">
              {[0, 1, 2].map(i => {
                const achId = viewingFriend.pinnedAchievements[i];
                const ach = ALL_ACHIEVEMENTS.find(a => a.id === achId);
                return (
                  <div key={i} className={`w-12 h-12 rounded-lg border flex items-center justify-center ${ach ? 'bg-ti9-accent/20 border-ti9-accent' : 'bg-ti9-panel border-dashed border-ti9-accent/30'}`}>
                    {ach ? <span className="text-xl" title={ach.title[lang]}>{ach.icon}</span> : <span className="text-[10px] opacity-30">-</span>}
                  </div>
                );
              })}
            </div>

            <button onClick={() => setViewingFriend(null)} className="w-full bg-ti9-panel py-2 rounded font-bold border border-ti9-accent/30 hover:bg-ti9-accent hover:text-ti9-dark transition">
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}