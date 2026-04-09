import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Minimize2, Maximize2, ChevronRight } from 'lucide-react';

interface LogEntry {
  id: string;
  time: number;
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'SYSTEM';
  message: string;
}

interface KernelTerminalProps {
  logs: LogEntry[];
  isVisible: boolean;
  onClose: () => void;
}

export default function KernelTerminal({ logs, isVisible, onClose }: KernelTerminalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isVisible) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed bottom-8 right-8 w-96 z-[100] glass-morphism rounded-xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 ${
        isMinimized ? 'h-12' : 'h-80'
      } flex flex-col transition-[height] duration-300`}
    >
      {/* Header */}
      <div className="bg-gray-900/90 text-gray-400 px-4 h-12 flex items-center justify-between cursor-move select-none border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-500" />
          <span className="text-xs font-mono font-bold tracking-tighter uppercase">Kernel_v1.1_Log</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1.5 bg-black/95 scrollbar-thin scrollbar-thumb-white/10"
          >
            {logs.length === 0 ? (
              <div className="text-gray-600 italic">Waiting for kernel events...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-2 leading-relaxed">
                  <span className="text-gray-500">[{log.time}ms]</span>
                  <span className={`font-bold ${
                    log.type === 'SUCCESS' ? 'text-emerald-500' :
                    log.type === 'WARN' ? 'text-amber-500' :
                    log.type === 'SYSTEM' ? 'text-blue-500' :
                    'text-blue-400'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-gray-300 break-all">{log.message}</span>
                </div>
              ))
            )}
            <div className="flex items-center gap-1 text-emerald-500/50 animate-pulse">
              <ChevronRight size={10} />
              <div className="w-1.5 h-3 bg-emerald-500/50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
