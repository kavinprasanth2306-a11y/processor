import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Process } from '../types';
import { fcfs, sjf, roundRobin } from '../lib/algorithms';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComparisonChartProps {
  processes: Process[];
  quantum: number;
}

export default function ComparisonChart({ processes, quantum }: ComparisonChartProps) {
  const comparisonData = useMemo(() => {
    if (processes.length === 0) return [];

    const algos = [
      { id: 'fcfs', name: 'FCFS', res: fcfs(processes) },
      { id: 'sjf_non', name: 'SJF (Non-P)', res: sjf(processes, false) },
      { id: 'sjf_pre', name: 'SJF (Pre)', res: sjf(processes, true) },
      { id: 'rr', name: 'Round Robin', res: roundRobin(processes, quantum) },
    ];

    const maxWait = Math.max(...algos.map(a => a.res.avgWaitingTime), 0.1);
    
    return algos.map(a => ({
      ...a,
      normalizedWait: (a.res.avgWaitingTime / maxWait) * 100
    })).sort((a, b) => a.res.avgWaitingTime - b.res.avgWaitingTime);
  }, [processes, quantum]);

  if (processes.length === 0) return null;

  return (
    <Card className="glass-card border-none overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Algorithm Benchmarking</CardTitle>
        <CardDescription>Real-time average waiting time comparison</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {comparisonData.map((item, idx) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-1.5"
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className={idx === 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-500"}>
                    {item.name} {idx === 0 && ' (Optimal)'}
                  </span>
                  <span className="font-mono">{item.res.avgWaitingTime.toFixed(2)}ms</span>
                </div>
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.normalizedWait}%` }}
                    className={`h-full rounded-full ${
                      idx === 0 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                        : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50"
        >
          <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed italic">
            <strong>Optimal Choice:</strong> {comparisonData[0]?.name} is currently the most efficient algorithm for this workload, reducing average wait time by {((comparisonData[comparisonData.length-1].res.avgWaitingTime - comparisonData[0].res.avgWaitingTime)).toFixed(2)}ms compared to the least efficient option.
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
