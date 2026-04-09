import { Process, ScheduledProcess, GanttChartItem, SimulationResult } from '../types';

const calculateMetrics = (
  processes: Process[],
  scheduled: ScheduledProcess[],
  gantt: GanttChartItem[]
): SimulationResult => {
  const totalWaitingTime = scheduled.reduce((acc, p) => acc + p.waitingTime, 0);
  const totalTurnaroundTime = scheduled.reduce((acc, p) => acc + p.turnaroundTime, 0);
  const totalResponseTime = scheduled.reduce((acc, p) => acc + p.responseTime, 0);
  
  const lastEndTime = gantt.length > 0 ? gantt[gantt.length - 1].endTime : 0;
  const totalBurstTime = processes.reduce((acc, p) => acc + p.burstTime, 0);
  
  return {
    scheduledProcesses: scheduled,
    ganttChart: gantt,
    avgWaitingTime: totalWaitingTime / processes.length || 0,
    avgTurnaroundTime: totalTurnaroundTime / processes.length || 0,
    avgResponseTime: totalResponseTime / processes.length || 0,
    cpuUtilization: (totalBurstTime / lastEndTime) * 100 || 0,
    throughput: processes.length / lastEndTime || 0,
  };
};

export const fcfs = (processes: Process[]): SimulationResult => {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const scheduled: ScheduledProcess[] = [];
  const gantt: GanttChartItem[] = [];
  
  let currentTime = 0;
  
  sorted.forEach(p => {
    if (currentTime < p.arrivalTime) {
      currentTime = p.arrivalTime;
    }
    
    const startTime = currentTime;
    const endTime = startTime + p.burstTime;
    
    gantt.push({
      processId: p.id,
      processName: p.name,
      startTime,
      endTime,
      color: p.color
    });
    
    const completionTime = endTime;
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = startTime - p.arrivalTime;
    
    scheduled.push({
      ...p,
      startTime: [startTime],
      endTime: [endTime],
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime
    });
    
    currentTime = endTime;
  });
  
  return calculateMetrics(processes, scheduled, gantt);
};

export const sjf = (processes: Process[], preemptive: boolean = false): SimulationResult => {
  const scheduled: ScheduledProcess[] = [];
  const gantt: GanttChartItem[] = [];
  
  let currentTime = 0;
  let completed = 0;
  const n = processes.length;
  const remainingBurstTime = processes.map(p => ({ ...p, remaining: p.burstTime, firstResponse: -1, lastEnd: -1 }));
  const isCompleted = new Array(n).fill(false);
  
  const processStats = processes.map(p => ({
    ...p,
    startTime: [] as number[],
    endTime: [] as number[],
    completionTime: 0,
    turnaroundTime: 0,
    waitingTime: 0,
    responseTime: 0
  }));

  while (completed !== n) {
    let idx = -1;
    let minBurst = Infinity;
    
    for (let i = 0; i < n; i++) {
      if (processes[i].arrivalTime <= currentTime && !isCompleted[i]) {
        if (remainingBurstTime[i].remaining < minBurst) {
          minBurst = remainingBurstTime[i].remaining;
          idx = i;
        }
        if (remainingBurstTime[i].remaining === minBurst) {
          if (processes[i].arrivalTime < processes[idx].arrivalTime) {
            idx = i;
          }
        }
      }
    }
    
    if (idx !== -1) {
      if (remainingBurstTime[idx].firstResponse === -1) {
        remainingBurstTime[idx].firstResponse = currentTime;
        processStats[idx].responseTime = currentTime - processes[idx].arrivalTime;
      }

      // If preemptive, we run for 1 unit and re-check
      // If non-preemptive, we run until completion
      const runTime = preemptive ? 1 : remainingBurstTime[idx].remaining;
      
      // Add to Gantt chart
      if (gantt.length > 0 && gantt[gantt.length - 1].processId === processes[idx].id) {
        gantt[gantt.length - 1].endTime += runTime;
      } else {
        gantt.push({
          processId: processes[idx].id,
          processName: processes[idx].name,
          startTime: currentTime,
          endTime: currentTime + runTime,
          color: processes[idx].color
        });
      }

      if (processStats[idx].startTime.length === 0 || processStats[idx].endTime[processStats[idx].endTime.length - 1] !== currentTime) {
        processStats[idx].startTime.push(currentTime);
      }
      
      currentTime += runTime;
      remainingBurstTime[idx].remaining -= runTime;
      
      if (processStats[idx].endTime.length < processStats[idx].startTime.length) {
        processStats[idx].endTime.push(currentTime);
      } else {
        processStats[idx].endTime[processStats[idx].endTime.length - 1] = currentTime;
      }

      if (remainingBurstTime[idx].remaining === 0) {
        processStats[idx].completionTime = currentTime;
        processStats[idx].turnaroundTime = processStats[idx].completionTime - processes[idx].arrivalTime;
        processStats[idx].waitingTime = processStats[idx].turnaroundTime - processes[idx].burstTime;
        isCompleted[idx] = true;
        completed++;
        scheduled.push(processStats[idx]);
      }
    } else {
      currentTime++;
    }
  }
  
  return calculateMetrics(processes, scheduled, gantt);
};

