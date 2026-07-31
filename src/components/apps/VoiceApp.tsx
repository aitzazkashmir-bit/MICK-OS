import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Globe, 
  Sparkles, 
  Bot, 
  Radio,
  RadioTower,
  MessageSquare,
  Activity,
  AlertCircle,
  Terminal,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  UserCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

export type VoiceEngineState = 
  | 'Idle' 
  | 'Wake Word Detected' 
  | 'Listening' 
  | 'Thinking' 
  | 'Executing' 
  | 'Speaking' 
  | 'Completed' 
  | 'Error';

export interface LiveTranscriptItem {
  id: string;
  sender: 'user' | 'mick';
  speechText: string;
  reasoningSummary?: string;
  actionPerformed?: string;
  toolUsed?: string;
  toolResult?: string;
  time: string;
  status: 'executing' | 'completed' | 'error';
}

export const VoiceApp: React.FC = () => {
  // Engine State
  const [engineState, setEngineState] = useState<VoiceEngineState>('Idle');
  const [voiceMode, setVoiceMode] = useState<'wake-word' | 'continuous' | 'push-to-talk'>('wake-word');
  const [language, setLanguage] = useState<'en-US' | 'ur-PK'>('en-US');
  const [transcript, setTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real Owner State
  const [ownerTasks, setOwnerTasks] = useState<any[]>([]);

  // Logs & History
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([
    {
      id: 'init-log',
      sender: 'mick',
      speechText: 'Welcome back Aitzaz. MICK Voice Engine initialized in English & Urdu.',
      reasoningSummary: 'System standby. Listening for "Hey Mick" or manual command.',
      actionPerformed: 'Voice Core Standby',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'completed',
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // Fetch real owner tasks on mount
  useEffect(() => {
    fetchOwnerTasks();
  }, []);

  const fetchOwnerTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.tasks) setOwnerTasks(data.tasks.slice(0, 5));
    } catch (e) {
      console.warn('Failed to fetch tasks for Voice panel', e);
    }
  };

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setErrorMessage('Speech Recognition is not supported natively in this browser window. Please use Chrome/Edge or click to type.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setErrorMessage(null);
        if (engineState === 'Idle') {
          setEngineState('Listening');
        }
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        const lower = currentText.toLowerCase().trim();

        // Check Wake Word "Hey Mick"
        if (voiceMode === 'wake-word' && (lower.includes('hey mick') || lower.includes('hey mic') || lower.includes('mick'))) {
          // Interrupt any ongoing TTS
          if (window.speechSynthesis) window.speechSynthesis.cancel();

          setEngineState('Wake Word Detected');
          const cleanPrompt = currentText.replace(/hey mick/gi, '').replace(/hey mic/gi, '').trim();

          if (cleanPrompt.length > 2) {
            processRealVoiceCommand(cleanPrompt);
          } else {
            // Natural greeting
            speakText('Good evening Aitzaz. I am listening.', () => {
              setEngineState('Listening');
            });
          }
        } else if (voiceMode === 'continuous' && currentText.trim().length > 5) {
          // Auto execute after short pause
          if (event.results[event.results.length - 1].isFinal) {
            processRealVoiceCommand(currentText.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
          setEngineState('Error');
        } else if (event.error !== 'no-speech') {
          console.warn('Speech recognition event:', event.error);
        }
      };

      recognition.onend = () => {
        // Auto restart if in wake-word or continuous mode
        if (voiceMode !== 'push-to-talk' && engineState !== 'Error') {
          try {
            recognition.start();
          } catch (e) {
            // Already started or restarting
          }
        }
      };

      recognitionRef.current = recognition;

      // Start recognition automatically
      if (voiceMode !== 'push-to-talk') {
        try {
          recognition.start();
          setEngineState('Listening');
        } catch (e) {}
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to initialize speech recognition.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [language, voiceMode]);

  const toggleListeningManual = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech Recognition unavailable in current environment.');
      return;
    }

    if (engineState === 'Listening' || engineState === 'Wake Word Detected') {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setEngineState('Idle');
    } else {
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setEngineState('Listening');
      } catch (e) {
        setEngineState('Listening');
      }
    }
  };

  // Process Real Voice Command with Server-Side Gemini AI & Tool Execution
  const processRealVoiceCommand = async (commandText: string) => {
    setEngineState('Thinking');
    setTranscript('');

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logId = `log-${Date.now()}`;

    // Add user entry
    const userLog: LiveTranscriptItem = {
      id: logId,
      sender: 'user',
      speechText: commandText,
      time: timeStr,
      status: 'executing',
    };

    setTranscripts((prev) => [userLog, ...prev]);

    // Check for direct OS App Open voice commands
    const lowerCmd = commandText.toLowerCase();
    let directAppToOpen: string | null = null;
    if (lowerCmd.includes('open job assistant') || lowerCmd.includes('open jobs')) directAppToOpen = 'job-assistant';
    else if (lowerCmd.includes('open tasks') || lowerCmd.includes('open task engine')) directAppToOpen = 'tasks';
    else if (lowerCmd.includes('open memory') || lowerCmd.includes('open memory core')) directAppToOpen = 'memory';
    else if (lowerCmd.includes('open terminal')) directAppToOpen = 'terminal';
    else if (lowerCmd.includes('open copilot') || lowerCmd.includes('open ai copilot')) directAppToOpen = 'copilot';
    else if (lowerCmd.includes('open notes')) directAppToOpen = 'notes';
    else if (lowerCmd.includes('open browser')) directAppToOpen = 'browser';
    else if (lowerCmd.includes('open settings')) directAppToOpen = 'settings';
    else if (lowerCmd.includes('open code editor')) directAppToOpen = 'code-editor';

    if (directAppToOpen) {
      window.dispatchEvent(new CustomEvent('mick-open-app', { detail: { appId: directAppToOpen } }));
      const openMessage = `Opening ${directAppToOpen} application on MICK OS.`;
      
      setEngineState('Executing');
      const mickLog: LiveTranscriptItem = {
        id: `mick-${Date.now()}`,
        sender: 'mick',
        speechText: openMessage,
        reasoningSummary: `Voice command identified OS navigation intent: Launch ${directAppToOpen}.`,
        actionPerformed: `mick-open-app: ${directAppToOpen}`,
        toolUsed: 'MICK OS Window Manager',
        toolResult: 'SUCCESS',
        time: timeStr,
        status: 'completed',
      };
      setTranscripts((prev) => [mickLog, ...prev]);

      setEngineState('Speaking');
      speakText(openMessage, () => {
        setEngineState('Idle');
      });
      return;
    }

    // Call Real Gemini 3.6 Flash Server AI Engine with Function Calling Capabilities
    try {
      setEngineState('Executing');
      const res = await fetch('/api/ai/mick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: commandText }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const reply = data.text || 'I have processed your command, Aitzaz.';
      const toolLogs = data.toolCallLogs || [];

      const mickLog: LiveTranscriptItem = {
        id: `mick-${Date.now()}`,
        sender: 'mick',
        speechText: reply,
        reasoningSummary: 'Synthesized context from MICK persistent memory & active state tools.',
        actionPerformed: toolLogs.length > 0 ? toolLogs.join('; ') : 'Gemini 3.6 Flash Execution',
        toolUsed: data.toolsUsed ? data.toolsUsed.join(', ') : 'AI Core + Real Tools',
        toolResult: 'Executed cleanly',
        time: timeStr,
        status: 'completed',
      };

      setTranscripts((prev) => [mickLog, ...prev]);

      // Refresh task list in case a task was created
      fetchOwnerTasks();

      // Speak response back
      setEngineState('Speaking');
      speakText(reply, () => {
        setEngineState('Idle');
      });
    } catch (err: any) {
      console.error('Voice execution error:', err);
      setEngineState('Error');
      setErrorMessage(`Execution error: ${err.message || 'Network request failed'}`);

      const errLog: LiveTranscriptItem = {
        id: `err-${Date.now()}`,
        sender: 'mick',
        speechText: `Aitzaz, I encountered an error: ${err.message || 'Unable to connect to AI server.'}`,
        reasoningSummary: 'Failed to complete execution due to network/API exception.',
        actionPerformed: 'Error Handler',
        time: timeStr,
        status: 'error',
      };
      setTranscripts((prev) => [errLog, ...prev]);
    }
  };

  // Speak Text using Web Speech Synthesis
  const speakText = (text: string, onEndCallback?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.95; // Calm, human-like pace
    utterance.pitch = 1.0;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      isSpeakingRef.current = false;
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  };

  const getBadgeForState = (st: VoiceEngineState) => {
    switch (st) {
      case 'Listening': return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'Wake Word Detected': return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-bounce';
      case 'Thinking': return 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse';
      case 'Executing': return 'bg-sky-500/20 text-sky-300 border-sky-500/40 animate-pulse';
      case 'Speaking': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse';
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Error': return 'bg-rose-600/30 text-rose-200 border-rose-500/50';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans p-4 space-y-4 overflow-hidden select-none">
      {/* Top Header & Engine Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shadow-lg shadow-rose-950/40">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              MICK Voice AI Command Center
              <span className={`px-2.5 py-0.5 text-xs rounded-full border font-mono tracking-wider ${getBadgeForState(engineState)}`}>
                ● {engineState.toUpperCase()}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Owner Aitzaz • Continuous "Hey Mick" Pipeline & Real Tool Execution</p>
          </div>
        </div>

        {/* Engine Controls */}
        <div className="flex items-center space-x-2">
          {/* Mode Selector */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setVoiceMode('wake-word')}
              className={`px-2.5 py-1 rounded-lg font-mono transition ${voiceMode === 'wake-word' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Activate 'Hey Mick' Wake Word Listener"
            >
              Wake-Word
            </button>
            <button
              onClick={() => setVoiceMode('continuous')}
              className={`px-2.5 py-1 rounded-lg font-mono transition ${voiceMode === 'continuous' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Continuous Hot Microphone"
            >
              Continuous
            </button>
            <button
              onClick={() => setVoiceMode('push-to-talk')}
              className={`px-2.5 py-1 rounded-lg font-mono transition ${voiceMode === 'push-to-talk' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Manual Push-To-Talk"
            >
              Push-To-Talk
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => setLanguage('en-US')}
              className={`px-2 py-0.5 rounded ${language === 'en-US' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ur-PK')}
              className={`px-2 py-0.5 rounded ${language === 'ur-PK' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400'}`}
            >
              UR (اردو)
            </button>
          </div>
        </div>
      </div>

      {/* Real Error Notification Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block text-rose-300">Microphone or Pipeline Alert</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Futuristic Command Stage */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 relative overflow-hidden shadow-2xl">
        {/* Background Visualizer Waves */}
        {(engineState === 'Listening' || engineState === 'Speaking' || engineState === 'Thinking') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-64 h-64 rounded-full border border-rose-500/10 animate-ping opacity-25 ${engineState === 'Speaking' ? 'border-emerald-500/20' : engineState === 'Thinking' ? 'border-purple-500/20' : ''}`} />
            <div className={`w-40 h-40 rounded-full border border-rose-500/20 animate-pulse opacity-30 ${engineState === 'Speaking' ? 'border-emerald-500/30' : engineState === 'Thinking' ? 'border-purple-500/30' : ''}`} />
          </div>
        )}

        {/* Central Audio Mic Button */}
        <button
          onClick={toggleListeningManual}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            engineState === 'Listening' || engineState === 'Wake Word Detected'
              ? 'bg-rose-600 text-white shadow-rose-600/50 scale-105 border-4 border-rose-400/40 animate-pulse'
              : engineState === 'Speaking'
              ? 'bg-emerald-600 text-white shadow-emerald-600/50 border-4 border-emerald-400/40'
              : engineState === 'Thinking' || engineState === 'Executing'
              ? 'bg-purple-600 text-white shadow-purple-600/50 border-4 border-purple-400/40 animate-spin'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-2 border-slate-700'
          }`}
        >
          {engineState === 'Listening' || engineState === 'Wake Word Detected' ? (
            <Mic className="w-10 h-10" />
          ) : engineState === 'Speaking' ? (
            <Volume2 className="w-10 h-10" />
          ) : engineState === 'Thinking' || engineState === 'Executing' ? (
            <Sparkles className="w-10 h-10" />
          ) : (
            <MicOff className="w-10 h-10" />
          )}
        </button>

        {/* Status text */}
        <div className="text-center space-y-1 relative z-10">
          <p className="text-xs font-semibold text-white tracking-widest uppercase">
            {engineState === 'Idle' && 'Voice Standby — Say "Hey Mick"'}
            {engineState === 'Wake Word Detected' && 'Wake Word Detected — Listening for Aitzaz...'}
            {engineState === 'Listening' && 'Listening for spoken instruction...'}
            {engineState === 'Thinking' && 'MICK AI Core Processing Intent...'}
            {engineState === 'Executing' && 'Executing real OS tools & API calls...'}
            {engineState === 'Speaking' && 'MICK Voice Synthesizing Response...'}
            {engineState === 'Completed' && 'Action Completed'}
            {engineState === 'Error' && 'Pipeline Error Encountered'}
          </p>
          <p className="text-[11px] text-slate-400">
            {language === 'ur-PK' ? 'اردو اور انگریزی میں ہدایات دیں' : 'Say "Open Job Assistant", "Create task", or ask MICK anything.'}
          </p>
        </div>

        {/* Live Recognized User Speech Box */}
        {transcript && (
          <div className="bg-slate-950/90 border border-rose-500/40 p-3 rounded-xl max-w-xl w-full text-center text-xs text-rose-300 font-mono shadow-xl animate-fade-in">
            <span className="text-[10px] text-slate-500 block mb-0.5 uppercase tracking-wider">Live Speech Input</span>
            "{transcript}"
          </div>
        )}
      </div>

      {/* Main Execution Split View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {/* Live Transcript Stream */}
        <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-rose-400" />
              Live Transcript & Execution Telemetry
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-Time Log</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {transcripts.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  item.sender === 'mick'
                    ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-slate-300">
                    {item.sender === 'mick' ? (
                      <Bot className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    {item.sender === 'mick' ? 'MICK AI Voice' : 'Aitzaz (Speech)'}
                  </span>
                  <span>{item.time}</span>
                </div>

                <p className="font-sans text-xs leading-relaxed text-slate-100">{item.speechText}</p>

                {item.reasoningSummary && (
                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div><strong className="text-purple-400">Reasoning:</strong> {item.reasoningSummary}</div>
                    {item.actionPerformed && (
                      <div><strong className="text-sky-400">Action:</strong> {item.actionPerformed}</div>
                    )}
                    {item.toolUsed && (
                      <div><strong className="text-emerald-400">Tool Used:</strong> {item.toolUsed} ({item.toolResult})</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Real Owner Context Panel */}
        <div className="md:col-span-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Owner Summary (Aitzaz)
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              Live State
            </span>
          </div>

          <div className="text-xs space-y-2 text-slate-300">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-semibold text-white text-xs">Today's Real Tasks ({ownerTasks.length})</div>
              {ownerTasks.length === 0 ? (
                <p className="text-[11px] text-slate-500">No pending tasks. Ask MICK to add one!</p>
              ) : (
                <ul className="space-y-1 text-[11px] text-slate-400">
                  {ownerTasks.map((t) => (
                    <li key={t.id} className="truncate flex items-center justify-between">
                      <span className="truncate">• {t.title}</span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">{t.priority}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1 text-[11px]">
              <div className="font-semibold text-white">Voice Command Triggers</div>
              <p className="text-slate-400">"Open Job Assistant"</p>
              <p className="text-slate-400">"Find remote AI jobs"</p>
              <p className="text-slate-400">"Create a task for MICK OS review"</p>
              <p className="text-slate-400">"Generate cover letter for Senior AI Engineer"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

