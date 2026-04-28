import { useState, useEffect } from 'react';
import api from '../api';
import { Activity, ShieldAlert, Cpu, Network } from 'lucide-react';

const Telemetry = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await api.get('/telemetry');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Telemetry fetch error:", err);
      }
    };
    fetchTelemetry();
  }, []);

  if (!data) return <div className="p-8 text-primary font-bold">Initializing Telemetry...</div>;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h4 className="text-muted text-sm font-semibold mb-1" style={{ letterSpacing: '0.1em' }}>SYSTEM TELEMETRY</h4>
          <h1 className="text-4xl">Issue History</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>24H VIEW</button>
          <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>7D VIEW</button>
          <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>30D VIEW</button>
        </div>
      </div>

      {/* Heatmap Widget */}
      <div className="glass-card mb-6" style={{ padding: '2rem' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="flex items-center gap-2 text-lg font-medium"><Activity size={18} className="text-primary" /> Activity Heatmap</h3>
          <div className="flex items-center gap-2 text-xs text-muted">
            Less <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', background: 'rgba(52, 211, 153, 0.1)' }}></div>
              <div style={{ width: '12px', height: '12px', background: 'rgba(52, 211, 153, 0.4)' }}></div>
              <div style={{ width: '12px', height: '12px', background: 'rgba(52, 211, 153, 0.7)' }}></div>
              <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)' }}></div>
            </div> More
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14px, 1fr))', gap: '4px', height: '100px' }}>
          {data.heatmap.slice(-150).map((day, idx) => {
            const opacities = [0.05, 0.2, 0.5, 0.8, 1];
            return (
              <div 
                key={idx} 
                title={`${day.date}: ${day.value} issues`}
                style={{
                  background: 'var(--color-primary)',
                  opacity: opacities[day.value] || 0.05,
                  borderRadius: '2px',
                  minHeight: '14px'
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted mt-4" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <span>Past</span><span>Recent</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Left Column Widgets */}
        <div className="flex-col gap-6">
          <div className="glass-card p-6">
            <h4 className="text-xs text-muted font-bold mb-4" style={{ letterSpacing: '0.1em' }}>INCIDENT FILTER</h4>
            <div className="flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)' }} />
                <span className="text-sm">Critical Thresholds</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)' }} />
                <span className="text-sm">System Calibrations</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} />
                <span className="text-sm">Manual Overrides</span>
              </label>
            </div>
          </div>

          <div className="glass-card p-6">
            <h4 className="text-xs text-muted font-bold mb-2" style={{ letterSpacing: '0.1em' }}>NETWORK HEALTH</h4>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-primary">{data.networkHealth}%</span>
              <Activity size={24} className="text-primary mb-1" />
            </div>
            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${data.networkHealth}%` }}></div></div>
          </div>
        </div>

        {/* Right Column Logs */}
        <div className="flex-col gap-4">
          {data.logs.map(log => (
            <div key={log.id} className="glass-card p-6 flex justify-between items-start" style={{ borderLeft: `4px solid ${log.status === 'STABILIZED' || log.status === 'RESOLVED' || log.status === 'OPTIMAL' ? 'var(--color-primary)' : 'var(--color-danger)'}` }}>
              <div className="flex gap-4">
                <div style={{ background: 'rgba(52,211,153,0.1)', padding: '0.75rem', borderRadius: '8px', color: 'var(--color-primary)', height: 'fit-content' }}>
                  {log.status === 'STABILIZED' || log.status === 'OPTIMAL' ? <Cpu size={20} /> : <ShieldAlert size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{log.title}</h3>
                  <p className="text-sm text-muted mb-4">{log.description}</p>
                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                    <ShieldAlert size={14} /> AI TAGGED: {log.aiTag}
                  </div>
                </div>
              </div>
              <div className="flex-col items-end gap-2">
                <span className="text-xs font-bold px-2 py-1" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--color-primary)', borderRadius: '4px', letterSpacing: '0.05em' }}>{log.status}</span>
                <span className="text-xs text-muted mt-8 block">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Telemetry;
