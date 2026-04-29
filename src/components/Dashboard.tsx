import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  Library, 
  Brain, 
  Flame, 
  BookOpen, 
  Search, 
  Gamepad2, 
  Languages, 
  Trophy, 
  Award,
  Zap,
  TrendingUp,
  Layers, 
  Pencil,
  Bookmark,
  Lock
} from 'lucide-react';
import { cn, safeStorage } from '../lib/utils';
import { format } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import { useTTSContext } from '../context/TTSContext';
import { useSound } from '../hooks/useSound';
import { useQuoteAgent } from '../hooks/useQuoteAgent';
import { Vocabulary } from '../types';
import { ACHIEVEMENTS } from '../lib/constants';

export const Dashboard = ({ vocabCount, vocab, logout, setActiveTab }: { vocabCount: number, vocab: Vocabulary[], logout?: () => void, setActiveTab: (tab: any) => void }) => {
  const { profile } = useContext(AuthContext);
  const { quotes } = useQuoteAgent();
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  useEffect(() => {
    if (quotes.length > 0) {
      const interval = setInterval(() => {
        setActiveQuoteIndex(prev => (prev + 1) % quotes.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [quotes]);

  const activeQuote = quotes[activeQuoteIndex] || { text: "継続は力なり", translation: "Continuity is power." };
  const streak = profile?.streakCount || 0;
  const { play } = useTTSContext();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mission tracking
  const missions = [
    { id: 1, label: `Learn ${profile?.dailyGoal || 5} words`, completed: vocabCount >= (profile?.dailyGoal || 5), icon: BookOpen },
    { id: 2, label: 'Ask from dictionary 3 words', completed: (profile?.dictionarySearchesToday || 0) >= 3, icon: Search },
    { id: 3, label: 'Play game/flashcards 5 mins', completed: (profile?.gameTimeToday || 0) >= 300, icon: Gamepad2 },
  ];
  const completedMissions = missions.filter(m => m.completed).length;

  const getStableWordOfTheDay = () => {
    if (vocab.length === 0) return { japanese: "学習", romaji: "Gakushuu", meaning: "Study / Learning" };
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % vocab.length;
    return vocab[index];
  };

  const wordOfTheDay = getStableWordOfTheDay();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative space-y-8 pb-24 px-4 pt-4"
    >
      {/* Today's Mission Card */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.01, rotate: [-0.1, 0.1, 0] }}
        className="bg-gradient-to-br from-[#1a4d5e] to-[#2c6e81] p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden"
      >
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Today's Mission</h2>
              <p className="text-white/80 text-xs">Small steps lead to great heights</p>
            </div>
            
            <div className="space-y-3">
              {missions.map(mission => (
                <div key={mission.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center border transition-all",
                    mission.completed ? 'bg-white/30 border-white/50' : 'bg-white/5 border-white/10'
                  )}>
                    {mission.completed && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <mission.icon className={cn("w-4 h-4", mission.completed ? "text-white/40" : "text-white/60")} />
                    <span className={cn(
                      "text-sm transition-all",
                      mission.completed ? 'text-white/40 line-through' : 'text-white font-medium'
                    )}>
                      {mission.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 p-2">
              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/10"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={276.46}
                  initial={{ strokeDashoffset: 276.46 }}
                  animate={{ strokeDashoffset: 276.46 - (276.46 * completedMissions) / 3 }}
                  className="text-white neon-glow"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-glow">{completedMissions} / 3</span>
              </div>
            </div>
            <button 
              onClick={() => { setActiveTab('vocab'); }}
              className="bg-[#f2a93b] text-stone-900 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(242,169,59,0.3)] hover:shadow-[0_0_30px_rgba(242,169,59,0.5)] transition-all active:scale-95"
            >
              Continue
            </button>
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </motion.div>

      {/* Quote Section */}
      <motion.div variants={itemVariants} className="text-center space-y-2 py-2">
        <h3 className="text-xl font-japanese text-stone-900 dark:text-stone-100">
          {activeQuote.text}
        </h3>
        <p className="text-stone-500 dark:text-stone-400 text-sm font-serif uppercase tracking-widest opacity-60">
          {activeQuote.translation}
        </p>
        {activeQuote.author && (
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 opacity-60">— {activeQuote.author}</p>
        )}
      </motion.div>

      {/* Grid Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Word of the Day */}
        <motion.div variants={itemVariants} className="col-span-1 bg-white dark:bg-stone-900 p-5 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-sm space-y-4 dynamic-island">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Word of the Day</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-japanese text-stone-900 dark:text-stone-100">{wordOfTheDay.japanese}</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{wordOfTheDay.romaji}</span>
              <span className="text-[10px] text-stone-500">{wordOfTheDay.meaning}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              safeStorage.setItem('komorebi_search_query', wordOfTheDay.japanese);
              setActiveTab('dictionary');
            }}
            className="w-full bg-[#f2a93b]/10 text-[#f2a93b] py-2 rounded-xl text-xs font-bold hover:bg-[#f2a93b]/20 transition-colors"
          >
            Learn
          </button>
        </motion.div>

        {/* Big Library Button */}
        <motion.button 
          variants={itemVariants}
          onClick={() => { setActiveTab('vocabList'); }}
          className="col-span-1 bg-white dark:bg-stone-900 p-5 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all group"
        >
          <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Library className="w-6 h-6 text-stone-600 dark:text-stone-400" />
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100 block">My Library</span>
            <span className="text-[10px] font-bold text-[#f2a93b] uppercase tracking-tighter opacity-80">{vocab.length} WORDS</span>
          </div>
        </motion.button>

        {/* Chat with Sensei Card */}
        <motion.div variants={itemVariants} className="col-span-1 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-[0_20px_40px_rgba(242,169,59,0.1)] transition-all dynamic-island">
          <div className="h-28 bg-stone-900 dark:bg-stone-950 relative overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#f2a93b]/50 via-transparent to-transparent animate-pulse" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-900 via-stone-900/80 to-transparent" />
              <img 
                src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" 
                alt="Sensei" 
                className="relative z-10 w-16 h-16 group-hover:scale-110 group-hover:neon-glow transition-transform drop-shadow-xl text-[#f2a93b]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/bottts/svg?seed=sensei";
                }}
              />
            </div>
            <div className="p-5 pt-4 space-y-4 relative z-10">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Sensei Chat 
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </h4>
              <button 
                onClick={() => { setActiveTab('chatbot'); }}
                className="w-full bg-stone-900 dark:bg-[#f2a93b] dark:text-stone-900 text-white py-2 rounded-xl text-[10px] font-bold border border-stone-800 dark:border-amber-400 transition-all active:scale-95"
              >
                CONSULT
              </button>
          </div>
        </motion.div>

        {/* Dictionary Shortcut Card */}
        <motion.div variants={itemVariants} className="col-span-1 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col group hover:bg-stone-50 dark:hover:bg-stone-800 transition-all dynamic-island">
            <div className="p-5 pt-4 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest leading-none">Dictionary</h4>
                <p className="text-[10px] text-stone-400 font-serif italic italic leading-tight">Master Kanji & Vocabulary</p>
              </div>
              <button 
                onClick={() => { setActiveTab('dictionary'); }}
                className="w-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 py-2 rounded-xl text-[10px] font-bold border border-stone-200 dark:border-stone-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                OPEN DICT
              </button>
            </div>
        </motion.div>

        {/* Rank Card - Improved Progress Logic */}
        <motion.div variants={itemVariants} className="col-span-2 bg-gradient-to-br from-[#fff8f0] to-[#fffcf9] dark:from-stone-900 dark:to-stone-950 p-8 rounded-[2.5rem] border border-[#ffe8cc] dark:border-stone-800 shadow-xl space-y-6 flex flex-col md:flex-row md:items-center justify-between group hover:border-[#f2a93b]/50 transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2a93b]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#f2a93b]/10 transition-colors" />
          
          <div className="space-y-4 md:max-w-[60%] relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f2a93b]/10 rounded-xl flex items-center justify-center">
                 <Brain className="w-6 h-6 text-[#f2a93b] animate-pulse" />
              </div>
              <p className="text-[10px] font-black text-[#f2a93b] uppercase tracking-[0.3em]">Knowledge Level</p>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100 leading-tight">Your Current Rank: <span className="text-[#f2a93b] font-bold not-italic">{profile?.rank || 'E5'}</span></h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-serif leading-relaxed italic opacity-80">
                You've gathered <span className="text-stone-900 dark:text-stone-100 font-bold">{vocab.length}</span> total words in your archive. Reach for the next tier!
              </p>
            </div>
          </div>
          
          <div className="space-y-4 md:w-64 pt-4 md:pt-0 relative z-10">
            <button 
              onClick={() => { setActiveTab('rankTest'); }}
              className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg group-hover:scale-[1.02] group-hover:shadow-[#f2a93b]/20 transition-all active:scale-95"
            >
              TAKE EVALUATION
            </button>
          </div>
        </motion.div>

        {/* Achievements Summary Card */}
        <motion.div variants={itemVariants} className="col-span-2 bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#f2a93b]" />
              Achievements
            </h4>
            <div className="flex gap-3">
              <button 
                onClick={() => { setActiveTab('achievements'); }} 
                className="text-[10px] font-bold text-[#f2a93b] hover:opacity-70 uppercase tracking-widest transition-colors"
              >
                Rewards
              </button>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3 pt-2">
            {profile?.achievements?.slice(0, 6).map((id) => {
              const ach = ACHIEVEMENTS.find(a => a.id === id);
              return (
                <div key={id} className="aspect-square bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-xl shadow-inner group hover:scale-110 transition-transform cursor-pointer" title={ach?.title}>
                  {ach?.icon}
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 6 - (profile?.achievements?.length || 0)) }).map((_, i) => (
              <div key={`lock-${i}`} className="aspect-square bg-stone-50/50 dark:bg-stone-800/30 rounded-2xl flex items-center justify-center border border-dashed border-stone-200 dark:border-stone-700">
                <span className="opacity-20 text-xs">🔒</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Streak Tracker */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-stone-900 p-4 md:p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm space-y-6 overflow-hidden relative">
        {/* Background Highlight */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2a93b]/5 blur-3xl rounded-full translate-x-16 -translate-y-16" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Weekly Activity</h4>
            <p className="text-[9px] text-stone-400 italic">Consistency is the secret to mastery</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const todayIndex = (new Date().getDay() + 6) % 7;
                const isToday = i === todayIndex;
                const isPast = i < todayIndex;
                const hasActivity = isPast || (isToday && vocabCount > 0);
                
                return (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "w-3 h-3 rounded-full transition-all duration-500",
                      isToday ? "bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-900/30 scale-110" : 
                      hasActivity ? "bg-emerald-500" : "bg-stone-100 dark:bg-stone-800"
                    )} />
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-tighter",
                      isToday ? "text-orange-500" : "text-stone-400"
                    )}>{day}</span>
                  </div>
                );
              })}
            </div>
            <div className="w-px h-8 bg-stone-100 dark:bg-stone-800 hidden sm:block" />
            <button 
              onClick={() => { setActiveTab('weeklyStats'); }}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-3 h-3" />
              FULL STATS
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 gap-6 border-t border-stone-50 dark:border-stone-800">
          <div className="flex justify-around md:justify-start gap-4 md:gap-6">
            {[
              { label: 'Translate', icon: Languages, tab: 'translator', color: 'text-blue-500' },
              { label: 'Revise', icon: Layers, tab: 'flashcards', color: 'text-purple-500' },
              { label: 'Writing', icon: Pencil, tab: 'writingPractice', color: 'text-teal-500' },
            ].map(tool => (
              <button 
                key={tool.label}
                onClick={() => { setActiveTab(tool.tab); }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center border border-stone-100 dark:border-stone-700 shadow-sm group-hover:scale-110 transition-all">
                  <tool.icon className={cn("w-4 h-4 md:w-5 md:h-5", tool.color)} />
                </div>
                <span className="text-[8px] md:text-[9px] font-bold text-stone-500 group-hover:text-stone-900 dark:group-hover:text-stone-100">{tool.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center md:items-end gap-4 md:gap-2">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <div className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100 tracking-tighter">
                  {format(currentTime, 'HH:mm:ss')}
                </div>
                <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">
                  {format(currentTime, 'EEEE, MMM do')}
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-stone-200 dark:bg-stone-800" />
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold text-stone-900 dark:text-stone-100">
                    {streak} Day Streak
                  </p>
                  <p className="text-[8px] text-stone-400 uppercase tracking-widest">Current Progress</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center border border-orange-100 dark:border-orange-800">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto p-2 bg-pink-50/50 dark:bg-pink-900/10 rounded-xl border border-pink-100/50 dark:border-pink-900/20 text-center sm:text-right">
              <p className="text-[9px] text-pink-600 dark:text-pink-400 font-medium">
                Next: <span className="font-bold italic">Sakura reward</span> 🌸
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
