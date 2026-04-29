import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  ChevronLeft, 
  Volume2, 
  BookOpen 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Vocabulary } from '../types';
import { useTTSContext } from '../context/TTSContext';

export const Flashcards = ({ vocab }: { vocab: Vocabulary[] }) => {
  const [step, setStep] = useState<'intro' | 'session'>('intro');
  const [sessionVocab, setSessionVocab] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { play, loading: ttsLoading } = useTTSContext();

  const startSession = (count: number) => {
    const shuffled = [...vocab].sort(() => 0.5 - Math.random());
    setSessionVocab(shuffled.slice(0, Math.min(count, vocab.length)));
    setCurrentIndex(0);
    setIsFlipped(false);
    setStep('session');
  };

  if (vocab.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-stone-200 dark:text-stone-800 mx-auto mb-4" />
        <h3 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100 mb-1">Your collection is empty</h3>
        <p className="text-stone-500 dark:text-stone-400 font-serif italic text-sm">Add some words to start reviewing with flashcards.</p>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="max-w-xl mx-auto text-center py-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-50 dark:border-stone-800 shadow-sm space-y-12">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-stone-900 dark:bg-stone-100 rounded-3xl mx-auto flex items-center justify-center shadow-lg -rotate-3 text-white dark:text-stone-900">
            <Layers className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100">Flashcard Review</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic">How many cards do you want to review?</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-8">
          {[10, 15, 20].map(count => (
            <button
              key={count}
              onClick={() => startSession(count)}
              className="py-4 rounded-2xl font-bold text-sm transition-all border-2 border-stone-50 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 text-stone-900 dark:text-stone-100"
            >
              {count}
            </button>
          ))}
          <button
            onClick={() => startSession(vocab.length)}
            className="py-4 rounded-2xl font-bold text-sm transition-all border-2 border-stone-50 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 text-stone-900 dark:text-stone-100"
          >
            All
          </button>
        </div>
      </div>
    );
  }

  const current = sessionVocab[currentIndex];

  return (
    <div className="max-w-md mx-auto py-2">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setStep('intro')}
            className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100">Review</h2>
        </div>
        <span className="text-stone-400 dark:text-stone-500 font-mono text-[10px]">{currentIndex + 1} / {sessionVocab.length}</span>
      </div>

      <div 
        className="relative h-64 w-full perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          className="w-full h-full relative preserve-3d"
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-stone-900 rounded-[1.5rem] shadow-md border border-stone-100 dark:border-stone-800 flex flex-col items-center justify-center p-6 text-center">
            <div className="absolute top-3 right-3 text-white dark:text-stone-900">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  play(current.japanese);
                }}
                disabled={ttsLoading}
                className="p-1.5 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all font-bold"
              >
                <Volume2 className={cn("w-3.5 h-3.5", ttsLoading && "animate-pulse")} />
              </button>
            </div>
            <span className="text-4xl font-serif mb-1 text-stone-900 dark:text-stone-100">{current.japanese}</span>
            <span className="text-stone-400 dark:text-stone-500 font-mono tracking-widest uppercase text-[8px]">{current.romaji}</span>
            <p className="mt-6 text-stone-300 dark:text-stone-700 text-[8px] uppercase tracking-widest font-bold">Click to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 backface-hidden bg-stone-900 dark:bg-stone-100 rounded-[1.5rem] shadow-md flex flex-col items-center justify-center p-6 text-center"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="text-xl font-editorial italic text-white dark:text-stone-900 mb-1">{current.meaning}</span>
            <p className="mt-6 text-stone-500 dark:text-stone-400 text-[8px] uppercase tracking-widest font-bold">Click to flip back</p>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 flex justify-between gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(false);
            setCurrentIndex(prev => (prev === 0 ? sessionVocab.length - 1 : prev - 1));
          }}
          className="flex-1 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 rounded-full font-bold text-xs hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
        >
          Previous
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(false);
            setCurrentIndex(prev => (prev === sessionVocab.length - 1 ? 0 : prev + 1));
          }}
          className="flex-1 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold text-xs hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-sm shadow-stone-200 dark:shadow-none"
        >
          Next
        </button>
      </div>
    </div>
  );
};
