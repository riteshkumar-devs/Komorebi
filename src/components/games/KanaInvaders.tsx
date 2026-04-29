import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Gamepad2, Trophy, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { hiragana, katakana } from '../../lib/constants';

interface Invader {
  id: number;
  kana: string;
  romaji: string;
  x: number;
  y: number;
  speed: number;
}

export const KanaInvaders = ({ onBack }: { onBack: () => void }) => {
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const gameRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const spawnInvader = useCallback(() => {
    const pool = hiragana.concat(katakana);
    const char = pool[Math.floor(Math.random() * pool.length)];
    const newInvader: Invader = {
      id: nextId.current++,
      kana: char.kana,
      romaji: char.romaji,
      x: Math.random() * 80 + 10,
      y: -50,
      speed: Math.random() * (0.5 + level * 0.1) + 0.5
    };
    setInvaders(prev => [...prev, newInvader]);
  }, [level]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(spawnInvader, Math.max(2000 - level * 100, 800));
    return () => clearInterval(interval);
  }, [spawnInvader, gameOver, level]);

  useEffect(() => {
    if (gameOver) return;
    const gameLoop = setInterval(() => {
      setInvaders(prev => {
        const next = prev.map(inv => ({ ...inv, y: inv.y + inv.speed }));
        const missed = next.filter(inv => inv.y > 500);
        if (missed.length > 0) {
          setLives(l => {
            const nextL = l - missed.length;
            if (nextL <= 0) setGameOver(true);
            return Math.max(0, nextL);
          });
        }
        return next.filter(inv => inv.y <= 500);
      });
    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameOver]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setInput(val);
    const hitIndex = invaders.findIndex(inv => inv.romaji.toLowerCase() === val);
    if (hitIndex !== -1) {
      setInvaders(prev => prev.filter((_, i) => i !== hitIndex));
      setScore(s => {
        const nextS = s + 10;
        if (nextS % 100 === 0) setLevel(l => l + 1);
        return nextS;
      });
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100">Kana Invaders</h2>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest">Level {level}</p>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Score</div>
            <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{score}</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Lives</div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} className={cn("w-5 h-5", i < lives ? "text-red-500 fill-current" : "text-stone-200 dark:text-stone-800")} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={gameRef}
        className="h-[500px] bg-stone-900 dark:bg-stone-950 rounded-[3.5rem] relative overflow-hidden border-8 border-stone-800 dark:border-stone-900 shadow-2xl"
      >
        <AnimatePresence>
          {invaders.map(inv => (
            <motion.div
              key={inv.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute text-white dark:text-[#f2a93b] font-japanese font-bold text-4xl select-none"
              style={{ left: `${inv.x}%`, top: `${inv.y}px` }}
            >
              {inv.kana}
            </motion.div>
          ))}
        </AnimatePresence>

        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm"
          >
            <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-4xl font-editorial italic text-white mb-2">Game Over</h3>
            <p className="text-stone-400 mb-8">Final Score: {score}</p>
            <button 
              onClick={() => {
                setInvaders([]);
                setScore(0);
                setLives(3);
                setGameOver(false);
                setLevel(1);
              }} 
              className="px-10 py-4 bg-white text-stone-900 rounded-full font-bold hover:bg-stone-50 transition-all shadow-xl"
            >
              Restart Mission
            </button>
          </motion.div>
        )}
      </div>

      <div className="max-w-md mx-auto">
        <input 
          autoFocus
          value={input}
          onChange={handleInput}
          disabled={gameOver}
          placeholder="TYPE ROMAJI..."
          className="w-full p-6 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-3xl text-center text-2xl font-bold tracking-[0.2em] outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-200 dark:placeholder:text-stone-800"
        />
        <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-4">Characters fall faster as you progress</p>
      </div>
    </div>
  );
};
