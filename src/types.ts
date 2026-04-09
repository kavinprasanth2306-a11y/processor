export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
  color: string;
}

export interface ScheduledProcess extends Process {
  startTime: number[];
  endTime: number[];
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
}

export interface GanttChartItem {
  processId: string;
  processName: string;
  startTime: number;
  endTime: number;
  color: string;
}

export interface SimulationResult {
  scheduledProcesses: ScheduledProcess[];
  ganttChart: GanttChartItem[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
}
