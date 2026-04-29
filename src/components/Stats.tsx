import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Zap, 
  Trophy, 
  BookOpen,
  Coins,
  ArrowRightLeft,
  Store,
  Users,
  Globe,
  Star,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { cn, safeStorage } from '../lib/utils';
import { doc, updateDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

import { MissingApiKeyWarning } from './ui/MissingApiKeyWarning';

interface LeaderboardItem {
  id: string;
  name: string;
  xp: number;
  streak: number;
  words: number;
  avatar: string;
  isMe: boolean;
  rank?: number;
}

export const Stats = ({ todayVocabCount }: { todayVocabCount: number }) => {
  const { profile, vocab, user, isDemo, setProfile } = useContext(AuthContext);
  const [exchangeAmount, setExchangeAmount] = useState(100);
  const [exchanging, setExchanging] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [leaderboardCategory, setLeaderboardCategory] = useState<'xp' | 'streak' | 'words'>('xp');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const usersRef = collection(db, 'users');
        // We fetch top 10 for the selected category
        const q = query(
          usersRef, 
          orderBy(leaderboardCategory === 'words' ? 'totalWords' : leaderboardCategory === 'streak' ? 'streakCount' : 'xp', 'desc'),
          limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const data: LeaderboardItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // FILTER: Skip users with "Unknown UID", guests, or missing displayName
          const name = userData.displayName || '';
          const uid = doc.id;
          const nameLower = name.toLowerCase();
          
          if (!name || nameLower === 'unknown uid' || nameLower === 'unknown' || nameLower.includes('guest') || nameLower === uid.toLowerCase()) {
            return;
          }

          data.push({
            id: uid,
            name: name,
            xp: userData.xp || 0,
            streak: userData.streakCount || 0,
            words: userData.totalWords || 0,
            avatar: userData.avatar || '🦊',
            isMe: uid === user?.uid
          });
        });

        // Ensure current user is included if not in top 20
        const myEntry = data.find(item => item.id === user?.uid);
        if (myEntry) {
          // Update my own entry with latest local data
          myEntry.words = vocab?.length || 0;
          myEntry.xp = profile?.xp || 0;
          myEntry.streak = profile?.streakCount || 0;
        } else if (profile && user) {
           data.push({
             id: user.uid,
             name: profile.displayName || 'You',
             xp: profile.xp || 0,
             streak: profile.streakCount || 0,
             words: vocab?.length || 0,
             avatar: profile.avatar || '🦊',
             isMe: true
           });
        }

        // Sort again since we might have added "me" manually
        const sorted = data.sort((a, b) => {
          const valA = leaderboardCategory === 'words' ? a.words : leaderboardCategory === 'streak' ? a.streak : a.xp;
          const valB = leaderboardCategory === 'words' ? b.words : leaderboardCategory === 'streak' ? b.streak : b.xp;
          return (valB || 0) - (valA || 0);
        });

        setLeaderboardData(sorted.slice(0, 10).map((item, i) => ({ ...item, rank: i + 1 })));
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        // Fallback to minimal data if fetch fails
        setLeaderboardData([
          { id: 'me', name: profile?.displayName || "You", xp: profile?.xp || 0, streak: profile?.streakCount || 0, words: vocab?.length || 0, avatar: profile?.avatar || "🦊", isMe: true, rank: 1 }
        ]);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();
  }, [leaderboardCategory, user, profile, vocab?.length]);

  const streak = profile?.streakCount || 0;
  const xp = profile?.xp || 0;
  const coins = profile?.coins || 0;
  const rank = profile?.rank || 'E5';
  const totalWords = vocab?.length || 0;
  const dailyGoal = profile?.dailyGoal || 5;
  const progress = Math.min((todayVocabCount / dailyGoal) * 100, 100);

  const XP_COIN_RATE = 10; // 10 XP = 1 Coin

  const handleExchange = async () => {
    if (xp < exchangeAmount) {
      setMessage({ text: "Not enough XP!", type: 'error' });
      return;
    }
    setExchanging(true);
    const coinsToAdd = Math.floor(exchangeAmount / XP_COIN_RATE);
    const newXp = xp - exchangeAmount;
    const newCoins = coins + coinsToAdd;

    const updates = { xp: newXp, coins: newCoins };
    try {
      if (isDemo) {
        const p = { ...profile, ...updates };
        setProfile(p as any);
        safeStorage.setItem('komorebi_profile', JSON.stringify(p));
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid), updates);
      }
      setMessage({ text: `Successfully exchanged ${exchangeAmount} XP for ${coinsToAdd} Coins!`, type: 'success' });
      // playSound('success');
    } catch (e) {
      setMessage({ text: "Failed to exchange.", type: 'error' });
    } finally {
      setExchanging(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const buyStreakRetrieval = async () => {
    const PRICE = 500;
    if (coins < PRICE) {
      setMessage({ text: "Not enough coins!", type: 'error' });
      return;
    }
    const newCoins = coins - PRICE;
    const newStreak = streak + 1;
    const updates = { coins: newCoins, streakCount: newStreak };
    
    try {
      if (isDemo) {
        const p = { ...profile, ...updates };
        setProfile(p as any);
        safeStorage.setItem('komorebi_profile', JSON.stringify(p));
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid), updates);
      }
      setMessage({ text: "Streak retrieved! 💎", type: 'success' });
      // playSound('success');
    } catch (e) {
      setMessage({ text: "Failed to purchase.", type: 'error' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
      className="space-y-8 pb-32 px-2 pt-2"
    >
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md",
              message.type === 'success' ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 font-bold" /> : <AlertCircle className="w-5 h-5 font-bold" />}
            <span className="font-bold text-xs">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 italic transition-all">Stats & Inventory</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f2a93b] mt-1 italic transition-all">Your Global Status & Economy</p>
        </div>
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-full border border-stone-200 dark:border-stone-700">
           <button 
             onClick={() => setShowStore(false)}
             className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", !showStore ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-400")}
           >
             Stats
           </button>
           <button 
             onClick={() => setShowStore(true)}
             className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", showStore ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-400")}
           >
             Store
           </button>
        </div>
      </motion.div>
      
      {!showStore ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <motion.div 
              variants={itemVariants}
              className="bg-white dark:bg-stone-900/50 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm text-center space-y-2 relative overflow-hidden"
            >
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform font-bold">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{streak}</div>
              <div className="text-[9px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold">Streak</div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-white dark:bg-stone-900/50 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm text-center space-y-2 relative overflow-hidden"
            >
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform font-bold">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{xp}</div>
              <div className="text-[9px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold">Total XP</div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-white dark:bg-stone-900/50 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm text-center space-y-2 relative overflow-hidden"
            >
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform font-bold">
                <Coins className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{coins}</div>
              <div className="text-[9px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold">Coins</div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="bg-white dark:bg-stone-900/50 p-6 rounded-[2.5rem] border border-[#f2a93b]/30 dark:border-[#f2a93b]/20 shadow-md text-center space-y-2 relative overflow-hidden ring-4 ring-[#f2a93b]/5"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform font-bold">
                <BookOpen className="w-5 h-5 text-blue-500 fill-blue-500" />
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalWords}</div>
              <div className="text-[9px] text-[#f2a93b] dark:text-[#f2a93b] uppercase tracking-[0.2em] font-bold">Words Stored</div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-white dark:bg-stone-900/50 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm text-center space-y-2 relative overflow-hidden"
            >
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform font-bold">
                <Trophy className="w-5 h-5 text-blue-500 fill-blue-500" />
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{rank}</div>
              <div className="text-[9px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold">Rank</div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* XP Exchange Section */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-[#f2a93b]" />
                  XP Exchange
                </h3>
                <span className="text-[10px] font-bold text-[#f2a93b] uppercase tracking-widest whitespace-nowrap">Rate: 10 XP = 1 Coin</span>
              </div>

              <div className="space-y-6">
                <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-3xl border border-stone-100 dark:border-stone-700 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-1">Available XP</span>
                    <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{xp} XP</span>
                  </div>
                  <div className="h-8 w-px bg-stone-200 dark:bg-stone-700" />
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-1">Exchange Amount</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setExchangeAmount(prev => Math.max(10, prev - 100))}
                        className="w-6 h-6 bg-white dark:bg-stone-700 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm hover:scale-110 active:scale-95 transition-transform"
                      >-</button>
                      <span className="text-xl font-bold text-stone-900 dark:text-stone-100 w-16 text-center text-glow">{exchangeAmount}</span>
                      <button 
                        onClick={() => setExchangeAmount(prev => Math.min(xp, prev + 100))}
                        className="w-6 h-6 bg-white dark:bg-stone-700 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm hover:scale-110 active:scale-95 transition-transform"
                      >+</button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-center">
                   <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center shadow-inner group">
                      <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500 neon-glow" />
                   </div>
                   <div className="text-stone-300 dark:text-stone-700 animate-pulse">
                      <ArrowRightLeft className="w-6 h-6" />
                   </div>
                   <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center shadow-inner">
                      <Coins className="w-6 h-6 text-amber-500 fill-amber-500 neon-glow" />
                   </div>
                </div>

                <button 
                  onClick={handleExchange}
                  disabled={exchanging || xp < exchangeAmount}
                  className="w-full py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(242,169,59,0.3)] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {exchanging ? <RefreshCcw className="w-4 h-4 animate-spin font-bold" /> : <RefreshCcw className="w-4 h-4 font-bold" />}
                  Swap for {Math.floor(exchangeAmount / XP_COIN_RATE)} Coins
                </button>
              </div>
            </motion.div>

            {/* Global Leaderboard Section */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    E-Rank Global
                  </h3>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Hunter Rankings</p>
                </div>
                <div className="flex bg-stone-50 dark:bg-stone-800 p-1 rounded-xl">
                  {(['xp', 'streak', 'words'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLeaderboardCategory(cat)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all",
                        leaderboardCategory === cat ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-400"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {loadingLeaderboard ? (
                  <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Scanning Hunters...</span>
                  </div>
                ) : leaderboardData.length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Hunters Found</span>
                  </div>
                ) : (
                  leaderboardData.map((item, i) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-3 rounded-2xl flex items-center justify-between transition-all font-bold",
                        item.isMe 
                          ? "bg-[#f2a93b]/10 border-2 border-[#f2a93b]/30 shadow-md scale-[1.02]" 
                          : "bg-stone-50 dark:bg-stone-800/40 border border-transparent font-bold"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black italic",
                          i === 0 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                          i === 1 ? "bg-stone-200 text-stone-700 border border-stone-300" :
                          i === 2 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                          "bg-white dark:bg-stone-700 text-stone-400"
                        )}>
                          #{item.rank}
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 flex items-center justify-center text-lg shadow-sm overflow-hidden">
                          {item.avatar.startsWith('data:') || item.avatar.startsWith('http') ? (
                            <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            item.avatar
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-xs font-bold", item.isMe ? "text-stone-900 dark:text-[#f2a93b]" : "text-stone-600 dark:text-stone-300 font-bold")}>
                              {item.name} {item.isMe && "(You)"}
                            </span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[7px] font-black italic border",
                              item.xp > 100000 ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              item.xp > 75000 ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                              "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            )}>
                              {item.xp > 100000 ? 'S' : item.xp > 75000 ? 'A' : 'B'}
                            </span>
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Lv. {Math.max(1, Math.floor(item.xp / 1000))} Hunter</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-black text-stone-900 dark:text-stone-100 italic transition-all">
                           {(item[leaderboardCategory as keyof typeof item] as number).toLocaleString()}
                         </span>
                         <span className="text-[8px] font-bold text-stone-400 block uppercase tracking-widest italic transition-all">
                           {leaderboardCategory === 'words' ? 'Words' : leaderboardCategory.toUpperCase()}
                         </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        <motion.div variants={itemVariants} className="space-y-8">
           <div className="bg-gradient-to-br from-[#1a4d5e] to-[#2c6e81] p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h3 className="text-3xl font-editorial italic">Hunter's Shop</h3>
                       <p className="text-white/60 text-xs italic">Prepare for the next raid</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 border border-white/30 shadow-xl">
                       <Coins className="w-5 h-5 text-amber-300 fill-amber-300" />
                       <span className="text-2xl font-bold uppercase tracking-widest italic">{coins}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 space-y-6 flex flex-col group hover:scale-[1.02] transition-transform">
                       <div className="w-16 h-16 bg-blue-400/20 rounded-3xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                          <RefreshCcw className="w-8 h-8 text-blue-300" />
                       </div>
                       <div className="space-y-2 flex-1">
                          <h4 className="text-xl font-bold">Streak Retrieval</h4>
                          <p className="text-xs text-white/60 font-serif italic leading-relaxed">Missed a day? Retrieve your fallen streak and restore your honor. Only valid for one lost day.</p>
                       </div>
                       <div className="flex items-center justify-between gap-4 pt-4">
                          <div className="flex items-center gap-1.5 font-bold text-amber-300">
                             <Coins className="w-4 h-4 fill-current" />
                             <span className="italic text-lg tracking-widest font-bold font-bold">500</span>
                          </div>
                          <button 
                            onClick={buyStreakRetrieval}
                            className="bg-white text-[#1a4d5e] px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-stone-50 transition-all font-bold"
                          >
                            Purchase
                          </button>
                       </div>
                    </div>

                    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 space-y-6 flex flex-col group hover:scale-[1.02] transition-transform opacity-60">
                       <div className="w-16 h-16 bg-purple-400/20 rounded-3xl flex items-center justify-center shadow-inner">
                          <Star className="w-8 h-8 text-purple-300" />
                       </div>
                       <div className="space-y-2 flex-1">
                          <h4 className="text-xl font-bold italic">Rare Avatar</h4>
                          <p className="text-xs text-white/60 font-serif italic leading-relaxed">Unique legendary hunter avatars coming soon in the next season update. Stay tuned!</p>
                       </div>
                       <div className="flex items-center justify-between gap-4 pt-4">
                          <div className="flex items-center gap-1.5 font-bold text-amber-300">
                             <Coins className="w-4 h-4 fill-current" />
                             <span className="italic text-lg tracking-widest font-bold font-bold">???</span>
                          </div>
                          <button disabled className="bg-white/20 text-white/40 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-not-allowed font-bold">
                            Locked
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />
           </div>
           
           <div className="flex items-center justify-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-[0.4em] py-4">
              <Star className="w-3 h-3" />
              Marketplace of Shadows
              <Star className="w-3 h-3" />
           </div>
        </motion.div>
      )}

      <motion.div 
        variants={itemVariants}
        className="bg-[#1a4d5e] p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-xl font-bold">Daily Progress</h3>
          <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest">{profile?.dailyGoal || 5} words / day</span>
        </div>
        <div className="space-y-4 relative z-10">
          <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#f2a93b] shadow-[0_0_20px_rgba(242,169,59,0.5)]"
            />
          </div>
          <p className="text-sm text-white/70 font-serif italic leading-relaxed">
            {todayVocabCount >= dailyGoal 
              ? "Goal met! You're dominating the daily rankings. ✨" 
              : `You've learned ${todayVocabCount} words today. Just ${dailyGoal - todayVocabCount} more to hit the goal.`}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-10 -translate-y-10" />
      </motion.div>
    </motion.div>
  );
};
