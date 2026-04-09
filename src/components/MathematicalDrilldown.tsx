import { motion } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScheduledProcess } from '../types';
import { Equal, Minus, Plus, Play } from 'lucide-react';

interface MathematicalDrilldownProps {
  process: ScheduledProcess | null;
}

export default function MathematicalDrilldown({ process }: MathematicalDrilldownProps) {
  if (!process) {
    return (
      <Card className="glass-card border-none shadow-xl h-full flex items-center justify-center text-gray-400 text-sm italic">
        Select a process in the table to see math breakdown
      </Card>
    );
  }

  const tat = process.turnaroundTime;
  const wt = process.waitingTime;
  const bt = process.burstTime;
  const ct = process.completionTime;
  const at = process.arrivalTime;

  return (
    <Card className="glass-card border-none shadow-xl overflow-hidden group">
      <CardHeader className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-b border-white/10">
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Play size={14} className="text-blue-600" />
          Math Breakdown: {process.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Turnaround Time */}
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
            <span>Turnaround Time (TAT)</span>
            <span>CT - AT</span>
          </div>
          <div className="flex items-center justify-between bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-white/20">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black">{ct}</span>
              <span className="text-[8px] text-gray-400">Completion</span>
            </div>
            <Minus size={16} className="text-gray-400" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-black">{at}</span>
              <span className="text-[8px] text-gray-400">Arrival</span>
            </div>
            <Equal size={16} className="text-blue-600" />
            <div className="flex flex-col items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-500/30">
              <span className="text-xl font-black">{tat}</span>
              <span className="text-[8px] opacity-80">Result (ms)</span>
            </div>
          </div>
        </div>

        {/* Waiting Time */}
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
            <span>Waiting Time (WT)</span>
            <span>TAT - BT</span>
          </div>
          <div className="flex items-center justify-between bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-white/20">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black">{tat}</span>
              <span className="text-[8px] text-gray-400">Turnaround</span>
            </div>
            <Minus size={16} className="text-gray-400" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-black">{bt}</span>
              <span className="text-[8px] text-gray-400">Burst Time</span>
            </div>
            <Equal size={16} className="text-blue-600" />
            <div className="flex flex-col items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/30">
              <span className="text-xl font-black">{wt}</span>
              <span className="text-[8px] opacity-80">Result (ms)</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-white/5">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            * Note: These metrics are critical for evaluating algorithm efficiency. SJF typically minimizes <strong>Waiting Time</strong>, while RR ensures fairness.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
