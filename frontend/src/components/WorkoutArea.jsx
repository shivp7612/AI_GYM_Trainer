// frontend/src/components/WorkoutArea.jsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  Dumbbell, Play, Pause, RefreshCw, X, ShieldAlert, 
  Volume2, VolumeX, Droplet, Flame, Compass, Award 
} from 'lucide-react';

export default function WorkoutArea({ userId, workoutExercises, restDuration, setView, onWorkoutLogged }) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const currentEx = workoutExercises[exerciseIndex] ? workoutExercises[exerciseIndex][0] : 'squat';
  const currentCleanName = workoutExercises[exerciseIndex] ? workoutExercises[exerciseIndex][1] : 'Squat';

  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(restDuration || 90);
  
  // Real-time API states
  const [reps, setReps] = useState(0);
  const [sets, setSets] = useState(1);
  const [stage, setStage] = useState('-');
  const [activeAngle, setActiveAngle] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [fatigue, setFatigue] = useState(0);
  const [stresses, setStresses] = useState({ lumbar: 'Low', knee: 'Low', shoulder: 'Low', neck: 'Low' });
  const [riskScore, setRiskScore] = useState('Low');
  const [warningMsg, setWarningMsg] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [landmarks, setLandmarks] = useState([]);
  
  // Audio state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpokenRef = useRef(0);

  // Water reminder state
  const [showWaterReminder, setShowWaterReminder] = useState(false);

  // References
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const restTimerRef = useRef(null);

  // Stats accumulated during current exercise
  const [accuraciesList, setAccuraciesList] = useState([]);
  const [fatiguesList, setFatiguesList] = useState([]);
  const [startTime] = useState(Date.now());

  // Summary Modal state
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [savingLog, setSavingLog] = useState(false);

  // Voice speech synthesizer
  const speakText = (text) => {
    if (!voiceEnabled || !text) return;
    const now = Date.now();
    // Throttle speech to once every 4 seconds to avoid overlapping voices
    if (now - lastSpokenRef.current < 4000) return;
    
    try {
      window.speechSynthesis.cancel(); // Cancel any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      lastSpokenRef.current = now;
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      alert("Webcam permission denied! Camera module requires access to continue.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
  };

  // Connect WebSocket
  const connectWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:8000/ws/track/${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send active exercise configuration
      ws.send(JSON.stringify({
        event: 'config',
        exercise: currentEx
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error(data.error);
        return;
      }

      if (data.event === 'summary') {
        // Summary payload received from backend
        return;
      }

      // Update state parameters
      setIsVerified(data.verified);
      setLandmarks(data.landmarks || []);
      setReps(data.reps || 0);
      setStage(data.stage || '-');
      setActiveAngle(data.active_angle || 0);
      setAccuracy(data.form_accuracy !== undefined ? data.form_accuracy : 100);
      setFatigue(data.fatigue !== undefined ? data.fatigue : 0);
      setStresses(data.stresses || { lumbar: 'Low', knee: 'Low', shoulder: 'Low', neck: 'Low' });
      setRiskScore(data.risk_score || 'Low');
      
      const cleanWarning = data.warning || '';
      setWarningMsg(cleanWarning);

      // Save accuracies/fatigues for local calculations
      if (data.verified && data.form_accuracy > 0) {
        setAccuraciesList(prev => [...prev, data.form_accuracy]);
        setFatiguesList(prev => [...prev, data.fatigue]);
      }

      // Voice Warning trigger
      if (cleanWarning) {
        speakText(cleanWarning);
      }

      // Water intake reminder trigger
      if (data.water_reminder) {
        setShowWaterReminder(true);
        speakText("Time to drink water. Two hundred and fifty milliliters recommended.");
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Start frame capturing loops
  const startFrameLoop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    frameIntervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isResting) return;

      // Draw video frame to hidden canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get base64 string
      const jpegBase64 = canvas.toDataURL('image/jpeg', 0.5); // Compress to 50% quality

      // Send to WebSocket
      wsRef.current.send(JSON.stringify({
        event: 'frame',
        image: jpegBase64,
        exercise: currentEx
      }));
    }, 130); // ~7.5 frames per second - low latency and smooth
  };

  useEffect(() => {
    if (isRunning && !isResting) {
      startCamera();
      connectWebSocket();
      // Wait for video meta to initialize loop
      const checkVideo = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState >= 3) {
          startFrameLoop();
          clearInterval(checkVideo);
        }
      }, 200);
    } else {
      stopCamera();
      disconnectWebSocket();
    }

    return () => {
      stopCamera();
      disconnectWebSocket();
    };
  }, [isRunning, isResting, currentEx]);

  // Set-based Rest Timer triggers
  useEffect(() => {
    if (reps > 0 && reps % 12 === 0) {
      // Trigger Rest
      triggerRest();
    }
  }, [reps]);

  const triggerRest = () => {
    setIsResting(true);
    setRestTimeLeft(restDuration || 90);
    speakText("Set complete. Take a rest for one minute and thirty seconds.");
    
    restTimerRef.current = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current);
          setIsResting(false);
          speakText("Rest over. Start your next set.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    clearInterval(restTimerRef.current);
    setIsResting(false);
    speakText("Rest skipped. Let's begin.");
  };

  const handleFinishSession = async () => {
    stopCamera();
    disconnectWebSocket();
    setIsRunning(false);

    // Calculate metrics
    const duration = roundValue((Date.now() - startTime) / 60000.0, 1);
    const avgAcc = accuraciesList.length > 0 ? Math.round(accuraciesList.reduce((a,b)=>a+b, 0) / accuraciesList.length) : 88;
    const avgFatigue = fatiguesList.length > 0 ? Math.round(fatiguesList.reduce((a,b)=>a+b, 0) / fatiguesList.length) : 45;
    const cals = roundValue(duration * 7.2, 1);
    
    // Calculate wrong reps estimation (if accuracy was below 75% on various readings)
    const lowAccCount = accuraciesList.filter(a => a < 75).length;
    const wrongReps = Math.min(reps, Math.round(lowAccCount / 5));

    const finalSummary = {
      exercise: currentEx,
      reps: reps,
      sets: sets,
      duration: duration,
      accuracy: avgAcc,
      calories_burned: cals,
      avg_fatigue: avgFatigue,
      risk_score: riskScore,
      wrong_reps: wrongReps,
      correct_reps: Math.max(0, reps - wrongReps)
    };

    setSummaryData(finalSummary);
    setShowSummary(true);
  };

  const submitWorkoutLog = async () => {
    setSavingLog(true);
    try {
      const res = await fetch(`http://localhost:8000/api/workout/finish/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryData)
      });
      if (!res.ok) throw new Error('Database logging failed');
      
      onWorkoutLogged();
    } catch (e) {
      alert("Failed to log session: " + e.message);
    } finally {
      setSavingLog(false);
      setShowSummary(false);
    }
  };

  const nextExercise = () => {
    if (exerciseIndex < workoutExercises.length - 1) {
      setExerciseIndex(exerciseIndex + 1);
      // Reset local counts
      setReps(0);
      setSets(1);
      setAccuraciesList([]);
      setFatiguesList([]);
    } else {
      handleFinishSession();
    }
  };

  const roundValue = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  };

  // Helper values for skeletal line rendering
  const renderBone = (idA, idB, color = "#6366F1") => {
    const ptA = landmarks.find(lm => lm.id === idA);
    const ptB = landmarks.find(lm => lm.id === idB);
    if (!ptA || !ptB) return null;
    if (ptA.x === 0 || ptB.x === 0) return null; // invisible

    return (
      <line 
        key={`${idA}-${idB}`} 
        x1={`${ptA.x}%`} y1={`${ptA.y}%`} 
        x2={`${ptB.x}%`} y2={`${ptB.y}%`} 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round"
        className="opacity-80"
      />
    );
  };

  const renderSkeleton = () => {
    if (landmarks.length === 0) return null;
    
    // Color schemes
    const activeColor = isVerified ? "#10B981" : "#F43F5E"; // green if verified, red if not

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
        {/* Torso */}
        {renderBone(11, 12, activeColor)}
        {renderBone(11, 23, activeColor)}
        {renderBone(12, 24, activeColor)}
        {renderBone(23, 24, activeColor)}
        
        {/* Left Arm */}
        {renderBone(11, 13, activeColor)}
        {renderBone(13, 15, activeColor)}
        
        {/* Right Arm */}
        {renderBone(12, 14, activeColor)}
        {renderBone(14, 16, activeColor)}
        
        {/* Left Leg */}
        {renderBone(23, 25, activeColor)}
        {renderBone(25, 27, activeColor)}
        
        {/* Right Leg */}
        {renderBone(24, 26, activeColor)}
        {renderBone(26, 28, activeColor)}

        {/* Joint Dots */}
        {landmarks.map(lm => {
          if (lm.id > 28) return null; // skip hands/feet details for performance
          return (
            <circle 
              key={lm.id}
              cx={`${lm.x}%`} 
              cy={`${lm.y}%`} 
              r="4.5" 
              fill="#FFFFFF" 
              stroke={activeColor}
              strokeWidth="2"
            />
          );
        })}
      </svg>
    );
  };

  const getStressColorClass = (level) => {
    if (level === 'High') return 'bg-brand-coral/10 border-brand-coral/45 text-brand-coral font-bold';
    if (level === 'Medium') return 'bg-brand-gold/10 border-brand-gold/45 text-brand-gold font-bold';
    return 'bg-brand-mint/10 border-brand-mint/20 text-brand-mint font-semibold';
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-dark text-white p-4 md:p-8 flex flex-col items-center select-none relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-15%] w-[40vw] h-[40vw] rounded-full bg-brand-purple/5 blur-[120px]"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-brand-mint/5 blur-[120px]"></div>

      {/* TOP CONTROLS */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6 z-10 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleFinishSession}
            className="w-10 h-10 rounded-xl bg-dark-border/40 hover:bg-dark-border/60 transition-colors flex items-center justify-center border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-extrabold capitalize">{currentCleanName.replace(/_/g, ' ')}</h2>
            <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block mt-0.5">Active Exercise</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
              voiceEnabled 
                ? 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple' 
                : 'bg-dark-border/40 border-white/5 text-dark-muted'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isRunning 
                ? 'bg-brand-coral hover:bg-brand-coral/90 shadow-md shadow-brand-coral/20' 
                : 'bg-brand-purple hover:bg-brand-purple/90 shadow-md shadow-brand-purple/20'
            }`}
          >
            {isRunning ? <><Pause className="w-4 h-4" /> Pause session</> : <><Play className="w-4 h-4" /> Begin tracking</>}
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 z-10 animate-fade-in-up">
        
        {/* LEFT COLUMN: CAMERA MODULE HUD */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-3xl bg-dark-card border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center">
            
            {/* Realtime Video Stream */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1] z-10" // Mirror camera
            />

            {/* Hidden Frame Grab Canvas */}
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />

            {/* Neon Landmark SVG overlay */}
            {renderSkeleton()}

            {/* Camera off/standby overlay */}
            {!isRunning && (
              <div className="absolute inset-0 bg-dark-card/90 z-30 flex flex-col justify-center items-center text-center p-6">
                <Dumbbell className="w-16 h-16 text-brand-purple/30 mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-1">AI Posture System Suspended</h3>
                <p className="text-xs text-dark-muted max-w-[280px] leading-relaxed">
                  Click 'Begin tracking' to enable your webcam and start scanning joint loads.
                </p>
              </div>
            )}

            {/* Rest Timer overlay */}
            {isResting && (
              <div className="absolute inset-0 bg-dark/95 z-30 flex flex-col justify-center items-center text-center p-6">
                <Compass className="w-16 h-16 text-brand-purple mb-4 animate-spin" />
                <h3 className="text-2xl font-black text-brand-purple">REST TIME</h3>
                <span className="text-5xl font-black tracking-widest block mt-2 text-white">{formatTime(restTimeLeft)}</span>
                <span className="text-xs text-dark-muted mt-2 uppercase tracking-widest font-bold">Remaining rest</span>
                <button
                  onClick={skipRest}
                  className="mt-6 px-6 py-2.5 bg-brand-mint text-white font-semibold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-brand-mint/20"
                >
                  Skip Rest Timer
                </button>
              </div>
            )}

            {/* WRONG EXERCISE BANNER */}
            {!isVerified && isRunning && (
              <div className="absolute bottom-0 left-0 right-0 bg-brand-coral border-t border-brand-coral/45 p-4 z-20 flex gap-3 text-white">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase">WRONG EXERCISE DETECTED</h4>
                  <p className="text-[10px] text-white/95 mt-0.5 leading-relaxed">
                    {warningMsg || `Please perform a ${currentCleanName} movement - locking rep count.`}
                  </p>
                </div>
              </div>
            )}

            {/* Form Warnings HUD banner */}
            {isVerified && warningMsg && isRunning && (
              <div className="absolute bottom-4 left-4 right-4 bg-brand-coral/90 backdrop-blur-md border border-brand-coral/40 p-4 rounded-2xl z-20 flex gap-3 text-white">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase">POSTURE WARNING</h4>
                  <p className="text-xs text-white/95 mt-0.5 font-semibold">{warningMsg}</p>
                </div>
              </div>
            )}

            {/* Water reminder notification bubble */}
            {showWaterReminder && (
              <div className="absolute top-4 left-4 bg-brand-purple border border-brand-purple/40 p-4 rounded-2xl z-30 shadow-xl max-w-[260px] animate-fade-in-up flex gap-3">
                <Droplet className="w-5 h-5 text-white flex-shrink-0 animate-bounce" />
                <div>
                  <h4 className="font-bold text-xs">Hydration Alert</h4>
                  <p className="text-[10px] text-white/90 leading-relaxed mt-0.5">You have trained hard. Drink 250ml of water to maintain form stability.</p>
                  <button 
                    onClick={() => setShowWaterReminder(false)}
                    className="mt-2 text-[9px] font-bold underline uppercase"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS HUD */}
        <div className="space-y-6">
          
          {/* HUD MAIN STATS CARD */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-6">
            <span className="text-xs font-bold text-brand-purple tracking-widest uppercase block mb-1">Live Metrics</span>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-border/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-[100px]">
                <span className="text-xs font-bold text-dark-muted uppercase">Rep Counter</span>
                <span className="text-3xl font-black text-brand-mint">{reps}</span>
              </div>
              <div className="bg-dark-border/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-[100px]">
                <span className="text-xs font-bold text-dark-muted uppercase">Active Set</span>
                <span className="text-3xl font-black text-brand-purple">{sets}</span>
              </div>
              <div className="bg-dark-border/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-[100px]">
                <span className="text-xs font-bold text-dark-muted uppercase">Joint Angle</span>
                <span className="text-3xl font-black text-brand-gold">{activeAngle}°</span>
              </div>
              <div className="bg-dark-border/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-[100px]">
                <span className="text-xs font-bold text-dark-muted uppercase">Form Score</span>
                <span className="text-3xl font-black text-brand-purple">{accuracy}%</span>
              </div>
            </div>

            {/* Fatigue circular bar */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Physical Fatigue</h4>
                <p className="text-[10px] text-dark-muted mt-0.5 leading-relaxed max-w-[180px]">
                  Estimated using joint tremble, motion speed, and range degradation.
                </p>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                  <circle 
                    cx="32" cy="32" r="28" 
                    stroke={fatigue >= 80 ? "#F43F5E" : (fatigue >= 55 ? "#F59E0B" : "#6366F1")} 
                    strokeWidth="4" 
                    fill="transparent" 
                    strokeDasharray={176}
                    strokeDashoffset={176 - (176 * fatigue) / 100}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-xs font-black">{fatigue}%</span>
              </div>
            </div>
          </div>

          {/* HUD STRESS DIAGNOSTICS CARD */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <span className="text-xs font-bold text-brand-purple tracking-widest uppercase block">Joint Stress Indicator</span>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(stresses).map((joint) => (
                <div key={joint} className={`border rounded-xl p-3 flex justify-between items-center transition-all ${getStressColorClass(stresses[joint])}`}>
                  <span className="text-xs capitalize font-semibold">{joint}</span>
                  <span className="text-[10px] tracking-wider uppercase font-bold">{stresses[joint]}</span>
                </div>
              ))}
            </div>

            {riskScore !== 'Low' && (
              <div className="bg-brand-coral/5 border border-brand-coral/20 rounded-xl p-3 flex gap-2 text-[10px] text-brand-coral font-medium">
                <span className="font-bold uppercase flex-shrink-0">Risk Profile: {riskScore}</span>
                <span>Compressive stress detected on joint surfaces. Adjust weight load.</span>
              </div>
            )}
          </div>

          {/* NAVIGATION */}
          <button
            onClick={nextExercise}
            className="w-full py-4 bg-brand-purple hover:bg-brand-purple/95 active:scale-95 transition-all text-white font-bold rounded-2xl shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-1 text-sm"
          >
            {exerciseIndex < workoutExercises.length - 1 ? 'Next Exercise' : 'Finish Session'}
          </button>

        </div>

      </div>

      {/* --- SESSION SUMMARY MODAL --- */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-bright p-8 rounded-3xl border border-white/10 animate-fade-in-up relative max-h-[90vh] overflow-y-auto">
            
            <div className="text-center flex flex-col items-center mb-6">
              <div className="w-14 h-14 bg-brand-mint/10 border border-brand-mint/20 text-brand-mint rounded-2xl flex items-center justify-center mb-4">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Workout Complete!</h3>
              <p className="text-xs text-dark-muted mt-1 uppercase tracking-widest font-bold">Performance Breakdown</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-dark-border/20 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs text-dark-muted font-semibold uppercase block mb-1">Duration</span>
                <span className="text-xl font-black text-brand-purple">{summaryData.duration}m</span>
              </div>
              <div className="bg-dark-border/20 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs text-dark-muted font-semibold uppercase block mb-1">Calories</span>
                <span className="text-xl font-black text-brand-coral">{intake_today.calories + summaryData.calories_burned}</span>
              </div>
              <div className="bg-dark-border/20 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs text-dark-muted font-semibold uppercase block mb-1">Accuracy</span>
                <span className="text-xl font-black text-brand-mint">{summaryData.accuracy}%</span>
              </div>
              <div className="bg-dark-border/20 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs text-dark-muted font-semibold uppercase block mb-1">Total Reps</span>
                <span className="text-xl font-black text-white">{summaryData.reps}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Correct/Incorrect breakdown */}
              <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                <span className="text-dark-muted font-medium">Form-Verified Correct Reps</span>
                <span className="font-extrabold text-brand-mint text-sm">{summaryData.correct_reps}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                <span className="text-dark-muted font-medium">Wrong Posture Reps (Locked)</span>
                <span className="font-extrabold text-brand-coral text-sm">{summaryData.wrong_reps}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                <span className="text-dark-muted font-medium">Average Fatigue Rating</span>
                <span className="font-extrabold text-brand-purple text-sm">{summaryData.avg_fatigue}%</span>
              </div>
            </div>

            {/* Coach's suggestions */}
            <div className="bg-brand-purple/5 border border-brand-purple/20 p-5 rounded-2xl mb-8 space-y-2 text-xs leading-relaxed">
              <h4 className="font-bold text-sm text-brand-purple">Coach Recommendations</h4>
              <p>• <b>Posture correction:</b> {summaryData.accuracy >= 85 ? 'Excellent squat/press depth. Keep your current tempo.' : 'Watch out for knees caving. Push your knees slightly outward.'}</p>
              <p>• <b>Safety Advice:</b> {summaryData.risk_score === 'High' ? 'Avoid high loading. Lower your weights by 10% next session to reduce AC joint shear.' : 'Low joint stress registered. Ready for progressive load.'}</p>
            </div>

            {/* Action buttons */}
            <button
              onClick={submitWorkoutLog}
              disabled={savingLog}
              className="w-full py-4 bg-brand-purple hover:bg-brand-purple/95 active:scale-95 transition-all text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-brand-purple/20"
            >
              {savingLog ? 'Saving session to database...' : 'Save & Close Session'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
