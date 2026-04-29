import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Timer, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Vocabulary } from '../../types';

export const SpeedQuiz = ({ vocab, onBack }: { vocab: Vocabulary[]; onBack: () => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState<{ word: Vocabulary; options: string[] } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');

  const generateQuestion = useCallback(() => {
    if (vocab.length < 4) return;
    const word = vocab[Math.floor(Math.random() * vocab.length)];
    const options = [word.meaning];
    while (options.length < 4) {
      const randomWord = vocab[Math.floor(Math.random() * vocab.length)].meaning;
      if (!options.includes(randomWord)) options.push(randomWord);
    }
    setCurrentQuestion({ word, options: options.sort(() => Math.random() - 0.5) });
  }, [vocab]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameState('end');
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameState('playing');
    generateQuestion();
  };

  const handleAnswer = (option: string) => {
    if (option === currentQuestion?.word.meaning) {
      setScore(prev => prev + 10);
    }
    generateQuestion();
  };

  if (vocab.length < 4) {
    return (
      <div className="text-center p-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl">
        <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-4">Not enough words</h3>
        <p className="text-stone-500 dark:text-stone-400 mb-8 font-serif italic">Add at least 4 words to your vocabulary to play Speed Quiz.</p>
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
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Speed Quiz</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">How many can you get in 60 seconds?</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Time</div>
            <div className={cn("text-2xl font-editorial italic", timeLeft < 10 ? "text-red-500" : "text-stone-900 dark:text-stone-100")}>{timeLeft}s</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Score</div>
            <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{score}</div>
          </div>
        </div>
      </div>

      {gameState === 'start' ? (
        <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center">
          <Timer className="w-16 h-16 text-stone-900 dark:text-stone-100 mx-auto mb-6" />
          <h3 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100 mb-4">Are you ready?</h3>
          <p className="text-stone-500 dark:text-stone-400 mb-8 font-serif italic">You have 60 seconds to translate as many words as possible.</p>
          <button onClick={startGame} className="px-12 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-100 dark:shadow-none">Start Quiz</button>
        </div>
      ) : gameState === 'playing' ? (
        <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center space-y-10">
          <div className="text-6xl font-bold text-stone-900 dark:text-stone-100">{currentQuestion?.word.japanese}</div>
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion?.options.map((option, i) => (
              <button key={i} onClick={() => handleAnswer(option)} className="p-6 bg-stone-50 dark:bg-stone-800 hover:bg-stone-900 dark:hover:bg-stone-100 hover:text-white dark:hover:text-stone-900 rounded-2xl font-bold transition-all text-lg shadow-sm text-stone-700 dark:text-stone-300">{option}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-12 rounded-[3rem] text-center shadow-2xl">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-3xl font-editorial italic mb-2">Time's Up!</h3>
          <p className="text-stone-400 dark:text-stone-600 mb-8 font-serif italic">Final Score: {score}</p>
          <button onClick={startGame} className="px-12 py-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-full font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-xl">Try Again</button>
        </div>
      )}
    </div>
  );
};
