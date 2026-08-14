// frontend/src/components/Onboarding.jsx
import React, { useState } from 'react';
import { ChevronRight, Award, User, Target, Calendar, Heart } from 'lucide-react';

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const experience = 'Intermediate';
  const [workoutDays, setWorkoutDays] = useState(4);
  const selectedEquipment = ['Gym'];
  const [selectedInjuries, setSelectedInjuries] = useState(['None']);
  const [dietPref, setDietPref] = useState('Veg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const injuryOptions = ['Shoulder', 'Knee', 'Back', 'None'];

  const toggleInjury = (item) => {
    if (item === 'None') {
      setSelectedInjuries(['None']);
      return;
    }
    let updated = [...selectedInjuries].filter(x => x !== 'None');
    if (updated.includes(item)) {
      updated = updated.filter(x => x !== item);
      if (updated.length === 0) updated = ['None'];
    } else {
      updated.push(item);
    }
    setSelectedInjuries(updated);
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginUsername.trim()) return setError('Please enter Email or Phone number');
    if (!loginPassword) return setError('Please enter your password');

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Login failed. Please check credentials.');
      }

      const user = await res.json();
      
      localStorage.setItem('gym_user_id', user.id);
      localStorage.setItem('gym_user_name', user.name);
      localStorage.setItem('gym_user_goal', user.goal || 'Muscle Gain');

      onFinish(user.id, user.name);
    } catch (e) {
      setError(e.message || 'Login connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!name.trim()) return setError('Please enter your name');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email');
    if (!phone.trim()) return setError('Please enter your phone number');
    if (!password) return setError('Please enter a password');
    if (!age || isNaN(age)) return setError('Please enter a valid age');
    if (!height || isNaN(height)) return setError('Please enter a valid height');
    if (!weight || isNaN(weight)) return setError('Please enter a valid weight');

    setLoading(true);
    setError('');

    try {
      // 1. Register User
      const regRes = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: password
        })
      });

      if (!regRes.ok) {
        const errData = await regRes.json();
        throw new Error(errData.detail || 'Registration failed');
      }
      const user = await regRes.json();

      // 2. Submit Profile Setup
      const profilePayload = {
        age: parseInt(age),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        goal,
        experience,
        workout_days: parseInt(workoutDays),
        equipment: selectedEquipment,
        injury: selectedInjuries,
        diet_pref: dietPref
      };

      const profRes = await fetch(`${import.meta.env.VITE_API_URL}/api/profile?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
      });

      if (!profRes.ok) throw new Error('Profile configuration failed');
      await profRes.json();

      // Save to localStorage
      localStorage.setItem('gym_user_id', user.id);
      localStorage.setItem('gym_user_name', user.name);
      localStorage.setItem('gym_user_goal', goal);

      onFinish(user.id, user.name);
    } catch (e) {
      setError(e.message || 'Server connection failed. Make sure the backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 2) {
      if (!name.trim()) return setError('Name is required');
      if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email');
      if (!phone.trim() || phone.length < 8) return setError('Please enter a valid phone number (at least 8 digits)');
      if (!password || password.length < 4) return setError('Password must be at least 4 characters');
      if (!age || age < 10 || age > 100) return setError('Please enter a valid age (10-100)');
      if (!height || height < 100 || height > 250) return setError('Please enter a valid height (100-250 cm)');
      if (!weight || weight < 30 || weight > 250) return setError('Please enter a valid weight (30-250 kg)');
    }
    setError('');
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-dark relative overflow-hidden select-none">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-gold/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-magenta/10 blur-[120px]"></div>

      {/* Main card */}
      <div className="w-full max-w-md futuristic-card p-8 rounded-3xl animate-fade-in-up shadow-2xl relative border border-gold/20 z-10">
        
        {/* Progress header */}
        {step > 1 && (
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xs font-bold text-gold tracking-widest uppercase">Step {step - 1} of 4</span>
            <div className="w-2/3 h-1.5 bg-dark-card rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-gold to-magenta transition-all duration-300"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* --- SCREEN 1: WELCOME --- */}
        {step === 1 && !isLoggingIn && (
          <div className="text-center flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-gold/15 rounded-2xl flex items-center justify-center border border-gold/30 mb-6 animate-bounce shadow-lg shadow-gold/20">
              <Award className="w-10 h-10 text-gold" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 uppercase neon-gradient-text">
              AI Fitness Coach
            </h1>
            <p className="text-dark-muted font-medium text-sm tracking-wide max-w-[280px] mb-8">
              Transform Your Fitness with Precision Real-Time AI Posture Analytics
            </p>
            {error && <p className="w-full mb-4 text-magenta text-xs font-bold bg-magenta/10 p-3 rounded-lg border border-magenta/25">{error}</p>}
            <div className="w-full space-y-3.5">
              <button
                onClick={() => {
                  setIsLoggingIn(true);
                  setError('');
                }}
                className="w-full py-4 neon-btn-gold text-black font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setStep(2);
                  setError('');
                }}
                className="w-full py-4 neon-btn-magenta text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* --- LOGIN FORM --- */}
        {isLoggingIn && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-brand-primary" />
              <h2 className="text-xl font-bold">Log In to Coach</h2>
            </div>
            {error && <p className="text-brand-secondary text-xs font-semibold bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/20">{error}</p>}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-dark-muted block mb-1">Email or Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter email or phone number"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-dark-muted block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-muted hover:text-white transition-colors"
                  >
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoggingIn(false);
                    setError('');
                  }}
                  className="w-1/3 py-4 bg-dark-border/30 hover:bg-dark-border/40 transition-colors text-white font-semibold rounded-2xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-4 bg-brand-primary hover:bg-brand-primary/90 transition-colors text-white font-semibold rounded-2xl flex items-center justify-center shadow-lg"
                >
                  {loading ? 'Logging In...' : 'Log In'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- SCREEN 2: PERSONAL INFO --- */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-brand-primary" />
              <h2 className="text-xl font-bold">Personal Information</h2>
            </div>
            {error && <p className="text-brand-secondary text-xs font-semibold bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/20">{error}</p>}
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-dark-muted block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-dark-muted block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark-muted block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-dark-muted block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-muted hover:text-white transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-dark-muted block mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="22"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark-muted block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-border/40 outline-none rounded-xl border border-white/5 text-white font-medium text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-dark-muted block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark-muted block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-primary/40 text-white font-medium text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={nextStep}
              className="w-full mt-6 py-4 bg-brand-primary hover:bg-brand-primary/90 transition-colors text-white font-semibold rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-brand-primary/20"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- SCREEN 3: GOALS --- */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-brand-primary" />
              <h2 className="text-xl font-bold">Fitness Goal & Diet</h2>
            </div>
            
            <div className="space-y-3">
              {['Weight Loss', 'Muscle Gain', 'Strength'].map((g) => (
                <div
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`px-5 py-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    goal === g 
                      ? 'border-brand-primary bg-brand-primary/10 text-white font-semibold' 
                      : 'border-white/5 bg-dark-border/20 text-dark-muted hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span>{g}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${goal === g ? 'border-brand-primary' : 'border-dark-border'}`}>
                    {goal === g && <div className="w-2.5 h-2.5 bg-brand-primary rounded-full"></div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Dietary Preference Section */}
            <div className="mt-6 pt-4 border-t border-white/5 space-y-4 animate-fade-in-up">
              <label className="text-xs font-semibold text-dark-muted block uppercase tracking-wider">Dietary Preference</label>
              <div className="grid grid-cols-2 gap-3">
                {['Veg', 'Non-Veg'].map((pref) => (
                  <button
                    key={pref}
                    onClick={() => setDietPref(pref)}
                    className={`py-3.5 rounded-xl border text-center font-bold text-sm transition-all ${
                      dietPref === pref 
                        ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                        : 'bg-dark-border/20 border-white/5 text-dark-muted hover:border-white/10 hover:text-slate-200'
                    }`}
                  >
                    {pref === 'Veg' ? 'Veg (Inc. Egg)' : 'Non-Veg'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => {
                  setError('');
                  setStep(2);
                }}
                className="w-1/3 py-4 bg-dark-border/30 hover:bg-dark-border/40 transition-colors text-white font-semibold rounded-2xl"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="w-2/3 py-4 bg-brand-primary hover:bg-brand-primary/90 transition-colors text-white font-semibold rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-brand-primary/20"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- SCREEN 4: AVAILABILITY --- */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-brand-primary" />
              <h2 className="text-xl font-bold">Workout Availability</h2>
            </div>

            {/* Days Selection */}
            <div>
              <label className="text-xs font-semibold text-dark-muted block mb-3">Workout Days per Week</label>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((day) => (
                  <button
                    key={day}
                    onClick={() => setWorkoutDays(day)}
                    className={`py-3 rounded-xl border text-center font-bold text-sm transition-all ${
                      workoutDays === day 
                        ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/20' 
                        : 'bg-dark-border/20 border-white/5 text-dark-muted hover:border-white/10'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => {
                  setError('');
                  setStep(3);
                }}
                className="w-1/3 py-4 bg-dark-border/30 hover:bg-dark-border/40 transition-colors text-white font-semibold rounded-2xl"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="w-2/3 py-4 bg-brand-primary hover:bg-brand-primary/90 transition-colors text-white font-semibold rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-brand-primary/20"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- SCREEN 5: INJURIES & FINISH --- */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-brand-primary" />
              <h2 className="text-xl font-bold">Health & Injuries</h2>
            </div>
            {error && <p className="text-brand-secondary text-xs font-semibold bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/20">{error}</p>}

            <div>
              <p className="text-xs text-dark-muted mb-4 font-medium leading-relaxed">
                Do you have any existing joint injuries? We will automatically customize your plan, removing contraindicated movements to ensure safety.
              </p>
              
              <div className="space-y-2">
                {injuryOptions.map((injury) => {
                  const active = selectedInjuries.includes(injury);
                  return (
                    <div
                      key={injury}
                      onClick={() => toggleInjury(injury)}
                      className={`px-5 py-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        active 
                          ? 'border-brand-secondary bg-brand-secondary/5 text-brand-secondary font-semibold' 
                          : 'border-white/5 bg-dark-border/20 text-dark-muted hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <span>{injury} Injury</span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${active ? 'border-brand-secondary bg-brand-secondary/10' : 'border-dark-border'}`}>
                        {active && <span className="text-brand-secondary text-xs">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="w-1/3 py-4 bg-dark-border/30 hover:bg-dark-border/40 transition-colors text-white font-semibold rounded-2xl"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-2/3 py-4 bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-95 transition-opacity text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? 'Generating AI Plan...' : 'Finish Setup'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
