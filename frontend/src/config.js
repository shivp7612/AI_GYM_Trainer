// frontend/src/config.js
export const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || '';
  const isProduction = typeof window !== 'undefined' && 
                       window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';

  // If running on Vercel but envUrl is empty or points to localhost
  if (isProduction && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    // Default production Render backend fallback
    return 'https://ai-gym-backend-tvrg.onrender.com';
  }

  return envUrl || 'http://localhost:8000';
};

export const getWsUrl = (userId) => {
  const envWs = import.meta.env.VITE_WS_URL || '';
  const isProduction = typeof window !== 'undefined' && 
                       window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';

  if (isProduction && (!envWs || envWs.includes('localhost') || envWs.includes('127.0.0.1'))) {
    return `wss://ai-gym-backend-tvrg.onrender.com/ws/track/${userId}`;
  }

  let baseUrl = envWs || getApiUrl();
  if (baseUrl.startsWith('https://')) {
    baseUrl = baseUrl.replace('https://', 'wss://');
  } else if (baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'ws://');
  }
  baseUrl = baseUrl.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && baseUrl.startsWith('ws://')) {
    baseUrl = baseUrl.replace('ws://', 'wss://');
  }

  return `${baseUrl}/ws/track/${userId}`;
};
