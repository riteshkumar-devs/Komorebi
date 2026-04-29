import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Flame, 
  BookOpen,
  Trophy,
  Activity,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isAfter, isBefore } from 'date-fns';
import { Vocabulary, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface WeeklyStatsProps {
  vocab: Vocabulary[];
  profile: UserProfile | null;
  onBack: () => void;
}

export const WeeklyStats = ({ vocab, profile, onBack }: WeeklyStatsProps) => {
  const streak = profile?.streakCount || 0;
  
  // Calculate stats for the last 7 days
  const chartData = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));
    
    return last7Days.map(day => {
      const dayVocab = vocab.filter(v => {
        const createDate = v.createdAt?.toDate ? v.createdAt.toDate() : new Date(v.createdAt as any);
        return isSameDay(createDate, day);
      });
      const count = dayVocab.length;
      const masteryAvg = count > 0 
        ? dayVocab.reduce((acc, curr) => acc + (curr.mastery || 0), 0) / count 
        : 0;
      
      return {
        name: format(day, 'EEE'),
        fullDate: format(day, 'MMMM do'),
        count,
        mastery: Math.round(masteryAvg),
        isToday: isSameDay(day, today)
      };
    });
  }, [vocab]);

  const peakDay = useMemo(() => {
    return [...chartData].sort((a, b) => b.count - a.count)[0];
  }, [chartData]);

  const totalThisWeek = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const avgPerDay = (totalThisWeek / 7).toFixed(1);

  // Calendar logic (Current Month)
  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    // Show 4 weeks for better perspective
    const monthStart = subDays(start, 21); 
    const days = eachDayOfInterval({ start: monthStart, end });
    
    return days.map(day => {
      const dayVocab = vocab.filter(v => {
        const createDate = v.createdAt?.toDate ? v.createdAt.toDate() : new Date(v.createdAt as any);
        return isSameDay(createDate, day);
      });
      const count = dayVocab.length;
      
      return {
        date: day,
        dayNum: format(day, 'd'),
        hasActivity: count > 0,
        intensity: count > 5 ? 'high' : count > 2 ? 'medium' : count > 0 ? 'low' : 'none',
        count,
        isToday: isSameDay(day, new Date())
      };
    });
  }, [vocab]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm sticky top-4 z-40 backdrop-blur-md bg-white/80 dark:bg-stone-900/80">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all border border-stone-200 dark:border-stone-700 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100">Learning Insights</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Comprehensive Activity Report</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800 px-4 py-2 rounded-2xl border border-stone-200 dark:border-stone-700">
           <Activity className="w-4 h-4 text-[#f2a93b]" />
           <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Live Status</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Stats Summary */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2a93b]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#f2a93b]/10 transition-colors" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Weekly Vocabulary</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-editorial italic text-stone-900 dark:text-stone-100 neon-glow">{totalThisWeek}</span>
                    <span className="text-xs font-bold text-stone-400">WORDS</span>
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Healthy
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF' }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-stone-900 text-white px-3 py-2 rounded-xl text-[10px] font-bold shadow-xl border border-stone-800">
                              <p className="mb-1">{payload[0].payload.fullDate}</p>
                              <p className="text-[#f2a93b]">{payload[0].value} words added</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isToday ? '#f2a93b' : '#3c6e71'} 
                          fillOpacity={entry.count > 0 ? 1 : 0.1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center sm:text-left">Efficiency</p>
                <p className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 text-center sm:text-left">{avgPerDay} <span className="text-[10px] text-stone-400">/ DAY</span></p>
              </div>
            </div>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center sm:text-left">Active Streak</p>
                <p className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 text-center sm:text-left">{streak} <span className="text-[10px] text-stone-400">DAYS</span></p>
              </div>
            </div>
          </div>
          
          <div className="bg-stone-900 dark:bg-[#f2a93b]/10 text-white dark:text-[#f2a93b] p-6 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Peak Performance</p>
               <h4 className="text-xl font-editorial italic">{peakDay.fullDate}</h4>
               <p className="text-xs mt-1 font-medium italic opacity-80">You conquered {peakDay.count} new words in a single day.</p>
            </div>
            <div className="bg-white/10 dark:bg-[#f2a93b]/20 p-4 rounded-2xl relative z-10 shrink-0">
               <TrendingUp className="w-8 h-8 text-[#f2a93b]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </motion.div>

        {/* Sidebar / Calendar */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#f2a93b]" />
                Recent Flow
              </h3>
              <span className="text-[10px] font-bold text-stone-400">{format(new Date(), 'MMMM')}</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={`head-${i}`} className="text-[8px] font-bold text-stone-300 text-center">{day}</div>
              ))}
              {calendarDays.map((day, i) => (
                <motion.div 
                  key={`day-${i}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.01 + 0.3 }}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all relative group",
                    day.intensity === 'high' ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]" :
                    day.intensity === 'medium' ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                    day.intensity === 'low' ? "bg-emerald-400 text-white" :
                    "bg-stone-50 dark:bg-stone-800 text-stone-400",
                    day.isToday && !day.hasActivity && "ring-2 ring-[#f2a93b] ring-offset-2 dark:ring-offset-stone-900"
                  )}
                >
                  {day.dayNum}
                  {day.count > 0 && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-2 py-1 rounded text-[8px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                       {day.count} words
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Active Streak</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-stone-100 dark:bg-stone-800" />
                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">No Record</span>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[3rem] text-white shadow-xl space-y-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Trophy className="w-8 h-8 text-white/50" />
            <div className="space-y-1">
              <h4 className="text-lg font-editorial italic">Knowledge Master</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                You've archived <span className="font-bold text-white uppercase">{vocab.length}</span> total words in your library. Keep pushing through!
              </p>
            </div>
            <div className="pt-2">
               <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "45%" }}
                    className="h-full bg-white shadow-[0_0_15px_white]"
                  />
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
