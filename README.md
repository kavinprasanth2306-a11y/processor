# Process Scheduler

A web-based application to simulate and visualize various CPU process scheduling algorithms.

## Project Structure

This project consists of two main parts:
- **Frontend**: A React application built with Vite and Tailwind CSS.
- **Backend**: A Python-based backend that handles the scheduling algorithm logic.

## Setup Instructions

### Frontend
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

### Backend
1. Navigate to the `backend` directory: `cd backend`
2. Install Python dependencies: `pip install -r requirements.txt` (or pip3)
3. Run the backend server: `python main.py` (or python3)

## Features
- Input processes with arrival times and burst times.
- Visualize the scheduling with a Gantt chart.
- Calculate metrics like Turnaround Time and Waiting Time.
