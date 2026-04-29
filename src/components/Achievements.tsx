import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trophy, 
  Award, 
  Check, 
  Pin, 
  Lock, 
  ChevronRight, 
  X,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../lib/constants';
import { cn, safeStorage } from '../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const Achievements = () => {
    const { profile, user, isDemo, setProfile } = useContext(AuthContext);
    const [pinned, setPinned] = useState<string[]>(profile?.pinnedAchievements || []);
    const [activeCategory, setActiveCategory] = useState('all');
    const [claiming, setClaiming] = useState<string | null>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  
    const handlePin = async (id: string) => {
      let newPinned = [...pinned];
      if (newPinned.includes(id)) {
        newPinned = newPinned.filter(p => p !== id);
      } else {
        if (newPinned.length >= 10) return;
        newPinned.push(id);
      }
      setPinned(newPinned);
  
      try {
        if (isDemo) {
          const p = JSON.parse(safeStorage.getItem('komorebi_profile') || '{}');
          safeStorage.setItem('komorebi_profile', JSON.stringify({ ...p, pinnedAchievements: newPinned }));
        } else if (user) {
          await updateDoc(doc(db, 'users', user.uid), { pinnedAchievements: newPinned });
        }
      } catch (error) {
        console.error("Error pinning achievement:", error);
      }
    };
  
    const handleClaimReward = async (ach: any) => {
      if (!profile || claiming) return;
      const claimed = profile.claimedRewards || [];
      if (claimed.includes(ach.id)) return;
  
      setClaiming(ach.id);
      try {
        const newClaimed = [...claimed, ach.id];
        const newXp = (profile.xp || 0) + (ach.reward || 0);
        
        const updates = {
          claimedRewards: newClaimed,
          xp: newXp
        };
  
        if (isDemo) {
          const p = { ...profile, ...updates };
          setProfile(p);
          safeStorage.setItem('komorebi_profile', JSON.stringify(p));
        } else if (user) {
          await updateDoc(doc(db, 'users', user.uid), updates);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setClaiming(null);
      }
    };
  
    const filteredAchievements = ACHIEVEMENTS
      .filter(ach => 
        activeCategory === 'all' || ach.category === activeCategory
      )
      .sort((a, b) => {
        const aUnlocked = profile?.achievements?.includes(a.id) ? 1 : 0;
        const bUnlocked = profile?.achievements?.includes(b.id) ? 1 : 0;
        return bUnlocked - aUnlocked; // Unlocked first
      });

    const stats = {
      total: ACHIEVEMENTS.length,
      unlocked: profile?.achievements?.length || 0,
      claimed: profile?.claimedRewards?.length || 0,
      percentage: Math.round(((profile?.achievements?.length || 0) / ACHIEVEMENTS.length) * 100)
    };
  
    return (
      <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 pt-4">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
           <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                    <Trophy className="w-6 h-6 text-[#f2a93b]" />
                 </div>
                 <div className="flex flex-col">
                   <h1 className="text-4xl md:text-5xl font-editorial italic text-stone-900 dark:text-stone-100 tracking-tight">Hall of Mastery</h1>
                   <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f2a93b] mt-1">Your Legacy and Achievements</p>
                 </div>
              </div>
           </div>
  
           <div className="flex gap-4">
              <div className="bg-white dark:bg-stone-900 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl flex items-center gap-4 md:gap-6">
                 <div className="text-center">
                    <div className="text-xl md:text-2xl font-display font-medium text-stone-900 dark:text-stone-100 italic tracking-tight">{stats.percentage}%</div>
                    <div className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-stone-400">Completion</div>
                 </div>
                 <div className="w-px h-6 md:h-8 bg-stone-100 dark:bg-stone-800" />
                 <div className="text-center">
                    <div className="text-xl md:text-2xl font-display font-medium text-stone-900 dark:text-stone-100 italic tracking-tight">{stats.unlocked}</div>
                    <div className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-stone-400">Unlocked</div>
                 </div>
              </div>
           </div>
        </header>
  
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 md:gap-3">
           <button 
             onClick={() => setActiveCategory('all')}
             className={cn(
                "px-4 md:px-6 py-2 md:py-3 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all",
                activeCategory === 'all' ? "bg-stone-900 text-white shadow-lg" : "bg-white dark:bg-stone-900 text-stone-400 border border-stone-100 dark:border-stone-800"
             )}
           >
             All
           </button>
           {ACHIEVEMENT_CATEGORIES.map(cat => (
             <button 
               key={cat.id}
               onClick={() => setActiveCategory(cat.id)}
               className={cn(
                 "px-4 md:px-6 py-2 md:py-3 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                 activeCategory === cat.id ? "bg-stone-900 text-white shadow-lg" : "bg-white dark:bg-stone-900 text-stone-400 border border-stone-100 dark:border-stone-800"
               )}
             >
               <span className="hidden md:inline">{cat.icon}</span>
               {cat.title}
             </button>
           ))}
        </div>
  
        {/* Grid Section - 3 columns on mobile as requested */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
           {filteredAchievements.map((ach) => {
             const isUnlocked = profile?.achievements?.includes(ach.id);
             const isClaimed = profile?.claimedRewards?.includes(ach.id);
             const isPinned = pinned.includes(ach.id);
  
             return (
               <motion.div 
                 key={ach.id}
                 layout
                 whileHover={{ scale: 1.05, y: -2 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setSelectedAchievement(ach)}
                 className={cn(
                   "relative aspect-square rounded-2xl md:rounded-[2.5rem] border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 md:gap-4 group shadow-sm overflow-hidden",
                   isUnlocked 
                     ? "bg-white dark:bg-stone-900 border-[#f2a93b]/30 shadow-amber-50/50 dark:shadow-none" 
                     : "bg-stone-50 dark:bg-stone-800/20 border-stone-100 dark:border-stone-800 grayscale opacity-60"
                 )}
               >
                 {isPinned && (
                   <div className="absolute top-2 right-2 md:top-6 md:right-6">
                      <Pin className="w-2 h-2 md:w-3 md:h-3 text-[#f2a93b] fill-current" />
                   </div>
                 )}
  
                 <div className={cn(
                   "w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[2rem] flex items-center justify-center text-xl md:text-3xl shadow-inner transition-transform group-hover:scale-110",
                   isUnlocked ? "bg-amber-50 dark:bg-[#f2a93b]/10" : "bg-stone-100 dark:bg-stone-800"
                 )}>
                   {ach.icon}
                 </div>

                 <div className="text-center px-1">
                    <h3 className="text-[9px] md:text-sm font-editorial italic text-stone-900 dark:text-stone-100 leading-tight line-clamp-1">{ach.title}</h3>
                    {isUnlocked && !isClaimed && (
                      <div className="mt-1 flex justify-center">
                         <div className="w-1.5 h-1.5 bg-[#f2a93b] rounded-full animate-ping" />
                      </div>
                    )}
                 </div>

                 {isClaimed && (
                   <div className="absolute bottom-1 right-1 md:bottom-3 md:right-3">
                      <CheckCircle2 className="w-2 h-2 md:w-4 md:h-4 text-emerald-500" />
                   </div>
                 )}

                 {!isUnlocked && (
                   <div className="absolute inset-0 bg-stone-900/5 dark:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Lock className="w-4 h-4 text-stone-400" />
                   </div>
                 )}
               </motion.div>
             );
           })}
        </div>
  
        {/* Achievement Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAchievement(null)}
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-[4rem] p-12 overflow-hidden border border-white/20"
              >
                <div className="flex flex-col items-center text-center space-y-8">
                  <div className="text-7xl mb-4">{selectedAchievement.icon}</div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100">{selectedAchievement.title}</h2>
                    <p className="text-stone-500 dark:text-stone-400 font-serif leading-relaxed italic">{selectedAchievement.description}</p>
                  </div>
  
                  <div className="flex flex-col gap-4 w-full pt-8 border-t border-stone-50 dark:border-stone-800">
                     <div className="flex justify-between items-center px-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Reward</span>
                        <div className="flex items-center gap-2 text-[#f2a93b] font-bold">
                           <Zap className="w-4 h-4 fill-current" />
                           <span>{selectedAchievement.reward} XP</span>
                        </div>
                     </div>
  
                     <button 
                        onClick={() => handlePin(selectedAchievement.id)}
                        className={cn(
                          "w-full py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all",
                          pinned.includes(selectedAchievement.id)
                            ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                            : "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xl"
                        )}
                     >
                        <Pin className={cn("w-4 h-4", pinned.includes(selectedAchievement.id) ? "fill-current" : "")} />
                        {pinned.includes(selectedAchievement.id) ? 'Unpin from Status' : 'Pin to Status'}
                     </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
};
