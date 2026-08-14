import React, { useState, useEffect } from 'react';
import { User, Activity, Flame, ShieldAlert, Award, Calendar, RotateCcw, Droplet, Dumbbell, ShieldCheck, Camera } from 'lucide-react';

export default function ProfileView({ userId, userName, handleLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('gym_user_avatar') || '');

  // Readiness Checklist Modal State
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [sleepInput, setSleepInput] = useState(7.5);
  const [sorenessInput, setSorenessInput] = useState(3);
  const [energyInput, setEnergyInput] = useState(8);
  const [readinessResult, setReadinessResult] = useState(null);
  const [calculatingReadiness, setCalculatingReadiness] = useState(false);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        localStorage.setItem('gym_user_avatar', base64String);
        setAvatarUrl(base64String);
        window.dispatchEvent(new Event('avatarUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

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
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wider text-dark-muted">LOADING USER PROFILE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white px-4">
        <div className="glass p-8 rounded-3xl text-center max-w-md border border-brand-secondary/20">
          <ShieldAlert className="w-16 h-16 text-brand-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Profile</h2>
          <p className="text-sm text-dark-muted mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={fetchProfile}
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 transition-colors font-semibold rounded-xl text-sm"
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
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary/5 blur-[150px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-accent/5 blur-[150px]"></div>

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
            className="px-4 py-2.5 neon-btn-gold text-black transition-all font-bold rounded-xl text-xs flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4" />
            Check Readiness
          </button>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main User Card */}
          <div className="md:col-span-1 futuristic-card p-6 rounded-3xl border border-gold/20 flex flex-col items-center justify-between text-center space-y-6">
            <div className="space-y-4 w-full">
              <div className="relative w-24 h-24 mx-auto group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 p-1 flex items-center justify-center font-bold text-3xl uppercase shadow-xl shadow-gold/20 overflow-hidden relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-[#0E0E17] rounded-full flex items-center justify-center text-white font-extrabold">
                      {userName.substring(0, 2)}
                    </div>
                  )}
                </div>
                
                {/* Camera upload overlay badge */}
                <label 
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-red-500 border-2 border-[#0E0E17] flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-red-600 hover:scale-110 active:scale-95 transition-all"
                  title="Upload Profile Photo"
                >
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">{userName}</h2>
                <label className="text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer underline block mt-1">
                  Change Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                  />
                </label>
                <span className="text-xs font-bold text-red-500 tracking-wider uppercase bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-full mt-2 inline-block">
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
                <span className="font-bold text-gold">{profile.diet_pref}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition-all font-bold text-xs text-red-500 uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Profile
            </button>
          </div>

          {/* AI Metrics Outputs */}
          <div className="md:col-span-2 space-y-6">
            <div className="futuristic-card p-8 rounded-3xl border border-gold/15 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Award className="w-5 h-5 text-gold" />
                AI Health Diagnostics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-card border border-gold/20 rounded-2xl p-4 flex flex-col justify-center items-center text-center futuristic-glow-gold">
                  <span className="text-3xl font-black text-gold">{profile.bmi}</span>
                  <span className="text-xs font-semibold text-dark-muted mt-1 uppercase tracking-wider">BMI Score</span>
                </div>
                <div className="bg-dark-card border border-red-500/20 rounded-2xl p-4 flex flex-col justify-center items-center text-center futuristic-glow-red">
                  <span className="text-3xl font-black text-red-500">{profile.body_fat_est}%</span>
                  <span className="text-xs font-semibold text-dark-muted mt-1 uppercase tracking-wider">Est Body Fat</span>
                </div>
                <div className="bg-dark-card border border-gold/20 rounded-2xl p-4 flex flex-col justify-center items-center text-center futuristic-glow-gold">
                  <span className="text-3xl font-black text-gold">{profile.sleep_hours} Hrs</span>
                  <span className="text-xs font-semibold text-dark-muted mt-1 uppercase tracking-wider">Sleep Rec</span>
                </div>
                <div className="bg-dark-card border border-red-500/20 rounded-2xl p-4 flex flex-col justify-center items-center text-center futuristic-glow-red">
                  <span className="text-3xl font-black text-red-500">{profile.target_weight} kg</span>
                  <span className="text-xs font-semibold text-dark-muted mt-1 uppercase tracking-wider">Goal Weight</span>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-gold/10 border border-gold/25 p-5 rounded-2xl">
                <Calendar className="w-8 h-8 text-gold flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white">Estimated Timeline</h4>
                  <p className="text-xs text-dark-muted mt-1 leading-relaxed">
                    Based on your starting weight and goal targets, you should reach <b className="text-gold">{profile.target_weight}kg</b> in approximately <b className="text-gold">{profile.goal_time_weeks} weeks</b>.
                  </p>
                </div>
              </div>
            </div>

            {/* Target Nutrition Limits */}
            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-accent" />
                Calculated Daily Targets
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 bg-dark-border/20 border border-white/5 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-dark-muted font-bold block uppercase tracking-wider">Water Goal</span>
                    <span className="text-lg font-black">{profile.target_water} Liters / day</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-dark-border/20 border border-white/5 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
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
                  className="w-full px-4 py-3 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                />
              </div>

              {/* Question 2 */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-slate-300">2. Muscle Soreness Level</label>
                  <span className="text-xs font-bold text-brand-secondary">{sorenessInput} / 10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10"
                  value={sorenessInput}
                  onChange={(e) => setSorenessInput(e.target.value)}
                  className="w-full h-1.5 bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
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
                  <span className="text-xs font-bold text-brand-accent">{energyInput} / 10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10"
                  value={energyInput}
                  onChange={(e) => setEnergyInput(e.target.value)}
                  className="w-full h-1.5 bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <div className="flex justify-between text-[9px] text-dark-muted mt-1 font-semibold uppercase">
                  <span>Exhausted</span>
                  <span>Fully Charged</span>
                </div>
              </div>

              {/* Readiness Output Summary */}
              {readinessResult && (
                <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl space-y-2 mt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-dark-muted uppercase">Readiness Score</span>
                    <span className="text-xl font-black text-brand-primary">{readinessResult.score}%</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-dark-muted uppercase">Recommendation</span>
                    <span className="text-xs font-bold text-brand-accent">{readinessResult.action}</span>
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
                  className="w-2/3 py-3.5 bg-brand-primary hover:bg-brand-primary/90 active:scale-95 transition-all text-white font-bold rounded-xl text-xs flex items-center justify-center shadow-lg shadow-brand-primary/20"
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
