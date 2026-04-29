import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Zap, Trees } from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';

export const OnboardingFlow = ({ onComplete }: { onComplete: (data: any) => Promise<void> }) => {
  const [step, setStep] = useState(0); // Starts at 0 for welcome
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '',
    dob: '',
    careerGoal: '',
    dailyGoal: 10
  });

  const handleFinish = async () => {
    setLoading(true);
    try {
      await onComplete(data);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const projectionData = Array.from({ length: 13 }).map((_, i) => {
    const months = i * 1;
    const wordsPerDay = data.dailyGoal;
    const totalWords = months * 30 * wordsPerDay;
    return {
      name: `Month ${months}`,
      level: totalWords,
      average: months * 50 // Assume avg learner knows 50 words per month
    };
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#1c1917] rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-8 sm:p-12 overflow-hidden border border-white/20"
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center text-center space-y-10"
            >
              <div className="w-24 h-24 bg-stone-900 dark:bg-stone-100 rounded-[2.5rem] flex items-center justify-center text-white dark:text-stone-900 text-5xl font-bold shadow-2xl relative">
                木
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-stone-900 dark:bg-stone-100 rounded-[2.5rem] -z-10 blur-2xl" 
                />
              </div>
              <div className="space-y-4 max-w-sm">
          <div className="flex flex-col">
            <h1 className="text-5xl font-editorial italic tracking-tight text-stone-900 dark:text-stone-100">Komorebi</h1>
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#f2a93b] mt-2 italic">Japanese Language Platform</span>
          </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed italic font-serif text-lg">
                  "The sunlight filtering through the trees."
                </p>
                <p className="text-stone-400 dark:text-stone-500 text-sm leading-relaxed p-6 bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-stone-100 dark:border-stone-800">
                  Welcome to your journey toward Japanese mastery. We'll need a few details to personalize your experience.
                </p>
              </div>
              <button 
                onClick={nextStep}
                className="px-12 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:scale-105 transition-all shadow-xl flex items-center gap-3"
              >
                Begin Your Path <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Step 01 / 04</span>
                <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 leading-tight">First, what is<br />your name?</h2>
              </div>
              <input 
                autoFocus
                value={data.name}
                onChange={(e) => setData({...data, name: e.target.value})}
                placeholder="Type your name here..."
                className="w-full text-3xl font-medium bg-transparent border-b-2 border-stone-100 dark:border-stone-800 pb-4 outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors placeholder:text-stone-200 dark:placeholder:text-stone-800"
              />
              <div className="flex justify-end">
                <button 
                  disabled={!data.name.trim()}
                  onClick={nextStep}
                  className="px-10 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:scale-105 transition-all disabled:opacity-30 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Step 02 / 04</span>
                <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 leading-tight">When were<br />you born?</h2>
              </div>
              <input 
                type="date"
                autoFocus
                value={data.dob}
                onChange={(e) => setData({...data, dob: e.target.value})}
                className="w-full text-3xl font-medium bg-transparent border-b-2 border-stone-100 dark:border-stone-800 pb-4 outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors"
              />
              <div className="flex justify-between items-center pt-8">
                <button onClick={prevStep} className="text-stone-400 font-bold uppercase tracking-widest text-[10px] hover:text-stone-900 dark:hover:text-stone-100">Back</button>
                <button 
                  disabled={!data.dob}
                  onClick={nextStep}
                  className="px-10 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:scale-105 transition-all disabled:opacity-30 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Step 03 / 05</span>
                <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 leading-tight">Your daily<br />commitment?</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[5, 10, 15, 20].map(goal => (
                  <button
                    key={goal}
                    onClick={() => {
                      setData({...data, dailyGoal: goal});
                      nextStep();
                    }}
                    className={cn(
                      "p-8 rounded-[2rem] border-2 transition-all text-left group",
                      data.dailyGoal === goal 
                        ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100" 
                        : "bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600"
                    )}
                  >
                    <span className={cn(
                      "text-4xl font-display font-medium block",
                      data.dailyGoal === goal ? "text-white dark:text-stone-900" : "text-stone-400"
                    )}>{goal}</span>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider block mt-1",
                      data.dailyGoal === goal ? "text-white/60 dark:text-stone-900/60" : "text-stone-300"
                    )}>Words / Day</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-start">
                <button onClick={prevStep} className="text-stone-400 font-bold uppercase tracking-widest text-[10px] hover:text-stone-900 dark:hover:text-stone-100">Back</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Step 04 / 05</span>
                <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 leading-tight">How will Japanese<br />help your career?</h2>
              </div>
              <textarea 
                autoFocus
                value={data.careerGoal}
                onChange={(e) => setData({...data, careerGoal: e.target.value})}
                placeholder="E.g. I want to work at a tech company in Tokyo..."
                rows={3}
                className="w-full text-xl font-medium bg-stone-50 dark:bg-stone-900 rounded-3xl p-6 outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800 transition-all border border-stone-100 dark:border-stone-800"
              />
              <div className="flex justify-between items-center">
                <button onClick={prevStep} className="text-stone-400 font-bold uppercase tracking-widest text-[10px] hover:text-stone-900 dark:hover:text-stone-100">Back</button>
                <button 
                  disabled={!data.careerGoal.trim()}
                  onClick={nextStep}
                  className="px-10 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:scale-105 transition-all disabled:opacity-30 flex items-center gap-2"
                >
                  See Projection <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Your Potential Journey</h2>
                    <p className="text-xs text-stone-400">Based on {data.dailyGoal} words per day</p>
                  </div>
                </div>

                <div className="h-64 sm:h-80 w-full bg-stone-50 dark:bg-stone-900/50 rounded-[2.5rem] p-6 border border-stone-100 dark:border-stone-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
                      <defs>
                        <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f2a93b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f2a93b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb33" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} fill="#888" />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} fill="#888" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px' }}
                        itemStyle={{ color: '#f2a93b' }}
                      />
                      <Area type="monotone" dataKey="level" stroke="#f2a93b" strokeWidth={3} fillOpacity={1} fill="url(#colorLevel)" name="Your Progress" />
                      <Area type="monotone" dataKey="average" stroke="#888" strokeWidth={1} strokeDasharray="5 5" fillOpacity={0} name="Avg. Person in India" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-3xl border border-orange-100/50 dark:border-orange-900/20">
                    <div className="text-2xl font-bold text-orange-600">{data.dailyGoal * 30}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-orange-400">Words in 1 Month</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-3xl border border-emerald-100/50 dark:border-emerald-900/20">
                    <div className="text-2xl font-bold text-emerald-600">{Math.round(((data.dailyGoal * 30) / 150) * 100 - 100)}%</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">vs Avg. Indian</div>
                  </div>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400 text-center italic font-serif leading-relaxed px-4">
                  In just 12 months, you'll know over {data.dailyGoal * 360} words. That's enough to understand {data.dailyGoal >= 15 ? '98%' : '90%'} of everyday Japanese conversations.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  disabled={loading}
                  onClick={handleFinish}
                  className="w-full py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trees className="w-5 h-5" />
                      Begin Your Awakening
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
