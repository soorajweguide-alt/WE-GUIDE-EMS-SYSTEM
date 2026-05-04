import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { attendanceAPI } from '../api';
import Topbar from '../components/Topbar';
import toast from 'react-hot-toast';

// ─── ResultCard defined OUTSIDE Scanner so React doesn't unmount it on re-render ──
function ResultCard({ result }) {
  if (!result) return null;
  const emp    = result.data?.data;
  const isOk   = result.type === 'success';
  const isWarn = result.type === 'warning';

  return (
    <div className={`scan-result ${result.type}`} style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ fontSize: 36 }}>
          {isOk ? '✅' : isWarn ? '⚠️' : '❌'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
            {isOk   ? (result.data?.action === 'check_out' ? 'Checked Out Successfully!' : 'Checked In Successfully!') :
             isWarn ? 'Already Marked Today' :
                      'Scan Failed'}
          </div>

          {emp ? (
            <div style={{ fontSize: 14 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</div>
                <strong style={{ fontSize: 18, color: 'var(--text)' }}>{emp.name}</strong>
              </div>
              {result.greeting && (
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid #10b981', borderRadius: '4px', marginBottom: '12px', fontSize: '15px', fontWeight: '500', color: '#10b981' }}>
                  ☀️ {result.greeting}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="badge badge-cyan">{emp.department}</span>
                <span className="badge badge-purple">{emp.designation}</span>
                <span className="badge badge-green">ID: {emp.employee_id}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Check-in Time</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--emerald)', fontWeight: 600 }}>
                    🕐 {emp.time_in}
                  </div>
                </div>
                {emp.time_out && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Check-out Time</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--emerald)', fontWeight: 600 }}>
                      🏃 {emp.time_out}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Date</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600 }}>
                    📅 {emp.date}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>
              {result.message || 'Something went wrong. Please try again.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper: extract token from raw string or JSON payload ────────────────────
function extractToken(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  try {
    const payload = JSON.parse(trimmed);
    if (payload && payload.token) return payload.token;
  } catch {
    // not JSON — treat as raw token
  }
  
  // Extract from a URL
  if (trimmed.startsWith('http')) {
    if (trimmed.includes('#token=')) {
      return trimmed.split('#token=')[1];
    }
    try {
      const url = new URL(trimmed);
      return url.pathname.split('/').pop() || trimmed;
    } catch {
      return trimmed.split('/').pop();
    }
  }
  
  return trimmed;
}

export default function Scanner({ isKiosk = false }) {
  const [scanning,    setScanning]    = useState(true);
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [lastScanned, setLastScanned] = useState('');   // debounce guard
  const loadingRef = useRef(false);   // ref to avoid stale closure in scanner callback
  const html5Ref   = useRef(null);

  // Keep loadingRef in sync
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  const markAttendance = useCallback(async (rawInput) => {
    if (loadingRef.current) return;

    const token = extractToken(rawInput);
    if (!token) {
      toast.error('Empty token — nothing to scan');
      return;
    }

    // Debounce: avoid re-processing the same QR immediately
    if (token === lastScanned) return;
    setLastScanned(token);

    loadingRef.current = true;
    setLoading(true);
    setResult(null);

    try {
      const res = await attendanceAPI.scan(token);
      const name = res.data.data.name;
      
      const isCheckOut = res.data.action === 'check_out';
      const hour = new Date().getHours();
      
      let greetingMsg = '';
      if (isCheckOut) {
        greetingMsg = `Good bye ${name}, `;
      } else {
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17) greeting = 'Good evening';
        greetingMsg = `${greeting} ${name}, have a good day!`;
      }
      
      setResult({ type: 'success', data: res.data, greeting: greetingMsg });
      toast.success(`✅ ${greetingMsg}`, { duration: 4000 });
      
      // Bonus: Text to Speech notification!
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greetingMsg);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }

    } catch (err) {
      const errData = err.response?.data;
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setResult({ type: 'error', message: 'Cannot reach server. Is the backend running?' });
        toast.error('Server unreachable — check backend');
      } else {
        setResult({ type: 'error', message: errData?.message || 'Invalid QR code or token' });
        toast.error(errData?.message || 'Invalid QR code');
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [lastScanned]);

  // ─── Webcam scanner ────────────────────────────────────────────────────────
  const stopScanner = useCallback(() => {
    if (html5Ref.current) {
      html5Ref.current.clear().catch(() => {});
      html5Ref.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!scanning) return;

    // Small delay so the DOM element #qr-reader is mounted
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, aspectRatio: 1.0, showTorchButtonIfSupported: true },
        false
      );

      scanner.render(
        async (decodedText) => {
          // Use loadingRef to avoid stale closure
          if (loadingRef.current) return;
          await markAttendance(decodedText);
        },
        () => { /* suppress decode errors while searching */ }
      );

      html5Ref.current = scanner;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (html5Ref.current) {
        html5Ref.current.clear().catch(() => {});
        html5Ref.current = null;
      }
    };
  }, [scanning, stopScanner, markAttendance]);

  const startScanner = () => {
    setResult(null);
    setLastScanned('');
    setScanning(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setLastScanned('');   // allow re-submission of same token manually
    await markAttendance(manualToken.trim());
    setManualToken('');
  };

  const scanAgain = useCallback(() => {
    setResult(null);
    setLastScanned('');
  }, []);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        scanAgain();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [result, scanAgain]);

  return (
    <div style={isKiosk ? { height: '100%' } : {}}>
      {!isKiosk && <Topbar title="QR Scanner" subtitle="Scan employee QR codes to mark attendance" />}

      <div className={isKiosk ? "fade-in" : "page-wrapper fade-in"} style={isKiosk ? { height: '100%' } : {}}>
        <div style={{ display: 'grid', gridTemplateColumns: isKiosk ? '1fr' : '1fr 1fr', gap: 24 }} className="scanner-grid">

          {/* ── Scanner Panel ───────────────────────────────────────── */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📷 Webcam Scanner</div>
            </div>
            <div className="card-body">
              <div>
                <div
                  id="qr-reader"
                  style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }}
                />
              </div>

              {/* Loading spinner */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <div style={{ color: 'var(--text2)', fontSize: 14 }}>Processing scan…</div>
                </div>
              )}

              {/* Result card renders here — defined outside component */}
              <ResultCard result={result} />

            </div>
          </div>

          {/* ── Manual + Info Panel ─────────────────────────────────── */}
          {!isKiosk && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
  
              {/* Manual Token Entry */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">⌨️ Manual Attendance Entry</div>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>
                    Enter the <strong>Employee ID</strong> below to manually mark attendance.
                  </p>
                  <form onSubmit={handleManualSubmit}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Employee ID</label>
                      <input
                        type="text"
                        className="form-control font-mono"
                        placeholder="e.g. EMP001"
                        value={manualToken}
                        onChange={e => setManualToken(e.target.value)}
                        style={{ fontSize: 14 }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={loading || !manualToken.trim()}
                    >
                      {loading ? (
                        <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing…</>
                      ) : (
                        '✅ Mark Attendance'
                      )}
                    </button>
                  </form>
  
                  {/* Show result also in manual panel */}
                  <ResultCard result={result} />
                </div>
              </div>
  
              {/* Scan ID Message */}
              <div className="card" style={{ padding: '30px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text2)' }}>
                  scan ur ID
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
