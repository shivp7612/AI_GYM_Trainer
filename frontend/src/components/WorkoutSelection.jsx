import React, { useState, useEffect } from 'react';
import { ChevronLeft, Dumbbell, Play, Sparkles, Layers } from 'lucide-react';

export default function WorkoutSelection({ userId, workoutExercises, setView, onSelectExercise }) {
  const [exercisesData, setExercisesData] = useState(null);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/workout/exercises');
        if (!res.ok) throw new Error('Failed to fetch exercises definition');
        const json = await res.json();
        setExercisesData(json);
      } catch (err) {
        setError(err.message || 'Could not load exercises.');
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wider text-dark-muted">FETCHING TRAINING REGIMES...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white px-4">
        <div className="glass p-8 rounded-3xl text-center max-w-md border border-brand-coral/20">
          <p className="text-sm text-brand-coral mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 transition-colors font-semibold rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cleanMuscleName = (name) => {
    if (name === 'Traps_Forearms') return 'Traps & Forearms';
    return name;
  };

  const formatExerciseName = (name) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getMuscleIcon = (muscle) => {
    return <Dumbbell className="w-5 h-5 text-brand-purple" />;
  };

  return (
    <div className="min-h-screen bg-dark text-white pb-16 px-4 md:px-8 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-purple/5 blur-[150px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-mint/5 blur-[150px]"></div>

      <div className="max-w-6xl mx-auto pt-8 space-y-8 relative z-10 animate-fade-in-up">
        {/* HEADER BAR */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {selectedMuscle && (
              <button 
                onClick={() => setSelectedMuscle(null)}
                className="w-10 h-10 rounded-xl bg-dark-border/40 hover:bg-dark-border/60 transition-colors flex items-center justify-center border border-white/5"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {selectedMuscle ? `${cleanMuscleName(selectedMuscle)} Exercises` : 'Select Target Muscle'}
              </h1>
              <p className="text-dark-muted text-xs md:text-sm tracking-wide mt-1">
                {selectedMuscle 
                  ? 'Choose an exercise to start real-time computer vision posture analysis.'
                  : 'Select a muscle group below or choose today\'s planned routine.'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setView('dashboard')}
            className="px-4 py-2.5 bg-dark-border/40 hover:bg-dark-border/60 transition-all font-semibold rounded-xl text-xs flex items-center gap-1.5 text-slate-300"
          >
            Back to Dashboard
          </button>
        </div>

        {/* TODAY'S PLAN SECTION */}
        {!selectedMuscle && workoutExercises && workoutExercises.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-brand-purple tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-purple animate-pulse" />
              Today's Scheduled Regime
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workoutExercises.map((ex, idx) => {
                const exKey = ex[0];
                const cleanName = ex[1] || formatExerciseName(exKey);
                return (
                  <div 
                    key={idx} 
                    className="glass p-5 rounded-3xl border border-white/5 hover:border-brand-purple/35 transition-all duration-300 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple font-extrabold rounded-2xl flex items-center justify-center text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm block capitalize">{cleanName}</span>
                        <span className="text-[10px] text-brand-purple font-bold tracking-widest uppercase block mt-0.5">Today's Target</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectExercise(exKey, cleanName)}
                      className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-brand-purple/10 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Launch
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        {!selectedMuscle ? (
          /* MUSCLE LIST GRID */
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-dark-muted tracking-widest uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Custom Selection by Muscle
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.keys(exercisesData || {}).map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className="glass p-6 rounded-3xl text-left border border-white/5 hover:border-brand-purple/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[150px] group relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center group-hover:bg-brand-purple/20 transition-colors">
                    {getMuscleIcon(muscle)}
                  </div>
                  
                  <div className="z-10">
                    <span className="text-lg font-extrabold block text-white group-hover:text-brand-purple transition-colors">
                      {cleanMuscleName(muscle)}
                    </span>
                    <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-1 uppercase">
                      {Object.keys(exercisesData[muscle]).length} Exercises
                    </span>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* EXERCISE LIST FOR SELECTED MUSCLE */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            {Object.keys(exercisesData[selectedMuscle] || {}).map((exKey) => {
              const exData = exercisesData[selectedMuscle][exKey];
              const cleanExName = formatExerciseName(exKey);
              return (
                <div 
                  key={exKey}
                  className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-between h-[200px] hover:border-brand-mint/30 transition-all duration-300 group relative overflow-hidden"
                >
                  <div>
                    <h3 className="text-lg font-black group-hover:text-brand-mint transition-colors">{cleanExName}</h3>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                        Posture: {exData.posture.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                        Joint: {exData.joint}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectExercise(exKey, cleanExName)}
                    className="w-full py-3 bg-brand-mint hover:bg-brand-mint/90 active:scale-95 transition-all text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-mint/15 z-10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start Tracking
                  </button>

                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-mint/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
