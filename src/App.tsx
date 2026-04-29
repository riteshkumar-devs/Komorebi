import React, { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  Timestamp,
  query,
  collection,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Vocabulary, OperationType } from './types';
import { 
  safeStorage, 
  handleFirestoreError, 
  generateCustomId,
  isToday,
  isYesterday,
  getSafeDate,
  checkAchievements,
  applyThemeToElement
} from './lib/utils';
import { AuthContext } from './context/AuthContext';
import { TTSProvider } from './context/TTSContext';
import { useSound } from './hooks/useSound';

// Components
import { Login } from './components/Login';
import { AppShell } from './components/AppShell';
import { UsageLimitModal } from './components/UsageLimitModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [vocab, setVocab] = useState<Vocabulary[]>([]);
  const [isDemo, setIsDemo] = useState(() => safeStorage.getItem('komorebi_demo') === 'true');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vocab' | 'vocabList' | 'flashcards' | 'quiz' | 'dictionary' | 'translator' | 'phrasebook' | 'writingPractice' | 'game' | 'stats' | 'chatbot' | 'notebook' | 'achievements' | 'rankTest' | 'subscription' | 'admin' | 'faq' | 'settings' | 'weeklyStats'>('dashboard');
  const [todayVocabCount, setTodayVocabCount] = useState(0);
  const [streakWarning, setStreakWarning] = useState(false);
  const [usageModal, setUsageModal] = useState<{ isOpen: boolean; type: 'dictionary' | 'translation' | 'chat' }>({ isOpen: false, type: 'dictionary' });
  const [discoveredWords, setDiscoveredWords] = useState<any[]>([]);

  // Apply theme immediately
  useEffect(() => {
    const currentTheme = profile?.theme || (safeStorage.getItem('komorebi_theme') as any) || 'system';
    applyThemeToElement(currentTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if ((profile?.theme || safeStorage.getItem('komorebi_theme') || 'system') === 'system') {
        applyThemeToElement('system');
      }
    };
    
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [profile?.theme]);

  // Auth Listener
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsDemo(false);
        const userRef = doc(db, 'users', u.uid);
        
        // Listen for profile changes
        unsubProfile = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            // Initialize if new
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || 'Learner',
              avatar: '🦊',
              streakCount: 0,
              xp: 0,
              rank: 'E5',
              totalWords: 0,
              achievements: [],
              dailyGoal: 10,
              onboardingCompleted: false,
              joinedAt: Timestamp.now(),
              lastActive: Timestamp.now(),
              lastActiveDate: Timestamp.now(),
              dailyGoalMet: false,
              customId: generateCustomId(),
              isPremium: false,
              notificationsEnabled: true
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        });
      } else {
        if (unsubProfile) unsubProfile();
        if (!isDemo) {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, [isDemo]);

  // Data synchronization
  useEffect(() => {
    const syncDemoData = () => {
      if (isDemo && !user) {
        const p = JSON.parse(safeStorage.getItem('komorebi_profile') || 'null');
        if (p) {
          setProfile({
            ...p,
            joinedAt: p.joinedAt?.seconds ? new Timestamp(p.joinedAt.seconds, p.joinedAt.nanoseconds) : Timestamp.now(),
            lastActive: p.lastActive?.seconds ? new Timestamp(p.lastActive.seconds, p.lastActive.nanoseconds) : Timestamp.now()
          });
        }
        
        const v = JSON.parse(safeStorage.getItem('komorebi_vocab') || '[]');
        const parsedVocab = v.map((item: any) => ({
          ...item,
          createdAt: item.createdAt?.seconds ? new Timestamp(item.createdAt.seconds, item.createdAt.nanoseconds) : Timestamp.now()
        }));
        setVocab(parsedVocab);
        setTodayVocabCount(parsedVocab.filter((v: any) => isToday(getSafeDate(v.createdAt))).length);

        const d = JSON.parse(safeStorage.getItem('discovered_words') || '[]');
        setDiscoveredWords(d);
      }
    };

    if (isDemo && !user) {
      syncDemoData();
      window.addEventListener('vocab_update', syncDemoData);
      window.addEventListener('profile_update', syncDemoData);
      return () => {
        window.removeEventListener('vocab_update', syncDemoData);
        window.removeEventListener('profile_update', syncDemoData);
      };
    } else if (user) {
      const q = query(collection(db, 'users', user.uid, 'vocabularies'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vocabulary));
        setVocab(list);
        setTodayVocabCount(list.filter(v => isToday(getSafeDate(v.createdAt))).length);
      });

      const dq = query(collection(db, 'users', user.uid, 'discovered_words'), orderBy('createdAt', 'desc'));
      const dUnsubscribe = onSnapshot(dq, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setDiscoveredWords(list);
      });

      return () => {
        unsubscribe();
        dUnsubscribe();
      };
    }
  }, [user, isDemo]);

  // Streak Maintenance (Day Rollover)
  useEffect(() => {
    if (!profile || (!user && !isDemo)) return;
    
    const maintenance = async () => {
      const lastActive = getSafeDate(profile.lastActiveDate);
      if (isToday(lastActive)) return; 

      const updates: any = { 
        lastActiveDate: Timestamp.now(), 
        dailyGoalMet: false 
      };

      const yesterday = isYesterday(lastActive);
      if (!yesterday || !profile.dailyGoalMet) {
          if (profile.streakCount > 0) {
            updates.streakCount = 0;
          }
      }

      if (isDemo) {
        const p = { ...profile, ...updates };
        setProfile(p);
        safeStorage.setItem('komorebi_profile', JSON.stringify(p));
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid), updates);
      }
    };

    maintenance();
  }, [profile?.uid, user, isDemo]);

  // Streak/Achievement logic
  useEffect(() => {
    if (!profile || (!user && !isDemo)) return;

    const checkGoalsAndAchievements = async () => {
      const updates: any = {};
      
      // Goal logic
      const goal = profile.dailyGoal || 10;
      
      // Update total words if it changed
      if (profile.totalWords !== vocab.length) {
        updates.totalWords = vocab.length;
      }

      if (todayVocabCount >= goal && !profile.dailyGoalMet) {
        updates.dailyGoalMet = true;
        updates.streakCount = (profile.streakCount || 0) + 1;
        updates.xp = (profile.xp || 0) + 50;
        updates.lastActiveDate = Timestamp.now();
      }

      // Achievement logic
      const newAchievements = checkAchievements(profile, vocab.length, 0, 0); // notes/chats stats can be added
      if (newAchievements) {
        updates.achievements = newAchievements;
      }

      if (Object.keys(updates).length > 0) {
        if (isDemo) {
          const updatedProfile = { ...profile, ...updates };
          setProfile(updatedProfile);
          safeStorage.setItem('komorebi_profile', JSON.stringify(updatedProfile));
        } else if (user) {
          await updateDoc(doc(db, 'users', user.uid), updates);
        }
      }
    };

    checkGoalsAndAchievements();
  }, [todayVocabCount, vocab.length]);

  // Streak warning
  useEffect(() => {
    if (!profile || !profile.notificationsEnabled || profile.dailyGoalMet) return;
    
    const checkStreak = () => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const hoursLeft = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
      setStreakWarning(hoursLeft <= 4 && hoursLeft > 0);
    };

    checkStreak();
    const interval = setInterval(checkStreak, 600000); // 10 mins
    return () => clearInterval(interval);
  }, [profile?.dailyGoalMet, profile?.notificationsEnabled]);

  const handleSetActiveTab = useCallback((tab: any) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  }, []);

  const checkUsageLimit = (type: 'dictionary' | 'translation' | 'chat') => {
    if (profile?.isPremium) return true;
    const settings = profile?.apiSettings;
    const hasKey = settings?.mode === 'particular' 
      ? settings?.structuredKeys?.[type === 'chat' ? 'sensei' : type]?.length > 0
      : settings?.structuredKeys?.universal?.length > 0;
    
    if (hasKey) return true;

    const limits = profile?.usageLimits || {};
    const today = new Date().toISOString().split('T')[0];
    const usage = limits[today]?.[type] || 0;
    const max = type === 'chat' ? 5 : 10;

    if (usage >= max) {
      setUsageModal({ isOpen: true, type });
      return false;
    }
    return true;
  };

  const incrementUsage = async (type: 'dictionary' | 'translation' | 'chat') => {
    if (profile?.isPremium) return;
    const today = new Date().toISOString().split('T')[0];
    const limits = { ...(profile?.usageLimits || {}) };
    if (!limits[today]) limits[today] = {};
    limits[today][type] = (limits[today][type] || 0) + 1;

    if (isDemo) {
      const updatedProfile = { ...profile!, usageLimits: limits };
      setProfile(updatedProfile);
      safeStorage.setItem('komorebi_profile', JSON.stringify(updatedProfile));
    } else if (user) {
      await updateDoc(doc(db, 'users', user.uid), { usageLimits: limits });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsDemo(false);
    safeStorage.removeItem('komorebi_demo');
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      setProfile, 
      loading, 
      signIn: async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
        setIsDemo(false);
        safeStorage.removeItem('komorebi_demo');
      }, 
      logout, 
      setDemoMode: (val: boolean) => {
        setIsDemo(val);
        if (val) safeStorage.setItem('komorebi_demo', 'true');
        else safeStorage.removeItem('komorebi_demo');
      }, 
      isDemo, 
      vocab, 
      discoveredWords,
      setDiscoveredWords,
      setActiveTab: handleSetActiveTab,
      checkUsageLimit,
      incrementUsage
    }}>
      <TTSProvider>
        <ErrorBoundary>
          {!user && !isDemo ? (
            <Login />
          ) : (
            <>
              <AppShell 
                activeTab={activeTab} 
                setActiveTab={handleSetActiveTab} 
                todayVocabCount={todayVocabCount} 
                vocab={vocab} 
                logout={logout} 
                streakWarning={streakWarning} 
              />
              <UsageLimitModal 
                isOpen={usageModal.isOpen} 
                onClose={() => setUsageModal({ ...usageModal, isOpen: false })} 
                type={usageModal.type} 
              />
            </>
          )}
        </ErrorBoundary>
      </TTSProvider>
    </AuthContext.Provider>
  );
}
