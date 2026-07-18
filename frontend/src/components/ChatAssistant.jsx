// frontend/src/components/ChatAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, MessageSquare, Award, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ChatAssistant({ setView }) {
  const [messages, setMessages] = useState([
    { sender: 'coach', text: 'Hello! I am your AI Fitness Chatbot. Ask me any queries about training, form, injuries, or diet targets.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const suggestions = [
    "Can I do squats if my knee hurts?",
    "What exercise replaces Deadlift?",
    "How much protein should I eat?",
    "Is my posture correct?",
    "How long should I rest?"
  ];

  const handleSendMessage = async (text) => {
    const msg = text || inputText;
    if (!msg.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setInputText('');
    setSending(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'user', message: msg })
      });
      if (!res.ok) throw new Error('API server failed');
      const data = await res.json();
      
      // Add response
      setMessages(prev => [...prev, { sender: 'coach', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'coach', text: '⚠️ Connection lost. Make sure the FastAPI backend is running locally.' }]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-dark text-white pb-6 px-4 md:px-8 relative overflow-hidden select-none flex flex-col items-center">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-purple/5 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-mint/5 blur-[120px]"></div>

      <div className="w-full max-w-3xl flex-1 flex flex-col pt-8 relative z-10 animate-fade-in-up">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => setView('dashboard')}
            className="w-10 h-10 rounded-xl bg-dark-border/40 hover:bg-dark-border/60 transition-colors flex items-center justify-center border border-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black">AI Chat Coach</h1>
            <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block mt-0.5">Posture & injury consultant</span>
          </div>
        </div>

        {/* CHAT CHASSIS */}
        <div className="flex-1 glass border border-white/5 rounded-3xl overflow-hidden flex flex-col mb-4">
          
          {/* MESSAGES BODY */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[50vh] md:max-h-[60vh]">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    m.sender === 'user' 
                      ? 'bg-brand-purple text-white rounded-tr-none' 
                      : 'bg-dark-border/40 border border-white/5 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Clean bullet rendering for markdown formats */}
                  {m.text.split('\n').map((line, lidx) => (
                    <p key={lidx} className={lidx > 0 ? "mt-1.5" : ""}>
                      {line.startsWith('- ') ? (
                        <span className="flex items-start gap-1">
                          <span className="text-brand-purple font-bold">•</span>
                          <span>{line.substring(2)}</span>
                        </span>
                      ) : (
                        <span>{line}</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* CHIPS SUGGESTIONS */}
          <div className="px-6 py-4 border-t border-white/5 bg-dark-border/10">
            <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block mb-2.5">Suggested Questions</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  disabled={sending}
                  className="px-3.5 py-2 bg-dark-border/30 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 transition-all rounded-xl text-xs text-slate-300 hover:text-white font-medium active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT AREA */}
          <div className="p-4 border-t border-white/5 flex gap-3 items-center">
            <input 
              type="text" 
              placeholder="Ask about exercises, posture, pain alternatives..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sending}
              className="flex-1 bg-dark-border/30 border border-white/5 outline-none rounded-xl px-4 py-3.5 text-sm focus:border-brand-purple/40 text-white placeholder-dark-muted font-medium transition-all"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={sending || !inputText.trim()}
              className="w-12 h-12 bg-brand-purple hover:bg-brand-purple/90 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
            >
              {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
