import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Volume2 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Vocabulary } from '../types';
import { useTTSContext } from '../context/TTSContext';

export const Quiz = ({ vocab }: { vocab: Vocabulary[] }) => {
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizVocab, setQuizVocab] = useState<Vocabulary[]>([]);
  const { play, loading: ttsLoading } = useTTSContext();

  const startQuiz = (count: number) => {
    const shuffled = [...vocab].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, vocab.length));
    setQuizVocab(selected);
    setQuestionCount(selected.length);
    setStep('quiz');
    setCurrentQuestion(0);
    setScore(0);
  };

  useEffect(() => {
    if (quizVocab.length > 0 && step === 'quiz' && currentQuestion < quizVocab.length) {
      generateQuestion();
    }
  }, [currentQuestion, quizVocab, step]);

  const generateQuestion = () => {
    const current = quizVocab[currentQuestion];
    const others = vocab.filter(v => v.id !== current.id);
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
    const choices = [current.meaning, ...shuffledOthers.slice(0, 3).map(v => v.meaning)];
    setOptions(choices.sort(() => 0.5 - Math.random()));
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const handleAnswer = (option: string) => {
    if (selectedOption) return;
    const current = quizVocab[currentQuestion];
    const correct = option === current.meaning;
    setSelectedOption(option);
    setIsCorrect(correct);
    if (correct) setScore(score + 1);

    setTimeout(() => {
      if (currentQuestion + 1 >= quizVocab.length) {
        setStep('result');
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    }, 1500);
  };

  if (vocab.length < 4) {
    return (
      <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-50 dark:border-stone-800">
        <Brain className="w-16 h-16 text-stone-200 dark:text-stone-800 mx-auto mb-6" />
        <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Not enough words</h3>
        <p className="text-stone-500 dark:text-stone-400 font-serif italic">You need at least 4 words in your library to start practice.</p>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="max-w-xl mx-auto text-center py-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-50 dark:border-stone-800 shadow-sm space-y-12">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-stone-900 dark:bg-stone-100 rounded-3xl mx-auto flex items-center justify-center shadow-lg rotate-3 text-white dark:text-stone-900">
            <Brain className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100">Practice Session</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic">Select how many words you want to practice today.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 px-12">
          {[5, 10, 15, 20].map(count => (
            <button
              key={count}
              onClick={() => startQuiz(count)}
              disabled={vocab.length < count && count !== 5}
              className={cn(
                "py-4 rounded-2xl font-bold text-sm transition-all border-2",
                vocab.length >= count || count === 5
                  ? "border-stone-100 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 text-stone-900 dark:text-stone-100"
                  : "border-stone-50 dark:border-stone-900 text-stone-200 dark:text-stone-800 cursor-not-allowed"
              )}
            >
              {count} Words
            </button>
          ))}
          <button
            onClick={() => startQuiz(vocab.length)}
            className="col-span-2 py-4 rounded-2xl font-bold text-sm transition-all border-2 border-stone-100 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 text-stone-900 dark:text-stone-100"
          >
            All Words ({vocab.length})
          </button>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="max-w-xl mx-auto text-center py-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-50 dark:border-stone-800 shadow-sm">
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-8 animate-bounce" />
        <h2 className="text-5xl font-editorial italic text-stone-900 dark:text-stone-100 mb-4">Practice Complete!</h2>
        <p className="text-2xl text-stone-500 dark:text-stone-400 font-serif mb-12">You scored {score} out of {questionCount}</p>
        <button 
          onClick={() => setStep('intro')}
          className="px-12 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-100 dark:shadow-none"
        >
          Practice Again
        </button>
      </div>
    );
  }

  const current = quizVocab[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Practice</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic">Testing your knowledge of your library.</p>
        </div>
        <div className="text-right self-end md:self-auto">
          <span className="text-stone-400 dark:text-stone-500 font-mono text-xs uppercase tracking-widest block mb-1">Progress</span>
          <span className="text-2xl font-serif text-stone-900 dark:text-stone-100">{currentQuestion + 1} / {questionCount}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 p-12 rounded-[3rem] shadow-sm border border-stone-50 dark:border-stone-800 mb-12 text-center relative">
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => play(current.japanese)}
            disabled={ttsLoading}
            className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-all active:scale-90"
          >
            <Volume2 className={cn("w-5 h-5", ttsLoading && "animate-pulse")} />
          </button>
        </div>
        <span className="text-stone-400 dark:text-stone-500 font-mono text-xs uppercase tracking-widest block mb-8">What does this mean?</span>
        <h3 className="text-7xl font-serif text-stone-900 dark:text-stone-100 mb-4">{current.japanese}</h3>
        <p className="text-stone-400 dark:text-stone-500 font-mono tracking-[0.3em] uppercase">{current.romaji}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={cn(
              "w-full p-6 text-left rounded-3xl border-2 transition-all flex items-center justify-between group",
              selectedOption === option
                ? isCorrect 
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-900 dark:text-emerald-400" 
                  : "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-400"
                : selectedOption && option === current.meaning
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-900 dark:text-emerald-400"
                  : "bg-white dark:bg-stone-900 border-stone-50 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 text-stone-600 dark:text-stone-400"
            )}
          >
            <span className="text-lg font-editorial italic">{option}</span>
            {selectedOption === option && (
              isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
