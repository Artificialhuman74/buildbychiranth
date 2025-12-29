import React, { useState, useEffect, useRef } from 'react';
import '../styles/SOSCenter.css';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string;
}

const SOSCenter: React.FC = () => {
  const [status, setStatus] = useState('Ready.');
  const [locStatus, setLocStatus] = useState('Location idle.');
  const [uploadStatus, setUploadStatus] = useState('None yet.');
  const [shakeStatus, setShakeStatus] = useState('Shake trigger: Off');
  const [isRecording, setIsRecording] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [countdownCancelled, setCountdownCancelled] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [batteryLevel, setBatteryLevel] = useState('Unknown');
  const [sosId, setSosId] = useState<string | number | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const locTimerRef = useRef<NodeJS.Timeout | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const slideThumbRef = useRef<HTMLDivElement>(null);
  const slideTrackRef = useRef<HTMLDivElement>(null);

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isSecure = window.isSecureContext || window.location.protocol === 'https:';

  useEffect(() => {
    fetchEmergencyContacts();
    checkLocationPermission();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      const res = await fetch('/api/emergency-contacts');
      const data = await res.json();
      if (data.success && Array.isArray(data.contacts)) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const checkLocationPermission = () => {
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      try {
        navigator.permissions.query({ name: 'geolocation' }).then((res) => {
          const map: { [key: string]: string } = {
            granted: 'Location ready.',
            prompt: 'Location permission will be requested on SOS.',
            denied: 'Location permission denied. Enable it in site settings.'
          };
          if (res?.state) setLocStatus(map[res.state] || 'Location status unknown.');
          if (res) {
            res.onchange = () => {
              if (res.state) setLocStatus(map[res.state] || 'Location status changed.');
            };
          }
        });
      } catch (_) {
        // ignore
      }
    }
  };

  const playAlarm = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 1000;
    oscillator.type = 'square' as OscillatorType;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const startAlarm = () => {
    playAlarm();
    alarmIntervalRef.current = setInterval(playAlarm, 500);
  };

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const startMedia = async () => {
    if (mediaStreamRef.current) return mediaStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true;
        previewRef.current.style.display = 'block';
        previewRef.current.play().catch(() => {});
      }
      return stream;
    } catch (e: any) {
      const reason = e?.name || 'UnknownError';
      const errorMessages: { [key: string]: string } = {
        NotAllowedError: 'Permission denied by user or browser.',
        NotFoundError: 'No camera/microphone found.',
        SecurityError: 'Blocked by insecure connection. Use HTTPS.',
        NotReadableError: 'Hardware in use by another app.'
      };
      setStatus(errorMessages[reason] || 'Could not access camera/mic.');
      throw e;
    }
  };

  const startRecorder = () => {
    if (!mediaStreamRef.current) return;
    chunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    try {
      recorderRef.current = new MediaRecorder(mediaStreamRef.current, options);
    } catch (_) {
      recorderRef.current = new MediaRecorder(mediaStreamRef.current);
    }
    recorderRef.current.ondataavailable = (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data);
    };
    recorderRef.current.onstop = uploadRecording;
    recorderRef.current.start(1000);
  };

  const uploadRecording = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const form = new FormData();
      form.append('recording', blob, `sos_${Date.now()}.webm`);
      form.append('sosId', sosId?.toString() || '');
      
      const res = await fetch('/api/upload-recording', { method: 'POST', body: form });
      const data = await res.json();
      if (data?.fileUrl) {
        setUploadStatus('Uploaded: ' + data.fileUrl);
      } else {
        setUploadStatus('Upload complete.');
      }
    } catch (e) {
      setUploadStatus('Upload failed.');
    }
  };

  const startLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocStatus('Geolocation not available');
      return;
    }

    const tick = () =>
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocStatus(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
          if (sosId) {
            fetch('/api/sos-live', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sosId,
                latitude,
                longitude,
                timestamp: new Date().toISOString()
              })
            }).catch(() => {});
          }
        },
        (err) => {
          setLocStatus('Location error: ' + err.message);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
      );

    tick();
    if (locTimerRef.current) clearInterval(locTimerRef.current);
    locTimerRef.current = setInterval(tick, 60000);
  };

  const beginSOS = async () => {
    if (contacts.length < 3) {
      setStatus('⚠️ Please add at least 3 emergency contacts first!');
      setTimeout(() => {
        window.location.href = '/emergency-contacts';
      }, 2000);
      return;
    }

    setShowCountdown(true);
    setCountdownCancelled(false);
    setCountdown(5);
    startAlarm();

    for (let i = 5; i >= 1; i--) {
      if (countdownCancelled) {
        setShowCountdown(false);
        stopAlarm();
        setStatus('SOS cancelled.');
        return;
      }

      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    stopAlarm();
    setShowCountdown(false);
    setSosActive(true);
    setStatus('SOS ACTIVATED!');

    startLocation();

    // Get battery level
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100).toString());
      }
    } catch (_) {
      // ignore
    }

    // Log SOS
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: (window as any).currentUser || 'Anonymous',
          time: new Date().toISOString(),
          triggeredBy: 'Button',
          battery: batteryLevel
        })
      });
      const data = await res.json();
      setSosId(data?.sosId || Date.now());
    } catch (e) {
      console.error('SOS logging failed:', e);
    }

    // Start recording
    if (isSecure || isLocalhost) {
      try {
        await startMedia();
        startRecorder();
        setIsRecording(true);
        setStatus('Recording… <span class="recording-dot"></span>');
      } catch (_) {
        setStatus('⚠️ SOS Active (recording failed)');
      }
    } else {
      setStatus('⚠️ SOS Active! Location tracked. (Recording requires HTTPS)');
    }

    // Show WhatsApp modal
    showWhatsAppModalFn();
  };

  const stopSOS = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      setStatus('Stopped. Uploading…');
    } else {
      setStatus('SOS ended.');
      setUploadStatus('No recording (HTTP mode).');
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (locTimerRef.current) {
      clearInterval(locTimerRef.current);
      locTimerRef.current = null;
    }

    setSosActive(false);
    setIsRecording(false);
  };

  const showWhatsAppModalFn = async () => {
    const userName = (window as any).currentUser || 'User';
    const trackUrl = `${window.location.origin}/track/${sosId}`;
    const batteryText = batteryLevel === 'Unknown' ? 'Unknown' : `${batteryLevel}%`;
    const baseText = `🚨 EMERGENCY ALERT from ${userName}. I'm in danger and need help. Live location: ${trackUrl}\nBattery: ${batteryText}\nPlease check in immediately.`;

    setAlertText(baseText);
    setShowWhatsAppModal(true);
  };

  const handleSlideStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!slideThumbRef.current) return;
    slideThumbRef.current.style.cursor = 'grabbing';
  };

  const handleSlideCancel = () => {
    setCountdownCancelled(true);
  };

  return (
    <div className="sos-container">
      {/* Countdown Overlay */}
      {showCountdown && (
        <div className="countdown-overlay active">
          <div className="countdown-content">
            <div className="countdown-number">{countdown}</div>
            <div className="countdown-text">Emergency SOS Activating</div>
            <div className="countdown-warning">🚨 Your emergency contacts will be alerted 🚨</div>
            <div className="slide-to-cancel-container">
              <div className="slide-to-cancel-track" ref={slideTrackRef}></div>
              <div
                className="slide-to-cancel-thumb"
                ref={slideThumbRef}
                onMouseDown={handleSlideStart}
                onTouchStart={handleSlideStart}
              >
                ➜
              </div>
              <div className="slide-to-cancel-text">Slide to Cancel</div>
            </div>
            <button
              onClick={handleSlideCancel}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel SOS
            </button>
          </div>
        </div>
      )}

      {/* Main SOS Hero */}
      <div className="sos-hero">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <div className="sos-title">Emergency SOS Center</div>
            <div className="sos-sub">
              Trigger SOS, auto-record, and share live location with your trusted contacts.
            </div>
          </div>
          <div className="text-end d-flex gap-2">
            <button className="btn btn-sm btn-success">Mark as Safe</button>
            <a href="tel:181" className="btn btn-sm btn-light">
              Call 181
            </a>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-7">
            <div className="card-lite">
              <h5 className="mb-2">Quick SOS</h5>
              <p className="mb-3" style={{ color: 'var(--muted)' }}>
                Press SOS to start a 3s countdown. We'll start recording and log your live location.
              </p>
              <div className="d-grid gap-2">
                <button
                  className="btn-sos"
                  onClick={beginSOS}
                  disabled={sosActive}
                  style={{ opacity: sosActive ? 0.5 : 1 }}
                >
                  🚨 Start SOS
                </button>
                {sosActive && (
                  <button className="btn btn-stop" onClick={stopSOS}>
                    ⛔ Stop & Upload
                  </button>
                )}
                <button className="btn btn-ghost">Test recording (no upload)</button>
              </div>
              <div className="mt-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button type="button" className="btn btn-sm btn-ghost">
                    Enable shake to trigger SOS
                  </button>
                  <span className="small" style={{ color: 'var(--muted)' }}>
                    {shakeStatus}
                  </span>
                </div>
              </div>
              <div className="mt-3 status" dangerouslySetInnerHTML={{ __html: status }} />
              <video ref={previewRef} playsInline muted style={{ display: 'none' }} />
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card-lite mb-3">
              <h6 className="mb-2">Live Location</h6>
              <div className="status">{locStatus}</div>
            </div>
            <div className="card-lite">
              <h6 className="mb-2">Recent Upload</h6>
              <div className="status">{uploadStatus}</div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📱 Alert Your Contacts</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowWhatsAppModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="alert alert-info mb-3">
                  <strong>✅ SMS app opening automatically!</strong>
                  <br />
                  Send the pre-filled message to your first contact, then return here to alert
                  others.
                </div>
                <div className="d-grid gap-2 mb-3">
                  <button type="button" className="btn btn-success">
                    Share to WhatsApp (choose recipients)
                  </button>
                  <button type="button" className="btn btn-outline-secondary">
                    Copy alert message
                  </button>
                </div>
                <div className="small text-muted mb-2">Send to individual contacts:</div>
                <p className="mb-3 small">
                  📱 <strong>SMS works instantly</strong> - no signup needed. WhatsApp requires
                  the app installed.
                </p>
                <div id="waContacts" className="d-grid gap-2">
                  {contacts.map((contact) => (
                    <a
                      key={contact.id}
                      href={`sms:${contact.phone}?body=${encodeURIComponent(alertText)}`}
                      className="btn btn-primary d-flex justify-content-between align-items-center mb-2"
                    >
                      <span>
                        📱 SMS {contact.name} <small className="text-white-50">({contact.relationship})</small>
                      </span>
                      <span className="ms-2">➜</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWhatsAppModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSCenter;
