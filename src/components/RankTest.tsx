import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  ChevronRight 
} from 'lucide-react';
import { cn, safeStorage } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { Vocabulary } from '../types';
import { SOLO_LEVELING_RANKS } from '../lib/constants';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextRank } from '../lib/utils';

export const RankTest = ({ vocab }: { vocab: Vocabulary[] }) => {
  const { profile, user, isDemo } = useContext(AuthContext);
  const [step, setStep] = useState<'intro' | 'quiz' | 'result' | 'rankup'>('intro');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<{ q: string, a: string, options: string[] }[]>([]);
  const [newRank, setNewRank] = useState<string | null>(null);
  const [sfx, setSfx] = useState<{ id: number, text: string, x: number, y: number }[]>([]);

  const triggerSfx = (text: string) => {
    const id = Date.now();
    const x = Math.random() * 60 + 20;
    const y = Math.random() * 40 + 30;
    setSfx(prev => [...prev, { id, text, x, y }]);
    setTimeout(() => setSfx(prev => prev.filter(s => s.id !== id)), 1000);
  };

  const startTest = () => {
    let testQuestions = [];
    
    if (vocab.length >= 15) {
      const shuffled = [...vocab].sort(() => 0.5 - Math.random());
      testQuestions = shuffled.slice(0, 15).map(v => {
        const otherMeanings = vocab
          .filter(ov => ov.id !== v.id)
          .map(ov => ov.meaning)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        
        const options = [v.meaning, ...otherMeanings].sort(() => 0.5 - Math.random());
        
        return {
          q: v.japanese,
          a: v.meaning,
          options
        };
      });
    } else {
      testQuestions = [
        { q: 'き', a: 'Tree (Ki)', options: ['Tree (Ki)', 'Water (Mizu)', 'Fire (Hi)', 'Earth (Tsuchi)'] },
        { q: 'みず', a: 'Water (Mizu)', options: ['Water (Mizu)', 'Tree (Ki)', 'Fire (Hi)', 'Mountain (Yama)'] },
        { q: 'ひ', a: 'Fire (Hi)', options: ['Fire (Hi)', 'Tree (Ki)', 'Water (Mizu)', 'Wind (Kaze)'] },
        { q: 'やま', a: 'Mountain (Yama)', options: ['Mountain (Yama)', 'River (Kawa)', 'Sea (Umi)', 'Forest (Mori)'] },
        { q: 'ひと', a: 'Person (Hito)', options: ['Person (Hito)', 'Dog (Inu)', 'Cat (Neko)', 'Bird (Tori)'] },
      ];
    }
    
    setQuestions(testQuestions);
    setStep('quiz');
    setScore(0);
    setCurrentQuestion(0);
  };

  const handleAnswer = async (answer: string) => {
    const isCorrect = answer === questions[currentQuestion].a;
    const newScore = isCorrect ? score + 1 : score;
    
    if (isCorrect) {
      setScore(newScore);
      triggerSfx('PERFECT!');
    } else {
      triggerSfx('MISS');
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else {
      setStep('result');
      if (newScore === questions.length) {
        const next = getNextRank(profile?.rank || 'E5');
        if (next !== profile?.rank) {
          setNewRank(next);
          // Auto transition to rankup after a delay
          setTimeout(() => setStep('rankup'), 2000);
        }
      }

      if (newScore > 0) {
        try {
          const bonus = newScore * 20;
          const updates: any = { xp: (profile?.xp || 0) + bonus };
          
          if (newScore === questions.length) {
            const next = getNextRank(profile?.rank || 'E5');
            if (next !== profile?.rank) {
              updates.rank = next;
            }
          }

          if (isDemo) {
            const p = JSON.parse(safeStorage.getItem('komorebi_profile') || '{}');
            safeStorage.setItem('komorebi_profile', JSON.stringify({ ...p, ...updates }));
          } else if (user) {
            await updateDoc(doc(db, 'users', user.uid), updates);
          }
        } catch (e) {
          console.error("Error awarding XP:", e);
        }
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-4 pb-12 px-4">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center space-y-8 relative overflow-hidden"
          >
            {/* Quest Header Style */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-stone-900 dark:bg-stone-100" />
            <div className="absolute top-4 right-8 text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em]">Quest ID: #ADV-001</div>

            <div className="w-24 h-24 bg-stone-900 dark:bg-[#f2a93b] rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-lg rotate-3 relative z-10 transition-colors">
              <Trophy className="w-12 h-12 text-amber-400 dark:text-stone-900" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 dark:bg-stone-900 rounded-full flex items-center justify-center text-stone-900 dark:text-amber-400 text-xs font-bold border-4 border-white dark:border-stone-800 transition-colors">!</div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100">Rank Advancement Quest</h2>
              <p className="text-stone-500 dark:text-stone-400 font-serif italic text-sm">"The system has detected your growth. A new trial awaits."</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-stone-50 dark:bg-stone-800/50 rounded-3xl border border-stone-100 dark:border-stone-800 text-left space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Current Status</h4>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/20 px-2 py-0.5 rounded">ACTIVE</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center text-xl font-bold text-stone-900 dark:text-stone-100">
                    {profile?.rank || 'E5'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-stone-400">
                      <span>Progression</span>
                      <span>{Math.floor((SOLO_LEVELING_RANKS.indexOf(profile?.rank || 'E5') / SOLO_LEVELING_RANKS.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(SOLO_LEVELING_RANKS.indexOf(profile?.rank || 'E5') / SOLO_LEVELING_RANKS.length) * 100}%` }}
                        className="h-full bg-stone-900 dark:bg-stone-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 text-left">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400 mb-4">Quest Objectives</h4>
                <ul className="text-xs text-emerald-900 dark:text-emerald-100 space-y-3 font-serif italic">
                  <li className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-[8px] font-bold">1</div>
                    Achieve a 100% accuracy rate in the evaluation.
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-[8px] font-bold">2</div>
                    Demonstrate mastery of current vocabulary set.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="p-6 bg-stone-50 dark:bg-stone-800/50 rounded-3xl space-y-4 text-left">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <span>Library Requirement</span>
                  <span className={cn(vocab.length >= 15 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600")}>
                    {vocab.length} / 15 Words
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((vocab.length / 15) * 100, 100)}%` }}
                    className={cn("h-full transition-colors", vocab.length >= 15 ? "bg-emerald-500" : "bg-stone-900 dark:bg-stone-100")}
                  />
                </div>
                {vocab.length < 15 && (
                  <p className="text-[10px] text-red-500 font-serif italic">
                    You need at least 15 words in your library to unlock this quest.
                  </p>
                )}
              </div>

              <button 
                onClick={startTest}
                disabled={vocab.length < 15}
                className="w-full py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-200 dark:shadow-none flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Accept Quest</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-widest text-stone-400">Question {currentQuestion + 1} / {questions.length}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">Rank: {profile?.rank}</div>
            </div>
            
            <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center relative overflow-hidden">
              <AnimatePresence>
                {sfx.map(s => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: s.y, x: s.x + '%', scale: 0.5 }}
                    animate={{ opacity: 1, y: s.y - 100, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "absolute pointer-events-none font-bold text-2xl z-50 italic tracking-tighter",
                      s.text === 'PERFECT!' ? "text-amber-500" : "text-stone-400"
                    )}
                  >
                    {s.text}
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="text-7xl font-japanese font-bold text-stone-900 dark:text-stone-100 mb-8">{questions[currentQuestion].q}</div>
              <div className="grid grid-cols-2 gap-4">
                {questions[currentQuestion].options.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="py-6 bg-stone-50 dark:bg-stone-800 hover:bg-stone-900 dark:hover:bg-stone-100 hover:text-white dark:hover:text-stone-900 rounded-2xl font-bold transition-all border border-stone-100 dark:border-stone-700 text-stone-700 dark:text-stone-300 shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center space-y-8"
          >
            <div className="text-6xl">{score === questions.length ? '🎊' : '💪'}</div>
            <div className="space-y-2">
              <h2 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100">Evaluation Complete</h2>
              <p className="text-stone-500 dark:text-stone-400 font-serif italic text-sm">You scored {score} out of {questions.length}.</p>
            </div>
            <div className="p-6 bg-stone-50 dark:bg-stone-800 rounded-3xl border border-stone-100 dark:border-stone-800">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Performance Bonus</div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">+{score * 20} XP</div>
            </div>
            {score === questions.length && (
              <div className="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse text-sm">
                PERFECT SCORE! PREPARING RANK ADVANCEMENT...
              </div>
            )}
            <button 
              onClick={() => setStep('intro')}
              className="w-full py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl"
            >
              Return to Dojo
            </button>
          </motion.div>
        )}

        {step === 'rankup' && (
          <motion.div 
            key="rankup"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[200] bg-stone-900 flex items-center justify-center p-8"
          >
            <div className="text-center space-y-12 max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-stone-400 text-xs font-bold uppercase tracking-[0.5em]"
              >
                System Notification
              </motion.div>
              
              <div className="space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="text-6xl font-editorial italic text-white"
                >
                  Rank Up
                </motion.h2>
                <div className="h-1 w-24 bg-amber-400 mx-auto" />
              </div>

              <div className="flex items-center justify-center gap-12">
                <div className="text-center">
                  <div className="text-stone-500 text-[10px] font-bold uppercase mb-2">Former</div>
                  <div className="text-4xl font-bold text-stone-600">{profile?.rank}</div>
                </div>
                <ChevronRight className="w-8 h-8 text-amber-400 animate-pulse" />
                <div className="text-center">
                  <div className="text-amber-400 text-[10px] font-bold uppercase mb-2">Current</div>
                  <div className="text-6xl font-bold text-white shadow-lg shadow-amber-400/20">{newRank}</div>
                </div>
              </div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-stone-400 font-serif italic text-sm"
              >
                Your limits have been surpassed. The path to the S-Rank continues.
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onClick={() => setStep('intro')}
                className="px-12 py-4 bg-white text-stone-900 rounded-full font-bold hover:bg-stone-100 transition-all transition-colors"
              >
                Confirm Ascension
              </motion.button>
            </div>
            
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[120px]" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
