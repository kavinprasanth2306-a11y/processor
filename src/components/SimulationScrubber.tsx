import { motion } from 'motion/react';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimulationScrubberProps {
  currentTime: number;
  maxTime: number;
  onTimeChange: (time: number) => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export default function SimulationScrubber({
  currentTime,
  maxTime,
  onTimeChange,
  isSimulating,
  onToggleSimulate,
  playbackSpeed,
  onSpeedChange
}: SimulationScrubberProps) {
  return (
    <div className="glass-card p-6 rounded-2xl border-none shadow-xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Global Simulation Scrubber</span>
          <span className="text-2xl font-black tabular-nums">{currentTime}ms <span className="text-gray-400 font-light text-sm">/ {maxTime}ms</span></span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            {[0.5, 1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  playbackSpeed === speed 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onTimeChange(Math.max(0, currentTime - 1))}
            className="rounded-full"
          >
            <Rewind size={18} />
          </Button>
          
          <Button 
            variant="default" 
            size="icon" 
            onClick={onToggleSimulate}
            className={`w-14 h-14 rounded-full shadow-2xl transition-all active:scale-95 ${
              isSimulating 
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
            }`}
          >
            {isSimulating ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onTimeChange(Math.min(maxTime, currentTime + 1))}
            className="rounded-full"
          >
            <FastForward size={18} />
          </Button>
        </div>

        <div className="flex-1 px-4 relative group">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded text-[10px] font-mono pointer-events-none">
            {Math.round((currentTime / (maxTime || 1)) * 100)}% Complete
          </div>
          <Slider 
            value={[currentTime]} 
            max={maxTime || 1} 
            step={1} 
            onValueChange={(val) => onTimeChange(val[0])}
            className="cursor-pointer"
          />
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => onTimeChange(0)}
          className="rounded-full border-none bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10"
        >
          <RotateCcw size={18} />
        </Button>
      </div>
    </div>
  );
}
