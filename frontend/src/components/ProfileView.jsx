// frontend/src/components/ProfileView.jsx
import React, { useState, useEffect } from 'react';
import { User, Activity, Flame, ShieldAlert, Award, Calendar, RotateCcw, Droplet, Dumbbell, ShieldCheck } from 'lucide-react';

export default function ProfileView({ userId, userName, handleLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Readiness Checklist Modal State
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [sleepInput, setSleepInput] = useState(7.5);
  const [sorenessInput, setSorenessInput] = useState(3);
  const [energyInput, setEnergyInput] = useState(8);
  const [readinessResult, setReadinessResult] = useState(null);
  const [calculatingReadiness, setCalculatingReadiness] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/${userId}`);
      if (!res.ok) throw new Error('Could not load user profile details');
      const data = await res.json();
      setProfile(data);
    } catch (e) {
      setError(e.message || 'Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleReadinessCheck = async () => {
    setCalculatingReadiness(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/readiness/` + userId, {
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
          <p className="text-sm font-semibold tracking-wider text-dark-muted">LOADING USER PROFILE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white px-4">
        <div className="glass p-8 rounded-3xl text-center max-w-md border border-brand-coral/20">
          <ShieldAlert className="w-16 h-16 text-brand-coral mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Profile</h2>
          <p className="text-sm text-dark-muted mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={fetchProfile}
            className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 transition-colors font-semibold rounded-xl text-sm"
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white pb-16 px-4 md:px-8 relative overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-purple/5 blur-[150px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-mint/5 blur-[150px]"></div>

      <div className="max-w-4xl mx-auto pt-8 space-y-8 relative z-10 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Profile</h1>
            <p className="text-dark-muted text-xs md:text-sm tracking-wide mt-1">
              Manage your personal physical records, AI calculation targets, and options.
            </p>
          </div>
          
          <button 
            onClick={() => setShowReadinessModal(true)}
            className="px-4 py-2.5 bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple/20 transition-all font-semibold rounded-xl text-xs flex items-center gap-1.5 text-brand-purple"
          >
            <Activity className="w-4 h-4" />
            Check Readiness
          </button>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main User Card */}
          <div className="md:col-span-1 glass p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-between text-center space-y-6">
            <div className="space-y-4 w-full">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-purple to-brand-mint p-1 mx-auto flex items-center justify-center font-bold text-3xl uppercase">
                <div className="w-full h-full bg-[#131926] rounded-full flex items-center justify-center text-white font-extrabold">
                  {userName.substring(0, 2)}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black">{userName}</h2>
                <span className="text-xs font-bold text-brand-mint tracking-wider uppercase bg-brand-mint/10 border border-brand-mint/15 px-3 py-1 rounded-full mt-2 inline-block">
                  {profile.goal}
                </span>
              </div>
            </div>

            <div className="w-full border-t border-white/5 pt-6 space-y-3.5 text-left text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-dark-muted font-semibold">Age:</span>
                <span className="font-bold">{profile.age} Years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted font-semibold">Gender:</span>
                <span className="font-bold">{profile.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted font-semibold">Height:</span>
                <span className="font-bold">{profile.height} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted font-semibold">Weight:</span>
                <span className="font-bold">{profile.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted font-semibold">Diet Preference:</span>
                <span className="font-bold text-brand-mint">{profile.diet_pref}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-brand-coral/10 hover:bg-brand-coral/20 border border-brand-coral/20 hover:border-brand-coral/30 transition-all font-bold text-xs text-brand-coral uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Profile
            </button>
          </div>

          {/* AI Metrics Outputs */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-purple" />
                AI Health Diagnostics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-border/25 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                  <span className="text-3xl font-black text-brand-purple">{profile.bmi}</span>
                  <span className="text-xs font-semibold text-dark-muted mt-1 uppercase tracking-wider">BMI Score</span>
                </div>
                <div className="bg-dark-border/25 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                  <span className="text-3xl font-black text-brand-mint">{profile.body_fat_est}%</span>
                  <span className="text-xs font-semibold text-dark-muted mt-1 uppercase tracking-wider">Est Body Fat</span>
                </div>
                <div className="bg-dark-border/25 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                  <span className="text-3xl font-black text-brand-gold">{profile.sleep_hours} Hrs</span>
                  <span className="text-xs font-semibold text-dark-muted mt-1 uppercase tracking-wider">Sleep Rec</span>
                </div>
                <div className="bg-dark-border/25 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                  <span className="text-3xl font-black text-brand-coral">{profile.target_weight} kg</span>
                  <span className="text-xs font-semibold text-dark-muted mt-1 uppercase tracking-wider">Goal Weight</span>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-brand-purple/5 border border-brand-purple/20 p-5 rounded-2xl">
                <Calendar className="w-8 h-8 text-brand-purple flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Estimated Timeline</h4>
                  <p className="text-xs text-dark-muted mt-1 leading-relaxed">
                    Based on your starting weight and goal targets, you should reach <b>{profile.target_weight}kg</b> in approximately <b>{profile.goal_time_weeks} weeks</b>.
                  </p>
                </div>
              </div>
            </div>

            {/* Target Nutrition Limits */}
            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-mint" />
                Calculated Daily Targets
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 bg-dark-border/20 border border-white/5 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-dark-muted font-bold block uppercase tracking-wider">Water Goal</span>
                    <span className="text-lg font-black">{profile.target_water} Liters / day</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-dark-border/20 border border-white/5 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-mint/10 border border-brand-mint/20 flex items-center justify-center text-brand-mint">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-dark-muted font-bold block uppercase tracking-wider">Protein Goal</span>
                    <span className="text-lg font-black">{profile.target_protein} Grams / day</span>
                  </div>
                </div>
              </div>
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
