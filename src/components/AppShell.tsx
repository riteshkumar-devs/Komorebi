import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  ShieldCheck, 
  Pencil, 
  PlusCircle, 
  Brain, 
  Library, 
  Layers, 
  Trophy, 
  Award, 
  Gamepad2, 
  BookOpen, 
  Languages, 
  MessageSquare, 
  Bot, 
  CreditCard, 
  Settings as SettingsIcon,
  Layout,
  Search,
  Book,
  List,
  Plus,
  Calendar,
  BarChart2,
  HelpCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn, safeStorage, handleFirestoreError } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { useTTSContext } from '../context/TTSContext';
import { useQuoteAgent } from '../hooks/useQuoteAgent';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Vocabulary, OperationType } from '../types';

// Components
import { Dashboard } from './Dashboard';
import { Stats } from './Stats';
import { VocabEntry } from './VocabEntry';
import { VocabList } from './VocabList';
import { Flashcards } from './Flashcards';
import { Quiz } from './Quiz';
import { Dictionary } from './Dictionary';
import { Translator } from './Translator';
import { Phrasebook } from './Phrasebook';
import { WritingPractice } from './WritingPractice';
import { Games } from './Games';
import { Chatbot } from './Chatbot';
import { Notebook } from './Notebook';
import { Achievements } from './Achievements';
import { RankTest } from './RankTest';
import { Subscription } from './Subscription';
import { AdminPanel } from './AdminPanel';
import { FAQ } from './FAQ';
import { Settings } from './Settings';
import { OnboardingFlow } from './OnboardingFlow';
import { KanaInvaders } from './games/KanaInvaders';
import { WordSearch } from './WordSearch';
import { WeeklyStats } from './WeeklyStats';

interface AppShellProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  todayVocabCount: number;
  vocab: Vocabulary[];
  logout: () => void;
  streakWarning: boolean;
}

