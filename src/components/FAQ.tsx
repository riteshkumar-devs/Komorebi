import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  X, 
  Plus, 
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';

export const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
  
    const faqs = [
      {
        q: "What is Komorebi?",
        a: "Komorebi is an AI-powered Japanese language learning platform designed to make mastering Japanese intuitive and engaging, specifically for learners in India and worldwide."
      },
      {
        q: "How does the AI Sensei work?",
        a: "Sensei uses state-of-the-art Large Language Models (like Gemini 2.0) to provide context-aware explanations, example sentences, and conversational practice that feels like talking to a native tutor."
      },
      {
        q: "Is it really free?",
        a: "We offer a generous free tier that includes daily AI chat limits, dictionary searches, and vocabulary management. For unlimited access and advanced features, you can upgrade to Premium."
      },
      {
        q: "What is Solo Leveling Ranks?",
        a: "Inspired by the popular series, our ranking system tracks your progress from E-Rank to S-Rank and beyond, based on your vocabulary growth and consistency."
      },
      {
        q: "Can I use it offline?",
        a: "While AI features require an internet connection, your vocabulary list and notes are cached locally for quick review even when you're briefly offline."
      },
      {
        q: "How do I upgrade to Premium?",
        a: "Visit the Subscription tab to see our plans. You can pay via UPI (for Indian users), and once confirmed, your account will be upgraded instantly."
      }
    ];
  
    return (
      <div className="max-w-4xl mx-auto space-y-12 pb-24 px-4 pt-4">
        <header className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-stone-900 rounded-3xl flex items-center justify-center rotate-3 shadow-xl">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-editorial italic text-stone-900 dark:text-stone-100 tracking-tight">Questions & Answers</h1>
            <p className="text-stone-500 font-serif italic text-lg uppercase tracking-widest opacity-60">Everything you need to know about your journey</p>
          </div>
        </header>
  
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "group rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden",
                openIndex === i 
                  ? "bg-white dark:bg-stone-900 border-[#f2a93b] shadow-2xl shadow-amber-100 dark:shadow-none" 
                  : "bg-stone-50 dark:bg-stone-900/50 border-stone-100 dark:border-stone-800 hover:border-stone-200"
              )}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-10 py-8 flex items-center justify-between gap-6 text-left"
              >
                <span className={cn(
                  "text-xl font-editorial leading-tight transition-colors duration-300",
                  openIndex === i ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400"
                )}>
                  {faq.q}
                </span>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                  openIndex === i 
                    ? "bg-[#f2a93b] border-[#f2a93b] rotate-180" 
                    : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                )}>
                  <ChevronDown className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    openIndex === i ? "text-white" : "text-stone-400"
                  )} />
                </div>
              </button>
  
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                  >
                    <div className="px-10 pb-10">
                      <div className="h-px bg-stone-100 dark:bg-stone-800 mb-8" />
                      <p className="text-stone-600 dark:text-stone-300 font-serif leading-relaxed text-lg italic">
                        {faq.a}
                      </p>
                      <div className="mt-8 flex gap-3">
                         <div className="px-4 py-2 bg-stone-50 dark:bg-stone-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-400">Helpful info</div>
                         <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#f2a93b]">Learning Guide</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    );
};
