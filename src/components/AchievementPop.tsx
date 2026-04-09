import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Zap, Cpu } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'zap' | 'cpu';
}

interface AchievementPopProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementPop({ achievement, onClose }: AchievementPopProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          className="fixed top-24 right-8 z-[110] w-80 shadow-2xl"
        >
          <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-[1px] rounded-2xl overflow-hidden">
            <div className="bg-white dark:bg-gray-950 p-4 rounded-[15px] flex items-center gap-4 relative overflow-hidden">
              {/* Shine effect */}
              <motion.div 
                animate={{ left: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 w-20 h-full bg-white/20 skew-x-12 blur-md"
              />

              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                {achievement.icon === 'trophy' && <Trophy size={24} />}
                {achievement.icon === 'star' && <Star size={24} />}
                {achievement.icon === 'zap' && <Zap size={24} />}
                {achievement.icon === 'cpu' && <Cpu size={24} />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Achievement Unlocked</span>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <Star size={12} />
                  </button>
                </div>
                <h4 className="font-black text-sm text-gray-900 dark:text-white leading-tight mt-1">{achievement.title}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">{achievement.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