export const AppShell = ({ 
  activeTab, 
  setActiveTab, 
  todayVocabCount, 
  vocab, 
  logout, 
  streakWarning 
}: AppShellProps) => {
  const { profile, user, isDemo, setProfile } = useContext(AuthContext);
  const { quotes } = useQuoteAgent();
  const { quotaExhausted } = useTTSContext();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if (!profile || (!user && !isDemo)) return;

    const gameTabs = ['invaders', 'wordsearch', 'flashcards', 'quiz', 'kanaMatch', 'wordScramble', 'speedQuiz', 'listeningHero', 'flashcardSprint', 'kanjiQuiz', 'particleMaster', 'sentenceBuilder'];
    
    if (gameTabs.includes(activeTab)) {
      const interval = setInterval(async () => {
        try {
          const updates = { gameTimeToday: (profile?.gameTimeToday || 0) + 60 };
          if (isDemo) {
            const p = JSON.parse(safeStorage.getItem('komorebi_profile') || '{}');
            const updatedProfile = { ...p, ...updates };
            safeStorage.setItem('komorebi_profile', JSON.stringify(updatedProfile));
            setProfile(updatedProfile);
          } else if (user) {
            await updateDoc(doc(db, 'users', user.uid), updates);
          }
        } catch (e) {
          console.error("Error updating game time:", e);
        }
      }, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [activeTab, profile?.gameTimeToday, user, isDemo, setProfile]);
  
  const isNewUser = profile && !profile.onboardingCompleted;

  const unlocked = profile?.achievements || [];
  const claimed = profile?.claimedRewards || [];
  const hasUnclaimedRewards = unlocked.some(id => !claimed.includes(id));
  const isAdmin = profile?.role === 'admin' || profile?.email === "riteshkumar477823@gmail.com";

  const handleOnboardingComplete = async (data: any) => {
    const updates = { 
      displayName: data.name,
      dob: data.dob,
      careerGoal: data.careerGoal,
      dailyGoal: data.dailyGoal,
      onboardingCompleted: true
    };
    
    setProfile((prev: any) => prev ? { ...prev, ...updates } : null);

    try {
      if (isDemo) {
        const p = JSON.parse(safeStorage.getItem('komorebi_profile') || '{}');
        const updatedProfile = { ...p, ...updates };
        safeStorage.setItem('komorebi_profile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid), updates);
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error("Critical: Failed to save onboarding:", error);
      if (!isDemo && user) handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] dark:bg-[#1c1917] pb-20 md:pb-0 md:pl-56 transition-colors duration-300">
      <AnimatePresence>
        {isNewUser && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      </AnimatePresence>
      
      {/* Quota Warning */}
      {/* Page Loading Progress Bar (simulated for tab switch) */}
      <motion.div 
        key={activeTab}
        initial={{ width: "0%", opacity: 1 }}
        animate={{ width: "100%", opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed top-0 left-0 h-[3px] bg-[#f2a93b] z-[200] shadow-[0_0_15px_#f2a93b] neon-glow"
      />

      {/* Quota Warning */}
      <AnimatePresence>
        {quotaExhausted && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-orange-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-orange-500/20 backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">AI Voice Quota Reached</p>
                <p className="text-[10px] opacity-90">Automatically switched to Built-in voice for today.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Warning */}
      <AnimatePresence>
        {streakWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-red-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-red-500/20 backdrop-blur-md">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Streak in Danger!</p>
                <p className="text-[10px] opacity-90">Only a few hours left to hit your daily goal.</p>
              </div>
              <button 
                onClick={() => setActiveTab('vocab')}
                className="px-4 py-2 bg-white text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-all font-bold"
              >
                Study Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#1c1917] border-r border-stone-100 dark:border-stone-800 flex-col fixed inset-y-0 left-0 z-50 transition-colors duration-300">
          <div className="p-8 flex items-center gap-3 group/brand">
            <div className="w-10 h-10 bg-stone-900 dark:bg-[#f2a93b] rounded-xl flex items-center justify-center text-white dark:text-stone-900 font-bold shrink-0 text-xl shadow-lg group-hover/brand:scale-110 transition-transform">木</div>
            <div className="flex flex-col">
              <span className="font-editorial font-bold text-2xl tracking-tight text-stone-900 dark:text-stone-100 leading-none">Komorebi</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#f2a93b] mt-1">Japanese Language Platform</span>
            </div>
          </div>
        
        <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto pb-4 scrollbar-hide">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Main</div>
          {[
            { id: 'dashboard', icon: Flame, label: 'Home' },
            ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin' }] : []),
            { id: 'writingPractice', icon: Pencil, label: 'Writing' },
            { id: 'vocab', icon: PlusCircle, label: 'Add Word' },
            { id: 'quiz', icon: Brain, label: 'Test' },
          ].map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative duration-500",
                activeTab === item.id 
                  ? "text-white dark:text-stone-900" 
                  : "text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-all duration-500 relative z-10", 
                activeTab === item.id ? "neon-glow scale-110" : "group-hover:scale-110"
              )} />
              <span className="font-bold text-[10px] uppercase tracking-widest relative z-10">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabDesktop"
                  className="absolute inset-0 bg-stone-900 dark:bg-stone-100 rounded-xl -z-10 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(242,169,59,0.2)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}

          <div className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">More</div>
          {[
            { id: 'vocabList', icon: Library, label: 'Vocabulary' },
            { id: 'flashcards', icon: Layers, label: 'Review' },
            { id: 'rankTest', icon: Trophy, label: 'Rank Test' },
            { id: 'achievements', icon: Award, label: 'Achievements' },
            { id: 'game', icon: Gamepad2, label: 'Games' },
            { id: 'dictionary', icon: BookOpen, label: 'Dictionary' },
            { id: 'translator', icon: Languages, label: 'Translate' },
            { id: 'phrasebook', icon: MessageSquare, label: 'Phrases' },
            { id: 'chatbot', icon: (props: any) => (
              <img 
                {...props}
                src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" 
                className={cn(props.className, "object-contain brightness-0 invert opacity-40 group-hover:opacity-100 transition-opacity")} 
                alt="Sensei"
                referrerPolicy="no-referrer"
              />
            ), label: 'Sensei Chat' },
            { id: 'notebook', icon: BookOpen, label: 'Notebook' },
            { id: 'settings', icon: SettingsIcon, label: 'Settings' },
          ].map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 + 0.3 }}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
                activeTab === item.id 
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-lg shadow-stone-200 dark:shadow-none" 
                  : "text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100"
              )}
            >
              <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white dark:text-stone-900" : "text-stone-400 dark:text-stone-500 group-hover:text-stone-900 dark:group-hover:text-stone-100")} />
              <span className="font-medium text-xs tracking-wide">{item.label}</span>
              {item.id === 'achievements' && hasUnclaimedRewards && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-stone-900 animate-pulse" />
              )}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabDesktop"
                  className="absolute inset-0 bg-stone-900 dark:bg-stone-100 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100 dark:border-stone-800">
          <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#f2a93b] fill-[#f2a93b]" />
              <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-widest">Streak</span>
            </div>
            <span className="text-lg font-serif text-amber-900 dark:text-amber-100">{profile?.streakCount || 0} Days</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 px-2 py-3 flex justify-around items-center z-[100] shadow-2xl rounded-[2.5rem]">
        {[
          { id: 'dashboard', icon: Layout, label: 'Home' },
          { id: 'writingPractice', icon: Calendar, label: 'Writing' },
          { id: 'vocab', icon: Plus, label: 'Add', isCentral: true },
          { id: 'stats', icon: BarChart2, label: 'Stats' },
          { id: 'more', icon: List, label: 'More' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'more') {
                setShowMoreMenu(true);
              } else {
                setActiveTab(item.id as any);
                setShowMoreMenu(false);
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-all relative",
              item.isCentral 
                ? "bg-[#f2a93b] text-white p-4 rounded-full -mt-12 shadow-xl shadow-orange-200 font-bold" 
                : (activeTab === item.id ? "text-stone-900 dark:text-stone-100" : "text-stone-300 dark:text-stone-700")
            )}
          >
            <item.icon className={cn(item.isCentral ? "w-6 h-6" : "w-5 h-5")} />
            {!item.isCentral && <span className="text-[8px] font-bold uppercase tracking-tighter">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {showMoreMenu && (
          <div className="md:hidden fixed inset-0 z-[150] flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white dark:bg-stone-900 rounded-t-[3rem] p-8 pb-12 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-editorial text-stone-900 dark:text-stone-100">More Options</h3>
                <button onClick={() => setShowMoreMenu(false)} className="p-2 text-stone-400 dark:text-stone-500 font-bold">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <motion.div 
                initial="hidden"
                animate="visible"
                className="grid grid-cols-3 gap-4"
              >
                {[
                  { id: 'vocabList', icon: Library, label: 'Library' },
                  { id: 'flashcards', icon: Layers, label: 'Review' },
                  { id: 'rankTest', icon: Trophy, label: 'Rank Test' },
                  { id: 'achievements', icon: Award, label: 'Achievements' },
                  { id: 'game', icon: Gamepad2, label: 'Games' },
                  { id: 'dictionary', icon: Search, label: 'Dict' },
                  { id: 'translator', icon: Languages, label: 'Translate' },
                  { id: 'phrasebook', icon: Book, label: 'Phrases' },
                  { id: 'chatbot', icon: (props: any) => (
                    <img 
                      {...props}
                      src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" 
                      className={cn(props.className, "object-contain opacity-80 group-hover:opacity-100 group-hover:neon-glow transition-all")} 
                      alt="Sensei"
                      referrerPolicy="no-referrer"
                    />
                  ), label: 'Chat' },
                  { id: 'notebook', icon: List, label: 'Notes' },
                  { id: 'settings', icon: SettingsIcon, label: 'Settings' },
                ].map((item, i) => (
                  <motion.button
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, scale: 0.8, y: 10 },
                      visible: { 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transition: { delay: i * 0.03 } 
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setShowMoreMenu(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all relative font-bold",
                      activeTab === item.id 
                        ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900" 
                        : "bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 font-bold"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                    {item.id === 'achievements' && hasUnclaimedRewards && (
                      <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-stone-900 animate-pulse" />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="p-4 md:p-8 lg:p-10">
        <div className="max-w-5xl mx-auto">
          {/* Header for Mobile */}
          <div className="md:hidden flex flex-col gap-8 mb-10">
            <div className="flex items-start justify-between">
              {/* Logo Section */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-stone-900 dark:bg-stone-100 rounded-[1.25rem] flex items-center justify-center text-white dark:text-stone-900 text-3xl font-bold shadow-2xl shadow-stone-200/50 dark:shadow-none border border-stone-800 dark:border-stone-200">木</div>
              <div className="flex flex-col">
                <span className="font-editorial text-3xl tracking-tight text-stone-900 dark:text-stone-100 leading-none">Komorebi</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#f2a93b] mt-1">Japanese Language Platform</span>
              </div>
              </div>

              {/* Right Side: Profile & Actions */}
              <div className="flex flex-col items-end gap-4">
                {/* Profile Pic on Top */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('settings')}
                  className="w-14 h-14 rounded-[1.25rem] border-2 border-white dark:border-stone-800 shadow-xl overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 cursor-pointer ring-4 ring-stone-50 dark:ring-stone-900/50"
                >
                  {profile?.avatar?.startsWith('data:image') ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{profile?.avatar || '🦊'}</span>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.98 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="w-full"
            >
              {activeTab === 'dashboard' && <Dashboard vocabCount={todayVocabCount} vocab={vocab} logout={logout} setActiveTab={setActiveTab} />}
              {activeTab === 'stats' && <Stats todayVocabCount={todayVocabCount} />}
              {activeTab === 'weeklyStats' && <WeeklyStats vocab={vocab} profile={profile} onBack={() => setActiveTab('dashboard')} />}
              {activeTab === 'vocab' && <VocabEntry vocab={vocab} />}
              {activeTab === 'vocabList' && <VocabList vocab={vocab} />}
              {activeTab === 'flashcards' && <Flashcards vocab={vocab} />}
              {activeTab === 'quiz' && <Quiz vocab={vocab} />}
              {activeTab === 'dictionary' && <Dictionary vocab={vocab} />}
              {activeTab === 'translator' && <Translator />}
              {activeTab === 'phrasebook' && <Phrasebook />}
              {activeTab === 'writingPractice' && <WritingPractice />}
              {activeTab === 'game' && <Games vocab={vocab} onSelectGame={(id) => setActiveTab(id)} />}
              {activeTab === 'invaders' && <KanaInvaders onBack={() => setActiveTab('game')} />}
              {activeTab === 'wordsearch' && <WordSearch onBack={() => setActiveTab('game')} />}
              {activeTab === 'chatbot' && <Chatbot />}
              {activeTab === 'notebook' && <Notebook />}
              {activeTab === 'achievements' && <Achievements />}
              {activeTab === 'rankTest' && <RankTest vocab={vocab} />}
              {activeTab === 'subscription' && <Subscription />}
              {activeTab === 'admin' && <AdminPanel />}
              {activeTab === 'faq' && <FAQ />}
              {activeTab === 'settings' && <Settings vocab={vocab} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
