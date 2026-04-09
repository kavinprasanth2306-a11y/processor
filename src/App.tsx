/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Settings2, 
  BarChart3, 
  LayoutGrid, 
  Activity,
  Info,
  Cpu,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Process, SimulationResult, ScheduledProcess } from './types';
import { fcfs, sjf, roundRobin } from './lib/algorithms';
import ComparisonChart from './components/ComparisonChart';
import ParticleBackground from './components/ParticleBackground';
import KernelTerminal from './components/KernelTerminal';
import SimulationScrubber from './components/SimulationScrubber';
import MathematicalDrilldown from './components/MathematicalDrilldown';
import DiskSwapper from './components/DiskSwapper';
import AchievementPop, { Achievement } from './components/AchievementPop';
import { soundEngine } from './lib/SoundEngine';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'
];

const DEFAULT_PROCESSES: Process[] = [
  { id: '1', name: 'P1', arrivalTime: 0, burstTime: 5, color: COLORS[0] },
  { id: '2', name: 'P2', arrivalTime: 1, burstTime: 3, color: COLORS[1] },
  { id: '3', name: 'P3', arrivalTime: 2, burstTime: 8, color: COLORS[2] },
  { id: '4', name: 'P4', arrivalTime: 3, burstTime: 6, color: COLORS[3] },
];

function AnimatedNumber({ value }: { value: string | number }) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isPercent = typeof value === 'string' && value.endsWith('%');
  
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-block"
    >
      {value}
    </motion.span>
  );
}