export const roundRobin = (processes: Process[], quantum: number): SimulationResult => {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const n = processes.length;
  const remainingBurstTime = sorted.map(p => p.burstTime);
  const firstResponse = new Array(n).fill(-1);
  const lastEndTime = new Array(n).fill(0);
  const completionTime = new Array(n).fill(0);
  const startTimeArr = sorted.map(() => [] as number[]);
  const endTimeArr = sorted.map(() => [] as number[]);
  
  const gantt: GanttChartItem[] = [];
  const queue: number[] = [];
  let currentTime = 0;
  let completed = 0;
  const visited = new Array(n).fill(false);

  // Initial check for processes arriving at time 0
  for (let i = 0; i < n; i++) {
    if (sorted[i].arrivalTime <= currentTime) {
      queue.push(i);
      visited[i] = true;
    }
  }

  while (completed !== n) {
    if (queue.length > 0) {
      const idx = queue.shift()!;
      
      if (firstResponse[idx] === -1) {
        firstResponse[idx] = currentTime;
      }

      const runTime = Math.min(remainingBurstTime[idx], quantum);
      
      gantt.push({
        processId: sorted[idx].id,
        processName: sorted[idx].name,
        startTime: currentTime,
        endTime: currentTime + runTime,
        color: sorted[idx].color
      });

      startTimeArr[idx].push(currentTime);
      currentTime += runTime;
      endTimeArr[idx].push(currentTime);
      remainingBurstTime[idx] -= runTime;

      // Check for new arrivals during the runTime
      for (let i = 0; i < n; i++) {
        if (!visited[i] && sorted[i].arrivalTime <= currentTime) {
          queue.push(i);
          visited[i] = true;
        }
      }

      if (remainingBurstTime[idx] > 0) {
        queue.push(idx);
      } else {
        completionTime[idx] = currentTime;
        completed++;
      }
    } else {
      // Idle time
      currentTime++;
      for (let i = 0; i < n; i++) {
        if (!visited[i] && sorted[i].arrivalTime <= currentTime) {
          queue.push(i);
          visited[i] = true;
        }
      }
    }
  }

  const scheduled: ScheduledProcess[] = sorted.map((p, i) => ({
    ...p,
    startTime: startTimeArr[i],
    endTime: endTimeArr[i],
    completionTime: completionTime[i],
    turnaroundTime: completionTime[i] - p.arrivalTime,
    waitingTime: (completionTime[i] - p.arrivalTime) - p.burstTime,
    responseTime: firstResponse[i] - p.arrivalTime
  }));

  return calculateMetrics(processes, scheduled, gantt);
};
