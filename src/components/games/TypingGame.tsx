import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Brain, Play } from 'lucide-react';
import { cn, safeStorage } from '../../lib/utils';
import { Vocabulary } from '../../types';
import { hiragana, katakana } from '../../lib/constants';

export const TypingGame = ({ vocab, onBack }: { vocab: Vocabulary[]; onBack: () => void }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<{ id: number; text: string; romaji: string; x: number; y: number; speed: number }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [highScore, setHighScore] = useState(() => Number(safeStorage.getItem('komorebi_game_highscore') || 0));
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const startLevel = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setGameStarted(true);
    setScore(0);
    setBubbles([]);
    setGameOver(false);
    setInputValue('');
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const getBaseInterval = () => {
      switch (difficulty) {
        case 'easy': return 3500;
        case 'medium': return 2500;
        case 'hard': return 1500;
      }
    };

    const interval = setInterval(() => {
      const source = vocab.length > 5 ? vocab : (hiragana.concat(katakana) as any[]);
      const item = source[Math.floor(Math.random() * source.length)];
      
      let text, romaji;
      if ('japanese' in item) {
        text = item.japanese;
        romaji = item.romaji;
      } else {
        text = item.kana;
        romaji = item.romaji;
      }

      const getBaseSpeed = () => {
        switch (difficulty) {
          case 'easy': return 0.2;
          case 'medium': return 0.4;
          case 'hard': return 0.6;
        }
      };

      const newBubble = {
        id: nextId.current++,
        text,
        romaji: romaji.toLowerCase(),
        x: Math.random() * 80 + 10,
        y: -10,
        speed: getBaseSpeed() + Math.random() * 0.5 + (score / 200)
      };
      setBubbles(prev => [...prev, newBubble]);
    }, getBaseInterval() - Math.min(score * 15, getBaseInterval() * 0.7));

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, vocab, score, difficulty]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const animationFrame = requestAnimationFrame(function animate() {
      setBubbles(prev => {
        const next = prev.map(b => ({ ...b, y: b.y + b.speed }));
        if (next.some(b => b.y > 100)) {
          setGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            safeStorage.setItem('komorebi_game_highscore', score.toString());
          }
          return next;
        }
        return next;
      });
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [gameStarted, gameOver, score, highScore]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setInputValue(val);

    const matchIndex = bubbles.findIndex(b => b.romaji === val);
    if (matchIndex !== -1) {
      setScore(prev => prev + 10);
      setBubbles(prev => prev.filter((_, i) => i !== matchIndex));
      setInputValue('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[750px] flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-1">Typing Game</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Type the romaji before the bubbles hit the ground.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Score</div>
            <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{score}</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">High Score</div>
            <div className="text-2xl font-editorial italic text-stone-400 dark:text-stone-600">{highScore}</div>
          </div>
        </div>
      </div>

      <div 
        ref={gameAreaRef}
        className="flex-1 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-inner relative overflow-hidden"
      >
        {!gameStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-stone-900 dark:text-stone-100" />
            </div>
            <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Ready to type?</h3>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-sm mb-8 max-w-xs">
              Bubbles will fall with Japanese characters. Type their romaji equivalents to pop them.
            </p>
            
            <div className="flex gap-3 mb-8">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                    difficulty === d 
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-lg" 
                      : "bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            <button 
              onClick={() => startLevel(difficulty)}
              className="px-12 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-100 dark:shadow-none flex items-center gap-2"
            >
              <Play className="w-5 h-5" /> Start Game
            </button>
          </div>
        ) : gameOver ? (
          <div className="absolute inset-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20">
            <h3 className="text-4xl font-editorial italic text-red-600 mb-2">Game Over</h3>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg mb-8">Final Score: {score}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => startLevel(difficulty)}
                className="px-10 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-100 dark:shadow-none"
              >
                Try Again
              </button>
              <button 
                onClick={() => setGameStarted(false)}
                className="px-10 py-4 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-full font-bold hover:bg-stone-100 dark:hover:bg-stone-700 transition-all"
              >
                Menu
              </button>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {bubbles.map(bubble => (
                <motion.div
                  key={bubble.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.2 } }}
                  style={{ 
                    position: 'absolute', 
                    left: `${bubble.x}%`, 
                    top: `${bubble.y}%`,
                    transform: 'translateX(-50%)'
                  }}
                  className="w-14 h-14 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-full shadow-lg flex flex-col items-center justify-center z-10"
                >
                  <span className="text-base font-bold text-stone-900 dark:text-stone-100">{bubble.text}</span>
                  <div className="text-[6px] font-mono text-stone-300 dark:text-stone-600 uppercase tracking-tighter mt-0.5">{bubble.romaji}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-red-50 dark:bg-red-950/20 border-t border-red-100 dark:border-red-900/30" />
          </>
        )}
      </div>

      {gameStarted && !gameOver && (
        <div className="mt-8 w-full max-w-xs mx-auto px-4">
          <input 
            autoFocus
            value={inputValue}
            onChange={handleInput}
            placeholder="Type romaji..."
            className="w-full p-4 bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-100 rounded-2xl shadow-2xl text-center font-mono text-lg outline-none focus:ring-4 ring-stone-100 dark:ring-stone-800 transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600"
          />
        </div>
      )}
    </div>
  );
};