export default function App() {
  const [processes, setProcesses] = useState<Process[]>(DEFAULT_PROCESSES);
  const [algorithm, setAlgorithm] = useState<string>('fcfs');
  const [quantum, setQuantum] = useState<number>(2);
  const [isPreemptive, setIsPreemptive] = useState<boolean>(false);
  const [results, setResults] = useState<SimulationResult | null>(null);

  // Simulation Playback State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Form state
  const [newName, setNewName] = useState('');
  const [newArrival, setNewArrival] = useState<number>(0);
  const [newBurst, setNewBurst] = useState<number>(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // New State for Mega Update
  const [logs, setLogs] = useState<any[]>([]);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<ScheduledProcess | null>(null);
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [activeProcessName, setActiveProcessName] = useState('');

  // Dark Mode side-effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const runSimulation = useMemo(() => {
    if (processes.length === 0) return null;
    
    switch (algorithm) {
      case 'fcfs':
        return fcfs(processes);
      case 'sjf':
        return sjf(processes, isPreemptive);
      case 'rr':
        return roundRobin(processes, quantum);
      default:
        return fcfs(processes);
    }
  }, [processes, algorithm, quantum, isPreemptive]);

  useEffect(() => {
    setResults(runSimulation);
    setSimTime(0);
    setIsSimulating(false);
  }, [runSimulation]);

  // Simulation Timer
  useEffect(() => {
    let interval: any;
    if (isSimulating && results) {
      const maxTime = results.ganttChart[results.ganttChart.length - 1]?.endTime || 0;
      interval = setInterval(() => {
        setSimTime(prev => {
          const nextTime = prev + 1;
          
          if (nextTime >= maxTime) {
            setIsSimulating(false);
            soundEngine.playClick();
            addLog(maxTime, 'SUCCESS', 'Simulation completed successfully.');
            checkAchievements(maxTime);
            return maxTime;
          }

          // Kernel Log Logic
          const event = results.ganttChart.find(item => item.startTime === nextTime);
          if (event) {
            addLog(nextTime, 'INFO', `Process ${event.processName} started execution.`);
            soundEngine.playContextSwitch();
            setIsSwapping(true);
            setActiveProcessName(event.processName);
            setTimeout(() => setIsSwapping(false), 1000);
          }

          const completion = results.ganttChart.find(item => item.endTime === nextTime);
          if (completion) {
            addLog(nextTime, 'SYSTEM', `Process ${completion.processName} finished its burst.`);
            soundEngine.playClick();
          }

          return nextTime;
        });
      }, 500 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isSimulating, results, playbackSpeed]);

  const addLog = (time: number, type: string, message: string) => {
    setLogs(prev => [...prev.slice(-49), { id: Math.random().toString(), time, type: type as any, message }]);
  };

  const checkAchievements = (finalTime: number) => {
    if (!results) return;
    
    if (results.avgWaitingTime < 2) {
      setAchievement({
        id: 'low-wait',
        title: 'Efficiency Master',
        description: 'Average waiting time is below 2ms. Maximum optimization achieved!',
        icon: 'zap'
      });
    } else if (results.cpuUtilization > 95) {
      setAchievement({
        id: 'high-util',
        title: 'CPU Crusher',
        description: 'CPU utilization reached over 95%. No idle time detected!',
        icon: 'cpu'
      });
    }

    setTimeout(() => setAchievement(null), 5000);
  };

  useEffect(() => {
    soundEngine.setMute(isMuted);
  }, [isMuted]);

  const recommendations = useMemo(() => {
    if (processes.length === 0) return null;
    
    const algos = [
      { id: 'fcfs', name: 'FCFS', res: fcfs(processes) },
      { id: 'sjf_non', name: 'SJF (Non-Pre)', res: sjf(processes, false) },
      { id: 'sjf_pre', name: 'SJF (Pre)', res: sjf(processes, true) },
      { id: 'rr', name: 'Round Robin', res: roundRobin(processes, quantum) },
    ];

    const sorted = [...algos].sort((a, b) => a.res.avgWaitingTime - b.res.avgWaitingTime);
    return {
      best: sorted[0],
      others: sorted.slice(1)
    };
  }, [processes, quantum]);

  const addProcess = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const color = COLORS[processes.length % COLORS.length];
    const name = newName || `P${processes.length + 1}`;
    
    setProcesses([...processes, { 
      id, 
      name, 
      arrivalTime: newArrival, 
      burstTime: newBurst, 
      color 
    }]);
    
    setNewName('');
    setNewArrival(0);
    setNewBurst(1);
  };

  const removeProcess = (id: string) => {
    setProcesses(processes.filter(p => p.id !== id));
  };

  const resetProcesses = () => {
    setProcesses(DEFAULT_PROCESSES);
  };

  const clearAll = () => {
    setProcesses([]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0B] text-[#1A1A1A] dark:text-[#EDEDEE] font-sans selection:bg-blue-100 transition-colors duration-500">
      <ParticleBackground />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-default"
          >
            <motion.div 
              animate={isSimulating ? { 
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0px rgba(59, 130, 246, 0.4)",
                  "0 0 20px rgba(59, 130, 246, 0.6)",
                  "0 0 0px rgba(59, 130, 246, 0.4)"
                ]
              } : { rotate: 360 }}
              transition={isSimulating ? { 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity },
                boxShadow: { duration: 1, repeat: Infinity }
              } : { duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40 relative overflow-hidden"
            >
              <Cpu size={24} className="relative z-10" />
              {isSimulating && (
                <motion.div 
                  initial={{ top: '100%' }}
                  animate={{ top: '-100%' }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent"
                />
              )}
            </motion.div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">SchedSim</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Process Scheduling Simulator</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-full w-10 h-10 transition-transform active:scale-90"
            >
              {isMuted ? <Zap size={20} className="text-gray-400" /> : <Zap size={20} className="text-amber-500 fill-amber-500" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsTerminalVisible(!isTerminalVisible)}
              className={`rounded-full w-10 h-10 transition-transform active:scale-90 ${isTerminalVisible ? 'bg-emerald-50 text-emerald-600' : ''}`}
            >
              <Terminal size={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-full w-10 h-10 transition-transform active:scale-90"
            >
              {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
            </Button>
            <Button variant="outline" size="sm" onClick={resetProcesses} className="hidden sm:flex gap-2 group glass-card border-none">
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              Reset Defaults
            </Button>
            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800 px-3 py-1">
              v1.2.0 ULTRA
            </Badge>
          </div>
        </div>
      </motion.header>

      <AchievementPop achievement={achievement} onClose={() => setAchievement(null)} />
      <KernelTerminal logs={logs} isVisible={isTerminalVisible} onClose={() => setIsTerminalVisible(false)} />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          
          {/* Sidebar: Controls */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-4 space-y-6"
          >
            <Card className="glass-card shadow-sm overflow-hidden border-none">
              <CardHeader className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Settings2 size={18} className="text-blue-600" />
                  <CardTitle className="text-lg">Configuration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Algorithm</Label>
                  <Select value={algorithm} onValueChange={setAlgorithm}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select Algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fcfs">First Come First Serve (FCFS)</SelectItem>
                      <SelectItem value="sjf">Shortest Job First (SJF)</SelectItem>
                      <SelectItem value="rr">Round Robin (RR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AnimatePresence mode="wait">
                  {algorithm === 'sjf' && (
                    <motion.div 
                      key="sjf-preemptive"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold text-blue-900">Preemptive Mode</Label>
                        <p className="text-xs text-blue-700">Shortest Remaining Time First</p>
                      </div>
                      <Button 
                        variant={isPreemptive ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setIsPreemptive(!isPreemptive)}
                        className={isPreemptive ? "bg-blue-600" : ""}
                      >
                        {isPreemptive ? "ON" : "OFF"}
                      </Button>
                    </motion.div>
                  )}

                  {algorithm === 'rr' && (
                    <motion.div 
                      key="rr-quantum"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold">Time Quantum</Label>
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{quantum}ms</span>
                      </div>
                      <Slider 
                        value={[quantum]} 
                        onValueChange={(val) => setQuantum(val[0])} 
                        min={1} 
                        max={10} 
                        step={1}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Algorithm Recommendation Novelty */}
                {recommendations && processes.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-indigo-700">
                      <BarChart3 size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Optimal Recommendation</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-indigo-900">{recommendations.best.name}</span>
                      <Badge className="bg-indigo-600 text-white border-none">
                        {recommendations.best.res.avgWaitingTime.toFixed(2)}ms avg wait
                      </Badge>
                    </div>
                    <p className="text-[10px] text-indigo-600 leading-tight">
                      Based on current processes, {recommendations.best.name} provides the lowest average waiting time.
                    </p>
                  </motion.div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <Label className="text-sm font-semibold mb-3 block">Add New Process</Label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-gray-500 font-bold">Name</Label>
                      <Input 
                        placeholder="e.g. P5" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-gray-500 font-bold">Arrival Time</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        value={newArrival} 
                        onChange={(e) => setNewArrival(parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <Label className="text-[10px] uppercase text-gray-500 font-bold">Burst Time</Label>
                    <Input 
                      type="number" 
                      min={1} 
                      value={newBurst} 
                      onChange={(e) => setNewBurst(parseInt(e.target.value) || 1)}
                      className="h-9"
                    />
                  </div>
                  <Button onClick={addProcess} className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none gap-2 transform active:scale-[0.98] transition-all">
                    <Plus size={18} />
                    Add Process
                  </Button>
                </div>
              </CardContent>
            </Card>

            <ComparisonChart processes={processes} quantum={quantum} />

            <Card className="glass-card shadow-sm border-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Process Queue</CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2">
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                <div className="max-h-[300px] overflow-y-auto px-6">
                  {processes.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <LayoutGrid size={20} />
                      </div>
                      <p className="text-sm text-gray-500">No processes added yet</p>
                    </div>
                  ) : (
                    <motion.div layout className="space-y-2 pb-4">
                      <AnimatePresence mode="popLayout">
                        {processes.map((p) => (
                          <motion.div 
                            key={p.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                              mass: 1
                            }}
                            className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl group hover:border-blue-200 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                              <div>
                                <p className="text-sm font-bold">{p.name}</p>
                                <p className="text-[10px] text-gray-500">Arr: {p.arrivalTime} | Burst: {p.burstTime}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeProcess(p.id)}
                              className="h-8 w-8 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content: Results & Visualization */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-8 space-y-6"
          >
            
            <SimulationScrubber 
              currentTime={simTime}
              maxTime={results?.ganttChart[results.ganttChart.length - 1]?.endTime || 0}
              onTimeChange={setSimTime}
              isSimulating={isSimulating}
              onToggleSimulate={() => setIsSimulating(!isSimulating)}
              playbackSpeed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DiskSwapper isSwapping={isSwapping} processName={activeProcessName} />
              <MathematicalDrilldown process={selectedProcess} />
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Avg Waiting', value: results?.avgWaitingTime.toFixed(2) || '0.00', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Avg Turnaround', value: results?.avgTurnaroundTime.toFixed(2) || '0.00', icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'CPU Utilization', value: `${results?.cpuUtilization.toFixed(1) || '0.0'}%`, icon: Cpu, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Throughput', value: results?.throughput.toFixed(2) || '0.00', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Card className="glass-card shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all border-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                          <stat.icon size={16} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-black tracking-tight">
                        <AnimatedNumber value={stat.value} />
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Gantt Chart */}
            <Card className="glass-card shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Gantt Chart Visualization</CardTitle>
                  <CardDescription>Timeline of process execution</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (simTime >= (results?.ganttChart[results.ganttChart.length - 1]?.endTime || 0)) {
                          setSimTime(0);
                        }
                        setIsSimulating(!isSimulating);
                      }}
                      className="h-8 gap-2"
                    >
                      {isSimulating ? <Activity size={14} className="animate-pulse text-blue-600" /> : <ArrowRight size={14} />}
                      {isSimulating ? "Pause" : "Simulate"}
                    </Button>
                    {simTime > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => { setSimTime(0); setIsSimulating(false); }} className="h-8 text-xs">
                        Reset
                      </Button>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Active Execution
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Simulation Progress Bar */}
                {results && (
                  <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                      <span>Simulation Progress</span>
                      <span>Time: {simTime} / {results.ganttChart[results.ganttChart.length - 1]?.endTime || 0}ms</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-600"
                        animate={{ width: `${(simTime / (results.ganttChart[results.ganttChart.length - 1]?.endTime || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="relative mt-8 mb-12">
                  {results && results.ganttChart.length > 0 ? (
                    <div className="flex h-16 w-full border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-gray-50">
                      {results.ganttChart.map((item, i) => {
                        const totalTime = results.ganttChart[results.ganttChart.length - 1].endTime;
                        
                        // Simulation logic: only show segments up to current simTime
                        if (simTime > 0 && item.startTime >= simTime) return null;
                        
                        let displayEndTime = item.endTime;
                        if (simTime > 0 && item.endTime > simTime) {
                          displayEndTime = simTime;
                        }

                        const width = ((displayEndTime - item.startTime) / totalTime) * 100;
                        
                        return (
                          <motion.div
                            key={`${item.processId}-${item.startTime}-${i}`}
                            initial={{ width: 0, opacity: 0, x: -10 }}
                            animate={{ width: `${width}%`, opacity: 1, x: 0 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 100,
                              damping: 20,
                              delay: simTime > 0 ? 0 : i * 0.08 
                            }}
                            className="h-full flex items-center justify-center text-white text-xs font-bold relative group"
                            style={{ backgroundColor: item.color }}
                          >
                            <span className="truncate px-1">{item.processName}</span>
                            
                            {/* Time markers */}
                            <div className="absolute -bottom-8 left-0 flex flex-col items-center">
                              <div className="w-px h-2 bg-gray-300" />
                              <span className="text-[10px] text-gray-500 font-mono mt-1">{item.startTime}</span>
                            </div>
                            
                            {(i === results.ganttChart.length - 1 || (simTime > 0 && item.endTime >= simTime)) && (
                              <div className="absolute -bottom-8 right-0 flex flex-col items-center">
                                <div className="w-px h-2 bg-gray-300" />
                                <span className="text-[10px] text-gray-500 font-mono mt-1">{displayEndTime}</span>
                              </div>
                            )}

                            {/* Tooltip */}
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              whileHover={{ opacity: 1, y: 0 }}
                              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-[10px] pointer-events-none whitespace-nowrap z-10"
                            >
                              {item.processName}: {item.startTime} - {item.endTime}
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-16 w-full border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                      Add processes to see visualization
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-100">
                <CardTitle className="text-lg">Detailed Analysis</CardTitle>
                <CardDescription>Performance metrics per process</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-bold text-xs uppercase text-gray-500 pl-6">Process</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-gray-500">Arrival</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-gray-500">Burst</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-gray-500">Completion</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-gray-500">Turnaround</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-gray-500">Waiting</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-gray-500">Stress Index</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-gray-500 pr-6">Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {results?.scheduledProcesses.map((p, idx) => {
                        const stressLevel = (p.waitingTime / p.turnaroundTime) * 100;
                        return (
                          <motion.tr 
                            key={p.id}
                            layout
                            onClick={() => setSelectedProcess(p)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.05 }}
                            className={`group hover:bg-blue-50/30 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer ${selectedProcess?.id === p.id ? 'bg-blue-50/50 dark:bg-white/10' : ''}`}
                          >
                            <TableCell className="pl-6">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="font-bold">{p.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{p.arrivalTime}</TableCell>
                            <TableCell className="font-mono text-xs">{p.burstTime}</TableCell>
                            <TableCell className="font-mono text-xs font-bold text-blue-600">{p.completionTime}</TableCell>
                            <TableCell className="font-mono text-xs">{p.turnaroundTime}</TableCell>
                            <TableCell className="font-mono text-xs">{p.waitingTime}</TableCell>
                            <TableCell>
                              <div className="w-24 space-y-1">
                                <div className="flex justify-between text-[8px] font-bold text-gray-400">
                                  <span>WAIT RATIO</span>
                                  <span>{Math.round(stressLevel)}%</span>
                                </div>
                                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stressLevel}%` }}
                                    className={`h-full ${stressLevel > 50 ? 'bg-red-500' : stressLevel > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs pr-6">{p.responseTime}</TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                    {(!results || results.scheduledProcesses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Algorithm Info */}
            <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Zap size={120} />
              </div>
              <CardContent className="p-6 flex items-start gap-4 relative z-10">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner overflow-hidden">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Info size={24} />
                  </motion.div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {algorithm === 'fcfs' && "First Come First Serve"}
                    {algorithm === 'sjf' && (isPreemptive ? "Shortest Remaining Time First" : "Shortest Job First")}
                    {algorithm === 'rr' && "Round Robin Scheduling"}
                  </h3>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    {algorithm === 'fcfs' && "Processes are executed in the order they arrive. It's simple but can lead to the 'convoy effect' where short processes wait for long ones."}
                    {algorithm === 'sjf' && (isPreemptive 
                      ? "A preemptive version of SJF. If a new process arrives with a shorter remaining burst time than the current process, it preempts the current one."
                      : "The process with the smallest burst time is selected next. This minimizes average waiting time but can cause starvation for longer processes.")}
                    {algorithm === 'rr' && `Each process is assigned a fixed time unit (${quantum}ms) in a cyclic way. It's fair and provides good response time for interactive systems.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Cpu size={18} />
            <span className="text-sm font-medium">SchedSim © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Documentation</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Algorithms</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
