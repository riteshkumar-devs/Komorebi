import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, List } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ParticleMaster = ({ onBack }: { onBack: () => void }) => {
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<{ sentence: string; answer: string; options: string[] } | null>(null);

  const questions = [
    { sentence: "私は学生___です。", answer: "は", options: ["は", "が", "を", "に"] },
    { sentence: "りんご___食べます。", answer: "を", options: ["を", "は", "が", "も"] },
    { sentence: "学校___行きます。", answer: "に", options: ["に", "で", "を", "は"] },
    { sentence: "公園___遊びます。", answer: "で", options: ["で", "に", "を", "へ"] },
    { sentence: "明日、友達___会います。", answer: "に", options: ["に", "と", "を", "で"] },
    { sentence: "これは母___本です。", answer: "の", options: ["の", "に", "を", "が"] },
    { sentence: "コーヒー___お茶が好きです。", answer: "より", options: ["より", "も", "は", "と"] },
    { sentence: "デパート___買い物をしました。", answer: "で", options: ["で", "に", "を", "へ"] },
    { sentence: "家___帰ります。", answer: "へ", options: ["へ", "で", "を", "が"] },
    { sentence: "猫___います。", answer: "が", options: ["が", "は", "を", "に"] },
  ];

  const [index, setIndex] = useState(0);

  React.useEffect(() => {
    setCurrentQuestion(questions[index]);
  }, [index]);

  const handleAnswer = (option: string) => {
    if (option === currentQuestion?.answer) {
      setScore(prev => prev + 10);
      setMessage('Correct! ✨');
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % questions.length);
        setMessage('');
      }, 1000);
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
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Particle Master</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Choose the correct particle for the sentence.</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Score</div>
          <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{score}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl text-center space-y-10">
        <div className="text-4xl font-bold text-stone-900 dark:text-stone-100 font-japanese leading-relaxed">
          {currentQuestion?.sentence.split('___').map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i === 0 && <span className="mx-2 px-6 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600">?</span>}
            </React.Fragment>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion?.options.map((option, i) => (
            <button key={i} onClick={() => handleAnswer(option)} className="p-6 bg-stone-50 dark:bg-stone-800 hover:bg-stone-900 dark:hover:bg-stone-100 hover:text-white dark:hover:text-stone-900 rounded-2xl font-bold transition-all text-2xl shadow-sm text-stone-700 dark:text-stone-300">{option}</button>
          ))}
        </div>
        {message && <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("font-bold", message.includes('Correct') ? "text-emerald-500" : "text-red-500")}>{message}</motion.p>}
      </div>
    </div>
  );
};
