# ⚡ AI Gym Trainer - Real-Time Posture Analytics & Injury Prevention

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-gym-trainer-6b2lpg0rw-shivaprasadtengli39-2300s-projects.vercel.app/)
[![Backend Status](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://ai-gym-backend-tvnk.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)

An end-to-end, AI-powered computer vision fitness application that monitors exercise form, tracks repetitions, calculates active joint angles and range of motion (ROM) in real time, and prevents workout injuries using biomechanics analysis and instant voice coaching.

---

## ✨ Features

- 🏋️ **60 FPS Real-Time AR Skeleton Overlay**: Hybrid computer vision pipeline using WebAssembly MediaPipe Pose for zero-latency in-browser body joint tracking.
- 📐 **Live Joint Angle & ROM Tracking**: Calculates exact joint flexions (elbows, knees, hips, shoulders) and Range of Motion (ROM %) frame-by-frame.
- 🚫 **Posture Verification & Cheating Prevention**: Exercises only count repetitions when performed in strict, valid form.
- 🗣️ **Live Voice Guidance & Real-Time Feedback**: Audio coaching and screen alerts tailored to the selected exercise.
- 📊 **Interactive Dashboard & Readiness Analytics**: Tracks daily nutrition, water intake, workout streaks, fatigue levels, and joint stress indicators.
- 📄 **Automated PDF Workout Reports**: Generates detailed PDF summaries of workout performance, accuracy, and biomechanics risk scores.
- 📱 **Responsive Desktop & Mobile Layout**: Full-screen AR workout mode tailored for smartphones and desktop cameras.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS + Tailwind CSS (Glassmorphic dark design system)
- **Computer Vision**: `@mediapipe/pose` & `@mediapipe/camera_utils`
- **Charts & Icons**: Recharts & Lucide React

### Backend
- **Framework**: FastAPI (Python 3.10+) + Uvicorn
- **ORM & Database**: SQLAlchemy + SQLite
- **Computer Vision & Biomechanics**: OpenCV (Headless) + MediaPipe Python
- **PDF Generation**: ReportLab
- **Real-Time Streaming**: WebSockets (`wss://`)

---

## 🚀 Live Deployment

- **Frontend App**: [https://ai-gym-trainer-6b2lpg0rw-shivaprasadtengli39-2300s-projects.vercel.app/](https://ai-gym-trainer-6b2lpg0rw-shivaprasadtengli39-2300s-projects.vercel.app/)
- **Backend API**: [https://ai-gym-backend-tvnk.onrender.com](https://ai-gym-backend-tvnk.onrender.com)

---

## 💻 Local Installation & Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- Git

### 1. Clone Repository
```bash
git clone https://github.com/shivp7612/AI_GYM_Trainer.git
cd AI_GYM_Trainer
```

### 2. Backend Setup
```bash
# Create virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```
Backend server will run at: `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend

# Install frontend dependencies
npm install

# Run Vite dev server
npm run dev
```
Frontend web application will run at: `http://localhost:5173`

---

## 📁 Repository Structure

```
AI_GYM_Trainer/
├── backend/
│   ├── ai_logic/
│   │   ├── biomechanics.py       # Joint stress & fatigue analyzer
│   │   ├── chatbot.py            # AI Fitness assistant response engine
│   │   ├── planner.py            # Custom workout & diet plan generator
│   │   ├── readiness.py          # Daily training readiness score calculator
│   │   ├── report_generator.py   # ReportLab PDF generator
│   │   └── socket_manager.py     # Real-time WebSocket frame & pose engine
│   ├── database.py               # SQLite database session configuration
│   ├── main.py                   # FastAPI REST routes & WebSocket endpoint
│   ├── models.py                 # SQLAlchemy relational models
│   ├── schemas.py                # Pydantic API response schemas
│   └── requirements.txt          # Python dependencies
├── core/
│   ├── exercise_verifier.py      # Category-based posture rules & verifiers
│   └── pose_detector.py          # MediaPipe pose wrapper
├── exercises/
│   └── motion_profiler.py        # Exercise angle state machines & rep counters
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # Dashboard, WorkoutArea, Analytics, Onboarding
│   │   ├── config.js             # API & WebSocket URL resolvers
│   │   ├── App.jsx               # Main application component
│   │   └── main.jsx              # React entry point
│   ├── index.html                # MediaPipe WebAssembly CDN scripts
│   └── package.json
└── README.md
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
