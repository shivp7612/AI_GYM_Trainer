// frontend/src/components/ProgressPhotos.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Upload, Grid, ShieldAlert, Sparkles } from 'lucide-react';

export default function ProgressPhotos({ userId, setView }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Selection states for comparison
  const [photoA, setPhotoA] = useState(null);
  const [photoB, setPhotoB] = useState(null);
  const [showGrid, setShowGrid] = useState(true);

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/photos/${userId}`);
      if (!res.ok) throw new Error('Failed to load photos');
      const data = await res.json();
      setPhotos(data);
      
      // Auto select first photo if available
      if (data.length > 0) {
        setPhotoA(data[0]);
      }
      if (data.length > 1) {
        setPhotoB(data[1]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [userId]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://localhost:8000/api/photos/upload/${userId}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      
      // Reload photos list
      await fetchPhotos();
    } catch (e) {
      alert("Error uploading file: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const selectPhoto = (photo) => {
    // Alternate selection
    if (!photoA) {
      setPhotoA(photo);
    } else if (!photoB && photo.id !== photoA.id) {
      setPhotoB(photo);
    } else {
      // Both selected, swap B out
      setPhotoA(photo);
      setPhotoB(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wider text-dark-muted">LOADING PROGRESS PHOTO GALLERY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white pb-16 px-4 md:px-8 relative overflow-hidden select-none">
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-purple/5 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-mint/5 blur-[120px]"></div>

      <div className="max-w-5xl mx-auto pt-8 space-y-8 relative z-10 animate-fade-in-up">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('dashboard')}
              className="w-10 h-10 rounded-xl bg-dark-border/40 hover:bg-dark-border/60 transition-colors flex items-center justify-center border border-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black">Progress Photo Comparison</h1>
              <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block mt-0.5">Alignment checker</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
                showGrid 
                  ? 'bg-brand-mint/10 border-brand-mint/20 text-brand-mint' 
                  : 'bg-dark-border/40 border-white/5 text-dark-muted'
              }`}
            >
              <Grid className="w-4 h-4" />
              Toggle Alignment Grid
            </button>

            <label className="px-5 py-2.5 bg-brand-purple hover:bg-brand-purple/90 active:scale-95 transition-all text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-purple/20">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Photo'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={uploading} 
              />
            </label>
          </div>
        </div>

        {/* COMPARISON PANELS (SIDE-BY-SIDE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Photo A Box */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col items-center">
            <div className="flex justify-between items-center w-full">
              <h3 className="font-bold text-sm text-brand-purple uppercase tracking-wider">Photo A (Earlier)</h3>
              {photoA && (
                <span className="text-xs text-dark-muted font-bold">
                  {new Date(photoA.date).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
                </span>
              )}
            </div>
            
            <div className="relative aspect-[3/4] w-full max-w-[280px] bg-dark-border/10 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
              {photoA ? (
                <>
                  <img 
                    src={`http://localhost:8000${photoA.photo_path}`} 
                    alt="Progress A" 
                    className="w-full h-full object-cover"
                  />
                  {showGrid && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 pointer-events-none z-10">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="border border-brand-purple/15"></div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-dark-muted font-bold uppercase tracking-wider">Select a photo from gallery</span>
              )}
            </div>
          </div>

          {/* Photo B Box */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col items-center">
            <div className="flex justify-between items-center w-full">
              <h3 className="font-bold text-sm text-brand-mint uppercase tracking-wider">Photo B (Current)</h3>
              {photoB && (
                <span className="text-xs text-dark-muted font-bold">
                  {new Date(photoB.date).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
                </span>
              )}
            </div>
            
            <div className="relative aspect-[3/4] w-full max-w-[280px] bg-dark-border/10 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
              {photoB ? (
                <>
                  <img 
                    src={`http://localhost:8000${photoB.photo_path}`} 
                    alt="Progress B" 
                    className="w-full h-full object-cover"
                  />
                  {showGrid && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 pointer-events-none z-10">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="border border-brand-mint/15"></div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-dark-muted font-bold uppercase tracking-wider">Select a second photo</span>
              )}
            </div>
          </div>

        </div>

        {/* GALLERY WRAPPER */}
        <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-brand-purple tracking-widest uppercase block mb-1">Upload Archive</span>
              <h2 className="text-xl font-bold">Photo History</h2>
            </div>
            <span className="text-xs text-dark-muted font-bold uppercase">Click photo to place in workspace</span>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {photos.map((ph) => {
                const isSelectedA = photoA && photoA.id === ph.id;
                const isSelectedB = photoB && photoB.id === ph.id;
                return (
                  <div 
                    key={ph.id}
                    onClick={() => selectPhoto(ph)}
                    className={`aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative group ${
                      isSelectedA ? 'border-brand-purple scale-95' : (isSelectedB ? 'border-brand-mint scale-95' : 'border-transparent hover:border-white/20')
                    }`}
                  >
                    <img 
                      src={`http://localhost:8000${ph.photo_path}`} 
                      alt="History item" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-[9px] font-bold text-white tracking-wide">
                      {new Date(ph.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-dark-border/10 rounded-2xl border border-white/5">
              <span className="text-3xl block mb-2">📸</span>
              <span className="text-xs font-bold text-dark-muted uppercase tracking-wider block">No progress photos uploaded yet</span>
              <span className="text-[11px] text-dark-muted block mt-1">Upload a photo to see alignment overlays and track body geometry changes.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
