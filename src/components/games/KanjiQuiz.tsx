import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Book, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Vocabulary } from '../../types';

export const KanjiQuiz = ({ vocab, onBack }: { vocab: Vocabulary[]; onBack: () => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState<{ word: Vocabulary; options: string[] } | null>(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const generateQuestion = useCallback(() => {
    const kanjiWords = vocab.filter(v => /[\u4e00-\u9faf]/.test(v.japanese));
    if (kanjiWords.length < 4) return;
    
    const word = kanjiWords[Math.floor(Math.random() * kanjiWords.length)];
    const options = [word.meaning];
    while (options.length < 4) {
      const randomWord = vocab[Math.floor(Math.random() * vocab.length)].meaning;
      if (!options.includes(randomWord)) options.push(randomWord);
    }
    setCurrentQuestion({ word, options: options.sort(() => Math.random() - 0.5) });
    setMessage('');
  }, [vocab]);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  const handleAnswer = (option: string) => {
    if (option === currentQuestion?.word.meaning) {
      setScore(prev => prev + 10);
      setMessage('Correct! ✨');
      setTimeout(generateQuestion, 1000);
    } else {
      setMessage('Try again! ❌');
    }
  };

  if (vocab.filter(v => /[\u4e00-\u9faf]/.test(v.japanese)).length < 4) {
    return (
      <div className="text-center p-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
        <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-4">Not enough Kanji</h3>
        <p className="text-stone-500 dark:text-stone-400 mb-8 font-serif italic">Add at least 4 words containing Kanji to your vocabulary to play Kanji Quiz.</p>
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
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Kanji Quiz</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Match the Kanji to its meaning.</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Score</div>
          <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{score}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center space-y-10">
        <div className="text-8xl font-bold text-stone-900 dark:text-stone-100 font-japanese">{currentQuestion?.word.japanese}</div>
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion?.options.map((option, i) => (
            <button key={i} onClick={() => handleAnswer(option)} className="p-6 bg-stone-50 dark:bg-stone-800 hover:bg-stone-900 dark:hover:bg-stone-100 hover:text-white dark:hover:text-stone-900 rounded-2xl font-bold transition-all text-xl shadow-sm text-stone-700 dark:text-stone-300">{option}</button>
          ))}
        </div>
        {message && <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("font-bold", message.includes('Correct') ? "text-emerald-500" : "text-red-500")}>{message}</motion.p>}
      </div>
    </div>
  );
};
