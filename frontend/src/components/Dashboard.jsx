// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Flame, Calendar, Trophy, ChevronRight, Droplet, Dumbbell, 
  Apple, History, Image, Star, Plus, 
  BedDouble, UserCheck, ShieldCheck, HeartPulse 
} from 'lucide-react';

export default function Dashboard({ userId, userName, setView, onStartWorkout, data, setData, fetchDashboardData }) {
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState('');
  
  // Readiness Checklist Modal State
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [sleepInput, setSleepInput] = useState(7.5);
  const [sorenessInput, setSorenessInput] = useState(3);
  const [energyInput, setEnergyInput] = useState(8);
  const [readinessResult, setReadinessResult] = useState(null);
  const [calculatingReadiness, setCalculatingReadiness] = useState(false);

  // Quick Logs Local State
  const [addingWater, setAddingWater] = useState(false);
  const [addingProtein, setAddingProtein] = useState(false);
  const [addingCal, setAddingCal] = useState(false);
  const [showWorkoutsModal, setShowWorkoutsModal] = useState(false);
  
  // Weekly Diet State
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [activeDietDay, setActiveDietDay] = useState(daysOfWeek.includes(currentDayName) ? currentDayName : "Monday");

  const loadData = async () => {
    try {
      if (fetchDashboardData) {
        await fetchDashboardData();
      }
    } catch (err) {
      setError(err.message || 'Connection to API failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [userId, data]);

  const handleQuickLog = async (type, amount) => {
    try {
      const payload = {};
      if (type === 'water') {
        setAddingWater(true);
        payload.water_liters = amount;
      }
      if (type === 'protein') {
        setAddingProtein(true);
        payload.protein_grams = amount;
      }
      if (type === 'calories') {
        setAddingCal(true);
        payload.calories_kcal = amount;
      }

      const res = await fetch(`http://localhost:8000/api/intake/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Quick log failed');
      const intake = await res.json();
      
      // Update local dashboard state
      setData(prev => ({
        ...prev,
        intake_today: {
          calories: intake.calories_kcal,
          protein: intake.protein_grams,
          water: intake.water_liters
        }
      }));
    } catch (e) {
      alert(e.message);
    } finally {
      setAddingWater(false);
      setAddingProtein(false);
      setAddingCal(false);
    }
  };

  const handleReadinessCheck = async () => {
    setCalculatingReadiness(true);
    try {
      const res = await fetch(`http://localhost:8000/api/readiness/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleep_hours: parseFloat(sleepInput),
          soreness_level: parseInt(sorenessInput),
          energy_level: parseInt(energyInput)
        })
      });
      if (!res.ok) throw new Error('Readiness calculation failed');
      const result = await res.json();
      setReadinessResult(result);
    } catch (e) {
      alert(e.message);
    } finally {
      setCalculatingReadiness(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wider text-dark-muted">LOADING DASHBOARD SUMMARY...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white px-4">
        <div className="glass p-8 rounded-3xl text-center max-w-md border border-brand-coral/20">
          <ShieldCheck className="w-16 h-16 text-brand-coral mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sync Connection Error</h2>
          <p className="text-sm text-dark-muted mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 transition-colors font-semibold rounded-xl text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const {
    metrics, goals, intake_today, workout_streak,
    workout_completion, today_workout_name, today_exercises,
    workout_details, diet_meals, diet_macros_target,
    completed_today
  } = data;

  const currentDayMeals = diet_meals && diet_meals[activeDietDay] ? diet_meals[activeDietDay] : (diet_meals || {});

  const waterPercent = Math.min(100, (intake_today.water / goals.water_target) * 100);
  const proteinPercent = Math.min(100, (intake_today.protein / goals.protein_target) * 100);
  const caloriesPercent = Math.min(100, (intake_today.calories / goals.calories_target) * 100);

  return (
    <div className="min-h-screen bg-dark text-white pb-16 px-4 md:px-8 relative overflow-hidden select-none">
      {/* High-tech Background Neon Glowing Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-brand-mint/5 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }}></div>

      <div className="max-w-6xl mx-auto pt-8 space-y-8 relative z-10 animate-fade-in-up">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 relative">
          <div className="max-w-md">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Heyy {userName} 👋</h1>
            <p className="text-dark-muted text-xs md:text-sm tracking-wide mt-1">
              Ready for your session? Optimize performance and prevent injuries today.
            </p>
          </div>
          
          {/* Centered Motivational Quote/Thought */}
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 mt-4 md:mt-0 flex justify-center w-full md:w-auto">
            <div className="glass px-6 py-3 rounded-2xl border border-white/10 flex items-center shadow-lg relative overflow-hidden group hover:border-brand-mint/35 transition-all futuristic-glow-mint">
              <div className="absolute -inset-full bg-[radial-gradient(circle,rgba(16,185,129,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <span className="text-sm font-semibold italic text-brand-mint tracking-wide text-center">
                You're built to be epic
              </span>
            </div>
          </div>
        </div>


        {/* --- MAIN SPLIT CONTAINER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: TODAY'S WORKOUT PLAN & RECOMMENDATIONS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* WORKOUT PLAN BOX */}
            <div className="futuristic-card p-8 rounded-3xl space-y-6 futuristic-scanner relative overflow-hidden group">
              <div className="absolute -inset-full bg-[radial-gradient(circle,rgba(99,102,241,0.06),transparent)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <span className="text-xs font-bold text-brand-purple tracking-widest uppercase block mb-1">Today's Split</span>
                  <h2 className="text-2xl font-extrabold text-white">{today_workout_name}</h2>
                </div>
                <button
                  onClick={() => onStartWorkout(today_exercises)}
                  className="px-6 py-3.5 neon-btn-purple text-white text-sm font-bold rounded-2xl flex items-center gap-1.5 active:scale-95"
                >
                  {today_exercises.length > 0 ? "Start Workout" : "Start Custom Workout"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Safety warning swaps details */}
              {workout_details.injury_swaps && workout_details.injury_swaps.length > 0 && (
                <div className="bg-brand-coral/5 border border-brand-coral/20 rounded-2xl p-4 flex gap-3 text-xs text-brand-coral font-medium leading-relaxed relative z-10">
                  <div className="w-5 h-5 flex-shrink-0 bg-brand-coral/10 rounded-lg flex items-center justify-center text-sm font-bold">!</div>
                  <div>
                    <span className="font-bold uppercase tracking-wider block mb-1">Injury Safe Mode Active</span>
                    {workout_details.injury_swaps.map((swap, idx) => (
                      <p key={idx}>• {swap}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise Checklist */}
              {today_exercises.length > 0 ? (
                <div className="space-y-3 relative z-10">
                  {today_exercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-[#121829]/40 border border-white/5 rounded-2xl p-4 hover:border-brand-purple/40 hover:bg-dark-border/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-sm">
                      <div className="w-10 h-10 bg-brand-purple/20 border border-brand-purple/35 text-white font-extrabold rounded-xl flex items-center justify-center text-sm shadow-inner shadow-brand-purple/10">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold block capitalize text-sm">
                          {ex[0] === 'treadmill' ? 'Treadmill Recovery & Step Session' : (ex[1] || ex[0].replace(/_/g, ' '))}
                        </span>
                        <span className="text-xs text-dark-muted block mt-0.5">
                          {ex[0] === 'treadmill' ? ex[1] : `${workout_details.sets} Sets × ${workout_details.reps} Reps | ${workout_details.description}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-dark-border/10 rounded-2xl border border-white/5 relative z-10">
                  <span className="text-3xl block mb-2">🧘</span>
                  <span className="text-sm font-bold text-dark-muted block uppercase">Rest / Recovery Day Scheduled</span>
                  <span className="text-xs text-dark-muted block mt-1">Prioritize light stretching, deep sleep, and hydration.</span>
                </div>
              )}
            </div>

            {/* AI METRICS SUMMARY */}
            <div className="futuristic-card p-8 rounded-3xl space-y-6 relative overflow-hidden group">
              <div className="absolute -inset-full bg-[radial-gradient(circle,rgba(99,102,241,0.06),transparent)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <h2 className="text-xl font-bold flex items-center gap-2 relative z-10">
                <HeartPulse className="w-5 h-5 text-brand-purple" />
                AI Health Profiler Output
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                <div className="bg-[#121829]/60 border border-brand-purple/20 hover:border-brand-purple/40 rounded-2xl p-4 text-center transition-all hover:scale-105 futuristic-glow-purple">
                  <span className="text-2xl font-black block text-brand-purple tracking-tight">{metrics.bmi}</span>
                  <span className="text-[10px] font-bold text-dark-muted tracking-widest block mt-1 uppercase">Calculated BMI</span>
                </div>
                <div className="bg-[#121829]/60 border border-brand-mint/20 hover:border-brand-mint/40 rounded-2xl p-4 text-center transition-all hover:scale-105 futuristic-glow-mint">
                  <span className="text-2xl font-black block text-brand-mint tracking-tight">{metrics.body_fat_est}%</span>
                  <span className="text-[10px] font-bold text-dark-muted tracking-widest block mt-1 uppercase">Est Body Fat</span>
                </div>
                <div className="bg-[#121829]/60 border border-brand-gold/20 hover:border-brand-gold/40 rounded-2xl p-4 text-center transition-all hover:scale-105 futuristic-glow-gold">
                  <span className="text-2xl font-black block text-brand-gold tracking-tight">{metrics.sleep_hours} Hrs</span>
                  <span className="text-[10px] font-bold text-dark-muted tracking-widest block mt-1 uppercase">Sleep Rec</span>
                </div>
                <div className="bg-[#121829]/60 border border-brand-coral/20 hover:border-brand-coral/40 rounded-2xl p-4 text-center transition-all hover:scale-105 futuristic-glow-coral">
                  <span className="text-2xl font-black block text-brand-coral tracking-tight">{metrics.target_weight}kg</span>
                  <span className="text-[10px] font-bold text-dark-muted tracking-widest block mt-1 uppercase">Goal Weight</span>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-[#131b2e]/40 border border-white/5 p-5 rounded-2xl relative z-10 group-hover:border-brand-purple/30 transition-all">
                <BedDouble className="w-8 h-8 text-brand-purple flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Estimated Timeline to Goal</h4>
                  <p className="text-xs text-dark-muted mt-1 leading-relaxed">
                    Based on your weight logs and target goals, you are estimated to reach {metrics.target_weight}kg in approximately <b className="text-brand-purple">{metrics.goal_time_weeks} weeks</b> under safe caloric loads.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: DIET PLAN RECOMMENDATIONS */}
          <div className="futuristic-card p-6 md:p-8 rounded-3xl flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute -inset-full bg-[radial-gradient(circle,rgba(16,185,129,0.06),transparent)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="relative z-10">
              <span className="text-xs font-bold text-brand-mint tracking-widest uppercase block mb-1">Nutrition Strategy</span>
              <h2 className="text-2xl font-extrabold text-white">Indian Diet Plan</h2>
              <span className="text-xs text-dark-muted mt-0.5 block">Macro Split: {diet_macros_target.carbs}g Carbs | {diet_macros_target.fat}g Fat</span>
            </div>

            {/* Weekly Days Navigation Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-white/5 relative z-10">
              {daysOfWeek.map(day => {
                const isSelected = activeDietDay === day;
                const isSunday = day === "Sunday";
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDietDay(day)}
                    className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all border whitespace-nowrap flex-shrink-0 relative ${
                      isSelected 
                        ? 'bg-brand-mint text-dark border-brand-mint shadow-md shadow-brand-mint/20 hover:scale-105 active:scale-95' 
                        : 'bg-[#121829]/60 text-dark-muted border-white/5 hover:border-brand-mint/40 hover:text-slate-200'
                    }`}
                  >
                    {day.substring(0, 3)}
                    {isSunday && (
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isSelected ? 'bg-brand-coral' : 'bg-brand-gold'} animate-pulse`}></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 divide-y divide-white/5 relative z-10">
              {activeDietDay === "Sunday" && (
                <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-3 text-[10px] text-brand-gold font-medium leading-relaxed futuristic-glow-gold">
                  <span className="font-extrabold uppercase block mb-0.5">⚠️ Controlled Cheat Day</span>
                  Sundays are set up as low-stress, controlled recovery days. Enjoy localized favorite meals in portion-controlled sizes.
                </div>
              )}
              
              {Object.keys(currentDayMeals).map((mealKey) => (
                <div key={mealKey} className="pt-4 first:pt-0 pb-4 border-b border-white/5 last:border-none">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-3.5 bg-brand-mint rounded-full"></div>
                    <h4 className="font-bold text-sm text-brand-mint capitalize">{mealKey}</h4>
                  </div>
                  <ul className="space-y-2 pl-3 text-xs text-slate-300">
                    {currentDayMeals[mealKey].map((food, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed transition-all hover:translate-x-1 duration-200">
                        <span className="text-brand-mint font-bold mt-0.5">•</span>
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            </div>
          </div>

        </div>

      </div>

      {/* --- EXERCISE READINESS MODAL --- */}
      {showReadinessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-bright p-8 rounded-3xl border border-white/10 animate-fade-in-up relative">
            <h3 className="text-2xl font-extrabold tracking-tight mb-2">Exercise Readiness score</h3>
            <p className="text-xs text-dark-muted mb-6 leading-relaxed">
              Answer these questions to analyze systemic fatigue and determine safe training intensities.
            </p>

            <div className="space-y-5">
              
              {/* Question 1 */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">1. Sleep Duration (Last Night)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={sleepInput}
                  onChange={(e) => setSleepInput(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-purple/40 text-white font-medium text-sm transition-all"
                />
              </div>

              {/* Question 2 */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-slate-300">2. Muscle Soreness Level</label>
                  <span className="text-xs font-bold text-brand-coral">{sorenessInput} / 10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10"
                  value={sorenessInput}
                  onChange={(e) => setSorenessInput(e.target.value)}
                  className="w-full h-1.5 bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-purple"
                />
                <div className="flex justify-between text-[9px] text-dark-muted mt-1 font-semibold uppercase">
                  <span>No soreness</span>
                  <span>Extremely sore</span>
                </div>
              </div>

              {/* Question 3 */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-slate-300">3. Energy / Focus Level</label>
                  <span className="text-xs font-bold text-brand-mint">{energyInput} / 10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10"
                  value={energyInput}
                  onChange={(e) => setEnergyInput(e.target.value)}
                  className="w-full h-1.5 bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-purple"
                />
                <div className="flex justify-between text-[9px] text-dark-muted mt-1 font-semibold uppercase">
                  <span>Exhausted</span>
                  <span>Fully Charged</span>
                </div>
              </div>

              {/* Readiness Output Summary */}
              {readinessResult && (
                <div className="bg-brand-purple/10 border border-brand-purple/20 p-4 rounded-2xl space-y-2 mt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-dark-muted uppercase">Readiness Score</span>
                    <span className="text-xl font-black text-brand-purple">{readinessResult.score}%</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-dark-muted uppercase">Recommendation</span>
                    <span className="text-xs font-bold text-brand-mint">{readinessResult.action}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{readinessResult.advice}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    setShowReadinessModal(false);
                    setReadinessResult(null);
                  }}
                  className="w-1/3 py-3.5 bg-dark-border/40 hover:bg-dark-border/60 transition-colors font-semibold rounded-xl text-xs text-white"
                >
                  Close
                </button>
                <button 
                  onClick={handleReadinessCheck}
                  disabled={calculatingReadiness}
                  className="w-2/3 py-3.5 bg-brand-purple hover:bg-brand-purple/90 active:scale-95 transition-all text-white font-bold rounded-xl text-xs flex items-center justify-center shadow-lg shadow-brand-purple/20"
                >
                  {calculatingReadiness ? 'Analyzing readiness...' : 'Compute Score'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- WORKOUT LOGS MODAL --- */}
      {showWorkoutsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-bright p-8 rounded-3xl border border-white/10 animate-fade-in-up relative">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">Today's Completed Workouts</h3>
                <p className="text-xs text-dark-muted mt-1">
                  A track of all posture-analyzed sessions logged today
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-brand-gold" />
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {completed_today.map((w, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 px-4 py-3.5 rounded-2xl border border-white/5 hover:border-white/10 transition-all animate-fade-in-up">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200 capitalize">
                      {w.exercise.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-dark-muted font-medium mt-1">
                      {w.sets} sets × {w.reps} reps • {w.duration ? Number(w.duration).toFixed(1) : '0.0'} min
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-mint bg-brand-mint/10 px-2 py-1 rounded-lg border border-brand-mint/15">
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
