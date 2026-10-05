# AI Gym Trainer

A real-time computer vision fitness assistant that tracks exercise form, counts repetitions, monitors fatigue, and provides live feedback using MediaPipe and OpenCV.

Built with a **FastAPI** backend and a **React (Vite)** frontend, featuring real-time WebSocket communication and a dual-mode tracking architecture.

---

## Features

- **Live Skeleton Tracking**: Uses MediaPipe Pose to detect 33 body landmarks from your webcam stream, drawing a live pose overlay on screen so you can see your body alignment in real time.
- **Joint Angle & ROM Calculation**: Measures the exact angles at your elbows, knees, hips, and shoulders during each movement to check if you are completing the full range of motion.
- **Posture Verification & Anti-Cheat**: Ensures you are performing the correct exercise before reps start counting. For example, if you choose squats but start doing bicep curls, the system recognizes the mismatch and pauses counting until proper form is detected.
- **Real-Time Voice & Screen Alerts**: Provides immediate voice corrections and on-screen tips (like "extend fully" or "good depth") so you don't have to constantly look down or touch your screen mid-set.
- **Daily Dashboard & Readiness Score**: Lets you log daily water, protein, and calorie intake, tracks your workout streaks, and includes a pre-workout readiness assessment to check fatigue before exercising.
- **PDF Workout Summaries**: Automatically generates a downloadable PDF report after each session showing your total sets, reps, average form accuracy, calories burned, and joint stress levels.
- **Responsive Web Interface**: Works on both desktop browsers and mobile devices with a clean, full-screen workout view.

---

## Architecture & How It Works

The project supports two execution modes:

### 1. Web Tracking (Browser + WebSocket)
- The React frontend captures webcam frames onto a hidden `640x480` canvas.
- Frames are compressed to JPEG (50% quality, ~20 KB per frame) and sent over a WebSocket connection at **~7.5 FPS (130ms intervals)**.
- This bandwidth optimization keeps upstream network usage under 200 KB/s while giving the backend MediaPipe pipeline enough temporal resolution to track movement cleanly without server congestion.
- The FastAPI backend computes 33 3D pose landmarks, evaluates angles and fatigue, and streams joint coordinates and metrics back to the client for canvas rendering.

### 2. Desktop Mode (Standalone OpenCV)
- A local Python engine (`main.py`) running OpenCV with DirectShow on Windows.
- Processes uncompressed 720p video at the webcam's native rate (~30 FPS) with low input latency.
- Directly syncs completed workout sessions, accuracy, and calories to the SQLite database.

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Python 3.10+, FastAPI, Uvicorn, WebSockets
- **Computer Vision**: MediaPipe Pose, OpenCV, NumPy
- **Database & ORM**: SQLite, SQLAlchemy
- **Reporting**: ReportLab (automated PDF session reports)

---

## Supported Exercises

- **Chest**: Barbell Bench Press, Incline Dumbbell Press, Cable Fly / Pec Deck, Push-ups
- **Back**: Barbell Row, Lat Pulldown, Pull-ups / Chin-ups, Seated Cable Row
- **Shoulders**: Overhead Press, Lateral Raise, Front Raise
- **Arms**: Bicep Curl, Tricep Pushdown, Overhead Extension, Dips
- **Legs**: Squat, Leg Press, Romanian Deadlift, Calf Raise
- **Core**: Crunches, Leg Raises, Russian Twists

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A working webcam

### 1. Clone the repository
```bash
git clone https://github.com/shivp7612/AI_GYM_Trainer.git
cd AI_GYM_Trainer
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the FastAPI server
uvicorn backend.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

### 4. Running Desktop Tracker Directly (Optional)
To run the native OpenCV tracking window locally:
```bash
python main.py --exercise squat --user_id 1
```

---

## Project Structure

```
AI_GYM_Trainer/
├── backend/
│   ├── ai_logic/            # Pose processing, fatigue tracking, diet & workout plans
│   ├── database.py          # SQLAlchemy SQLite connection
│   ├── main.py              # FastAPI endpoints & WebSocket handler
│   ├── models.py            # Database tables (Users, Profiles, Workouts)
│   └── schemas.py           # Pydantic schemas
├── core/
│   ├── exercise_verifier.py # Anti-cheat posture verifier
│   └── pose_detector.py     # MediaPipe pose estimation wrapper
├── exercises/
│   ├── exercise_dict.py     # Joint definitions and target angle thresholds
│   └── motion_profiler.py   # State machine for rep counting
├── frontend/
│   ├── src/
│   │   ├── components/      # Dashboard, WorkoutArea, Analytics, Onboarding
│   │   ├── App.jsx          # Router & state manager
│   │   └── config.js        # API & WebSocket configuration
│   └── package.json
├── main.py                  # Standalone local OpenCV tracking application
└── README.md
```

---

## License

This project is licensed under the MIT License.
