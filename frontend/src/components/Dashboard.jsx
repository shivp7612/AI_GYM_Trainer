// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Flame, Calendar, Trophy, ChevronRight, Droplet, Dumbbell, 
  Apple, History, MessageSquare, Image, Star, Plus, 
  BedDouble, UserCheck, ShieldCheck, HeartPulse 
} from 'lucide-react';

export default function Dashboard({ userId, userName, setView, onStartWorkout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboard/${userId}`);
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Connection to API failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

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

  if (loading) {
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
    workout_details, diet_meals, diet_macros_target
  } = data;

  const waterPercent = Math.min(100, (intake_today.water / goals.water_target) * 100);
  const proteinPercent = Math.min(100, (intake_today.protein / goals.protein_target) * 100);
  const caloriesPercent = Math.min(100, (intake_today.calories / goals.calories_target) * 100);

  return (
    <div className="min-h-screen bg-dark text-white pb-16 px-4 md:px-8 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-purple/5 blur-[150px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-mint/5 blur-[150px]"></div>

      <div className="max-w-6xl mx-auto pt-8 space-y-8 relative z-10 animate-fade-in-up">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Hello {userName} 👋</h1>
            <p className="text-dark-muted text-xs md:text-sm tracking-wide mt-1">
              Ready for your session? Optimize performance and prevent injuries today.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setShowReadinessModal(true)}
              className="px-4 py-2.5 bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple/20 transition-all font-semibold rounded-xl text-xs flex items-center gap-1.5 text-brand-purple"
            >
              <UserCheck className="w-4 h-4" />
              Exercise Readiness Score
            </button>
            <button 
              onClick={() => setView('analytics')}
              className="px-4 py-2.5 bg-dark-border/40 hover:bg-dark-border/60 transition-all font-semibold rounded-xl text-xs flex items-center gap-1.5 text-slate-300"
            >
              <History className="w-4 h-4 text-dark-muted" />
              Analytics
            </button>
            <button 
              onClick={() => setView('photos')}
              className="px-4 py-2.5 bg-dark-border/40 hover:bg-dark-border/60 transition-all font-semibold rounded-xl text-xs flex items-center gap-1.5 text-slate-300"
            >
              <Image className="w-4 h-4 text-dark-muted" />
              Progress Photos
            </button>
            <button 
              onClick={() => setView('chat')}
              className="px-4 py-2.5 bg-dark-border/40 hover:bg-dark-border/60 transition-all font-semibold rounded-xl text-xs flex items-center gap-1.5 text-slate-300"
            >
              <MessageSquare className="w-4 h-4 text-dark-muted" />
              AI Coach Chat
            </button>
          </div>
        </div>

        {/* --- GRID: TRACKERS & STREAKS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* DAILY WATER LOGGER */}
          <div className="glass p-6 rounded-3xl flex flex-col justify-between h-[180px] border border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center">
                <Droplet className="w-5 h-5 text-brand-purple" />
              </div>
              <button 
                onClick={() => handleQuickLog('water', 0.25)}
                disabled={addingWater}
                className="w-8 h-8 rounded-xl bg-brand-purple hover:bg-brand-purple/90 active:scale-95 transition-all flex items-center justify-center font-bold text-white shadow-md shadow-brand-purple/20"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-black">{intake_today.water} <span className="text-xs text-dark-muted font-bold">/ {goals.water_target}L</span></span>
                <span className="text-xs font-bold text-brand-purple">{Math.round(waterPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-purple rounded-full" style={{ width: `${waterPercent}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-2 uppercase">Water Intake Target</span>
            </div>
          </div>

          {/* DAILY PROTEIN LOGGER */}
          <div className="glass p-6 rounded-3xl flex flex-col justify-between h-[180px] border border-white/5">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-2xl bg-brand-mint/10 border border-brand-mint/20 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-brand-mint" />
              </div>
              <button 
                onClick={() => handleQuickLog('protein', 20)}
                disabled={addingProtein}
                className="w-8 h-8 rounded-xl bg-brand-mint hover:bg-brand-mint/90 active:scale-95 transition-all flex items-center justify-center font-bold text-white shadow-md shadow-brand-mint/20"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-black">{intake_today.protein} <span className="text-xs text-dark-muted font-bold">/ {goals.protein_target}g</span></span>
                <span className="text-xs font-bold text-brand-mint">{Math.round(proteinPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-mint rounded-full" style={{ width: `${proteinPercent}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-2 uppercase">Protein Consumed</span>
            </div>
          </div>

          {/* DAILY CALORIE LOGGER */}
          <div className="glass p-6 rounded-3xl flex flex-col justify-between h-[180px] border border-white/5">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-2xl bg-brand-coral/10 border border-brand-coral/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-brand-coral" />
              </div>
              <button 
                onClick={() => handleQuickLog('calories', 300)}
                disabled={addingCal}
                className="w-8 h-8 rounded-xl bg-brand-coral hover:bg-brand-coral/90 active:scale-95 transition-all flex items-center justify-center font-bold text-white shadow-md shadow-brand-coral/20"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-black">{intake_today.calories} <span className="text-xs text-dark-muted font-bold">/ {goals.calories_target} kcal</span></span>
                <span className="text-xs font-bold text-brand-coral">{Math.round(caloriesPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-coral rounded-full" style={{ width: `${caloriesPercent}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-2 uppercase">Daily Calories Intake</span>
            </div>
          </div>

          {/* WORKOUT STREAK / PROGRESS */}
          <div className="glass p-6 rounded-3xl flex flex-col justify-between h-[180px] border border-white/5">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-brand-gold" />
              </div>
              <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold tracking-widest text-brand-gold uppercase">
                ACTIVE
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-black">{workout_streak} <span className="text-xs text-dark-muted font-bold">Days</span></span>
                <span className="text-xs font-bold text-brand-gold">{workout_completion}% Completion</span>
              </div>
              <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-gold rounded-full" style={{ width: `${workout_completion}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-2 uppercase">Workout Consistency</span>
            </div>
          </div>

        </div>

        {/* --- MAIN SPLIT CONTAINER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: TODAY'S WORKOUT PLAN & RECOMMENDATIONS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* WORKOUT PLAN BOX */}
            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-brand-purple tracking-widest uppercase block mb-1">Today's Split</span>
                  <h2 className="text-2xl font-extrabold">{today_workout_name}</h2>
                </div>
                <button
                  onClick={() => onStartWorkout(today_exercises)}
                  disabled={today_exercises.length === 0}
                  className="px-6 py-3.5 bg-brand-purple hover:bg-brand-purple/90 active:scale-95 transition-all text-white text-sm font-bold rounded-2xl flex items-center gap-1.5 shadow-lg shadow-brand-purple/20"
                >
                  Start Workout <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Safety warning swaps details */}
              {workout_details.injury_swaps && workout_details.injury_swaps.length > 0 && (
                <div className="bg-brand-coral/5 border border-brand-coral/20 rounded-2xl p-4 flex gap-3 text-xs text-brand-coral font-medium leading-relaxed">
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
                <div className="space-y-3">
                  {today_exercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-dark-border/20 border border-white/5 rounded-2xl p-4 hover:border-brand-purple/30 transition-colors">
                      <div className="w-10 h-10 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple font-bold rounded-xl flex items-center justify-center text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold block capitalize text-sm">{ex[1] || ex[0].replace(/_/g, ' ')}</span>
                        <span className="text-xs text-dark-muted block mt-0.5">{workout_details.sets} Sets × {workout_details.reps} Reps | {workout_details.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-dark-border/10 rounded-2xl border border-white/5">
                  <span className="text-3xl block mb-2">🧘</span>
                  <span className="text-sm font-bold text-dark-muted block uppercase">Rest / Recovery Day Scheduled</span>
                  <span className="text-xs text-dark-muted block mt-1">Prioritize light stretching, deep sleep, and hydration.</span>
                </div>
              )}
            </div>

            {/* AI METRICS SUMMARY */}
            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-brand-purple" />
                AI Health Profiler Output
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-border/25 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-2xl font-black block text-brand-purple">{metrics.bmi}</span>
                  <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-1 uppercase">Calculated BMI</span>
                </div>
                <div className="bg-dark-border/25 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-2xl font-black block text-brand-mint">{metrics.body_fat_est}%</span>
                  <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-1 uppercase">Est Body Fat</span>
                </div>
                <div className="bg-dark-border/25 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-2xl font-black block text-brand-gold">{metrics.sleep_hours} Hrs</span>
                  <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-1 uppercase">Sleep Rec</span>
                </div>
                <div className="bg-dark-border/25 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-2xl font-black block text-brand-coral">{metrics.target_weight}kg</span>
                  <span className="text-[10px] font-bold text-dark-muted tracking-wider block mt-1 uppercase">Goal Weight</span>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-brand-purple/5 border border-brand-purple/20 p-5 rounded-2xl">
                <BedDouble className="w-8 h-8 text-brand-purple flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Estimated Timeline to Goal</h4>
                  <p className="text-xs text-dark-muted mt-1 leading-relaxed">
                    Based on your weight logs and target goals, you are estimated to reach {metrics.target_weight}kg in approximately <b>{metrics.goal_time_weeks} weeks</b> under safe caloric loads.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: DIET PLAN RECOMMENDATIONS */}
          <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold text-brand-mint tracking-widest uppercase block mb-1">Nutrition Strategy</span>
              <h2 className="text-2xl font-extrabold">Indian Diet Plan</h2>
              <span className="text-xs text-dark-muted mt-0.5 block">Macro Split: {diet_macros_target.carbs}g Carbs | {diet_macros_target.fat}g Fat</span>
            </div>

            <div className="space-y-4 divide-y divide-white/5">
              
              {Object.keys(diet_meals).map((mealKey) => (
                <div key={mealKey} className="pt-4 first:pt-0">
                  <h4 className="font-bold text-sm text-brand-mint capitalize mb-2">{mealKey}</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {diet_meals[mealKey].map((food, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
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

    </div>
  );
}
