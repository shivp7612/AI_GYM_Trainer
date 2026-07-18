// frontend/src/components/Onboarding.jsx
import React, { useState } from 'react';
import { ChevronRight, Award, User, Target, Zap, Calendar, Heart, ShieldAlert } from 'lucide-react';

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [experience, setExperience] = useState('Intermediate');
  const [workoutDays, setWorkoutDays] = useState(4);
  const [selectedEquipment, setSelectedEquipment] = useState(['Bodyweight']);
  const [selectedInjuries, setSelectedInjuries] = useState(['None']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const equipmentOptions = ['Gym', 'Home', 'Dumbbells', 'Resistance Bands', 'Bodyweight'];
  const injuryOptions = ['Shoulder', 'Knee', 'Back', 'None'];

  const toggleEquipment = (item) => {
    if (item === 'Bodyweight') {
      setSelectedEquipment(['Bodyweight']);
      return;
    }
    let updated = [...selectedEquipment].filter(x => x !== 'Bodyweight');
    if (updated.includes(item)) {
      updated = updated.filter(x => x !== item);
      if (updated.length === 0) updated = ['Bodyweight'];
    } else {
      updated.push(item);
    }
    setSelectedEquipment(updated);
  };

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

  const handleFinish = async () => {
    if (!name.trim()) return setError('Please enter your name');
    if (!age || isNaN(age)) return setError('Please enter a valid age');
    if (!height || isNaN(height)) return setError('Please enter a valid height');
    if (!weight || isNaN(weight)) return setError('Please enter a valid weight');

    setLoading(true);
    setError('');

    try {
      // 1. Register User
      const regRes = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!regRes.ok) throw new Error('Registration failed');
      const user = await regRes.parse ? await regRes.parse() : await regRes.json();

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
        injury: selectedInjuries
      };

      const profRes = await fetch(`http://localhost:8000/api/profile?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
      });

      if (!profRes.ok) throw new Error('Profile configuration failed');
      const profile = await profRes.json();

      // Save to localStorage
      localStorage.setItem('gym_user_id', user.id);
      localStorage.setItem('gym_user_name', user.name);

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
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-purple/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-mint/10 blur-[120px]"></div>

      {/* Main card */}
      <div className="w-full max-w-md glass p-8 rounded-3xl animate-fade-in-up shadow-2xl relative border border-white/5 z-10">
        
        {/* Progress header */}
        {step > 1 && (
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-purple tracking-widest uppercase">Step {step - 1} of 5</span>
            <div className="w-2/3 h-1.5 bg-dark-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-purple to-brand-mint transition-all duration-300"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* --- SCREEN 1: WELCOME --- */}
        {step === 1 && (
          <div className="text-center flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-brand-purple/10 rounded-2xl flex items-center justify-center border border-brand-purple/20 mb-6 animate-bounce">
              <Award className="w-10 h-10 text-brand-purple" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI Fitness Coach
            </h1>
            <p className="text-dark-muted font-medium text-sm tracking-wide max-w-[280px] mb-8">
              Transform Your Fitness with Precision Real-Time AI Posture Analytics
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-brand-purple hover:bg-brand-purple/90 active:scale-95 transition-all text-white font-semibold rounded-2xl flex items-center justify-center gap-2 group shadow-lg shadow-brand-purple/30"
            >
              Get Started
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* --- SCREEN 2: PERSONAL INFO --- */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-brand-purple" />
              <h2 className="text-xl font-bold">Personal Information</h2>
            </div>
            {error && <p className="text-brand-coral text-xs font-semibold bg-brand-coral/10 p-3 rounded-lg border border-brand-coral/20">{error}</p>}
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-dark-muted block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-purple/40 text-white font-medium text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-dark-muted block mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="22"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-purple/40 text-white font-medium text-sm transition-all"
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
                    className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-purple/40 text-white font-medium text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark-muted block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-border/40 focus:bg-dark-border/60 outline-none rounded-xl border border-white/5 focus:border-brand-purple/40 text-white font-medium text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={nextStep}
              className="w-full mt-6 py-4 bg-brand-purple hover:bg-brand-purple/90 transition-colors text-white font-semibold rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-brand-purple/20"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- SCREEN 3: GOALS --- */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-brand-purple" />
              <h2 className="text-xl font-bold">Fitness Goal</h2>
            </div>
            
            <div className="space-y-3">
              {['Weight Loss', 'Muscle Gain', 'Strength', 'General Fitness', 'Rehabilitation'].map((g) => (
                <div
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`px-5 py-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    goal === g 
                      ? 'border-brand-purple bg-brand-purple/10 text-white font-semibold' 
                      : 'border-white/5 bg-dark-border/20 text-dark-muted hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span>{g}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${goal === g ? 'border-brand-purple' : 'border-dark-border'}`}>
                    {goal === g && <div className="w-2.5 h-2.5 bg-brand-purple rounded-full"></div>}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={nextStep}
              className="w-full mt-8 py-4 bg-brand-purple hover:bg-brand-purple/90 transition-colors text-white font-semibold rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-brand-purple/20"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- SCREEN 4: EXPERIENCE --- */}
        {step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-brand-purple" />
              <h2 className="text-xl font-bold">Experience Level</h2>
            </div>
            
            <div className="space-y-3">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <div
                  key={lvl}
                  onClick={() => setExperience(lvl)}
                  className={`px-5 py-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    experience === lvl 
                      ? 'border-brand-purple bg-brand-purple/10 text-white font-semibold' 
                      : 'border-white/5 bg-dark-border/20 text-dark-muted hover:border-white/10 hover:text-white'
                  }`}
                >
                  <div>
                    <span className="block font-semibold">{lvl}</span>
                    <span className="text-xs text-dark-muted mt-0.5">
                      {lvl === 'Beginner' && 'Just starting out, focusing on basic movements.'}
                      {lvl === 'Intermediate' && 'Trained consistently, looking for structure.'}
                      {lvl === 'Advanced' && 'Highly experienced, targeting progressive limits.'}
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ml-4 ${experience === lvl ? 'border-brand-purple' : 'border-dark-border'}`}>
                    {experience === lvl && <div className="w-2.5 h-2.5 bg-brand-purple rounded-full"></div>}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={nextStep}
              className="w-full mt-8 py-4 bg-brand-purple hover:bg-brand-purple/90 transition-colors text-white font-semibold rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-brand-purple/20"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- SCREEN 5: AVAILABILITY & EQUIPMENT --- */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-brand-purple" />
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
                        ? 'bg-brand-purple border-brand-purple text-white shadow-md shadow-brand-purple/20' 
                        : 'bg-dark-border/20 border-white/5 text-dark-muted hover:border-white/10'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Selection */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-dark-muted block mb-3">Available Equipment</label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((eq) => {
                  const active = selectedEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        active 
                          ? 'bg-brand-mint/10 border-brand-mint text-brand-mint' 
                          : 'bg-dark-border/20 border-white/5 text-dark-muted hover:border-white/10'
                      }`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={nextStep}
              className="w-full mt-6 py-4 bg-brand-purple hover:bg-brand-purple/90 transition-colors text-white font-semibold rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-brand-purple/20"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- SCREEN 6: INJURIES & FINISH --- */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-brand-purple" />
              <h2 className="text-xl font-bold">Health & Injuries</h2>
            </div>
            {error && <p className="text-brand-coral text-xs font-semibold bg-brand-coral/10 p-3 rounded-lg border border-brand-coral/20">{error}</p>}

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
                          ? 'border-brand-coral bg-brand-coral/5 text-brand-coral font-semibold' 
                          : 'border-white/5 bg-dark-border/20 text-dark-muted hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <span>{injury} Injury</span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${active ? 'border-brand-coral bg-brand-coral/10' : 'border-dark-border'}`}>
                        {active && <span className="text-brand-coral text-xs">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setStep(5)}
                className="w-1/3 py-4 bg-dark-border/30 hover:bg-dark-border/40 transition-colors text-white font-semibold rounded-2xl"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-2/3 py-4 bg-gradient-to-r from-brand-purple to-brand-mint hover:opacity-95 transition-opacity text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg"
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
