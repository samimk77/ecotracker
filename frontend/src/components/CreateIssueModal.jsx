import { useState, useEffect, useRef } from 'react';
import { X, Camera, Video, MapPin, Upload, Loader2, CheckCircle2, Type, RefreshCw, StopCircle } from 'lucide-react';
import api from '../api';
import { useLocation } from '../context/LocationContext';

const CreateIssueModal = ({ isOpen, onClose, onSuccess }) => {
  const { location: liveLocation } = useLocation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    lat: '',
    lng: '',
    address: ''
  });

  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isManualLocation, setIsManualLocation] = useState(false);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo'); // 'photo' or 'video'
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      if (liveLocation.lat) {
        setFormData(prev => ({
          ...prev,
          lat: liveLocation.lat,
          lng: liveLocation.lng
        }));
      } else {
        handleLocate();
      }
    }
    return () => stopCamera();
  }, [isOpen, liveLocation]);


  const handleLocate = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
        setLocating(false);
      },
      (error) => {
        console.error("Location error:", error);
        setLocating(false);
        setIsManualLocation(true);
      },
      { enableHighAccuracy: true }
    );
  };

  const startCamera = async (mode) => {
    setCameraMode(mode);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: mode === 'video' 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Camera access denied");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setIsRecording(false);
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImage(file);
      stopCamera();
    }, 'image/jpeg');
  };

  const startRecording = () => {
    chunksRef.current = [];
    const stream = videoRef.current.srcObject;
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
      const file = new File([blob], `video_${Date.now()}.mp4`, { type: 'video/mp4' });
      setVideo(file);
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    stopCamera();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (image) data.append('image', image);
      if (video) data.append('video', video);

      const res = await api.post('/issues', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Transmission failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex-col">
            <h4 className="text-[8px] font-bold text-primary tracking-[0.3em] uppercase">Sector Report Form</h4>
            <h2 className="text-xl font-bold uppercase tracking-tight">Environmental Anomaly Detection</h2>
          </div>
          <X className="cursor-pointer hover:text-white transition-all" onClick={onClose} />
        </div>

        {success ? (
          <div className="flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center animate-pulse">
              <CheckCircle2 size={40} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-widest">Data Transmitted</h3>
            <p className="text-[10px] text-muted font-bold">Planetary archive updated successfully.</p>
          </div>
        ) : showCamera ? (
          <div className="flex-col gap-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-primary/20">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                {cameraMode === 'photo' ? (
                  <button type="button" onClick={capturePhoto} className="w-12 h-12 rounded-full bg-white border-4 border-primary/30 flex items-center justify-center shadow-lg">
                    <Camera className="text-black" size={20} />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={isRecording ? stopRecording : startRecording} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isRecording ? 'bg-danger animate-pulse' : 'bg-white'}`}
                  >
                    {isRecording ? <StopCircle className="text-white" size={24} /> : <Video className="text-black" size={20} />}
                  </button>
                )}
                <button type="button" onClick={stopCamera} className="w-12 h-12 rounded-full bg-bg/80 border border-white/10 flex items-center justify-center">
                  <X className="text-white" size={20} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted font-bold uppercase tracking-widest">Live Sensor Preview</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="flex-col gap-4">
                <div className="flex-col gap-1">
                  <label className="text-[8px] font-bold text-muted uppercase tracking-widest">Anomaly Title</label>
                  <input required type="text" className="form-input text-xs" placeholder="Sector Observation Label" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="flex-col gap-1">
                  <label className="text-[8px] font-bold text-muted uppercase tracking-widest">Description</label>
                  <textarea required className="form-input text-xs" rows="4" placeholder="Detailed impact analysis..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="flex-col gap-1">
                  <label className="text-[8px] font-bold text-muted uppercase tracking-widest">Category</label>
                  <select className="form-input text-xs uppercase" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {['garbage', 'waterlogging', 'deforestation', 'air_pollution', 'sewage', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Geolocation & Media */}
              <div className="flex-col gap-4">
                <div className="flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[8px] font-bold text-muted uppercase tracking-widest">Geolocation Data</label>
                    <button type="button" className="text-[8px] font-bold text-primary hover:underline" onClick={() => setIsManualLocation(!isManualLocation)}>
                      {isManualLocation ? 'AUTO DETECT' : 'MANUAL ENTRY'}
                    </button>
                  </div>
                  
                  {isManualLocation ? (
                    <div className="flex-col gap-2">
                      <input type="text" className="form-input text-xs" placeholder="Address / Landmark" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="any" className="form-input text-xs" placeholder="Latitude" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
                        <input type="number" step="any" className="form-input text-xs" placeholder="Longitude" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
                      </div>
                    </div>
                  ) : (
                    <div className="form-input text-xs flex justify-between items-center group">
                      <span className={formData.lat ? 'text-primary font-bold' : 'text-muted italic'}>
                        {formData.lat ? `${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}` : 'Scanning for Satellites...'}
                      </span>
                      <MapPin size={14} className={locating ? 'animate-bounce text-primary' : 'text-muted'} onClick={handleLocate} />
                    </div>
                  )}
                </div>

                <div className="flex-col gap-2 mt-2">
                  <label className="text-[8px] font-bold text-muted uppercase tracking-widest">Media Uplink</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => startCamera('photo')} className="btn btn-outline flex-col py-4 gap-2 border-dashed border-2">
                      <Camera size={18} />
                      <span className="text-[8px] font-bold uppercase">Live Photo</span>
                    </button>
                    <button type="button" onClick={() => startCamera('video')} className="btn btn-outline flex-col py-4 gap-2 border-dashed border-2">
                      <Video size={18} />
                      <span className="text-[8px] font-bold uppercase">Live Video</span>
                    </button>
                  </div>
                  
                  {/* File Upload Fallbacks */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setImage(e.target.files[0])} />
                      <div className="form-input py-2 text-[8px] font-bold text-center uppercase tracking-widest border-dotted">
                        {image ? `Photo: ${image.name.substring(0, 10)}...` : 'Upload Image'}
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setVideo(e.target.files[0])} />
                      <div className="form-input py-2 text-[8px] font-bold text-center uppercase tracking-widest border-dotted">
                        {video ? `Video: ${video.name.substring(0, 10)}...` : 'Upload Video'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full py-4 text-xs tracking-[0.2em]" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
              {loading ? 'SYNCING DATA...' : 'TRANSMIT REPORT TO SECTOR COMMAND'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateIssueModal;

