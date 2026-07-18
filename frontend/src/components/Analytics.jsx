// frontend/src/components/Analytics.jsx
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { ChevronLeft, FileDown, Calendar, ShieldCheck, Dumbbell, Award, Flame } from 'lucide-react';

export default function Analytics({ userId, setView }) {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const analRes = await fetch(`http://localhost:8000/api/workout/analytics/${userId}`);
      if (!analRes.ok) throw new Error('Analytics loading failed');
      const analData = await analRes.json();
      setAnalytics(analData);

      const histRes = await fetch(`http://localhost:8000/api/workout/history/${userId}`);
      if (!histRes.ok) throw new Error('History loading failed');
      const histData = await histRes.json();
      setHistory(histData);
    } catch (e) {
      setError(e.message || 'API connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleDownloadReport = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/workout/report/${userId}/${sessionId}`);
      if (!response.ok) throw new Error('Report download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout_report_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Error generating PDF: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wider text-dark-muted">COMPILING PERFORMANCE ANALYTICS...</p>
        </div>
      </div>
    );
  }

  // Map charts data
  const weightChartData = analytics.weight_labels.map((lbl, idx) => ({
    name: lbl,
    weight: analytics.weight_data[idx]
  }));

  const historyChartData = analytics.dates.map((lbl, idx) => ({
    date: lbl,
    calories: analytics.calories[idx],
    accuracy: analytics.accuracies[idx],
    duration: analytics.durations[idx]
  }));

  return (
    <div className="min-h-screen bg-dark text-white pb-16 px-4 md:px-8 relative overflow-hidden select-none">
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-purple/5 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-mint/5 blur-[120px]"></div>

      <div className="max-w-5xl mx-auto pt-8 space-y-8 relative z-10 animate-fade-in-up">
        
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('dashboard')}
            className="w-10 h-10 rounded-xl bg-dark-border/40 hover:bg-dark-border/60 transition-colors flex items-center justify-center border border-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black">Performance Analytics</h1>
            <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block mt-0.5">Biometrics & form history</span>
          </div>
        </div>

        {/* CHARTS CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CHART 1: Weight Progression */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <div>
              <span className="text-xs font-bold text-brand-purple tracking-widest uppercase block mb-1">Timeline Tracker</span>
              <h3 className="text-lg font-bold">Weight Progress (kg)</h3>
            </div>
            <div className="h-[250px] w-full text-xs font-medium">
              <ResponsiveContainer width="100%" h="100%">
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23304A" />
                  <XAxis dataKey="name" stroke="#8F9CAE" />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#8F9CAE" />
                  <Tooltip contentStyle={{ backgroundColor: '#151D30', borderColor: '#23304A', color: '#FFF' }} />
                  <Line type="monotone" dataKey="weight" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: Form Accuracy Trend */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <div>
              <span className="text-xs font-bold text-brand-mint tracking-widest uppercase block mb-1">Live Joint Tracking</span>
              <h3 className="text-lg font-bold">Posture Form Accuracy (%)</h3>
            </div>
            <div className="h-[250px] w-full text-xs font-medium">
              <ResponsiveContainer width="100%" h="100%">
                <LineChart data={historyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23304A" />
                  <XAxis dataKey="date" stroke="#8F9CAE" />
                  <YAxis domain={[50, 100]} stroke="#8F9CAE" />
                  <Tooltip contentStyle={{ backgroundColor: '#151D30', borderColor: '#23304A', color: '#FFF' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 3: Calorie Burned Bar Chart */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4 md:col-span-2">
            <div>
              <span className="text-xs font-bold text-brand-coral tracking-widest uppercase block mb-1">Energy Expenditure</span>
              <h3 className="text-lg font-bold">Calories Burned (kcal)</h3>
            </div>
            <div className="h-[250px] w-full text-xs font-medium">
              <ResponsiveContainer width="100%" h="100%">
                <BarChart data={historyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23304A" />
                  <XAxis dataKey="date" stroke="#8F9CAE" />
                  <YAxis stroke="#8F9CAE" />
                  <Tooltip contentStyle={{ backgroundColor: '#151D30', borderColor: '#23304A', color: '#FFF' }} />
                  <Bar dataKey="calories" fill="#F43F5E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* WORKOUT SESSION HISTORY TABLE */}
        <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
          <div>
            <span className="text-xs font-bold text-brand-purple tracking-widest uppercase block mb-1">Historical Records</span>
            <h2 className="text-xl font-bold">Training Logs</h2>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-dark-border text-dark-muted font-bold text-xs uppercase tracking-wider">
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Exercise</th>
                    <th className="pb-4">Sets × Reps</th>
                    <th className="pb-4">Accuracy</th>
                    <th className="pb-4 text-center">Calories</th>
                    <th className="pb-4 text-center">PDF Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-xs font-bold text-dark-muted">
                        {new Date(log.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </td>
                      <td className="py-4 capitalize">
                        {log.exercise.replace(/_/g, ' ')}
                      </td>
                      <td className="py-4 text-xs font-bold text-brand-purple">
                        {log.sets} sets × {log.reps} reps
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs ${
                          log.accuracy >= 85 ? 'bg-brand-mint/10 text-brand-mint' : 'bg-brand-gold/10 text-brand-gold'
                        }`}>
                          {log.accuracy}% Form
                        </span>
                      </td>
                      <td className="py-4 text-center text-brand-coral text-xs font-extrabold">
                        {Math.round(log.calories_burned)} kcal
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => handleDownloadReport(log.id)}
                          className="p-2 hover:bg-brand-purple/10 text-brand-purple hover:text-white rounded-xl transition-all border border-transparent hover:border-brand-purple/20 active:scale-95 inline-flex items-center gap-1 text-xs"
                        >
                          <FileDown className="w-4 h-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-dark-border/10 rounded-2xl border border-white/5">
              <span className="text-3xl block mb-2">📊</span>
              <span className="text-xs font-bold text-dark-muted uppercase tracking-wider block">No workout session logged yet</span>
              <span className="text-[11px] text-dark-muted block mt-1">Complete a training session to view detailed progress charts here.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
