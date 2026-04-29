import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Zap, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Vocabulary } from '../../types';

export const FlashcardSprint = ({ vocab, onBack }: { vocab: Vocabulary[]; onBack: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');

  const shuffledVocab = useRef<Vocabulary[]>([]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameState('end');
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    shuffledVocab.current = [...vocab].sort(() => Math.random() - 0.5);
    setCurrentIndex(0);
    setShowAnswer(false);
    setScore(0);
    setTimeLeft(60);
    setGameState('playing');
  };

  const handleNext = (correct: boolean) => {
    if (correct) setScore(prev => prev + 1);
    setShowAnswer(false);
    setCurrentIndex(prev => (prev + 1) % shuffledVocab.current.length);
  };

  if (vocab.length < 1) {
    return (
      <div className="text-center p-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
        <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-4">No words found</h3>
        <p className="text-stone-500 dark:text-stone-400 mb-8 font-serif italic">Add some words to your vocabulary to play Flashcard Sprint.</p>
        <button onClick={onBack} className="px-8 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 shadow-sm transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Flashcard Sprint</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Rapid fire review. Speed is key!</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Time</div>
            <div className={cn("text-2xl font-editorial italic", timeLeft < 10 ? "text-red-500" : "text-stone-900 dark:text-stone-100")}>{timeLeft}s</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Words</div>
            <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{score}</div>
          </div>
        </div>
      </div>

      {gameState === 'start' ? (
        <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center">
          <Zap className="w-16 h-16 text-stone-900 dark:text-[#f2a93b] mx-auto mb-6" />
          <h3 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100 mb-4">Sprint Mode</h3>
          <p className="text-stone-500 dark:text-stone-400 mb-8 font-serif italic">Review as many cards as you can in 60 seconds.</p>
          <button onClick={startGame} className="px-12 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-100 dark:shadow-none">Start Sprint</button>
        </div>
      ) : gameState === 'playing' ? (
        <div className="space-y-8">
          <motion.div 
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white dark:bg-stone-900 aspect-video rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl flex flex-col items-center justify-center p-12 text-center relative overflow-hidden"
          >
            <div className="text-6xl font-bold text-stone-900 dark:text-stone-100 mb-4">{shuffledVocab.current[currentIndex].japanese}</div>
            <AnimatePresence>
              {showAnswer && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <div className="text-2xl text-stone-500 font-serif italic">{shuffledVocab.current[currentIndex].romaji}</div>
                  <div className="text-3xl font-bold text-stone-900 dark:text-stone-100">{shuffledVocab.current[currentIndex].meaning}</div>
                </motion.div>
              )}
            </AnimatePresence>
            {!showAnswer && (
              <button onClick={() => setShowAnswer(true)} className="mt-8 text-stone-400 font-bold text-xs uppercase tracking-widest hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Show Answer</button>
            )}
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={!showAnswer}
              onClick={() => handleNext(false)} 
              className="py-5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all disabled:opacity-50"
            >
              Skip
            </button>
            <button 
              disabled={!showAnswer}
              onClick={() => handleNext(true)} 
              className="py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all disabled:opacity-50"
            >
              I Knew It
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-12 rounded-[3rem] text-center shadow-2xl">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-3xl font-editorial italic mb-2">Sprint Finished!</h3>
          <p className="text-stone-400 dark:text-stone-600 mb-8 font-serif italic">You reviewed {score} words in 60 seconds.</p>
          <button onClick={startGame} className="px-12 py-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-full font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-xl">Start New Sprint</button>
        </div>
      )}
    </div>
  );
};
