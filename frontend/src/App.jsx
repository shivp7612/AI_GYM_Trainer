// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutArea from './components/WorkoutArea';
import Analytics from './components/Analytics';
import ChatAssistant from './components/ChatAssistant';
import ProgressPhotos from './components/ProgressPhotos';
import WorkoutSelection from './components/WorkoutSelection';
import { Dumbbell } from 'lucide-react';

function LocalWorkoutView({ userId, selectedExercise, setView }) {
  const [status, setStatus] = useState('launching');
  const [error, setError] = useState('');

  const launchLocal = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/workout/start_local/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise: selectedExercise ? selectedExercise.key : 'squat' })
      });
      if (!res.ok) throw new Error('Could not launch the local tracker window');
      setStatus('active');
    } catch (e) {
      setError(e.message || 'API connection failed');
      setStatus('error');
    }
  };

  useEffect(() => {
    launchLocal();
  }, [userId]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-dark relative overflow-hidden select-none">
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-purple/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-mint/10 blur-[120px]"></div>

      <div className="w-full max-w-md glass p-8 rounded-3xl animate-fade-in-up shadow-2xl relative border border-white/5 z-10 text-center space-y-6">
        <div className="w-14 h-14 bg-brand-purple/10 rounded-2xl flex items-center justify-center border border-brand-purple/20 mb-2 mx-auto animate-pulse">
          <Dumbbell className="w-6 h-6 text-brand-purple" />
        </div>
        
        {status === 'launching' && (
          <>
            <h2 className="text-xl font-bold">Launching Tracking Window...</h2>
            <p className="text-xs text-dark-muted leading-relaxed">
              FastAPI is spawning the high-performance local OpenCV pose analyzer window. Please allow standard webcam permissions when prompted by Windows.
            </p>
          </>
        )}

        {status === 'active' && (
          <>
            <h2 className="text-xl font-bold text-brand-mint">Local Workout Active</h2>
            <p className="text-sm font-semibold text-white capitalize mt-1">
              Tracking: {selectedExercise ? selectedExercise.name : ''}
            </p>
            <p className="text-xs text-dark-muted leading-relaxed font-semibold mt-3">
              The external posture analysis window is currently running on your desktop. Perform your exercises in front of the camera.
            </p>
            <div className="bg-brand-purple/5 border border-brand-purple/15 rounded-2xl p-4 text-[10px] text-brand-purple text-left leading-relaxed space-y-1">
              <p>💡 <b>Form Feedback:</b> Look at the OpenCV window for real-time rep counts and safety indicators.</p>
              <p>⏱️ <b>How to finish:</b> Press <b>ESC</b> (to close window) or <b>M</b> (to change exercise) in the tracking window. Your sets, reps, and accuracy will sync immediately to this dashboard.</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-xl font-bold text-brand-coral">Failed to Launch</h2>
            <p className="text-xs text-brand-coral/95 bg-brand-coral/5 border border-brand-coral/20 rounded-xl p-3">
              {error}
            </p>
            <button 
              onClick={launchLocal}
              className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 transition-colors font-bold text-xs rounded-xl"
            >
              Retry Connection
            </button>
          </>
        )}

        <div className="pt-4">
          <button 
            onClick={() => setView('dashboard')}
            className="w-full py-3.5 bg-dark-border/40 hover:bg-dark-border/60 transition-colors text-xs font-semibold rounded-2xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('loading');
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    // Check if user has already onboarded
    const storedId = localStorage.getItem('gym_user_id');
    const storedName = localStorage.getItem('gym_user_name');

    if (storedId && storedName) {
      setUserId(parseInt(storedId));
      setUserName(storedName);
      setView('dashboard');
    } else {
      setView('onboarding');
    }
  }, []);

  const handleFinishOnboarding = (id, name) => {
    setUserId(id);
    setUserName(name);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('gym_user_id');
    localStorage.removeItem('gym_user_name');
    setUserId(null);
    setUserName('');
    setView('onboarding');
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wider text-dark-muted">SYNCHRONIZING APP STATE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white relative">
      {/* Floating Logout Button on dashboard view */}
      {view === 'dashboard' && (
        <button 
          onClick={handleLogout}
          className="absolute top-8 right-4 md:right-8 z-20 px-3 py-1.5 bg-dark-border/20 hover:bg-brand-coral/10 hover:text-brand-coral border border-white/5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all"
        >
          Reset Profile
        </button>
      )}

      {view === 'onboarding' && (
        <Onboarding onFinish={handleFinishOnboarding} />
      )}

      {view === 'dashboard' && (
        <Dashboard 
          userId={userId} 
          userName={userName} 
          setView={setView} 
          onStartWorkout={(exercises) => {
            setWorkoutExercises(exercises);
            setView('select-workout');
          }}
        />
      )}

      {view === 'select-workout' && (
        <WorkoutSelection 
          userId={userId} 
          workoutExercises={workoutExercises} 
          setView={setView} 
          onSelectExercise={(key, name) => {
            setSelectedExercise({ key, name });
            setView('local-workout');
          }}
        />
      )}

      {view === 'local-workout' && (
        <LocalWorkoutView 
          userId={userId} 
          selectedExercise={selectedExercise}
          setView={setView} 
        />
      )}

      {view === 'workout' && (
        <WorkoutArea 
          userId={userId} 
          workoutExercises={workoutExercises} 
          setView={setView}
          onWorkoutLogged={() => setView('analytics')}
        />
      )}

      {view === 'analytics' && (
        <Analytics userId={userId} setView={setView} />
      )}

      {view === 'chat' && (
        <ChatAssistant setView={setView} />
      )}

      {view === 'photos' && (
        <ProgressPhotos userId={userId} setView={setView} />
      )}
    </div>
  );
}
