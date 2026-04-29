import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Vocabulary } from '../../types';

export const SentenceBuilder = ({ vocab, onBack }: { vocab: Vocabulary[]; onBack: () => void }) => {
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<{ original: string; scrambled: string[]; answer: string; meaning: string } | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  const questions = [
    { original: "私は学生です。", scrambled: ["私は", "学生", "です。"], answer: "私は学生です。", meaning: "I am a student." },
    { original: "これはペンです。", scrambled: ["これは", "ペン", "です。"], answer: "これはペンです。", meaning: "This is a pen." },
    { original: "明日、学校へ行きます。", scrambled: ["明日、", "学校へ", "行きます。"], answer: "明日、学校へ行きます。", meaning: "I will go to school tomorrow." },
    { original: "日本語を勉強します。", scrambled: ["日本語を", "勉強", "します。"], answer: "日本語を勉強します。", meaning: "I study Japanese." },
    { original: "テレビを見ます。", scrambled: ["テレビを", "見ます。"], answer: "テレビを見ます。", meaning: "I watch TV." },
  ];

  const [index, setIndex] = useState(0);

  const generateQuestion = useCallback(() => {
    const q = questions[index];
    setCurrentQuestion({
      ...q,
      scrambled: [...q.scrambled].sort(() => Math.random() - 0.5)
    });
    setSelectedWords([]);
    setMessage('');
  }, [index]);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  const toggleWord = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(prev => prev.filter(w => w !== word));
    } else {
      setSelectedWords(prev => [...prev, word]);
    }
  };

  const checkSentence = () => {
    if (selectedWords.join('') === currentQuestion?.answer) {
      setScore(prev => prev + 20);
      setMessage('Correct! ✨');
      setTimeout(() => {
        setIndex(prev => (prev + 1) % questions.length);
      }, 1500);
    } else {
      setMessage('Try again! ❌');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 shadow-sm transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Sentence Builder</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Arrange words to form the correct sentence.</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Score</div>
          <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{score}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center space-y-10">
        <div className="space-y-4">
          <p className="text-stone-400 dark:text-stone-500 font-serif italic">Meaning: {currentQuestion?.meaning}</p>
          <div className="min-h-[80px] p-6 bg-stone-50 dark:bg-stone-800 rounded-2xl flex flex-wrap justify-center gap-3 border border-stone-100 dark:border-stone-700">
            {selectedWords.map((word, i) => (
              <motion.button 
                key={i} 
                layoutId={`word-${word}`}
                onClick={() => toggleWord(word)}
                className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-japanese font-bold text-lg"
              >
                {word}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {currentQuestion?.scrambled.filter(w => !selectedWords.includes(w)).map((word, i) => (
            <motion.button 
              key={i}
              layoutId={`word-${word}`}
              onClick={() => toggleWord(word)}
              className="px-6 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl font-japanese font-bold text-lg shadow-sm hover:border-stone-400 dark:hover:border-stone-500 transition-all text-stone-900 dark:text-stone-100"
            >
              {word}
            </motion.button>
          ))}
        </div>

        <div className="pt-4 space-y-4">
          <button 
            disabled={selectedWords.length === 0}
            onClick={checkSentence}
            className="w-full py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-100 dark:shadow-none disabled:opacity-50"
          >
            Check Sentence
          </button>
          {message && <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("font-bold", message.includes('Correct') ? "text-emerald-500" : "text-red-500")}>{message}</motion.p>}
        </div>
      </div>
    </div>
  );
};
