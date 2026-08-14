// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutArea from './components/WorkoutArea';
import Analytics from './components/Analytics';
import ProgressPhotos from './components/ProgressPhotos';
import WorkoutSelection from './components/WorkoutSelection';
import ProfileView from './components/ProfileView';
import ChatAssistant from './components/ChatAssistant';
import { LayoutDashboard, Dumbbell, History, Image, User, MessageSquare, LogOut, Activity, Droplet, Trophy, ChevronLeft, Menu } from 'lucide-react';

function LocalWorkoutView({ userId, selectedExercise, setView }) {
  const [status, setStatus] = useState('launching');
  const [error, setError] = useState('');

  const launchLocal = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workout/start_local/${userId}`, {
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
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-primary/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-accent/10 blur-[120px]"></div>

      <div className="w-full max-w-md glass p-8 rounded-3xl animate-fade-in-up shadow-2xl relative border border-white/5 z-10 text-center space-y-6">
        <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 mb-2 mx-auto animate-pulse">
          <Dumbbell className="w-6 h-6 text-brand-primary" />
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
            <h2 className="text-xl font-bold text-brand-accent">Local Workout Active</h2>
            <p className="text-sm font-semibold text-white capitalize mt-1">
              Tracking: {selectedExercise ? selectedExercise.name : ''}
            </p>
            <p className="text-xs text-dark-muted leading-relaxed font-semibold mt-3">
              The external posture analysis window is currently running on your desktop. Perform your exercises in front of the camera.
            </p>
            <div className="bg-brand-primary/5 border border-brand-primary/15 rounded-2xl p-4 text-[10px] text-brand-primary text-left leading-relaxed space-y-1">
              <p>💡 <b>Form Feedback:</b> Look at the OpenCV window for real-time rep counts and safety indicators.</p>
              <p>⏱️ <b>How to finish:</b> Press <b>ESC</b> (to close window) or <b>M</b> (to change exercise) in the tracking window. Your sets, reps, and accuracy will sync immediately to this dashboard.</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-xl font-bold text-brand-secondary">Failed to Launch</h2>
            <p className="text-xs text-brand-secondary/95 bg-brand-secondary/5 border border-brand-secondary/20 rounded-xl p-3">
              {error}
            </p>
            <button 
              onClick={launchLocal}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/90 transition-colors font-bold text-xs rounded-xl"
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
  const [userGoal, setUserGoal] = useState('Muscle Gain');
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showWorkoutsModal, setShowWorkoutsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchDashboardData = async (uid) => {
    const targetUserId = uid || userId;
    if (!targetUserId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${targetUserId}`);
      if (res.ok) {
        const json = await res.json();
        setDashboardData(json);
      }
    } catch (e) {
      console.error("Sidebar fetch failed", e);
    }
  };

  const handleQuickLogSidebar = async (type, amount) => {
    if (!userId) return;
    try {
      const payload = {};
      if (type === 'water') {
        payload.water_liters = amount;
      }
      if (type === 'protein') {
        payload.protein_grams = amount;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/intake/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Quick log failed');
      const intake = await res.json();
      
      setDashboardData(prev => ({
        ...prev,
        intake_today: {
          ...prev.intake_today,
          protein: intake.protein_grams,
          water: intake.water_liters
        }
      }));
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDashboardData(userId);
    } else {
      setDashboardData(null);
    }
  }, [userId, view]);

  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('gym_user_avatar') || '');

  useEffect(() => {
    // Check if user has already onboarded
    const storedId = localStorage.getItem('gym_user_id');
    const storedName = localStorage.getItem('gym_user_name');
    const storedGoal = localStorage.getItem('gym_user_goal');

    if (storedId && storedName) {
      setUserId(parseInt(storedId));
      setUserName(storedName);
      if (storedGoal) setUserGoal(storedGoal);
      setView('dashboard');
    } else {
      setView('onboarding');
    }

    const handleAvatarChange = () => {
      setUserAvatar(localStorage.getItem('gym_user_avatar') || '');
    };
    window.addEventListener('avatarUpdated', handleAvatarChange);
    return () => window.removeEventListener('avatarUpdated', handleAvatarChange);
  }, []);

  const handleFinishOnboarding = (id, name) => {
    setUserId(id);
    setUserName(name);
    const storedGoal = localStorage.getItem('gym_user_goal') || 'Muscle Gain';
    setUserGoal(storedGoal);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('gym_user_id');
    localStorage.removeItem('gym_user_name');
    localStorage.removeItem('gym_user_goal');
    localStorage.removeItem('gym_user_avatar');
    setUserAvatar('');
    setUserId(null);
    setUserName('');
    setUserGoal('Muscle Gain');
    setView('onboarding');
  };

  const sidebarViews = ['dashboard', 'select-workout', 'analytics', 'photos', 'profile'];
  const showSidebar = userId && sidebarViews.includes(view);

  const renderSidebar = () => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'select-workout', label: 'Workout library', icon: Dumbbell },
      { id: 'analytics', label: 'Performance Analytics', icon: History },
      { id: 'photos', label: 'Progress', icon: Image },
      { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
      <div className={`w-64 bg-[#08080E] border-r border-gold/15 flex flex-col h-screen sticky top-0 flex-shrink-0 select-none z-30 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute md:relative md:w-0 overflow-hidden border-none'}`}>
        {/* Branding header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Activity className="w-5 h-5 animate-pulse text-gold" />
            </div>
            <span className="font-extrabold tracking-tight neon-gradient-text text-lg">AI Gym Trainer</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-gold/15 flex items-center justify-center text-dark-muted hover:text-gold transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div 
          onClick={() => setView('profile')}
          className="p-4 mx-4 my-6 bg-dark-card border border-gold/15 hover:border-red-500/40 rounded-2xl flex items-center gap-3 shadow-lg shadow-black/60 cursor-pointer group transition-all"
          title="View & Edit Profile"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center font-black text-sm text-black uppercase flex-shrink-0 shadow-md shadow-gold/20 overflow-hidden relative">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-full h-full object-cover rounded-xl" />
            ) : (
              userName ? userName.substring(0, 2) : 'AI'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-extrabold text-white text-sm block truncate group-hover:text-gold transition-colors">{userName || 'User'}</span>
            <span className="text-[10px] font-black text-red-500 tracking-wider block mt-0.5 uppercase truncate">{userGoal}</span>
          </div>
        </div>

        {/* Nav list */}
        <div className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full px-4 py-3.5 rounded-xl text-left text-sm font-semibold transition-all flex items-center gap-3 ${
                  isActive 
                    ? 'bg-gold/15 text-gold border border-gold/40 shadow-lg shadow-gold/10 font-bold' 
                    : 'text-dark-muted border border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-dark-muted'}`} />
                {item.label}
              </button>
            );
          })}

          {/* Activity Trackers inside Sidebar */}
          {dashboardData && (
            <div className="mt-6 pt-4 border-t border-white/5 space-y-3 pb-4">
              <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block mb-1">Daily Progress</span>

              {/* Consistency Tracker (Futuristic Circular Progress Ring) */}
              <div className="bg-dark-card border border-gold/20 rounded-2xl p-4 flex items-center gap-4 hover:border-gold/50 transition-all duration-300 futuristic-glow-gold relative overflow-hidden group">
                <div className="absolute -inset-full bg-[radial-gradient(circle,rgba(245,158,11,0.06),transparent)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                {/* SVG Progress Ring */}
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="19"
                      className="stroke-white/5 fill-transparent"
                      strokeWidth="3"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="19"
                      className="stroke-gold fill-transparent progress-ring-circle"
                      strokeWidth="3"
                      strokeDasharray={2 * Math.PI * 19}
                      strokeDashoffset={2 * Math.PI * 19 - (dashboardData.workout_completion / 100) * (2 * Math.PI * 19)}
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' }}
                    />
                  </svg>
                  <Trophy className="w-4 h-4 text-gold relative z-10 animate-pulse" />
                </div>
                
                {/* Text and Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold text-slate-300">Streak</span>
                    {dashboardData.completed_today && dashboardData.completed_today.length > 0 && (
                      <button 
                        onClick={() => setShowWorkoutsModal(true)}
                        className="px-1.5 py-0.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:scale-105 active:scale-95 transition-all text-red-500 text-[8px] font-bold tracking-widest uppercase rounded-md"
                      >
                        View
                      </button>
                    )}
                  </div>
                  <span className="text-sm font-black text-white block mt-1">{dashboardData.workout_streak} <span className="text-[10px] text-dark-muted font-bold">Days</span></span>
                  <span className="text-[9px] font-bold text-gold block mt-0.5">{dashboardData.workout_completion}% Completed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout at bottom */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3.5 rounded-xl text-left text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-3 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            Logout
          </button>
        </div>
      </div>
    );
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wider text-dark-muted">SYNCHRONIZING APP STATE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col md:flex-row relative overflow-x-hidden">
      {showSidebar && renderSidebar()}

      <div className={`flex-1 min-w-0 relative ${showSidebar && !isSidebarOpen ? 'pl-20 md:pl-24' : ''} transition-all duration-300`}>
        {/* Expand button visible only when sidebar is hidden */}
        {showSidebar && !isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-8 left-8 z-40 w-10 h-10 rounded-xl bg-[#080B11] border border-white/10 flex items-center justify-center text-dark-muted hover:text-white hover:border-brand-primary/40 shadow-lg shadow-black/40 transition-all duration-200 hover:scale-105 active:scale-95 animate-fade-in"
            title="Expand Sidebar"
          >
            <Menu className="w-5 h-5" />
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
            data={dashboardData}
            setData={setDashboardData}
            fetchDashboardData={() => fetchDashboardData(userId)}
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
            setView={(newView) => {
              if (newView === 'select-workout') setSelectedExercise(null);
              setView(newView);
            }} 
            onSelectExercise={(key, name) => {
              setSelectedExercise({ key, name });
              setView('workout');
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
            workoutExercises={selectedExercise ? [[selectedExercise.key, selectedExercise.name]] : (workoutExercises || [])} 
            setView={(newView) => {
              setSelectedExercise(null);
              setView(newView);
            }}
            onWorkoutLogged={() => {
              setSelectedExercise(null);
              setView('analytics');
            }}
          />
        )}

        {view === 'analytics' && (
          <Analytics userId={userId} setView={setView} />
        )}

        {view === 'photos' && (
          <ProgressPhotos userId={userId} setView={setView} />
        )}

        {view === 'profile' && (
          <ProfileView userId={userId} userName={userName} handleLogout={handleLogout} />
        )}
      </div>

      {/* --- WORKOUT LOGS MODAL --- */}
      {showWorkoutsModal && dashboardData && dashboardData.completed_today && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0b0e14] p-8 rounded-3xl border border-white/10 animate-fade-in-up relative">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-white">Today's Completed Workouts</h3>
                <p className="text-xs text-dark-muted mt-1">
                  A track of all posture-analyzed sessions logged today
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-brand-primary" />
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {dashboardData.completed_today.map((w, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 px-4 py-3.5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200 capitalize">
                      {w.exercise.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-dark-muted font-medium mt-1">
                      {w.sets} sets × {w.reps} reps • {w.duration ? Number(w.duration).toFixed(1) : '0.0'} min
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-accent bg-brand-accent/10 px-2 py-1 rounded-lg border border-brand-accent/15">
                    {Math.round(w.accuracy)}% Acc
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                onClick={() => setShowWorkoutsModal(false)}
                className="w-full py-3.5 bg-dark-border/40 hover:bg-dark-border/60 transition-colors font-semibold rounded-xl text-xs text-white"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
