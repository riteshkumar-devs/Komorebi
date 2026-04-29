import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Search, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

export const WordSearch = ({ onBack }: { onBack: () => void }) => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selecting, setSelecting] = useState<{ r: number, c: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const targetWords = ['ねこ', 'いぬ', 'さかな', 'とり', 'うし'];
  const gridSize = 8;

  const initGrid = useCallback(() => {
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const characters = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';

    targetWords.forEach(word => {
      let placed = false;
      while (!placed) {
        const horizontal = Math.random() > 0.5;
        const row = Math.floor(Math.random() * (gridSize - (horizontal ? 0 : word.length)));
        const col = Math.floor(Math.random() * (gridSize - (horizontal ? word.length : 0)));
        
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const r = horizontal ? row : row + i;
          const c = horizontal ? col + i : col;
          if (newGrid[r][c] !== '' && newGrid[r][c] !== word[i]) {
            fits = false;
            break;
          }
        }

        if (fits) {
          for (let i = 0; i < word.length; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            newGrid[r][c] = word[i];
          }
          placed = true;
        }
      }
    });

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = characters[Math.floor(Math.random() * characters.length)];
        }
      }
    }
    setGrid(newGrid);
    setFoundWords([]);
    setGameOver(false);
  }, []);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  const handleCellClick = (r: number, c: number) => {
    if (gameOver) return;
    const isSelected = selecting.some(s => s.r === r && s.c === c);
    
    // Auto-clear logic: if too many selected and no word found, clear
    if (selecting.length >= 10 && !isSelected) {
      setSelecting([{ r, c }]);
      return;
    }

    let newSelecting: { r: number, c: number }[] = [];
    if (isSelected) {
      newSelecting = selecting.filter(s => !(s.r === r && s.c === c));
    } else {
      newSelecting = [...selecting, { r, c }];
    }
    setSelecting(newSelecting);

    const currentString = newSelecting.map(s => grid[s.r][s.c]).join('');
    if (targetWords.includes(currentString) && !foundWords.includes(currentString)) {
      const nextFound = [...foundWords, currentString];
      setFoundWords(nextFound);
      setSelecting([]);
      if (nextFound.length === targetWords.length) setGameOver(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-4 relative z-10">
          <button onClick={onBack} className="w-10 h-10 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-all hover:scale-110 active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100">Word Search</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-serif italic">Find 5 animal words.</p>
          </div>
        </div>
        <div className="text-right relative z-10">
          <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Found</div>
          <div className="text-xl font-editorial italic text-stone-900 dark:text-stone-100 neon-glow text-stone-900 dark:text-stone-100">{foundWords.length}/{targetWords.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2 p-6 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl relative">
        {grid.map((row, r) => row.map((char, c) => (
          <button 
            key={`${r}-${c}`}
            onClick={() => handleCellClick(r, c)}
            className={cn(
              "aspect-square flex items-center justify-center text-xl font-bold rounded-xl transition-all relative overflow-hidden",
              selecting.some(s => s.r === r && s.c === c) 
                ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-110 z-10 neon-glow" 
                : "hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:scale-105"
            )}
          >
            {char}
          </button>
        )))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {targetWords.map(word => (
          <span key={word} className={cn(
            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-500",
            foundWords.includes(word) 
              ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] strike-through" 
              : "bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-600 border-stone-100 dark:border-stone-800"
          )}>
            {word}
          </span>
        ))}
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-10 rounded-[3rem] text-center shadow-2xl">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-3xl font-editorial italic mb-2">Excellent!</h3>
          <p className="text-stone-400 dark:text-stone-500 mb-8">You found all the hidden words.</p>
          <button onClick={initGrid} className="px-10 py-4 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-full font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">Play Again</button>
        </motion.div>
      )}
    </div>
  );
};
