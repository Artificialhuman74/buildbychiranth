import React, { useState, useRef, useEffect } from 'react';
import '../styles/FakeCall.css';
import FloatingDecorations from './FloatingDecorations';
import GradualBlur from './GradualBlur';

interface Message {
  id: string;
  type: 'sent' | 'received';
  text: string;
  timestamp: Date;
}

const FakeCall: React.FC = () => {
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callerName, setCallerName] = useState('Mom');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call timer
  useEffect(() => {
    if (callActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = () => {
    setCallActive(true);
    setMessages([]);
    setCallDuration(0);
    // Initial greeting
    setTimeout(() => {
      addMessage({
        id: Math.random().toString(),
        type: 'received',
        text: `Hi! It's ${callerName}. How are you doing? Is everything okay?`,
        timestamp: new Date()
      });
    }, 1000);
  };

  const endCall = () => {
    setCallActive(false);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setIsRecording(false);
  };

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      type: 'sent',
      text: inputMessage,
      timestamp: new Date()
    };

    addMessage(userMsg);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That sounds tough. I'm here for you.",
        "I understand. Take your time to talk.",
        'You can tell me anything. I\'m listening.',
        'I care about you. What else is on your mind?',
        'That makes sense. What happened next?',
        'I\'m so sorry to hear that. How are you feeling now?',
        'You did the right thing. Be proud of yourself.',
        'That sounds really stressful. You\'re not alone.'
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      addMessage({
        id: Math.random().toString(),
        type: 'received',
        text: randomResponse,
        timestamp: new Date()
      });
    }, 500 + Math.random() * 1000);
  };

  const startVoiceInput = async () => {
    setIsListening(true);
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition not available:', err);
      setIsListening(false);
    }
  };

  if (!callActive) {
    return (
      <div className="fake-call-container sylvie-landing">
        <FloatingDecorations />
        <GradualBlur position="bottom" height="11.475rem" strength={2.5} divCount={6} curve="ease-out" target="page" animated="scroll" />
        <div className="call-setup">
          <div className="setup-card">
            <h1>📞 Fake Call Assistant</h1>
            <p>Create a realistic incoming call or chat conversation to escape uncomfortable situations discreetly.</p>

            <div className="setup-form">
              <div className="form-group">
                <label>Who's calling you?</label>
                <input
                  type="text"
                  className="form-control"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  placeholder="e.g., Mom, Best Friend, Boss"
                />
              </div>

              <div className="call-options">
                <button
                  className="option-btn call-mode"
                  onClick={startCall}
                >
                  <div className="option-icon">📞</div>
                  <div className="option-title">Start Voice Call</div>
                  <div className="option-desc">Realistic incoming call simulation</div>
                </button>

                <button className="option-btn chat-mode">
                  <div className="option-icon">💬</div>
                  <div className="option-title">Chat Mode</div>
                  <div className="option-desc">Text-based conversation</div>
                </button>
              </div>

              <div className="tips">
                <h3>💡 Tips for Using Fake Call</h3>
                <ul>
                  <li>Use this feature discreetly to create a reason to leave</li>
                  <li>Can simulate calls from trusted contacts</li>
                  <li>Keep your phone visible to make it look natural</li>
                  <li>Safe way to escape uncomfortable situations</li>
                  <li>Always prioritize your safety first</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fake-call-container call-active">
      <div className="call-screen">
        <div className="call-header">
          <div className="caller-info">
            <div className="caller-avatar">
              {callerName.charAt(0).toUpperCase()}
            </div>
            <div className="caller-details">
              <h2>{callerName}</h2>
              <p className="call-status">
                {isRecording ? (
                  <>
                    <span className="recording-indicator">● Recording</span>
                  </>
                ) : (
                  'Active Call'
                )}
              </p>
              <p className="call-duration">{formatDuration(callDuration)}</p>
            </div>
          </div>
          <button className="btn-end-call" onClick={endCall}>
            ✕
          </button>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <p>Conversation starting...</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.type}`}>
                  <div className="message-content">{msg.text}</div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <input
              type="text"
              className="message-input"
              placeholder="Type a response..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <button
              className={`btn-voice ${isListening ? 'listening' : ''}`}
              onClick={startVoiceInput}
              title="Voice input"
            >
              🎤
            </button>
            <button
              className="btn-send"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
            >
              ➜
            </button>
          </div>

          <div className="call-controls">
            <button
              className={`control-btn ${isRecording ? 'active' : ''}`}
              onClick={() => setIsRecording(!isRecording)}
              title="Toggle recording"
            >
              {isRecording ? '⏹️ Stop Recording' : '⏺️ Start Recording'}
            </button>
            <button className="control-btn" title="Mute">
              🔇 Mute
            </button>
            <button
              className="control-btn end"
              onClick={endCall}
              title="End call"
            >
              📵 End Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FakeCall;
