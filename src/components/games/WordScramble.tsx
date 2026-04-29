import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Vocabulary } from '../../types';

export const WordScramble = ({ vocab, onBack }: { vocab: Vocabulary[]; onBack: () => void }) => {
  const [currentWord, setCurrentWord] = useState<Vocabulary | null>(null);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const nextWord = useCallback(() => {
    if (vocab.length === 0) return;
    const word = vocab[Math.floor(Math.random() * vocab.length)];
    setCurrentWord(word);
    const chars = word.japanese.split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setScrambled(chars.join(''));
    setInput('');
    setMessage('');
  }, [vocab]);

  useEffect(() => {
    nextWord();
  }, [nextWord]);

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === currentWord?.japanese) {
      setScore(prev => prev + 10);
      setMessage('Correct! ✨');
      setTimeout(nextWord, 1000);
    } else {
      setMessage('Try again! ❌');
    }
  };

  if (vocab.length < 3) {
    return (
      <div className="text-center p-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
        <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-4">Not enough words</h3>
        <p className="text-stone-500 dark:text-stone-400 mb-8 font-serif italic">Add at least 3 words to your vocabulary to play Word Scramble.</p>
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
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Word Scramble</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Unscramble the Japanese word.</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Score</div>
          <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{score}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center space-y-8">
        <div className="text-5xl font-bold tracking-widest text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-800 py-10 rounded-3xl">{scrambled}</div>
        <p className="text-stone-400 dark:text-stone-500 font-serif italic">Meaning: {currentWord?.meaning}</p>
        
        <form onSubmit={checkAnswer} className="space-y-4">
          <input 
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type the correct word..."
            className="w-full p-5 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl text-center text-2xl font-medium focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 outline-none transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600"
          />
          <button type="submit" className="w-full py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-100 dark:shadow-none">Check Answer</button>
        </form>
        {message && <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("font-bold", message.includes('Correct') ? "text-emerald-500" : "text-red-500")}>{message}</motion.p>}
      </div>
    </div>
  );
};
