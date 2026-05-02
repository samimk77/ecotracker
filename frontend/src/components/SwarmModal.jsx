import React, { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SwarmModal({ alert, onClose }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      // Play a subtle alert sound for maximum effect
      try {
        const audio = new Audio('/alert.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio autoplay prevented'));
      } catch (e) {}
    }
  }, [alert]);

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      // Navigate to map centered on the crisis
      if (alert.lat && alert.lng) {
         navigate(`/?lat=${alert.lat}&lng=${alert.lng}&zoom=16&issueId=${alert.issueId}`);
      } else {
         navigate('/');
      }
    }, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  if (!alert) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Background warning strobes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-red-600/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-full h-32 bg-red-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className={`relative w-full max-w-lg bg-[#0a0505] border-2 border-red-500/50 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.3)] transition-all duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
        
        {/* Header Bar */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
          <h2 className="text-white font-black text-2xl tracking-widest uppercase">Eco-Swarm Alert</h2>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col gap-6 relative">
          {/* Grid background effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
              {alert.title}
            </h3>
            <p className="text-red-200 text-lg leading-relaxed">
              {alert.message}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <MapPin className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-1">Target Location</p>
              <p className="text-white font-medium">{alert.lat ? `${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}` : 'Coordinates Locked'}</p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-xl p-5 shadow-[0_0_30px_rgba(245,158,11,0.1)] mt-2">
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">Bounty Reward</p>
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 drop-shadow-md">
                10,000 pts
              </p>
            </div>
            <Zap className="w-12 h-12 text-amber-400 opacity-80" />
          </div>

          <div className="relative z-10 flex gap-4 mt-4">
            <button 
              onClick={handleDismiss}
              className="px-6 py-4 bg-transparent border border-white/10 text-gray-400 rounded-xl font-bold tracking-wider hover:bg-white/5 transition-colors"
            >
              IGNORE
            </button>
            <button 
              onClick={handleAccept}
              className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-lg tracking-widest shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:shadow-[0_0_50px_rgba(239,68,68,0.8)] transition-all flex items-center justify-center gap-2 group"
            >
              ACCEPT MISSION
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
