import { motion, AnimatePresence } from 'motion/react';
import { Database, ArrowLeftRight, HardDrive } from 'lucide-react';

interface DiskSwapperProps {
  isSwapping: boolean;
  processName?: string;
}

export default function DiskSwapper({ isSwapping, processName }: DiskSwapperProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 relative overflow-hidden group">
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center gap-12 relative z-10">
        {/* RAM */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/40">
            <Database size={32} />
          </div>
          <span className="text-[10px] font-bold uppercase text-blue-600">Main RAM</span>
        </div>

        {/* Swap Action */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={isSwapping ? { 
              rotateY: [0, 180, 180, 0],
              scale: [1, 1.2, 1.2, 1]
            } : {}}
            transition={{ duration: 1, repeat: isSwapping ? Infinity : 0 }}
            className="text-gray-400"
          >
            <ArrowLeftRight size={32} className={isSwapping ? 'text-blue-500' : ''} />
          </motion.div>
          <AnimatePresence>
            {isSwapping && (
              <motion.span 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter"
              >
                Swapping {processName}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Disk */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-white shadow-xl shadow-black/40">
            <HardDrive size={32} />
          </div>
          <span className="text-[10px] font-bold uppercase text-gray-500">Virtual Disk</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
          {isSwapping 
            ? "Context switch in progress. Process state is being persisted to swap space." 
            : "System idle. Ready for next context switch event."}
        </p>
      </div>
    </div>
  );
}
