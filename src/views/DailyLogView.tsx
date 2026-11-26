import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { DailyLog, MoodType } from '../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Search,
  Save,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: BrowserSpeechRecognitionResult;
  };
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((ev: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type VoiceTargetField =
  | 'quickNote'
  | 'formReflection'
  | 'wentWell'
  | 'difficulties'
  | 'learned'
  | 'tomorrowFocus';

type VoiceLangCode = 'en-IN' | 'ml-IN' | 'en-US' | 'hi-IN';
type VoiceCaptureMode = 'android_phrase' | 'continuous_flow';
type VoiceInsertMode = 'append' | 'replace';

const VOICE_TARGET_OPTIONS: { id: VoiceTargetField; label: string; detailed?: boolean }[] = [
  { id: 'quickNote', label: 'Quick Note' },
  { id: 'formReflection', label: 'Personal Reflection' },
  { id: 'wentWell', label: 'What Went Well', detailed: true },
  { id: 'difficulties', label: 'Difficulties / Triggers', detailed: true },
  { id: 'learned', label: 'What I Learned', detailed: true },
  { id: 'tomorrowFocus', label: 'Tomorrow Focus', detailed: true },
];

const VOICE_LANGUAGE_OPTIONS: { code: VoiceLangCode; label: string }[] = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
];

function getSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function detectActivitiesFromSpeech(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];
  if (/\b(walk|walked|walking|jog|run|exercise)\b/.test(lower)) detected.push('Morning walk');
  if (/\b(breath|breathing|meditat|calm down|mindful)\b/.test(lower)) detected.push('Mindful breathing');
  if (/\b(meal|eat|ate|breakfast|lunch|dinner|food|healthy)\b/.test(lower)) detected.push('Nutritious meal');
  if (/\b(water|hydrat|drink water)\b/.test(lower)) detected.push('Stayed hydrated');
  if (/\b(read|book|study|learn|article)\b/.test(lower)) detected.push('Reading / Learning');
  if (/\b(friend|family|mother|father|sister|brother|supporter|called|spoke|talked)\b/.test(lower)) {
    detected.push('Spoke with supporter');
  }
  if (/\b(sleep|slept|rested|bedtime)\b/.test(lower)) detected.push('Good sleep routine');
  if (/\b(music|song|art|draw|paint|guitar)\b/.test(lower)) detected.push('Art or music');
  return detected;
}

export const DailyLogView: React.FC = () => {
  const { dailyLogs, addDailyLog, updateDailyLog, deleteDailyLog } = useApp();

  const [activeTab, setActiveTab] = useState<'timeline' | 'create'>('timeline');
  const [logMode, setLogMode] = useState<'quick' | 'detailed'>('quick');

  // Form State
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formMood, setFormMood] = useState<MoodType | undefined>('steady');
  const [formQuickNote, setFormQuickNote] = useState('');
  const [formActivities, setFormActivities] = useState<string[]>([]);
  const [activityInput, setActivityInput] = useState('');
  const [formReflection, setFormReflection] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Detailed fields
  const [dayOverview, setDayOverview] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [learned, setLearned] = useState('');
  const [supportNeeded, setSupportNeeded] = useState('');
  const [tomorrowFocus, setTomorrowFocus] = useState('');

  // Optional Craving, Sleep & Routine Check-In
  const [showVitalsSection, setShowVitalsSection] = useState(false);
  const [cravingFrequency, setCravingFrequency] = useState<string>('');
  const [cravingIntensity, setCravingIntensity] = useState<string>('');
  const [sleepHours, setSleepHours] = useState<string>('');
  const [routineSteady, setRoutineSteady] = useState<'unset' | 'yes' | 'no'>('unset');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');

  // Voice-to-Journal State & Refs
  const [speechSupported] = useState<boolean>(() => Boolean(getSpeechRecognitionConstructor()));
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<VoiceTargetField>('quickNote');
  const [voiceLang, setVoiceLang] = useState<VoiceLangCode>('en-IN');
  const [voiceCaptureMode, setVoiceCaptureMode] = useState<VoiceCaptureMode>(() => {
    if (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)) {
      return 'android_phrase';
    }
    return 'android_phrase';
  });
  const [voiceInsertMode, setVoiceInsertMode] = useState<VoiceInsertMode>('append');
  const [autoDetectActivities, setAutoDetectActivities] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStatusNote, setVoiceStatusNote] = useState<string | null>(null);
  const [suggestedVoiceActivities, setSuggestedVoiceActivities] = useState<string[]>([]);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    field: VoiceTargetField;
    previousValue: string;
  } | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const keepListeningRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const processedResultIndexRef = useRef(0);
  const lastFinalChunkRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  const voiceTargetRef = useRef(voiceTarget);
  voiceTargetRef.current = voiceTarget;
  const voiceInsertModeRef = useRef(voiceInsertMode);
  voiceInsertModeRef.current = voiceInsertMode;
  const voiceCaptureModeRef = useRef(voiceCaptureMode);
  voiceCaptureModeRef.current = voiceCaptureMode;
  const autoDetectActivitiesRef = useRef(autoDetectActivities);
  autoDetectActivitiesRef.current = autoDetectActivities;

  const moodOptions: { type: MoodType; label: string; emoji: string; color: string }[] = [
    { type: 'peaceful', label: 'Peaceful', emoji: '🌿', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { type: 'steady', label: 'Steady', emoji: '⚓', color: 'bg-teal-50 text-teal-800 border-teal-200' },
    { type: 'hopeful', label: 'Hopeful', emoji: '✨', color: 'bg-sky-50 text-sky-800 border-sky-200' },
    { type: 'challenged', label: 'Challenged', emoji: '🌊', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { type: 'heavy', label: 'Heavy', emoji: '🌧️', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  ];

  const commonActivities = [
    'Morning walk',
    'Mindful breathing',
    'Nutritious meal',
    'Stayed hydrated',
    'Reading / Learning',
    'Spoke with supporter',
    'Good sleep routine',
    'Art or music',
  ];

  const getFieldValue = useCallback(
    (field: VoiceTargetField): string => {
      switch (field) {
        case 'quickNote':
          return formQuickNote;
        case 'formReflection':
          return formReflection;
        case 'wentWell':
          return wentWell;
        case 'difficulties':
          return difficulties;
        case 'learned':
          return learned;
        case 'tomorrowFocus':
          return tomorrowFocus;
      }
    },
    [formQuickNote, formReflection, wentWell, difficulties, learned, tomorrowFocus]
  );

  const setFieldValue = useCallback((field: VoiceTargetField, nextValue: string) => {
    switch (field) {
      case 'quickNote':
        setFormQuickNote(nextValue);
        break;
      case 'formReflection':
        setFormReflection(nextValue);
        break;
      case 'wentWell':
        setWentWell(nextValue);
        break;
      case 'difficulties':
        setDifficulties(nextValue);
        break;
      case 'learned':
        setLearned(nextValue);
        break;
      case 'tomorrowFocus':
        setTomorrowFocus(nextValue);
        break;
    }
  }, []);

  const applyDictatedTranscript = useCallback(
    (rawChunk: string) => {
      const cleaned = rawChunk.trim();
      if (!cleaned) return;

      // Guard against Android Chrome emitting duplicate consecutive final chunks
      const now = Date.now();
      if (
        lastFinalChunkRef.current.text.toLowerCase() === cleaned.toLowerCase() &&
        now - lastFinalChunkRef.current.time < 2200
      ) {
        return;
      }
      lastFinalChunkRef.current = { text: cleaned, time: now };

      const field = voiceTargetRef.current;
      const insertMode = voiceInsertModeRef.current;

      const updateFieldUpdater = (prev: string) => {
        setUndoSnapshot({ field, previousValue: prev });
        if (insertMode === 'replace') {
          return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        const trimmedPrev = prev.trimEnd();
        if (!trimmedPrev) {
          return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        const needsPeriod = !/[.!?]$/.test(trimmedPrev);
        const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        return `${trimmedPrev}${needsPeriod ? '.' : ''} ${formatted}`;
      };

      switch (field) {
        case 'quickNote':
          setFormQuickNote(updateFieldUpdater);
          break;
        case 'formReflection':
          setFormReflection(updateFieldUpdater);
          break;
        case 'wentWell':
          setWentWell(updateFieldUpdater);
          break;
        case 'difficulties':
          setDifficulties(updateFieldUpdater);
          break;
        case 'learned':
          setLearned(updateFieldUpdater);
          break;
        case 'tomorrowFocus':
          setTomorrowFocus(updateFieldUpdater);
          break;
      }

      if (autoDetectActivitiesRef.current) {
        const hits = detectActivitiesFromSpeech(cleaned);
        if (hits.length > 0) {
          setSuggestedVoiceActivities(prev => Array.from(new Set([...prev, ...hits])));
        }
      }
    },
    []
  );

  const stopVoiceCapture = useCallback(() => {
    keepListeningRef.current = false;
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      keepListeningRef.current = false;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const launchRecognitionSession = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setVoiceError(
        'Voice-to-Journal requires a browser supporting Web Speech API (Android Chrome, Desktop Chrome, Edge, or Safari).'
      );
      setIsListening(false);
      keepListeningRef.current = false;
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    processedResultIndexRef.current = 0;

    const recognition = new Ctor();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    // Android Chrome works far more reliably with continuous=false; Continuous Auto-Flow re-arms cleanly onEnd.
    recognition.continuous = voiceCaptureModeRef.current === 'continuous_flow';

    recognition.onstart = () => {
      setVoiceError(null);
      setIsListening(true);
      setVoiceStatusNote(
        voiceCaptureModeRef.current === 'android_phrase'
          ? 'Listening for one clear phrase (Android-safe)...'
          : 'Listening continuously (auto-resume enabled)...'
      );
    };

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let interimBuf = '';
      const startIdx = Math.max(event.resultIndex || 0, processedResultIndexRef.current);

      for (let i = startIdx; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          processedResultIndexRef.current = i + 1;
          applyDictatedTranscript(transcript);
        } else {
          interimBuf += transcript;
        }
      }
      setInterimTranscript(interimBuf.trim());
    };

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        keepListeningRef.current = false;
        setIsListening(false);
        setVoiceError(
          'Microphone permission blocked. Allow microphone access in your browser / Android Chrome site settings and tap Start Speaking.'
        );
        return;
      }
      if (event.error === 'audio-capture') {
        keepListeningRef.current = false;
        setIsListening(false);
        setVoiceError('No working microphone was detected on this device.');
        return;
      }
      if (event.error === 'no-speech') {
        setVoiceStatusNote('No speech heard — tap Start Speaking when ready.');
        return;
      }
      setVoiceError(`Voice input paused (${event.error}). You can tap Start Speaking again anytime.`);
    };

    recognition.onend = () => {
      setInterimTranscript('');
      if (keepListeningRef.current && voiceCaptureModeRef.current === 'continuous_flow') {
        restartTimerRef.current = window.setTimeout(() => {
          if (keepListeningRef.current) {
            launchRecognitionSession();
          }
        }, 280);
      } else {
        keepListeningRef.current = false;
        setIsListening(false);
        setVoiceStatusNote('Phrase captured cleanly. Tap Start Speaking to add another phrase.');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setVoiceError('Could not start microphone capture. Please wait a second and tap again.');
      keepListeningRef.current = false;
      setIsListening(false);
    }
  }, [voiceLang, applyDictatedTranscript]);

  const handleToggleVoiceCapture = () => {
    if (isListening) {
      stopVoiceCapture();
      setVoiceStatusNote('Voice capture paused.');
    } else {
      setVoiceError(null);
      keepListeningRef.current = true;
      launchRecognitionSession();
    }
  };

  const handleSelectVoiceTarget = (target: VoiceTargetField) => {
    setVoiceTarget(target);
    const meta = VOICE_TARGET_OPTIONS.find(o => o.id === target);
    if (meta?.detailed) {
      setLogMode('detailed');
    }
  };

  const handleUndoLastVoice = () => {
    if (!undoSnapshot) return;
    setFieldValue(undoSnapshot.field, undoSnapshot.previousValue);
    setUndoSnapshot(null);
    setVoiceStatusNote('Reverted last voice dictation phrase.');
  };

  const handleAddActivity = (act: string) => {
    if (!formActivities.includes(act)) {
      setFormActivities([...formActivities, act]);
    }
    setSuggestedVoiceActivities(prev => prev.filter(a => a !== act));
  };

  const handleRemoveActivity = (act: string) => {
    setFormActivities(formActivities.filter(a => a !== act));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formTags.includes(tagInput.trim().toLowerCase())) {
      setFormTags([...formTags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const resetForm = () => {
    stopVoiceCapture();
    setEditingLogId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMood('steady');
    setFormQuickNote('');
    setFormActivities([]);
    setFormReflection('');
    setFormTags([]);
    setDayOverview('');
    setWentWell('');
    setDifficulties('');
    setLearned('');
    setSupportNeeded('');
    setTomorrowFocus('');
    setCravingFrequency('');
    setCravingIntensity('');
    setSleepHours('');
    setRoutineSteady('unset');
    setShowVitalsSection(false);
    setUndoSnapshot(null);
    setSuggestedVoiceActivities([]);
    setVoiceStatusNote(null);
    setVoiceError(null);
  };

  const startEditLog = (log: DailyLog) => {
    stopVoiceCapture();
    setEditingLogId(log.id);
    setLogMode(log.type);
    setFormDate(log.date);
    setFormMood(log.mood);
    setFormQuickNote(log.quickNote || '');
    setFormActivities(log.completedActivities || []);
    setFormReflection(log.personalReflection || '');
    setFormTags(log.tags || []);
    setCravingFrequency(typeof log.cravingFrequency === 'number' ? String(log.cravingFrequency) : '');
    setCravingIntensity(typeof log.cravingIntensity === 'number' ? String(log.cravingIntensity) : '');
    setSleepHours(typeof log.sleepHours === 'number' ? String(log.sleepHours) : '');
    setRoutineSteady(typeof log.routineSteady === 'boolean' ? (log.routineSteady ? 'yes' : 'no') : 'unset');
    if (
      typeof log.cravingFrequency === 'number' ||
      typeof log.cravingIntensity === 'number' ||
      typeof log.sleepHours === 'number' ||
      typeof log.routineSteady === 'boolean'
    ) {
      setShowVitalsSection(true);
    }
    if (log.detailedQuestions) {
      setDayOverview(log.detailedQuestions.dayOverview || '');
      setWentWell(log.detailedQuestions.wentWell || '');
      setDifficulties(log.detailedQuestions.difficulties || '');
      setLearned(log.detailedQuestions.learned || '');
      setSupportNeeded(log.detailedQuestions.supportNeeded || '');
      setTomorrowFocus(log.detailedQuestions.tomorrowFocus || '');
    }
    setActiveTab('create');
  };

  const handleSaveLog = (isDraft: boolean = false) => {
    stopVoiceCapture();
    const parsedFreq = cravingFrequency !== '' ? Number(cravingFrequency) : undefined;
    const parsedInt = cravingIntensity !== '' ? Number(cravingIntensity) : undefined;
    const parsedSleep = sleepHours !== '' ? Number(sleepHours) : undefined;

    const payload = {
      date: formDate,
      type: logMode,
      mood: formMood,
      quickNote: formQuickNote,
      completedActivities: formActivities,
      personalReflection: formReflection,
      tags: formTags,
      cravingFrequency:
        parsedFreq !== undefined && !Number.isNaN(parsedFreq)
          ? Math.max(0, Math.min(5, Math.round(parsedFreq)))
          : undefined,
      cravingIntensity:
        parsedInt !== undefined && !Number.isNaN(parsedInt)
          ? Math.max(0, Math.min(10, Math.round(parsedInt)))
          : undefined,
      sleepHours:
        parsedSleep !== undefined && !Number.isNaN(parsedSleep)
          ? Math.max(0, Math.min(16, Math.round(parsedSleep * 10) / 10))
          : undefined,
      routineSteady: routineSteady === 'unset' ? undefined : routineSteady === 'yes',
      isDraft,
      detailedQuestions:
        logMode === 'detailed'
          ? {
              dayOverview,
              wentWell,
              difficulties,
              learned,
              supportNeeded,
              tomorrowFocus,
            }
          : undefined,
    };

    if (editingLogId) {
      updateDailyLog(editingLogId, payload);
    } else {
      addDailyLog(payload);
    }

    resetForm();
    setActiveTab('timeline');
  };

  // Filter and search
  const filteredLogs = dailyLogs.filter(log => {
    const matchesMood = filterMood === 'all' || log.mood === filterMood;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      log.quickNote?.toLowerCase().includes(query) ||
      log.personalReflection?.toLowerCase().includes(query) ||
      log.tags?.some(t => t.toLowerCase().includes(query)) ||
      log.completedActivities?.some(a => a.toLowerCase().includes(query));
    return matchesMood && matchesSearch;
  });

  const activeTargetLabel =
    VOICE_TARGET_OPTIONS.find(o => o.id === voiceTarget)?.label || 'Quick Note';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Private Daily Journal · Text &amp; Voice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Daily Log</h1>
          <p className="text-sm text-slate-600 mt-1">
            Speak or type your reflections privately — Voice-to-Journal works across Android phones &amp; laptops.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'timeline' && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('create');
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-indigo-950 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Voice-to-Journal</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'timeline') {
                resetForm();
                setActiveTab('create');
              } else {
                stopVoiceCapture();
                setActiveTab('timeline');
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                : 'bg-indigo-800 hover:bg-indigo-900 text-white'
            }`}
          >
            {activeTab === 'create' ? (
              <span>View Past Logs</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>New Log Entry</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CREATE / EDIT FORM */}
      {activeTab === 'create' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              {editingLogId ? 'Edit Journal Entry' : 'New Journal Entry'}
            </h2>

            {/* Quick vs Detailed Mode Switch */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setLogMode('quick')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  logMode === 'quick' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Quick Log (30 sec)
              </button>
              <button
                type="button"
                onClick={() => setLogMode('detailed')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  logMode === 'detailed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Detailed Reflection
              </button>
            </div>
          </div>

          {/* ==========================================================
              VOICE-TO-JOURNAL STUDIO (MOBILE ANDROID + DESKTOP READY)
          ========================================================== */}
          <section
            aria-label="Voice-to-Journal controls"
            className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition-colors ${
              isListening
                ? 'bg-indigo-50/90 border-indigo-400 shadow-sm'
                : 'bg-slate-50/90 border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                  <Volume2 className={`w-4 h-4 ${isListening ? 'text-rose-600 animate-pulse' : 'text-indigo-700'}`} />
                  <span>Voice-to-Journal (Speech Recognition)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Choose where your voice goes, language, and capture style — works seamlessly on Android Chrome &amp; laptops.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {undoSnapshot && (
                  <button
                    type="button"
                    onClick={handleUndoLastVoice}
                    className="px-3 py-2.5 min-h-[44px] rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo Last Phrase</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleVoiceCapture}
                  disabled={!speechSupported}
                  className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-indigo-950 hover:bg-indigo-900 text-white'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 animate-pulse" />
                      <span>Stop Speaking</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-amber-300" />
                      <span>Start Speaking ({activeTargetLabel})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!speechSupported && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Web Speech Recognition is not enabled in this browser. Open in <strong>Google Chrome on Android/Desktop</strong> or <strong>Microsoft Edge</strong>, or type directly below (or use your Android keyboard mic).
                </span>
              </div>
            )}

            {/* Multiple Selectable Voice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. Speak Into Field
                </label>
                <select
                  value={voiceTarget}
                  onChange={e => handleSelectVoiceTarget(e.target.value as VoiceTargetField)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                >
                  {VOICE_TARGET_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}{opt.detailed ? ' (Detailed)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  2. Spoken Language
                </label>
                <select
                  value={voiceLang}
                  onChange={e => {
                    const nextLang = e.target.value as VoiceLangCode;
                    setVoiceLang(nextLang);
                    if (isListening) stopVoiceCapture();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                >
                  {VOICE_LANGUAGE_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  3. Capture Style
                </label>
                <select
                  value={voiceCaptureMode}
                  onChange={e => {
                    const nextMode = e.target.value as VoiceCaptureMode;
                    setVoiceCaptureMode(nextMode);
                    if (isListening) stopVoiceCapture();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                >
                  <option value="android_phrase">Phrase Mode (Best for Android)</option>
                  <option value="continuous_flow">Continuous Auto-Resume</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  4. Text Placement
                </label>
                <select
                  value={voiceInsertMode}
                  onChange={e => setVoiceInsertMode(e.target.value as VoiceInsertMode)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                >
                  <option value="append">Append to Existing Text</option>
                  <option value="replace">Replace Field Text</option>
                </select>
              </div>
            </div>

            {/* Secondary Option Toggle: Smart Activity Detection */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDetectActivities}
                  onChange={e => setAutoDetectActivities(e.target.checked)}
                />
                <span>Suggest healthy activities mentioned in speech (walk, sleep, breathing, supporter)</span>
              </label>

              {getFieldValue(voiceTarget) && (
                <span className="text-[11px] font-mono text-slate-500">
                  {getFieldValue(voiceTarget).trim().split(/\s+/).filter(Boolean).length} words in {activeTargetLabel}
                </span>
              )}
            </div>

            {/* Live Interim Transcript Preview */}
            {(isListening || interimTranscript || voiceStatusNote) && (
              <div className="p-3 rounded-xl bg-white border border-indigo-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                  <span>{isListening ? 'Live Transcription' : 'Voice Status'}</span>
                  <span className="text-slate-500">{voiceLang}</span>
                </div>
                {interimTranscript ? (
                  <p className="text-indigo-950 italic">&ldquo;{interimTranscript}...&rdquo;</p>
                ) : (
                  <p className="text-slate-600">{voiceStatusNote}</p>
                )}
              </div>
            )}

            {voiceError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{voiceError}</span>
              </div>
            )}

            {suggestedVoiceActivities.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-amber-950 inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Detected in your speech — tap to add:</span>
                </span>
                {suggestedVoiceActivities.map(act => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => handleAddActivity(act)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-indigo-700" />
                    <span>+ {act}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Date & Mood Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Mood</label>
              <div className="flex flex-wrap gap-1.5">
                {moodOptions.map(m => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setFormMood(m.type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                      formMood === m.type
                        ? 'border-indigo-700 bg-indigo-50 text-indigo-950 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Note */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {logMode === 'quick' ? 'How did today feel? (Short note)' : 'Opening Summary'}
              </label>
              <button
                type="button"
                onClick={() => handleSelectVoiceTarget('quickNote')}
                className={`text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                  voiceTarget === 'quickNote' ? 'text-indigo-800 underline' : 'text-slate-500 hover:text-indigo-800'
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>{voiceTarget === 'quickNote' ? 'Voice Active Target' : 'Dictate Here'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={formQuickNote}
              onChange={e => setFormQuickNote(e.target.value)}
              placeholder="Speak above or type: e.g., Felt calm during the morning; experienced mild stress at 4pm but walked it off."
              className={`w-full p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                voiceTarget === 'quickNote' && isListening
                  ? 'border-indigo-500 bg-indigo-50/30'
                  : 'border-slate-200'
              }`}
            />
          </div>

          {/* Completed Activities Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Healthy Activities Completed Today
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {commonActivities.map(act => {
                const isSelected = formActivities.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => (isSelected ? handleRemoveActivity(act) : handleAddActivity(act))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-800 text-white border-indigo-800'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {act}
                  </button>
                );
              })}
            </div>

            {/* Custom activity input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={activityInput}
                onChange={e => setActivityInput(e.target.value)}
                placeholder="Add custom activity..."
                className="p-2 rounded-xl border border-slate-200 text-xs w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (activityInput.trim()) {
                    handleAddActivity(activityInput.trim());
                    setActivityInput('');
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* DETAILED FIELDS IF DETAILED MODE IS ACTIVE */}
          {logMode === 'detailed' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">What went well today?</label>
                  <button
                    type="button"
                    onClick={() => handleSelectVoiceTarget('wentWell')}
                    className={`text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                      voiceTarget === 'wentWell' ? 'text-indigo-800 underline' : 'text-slate-500 hover:text-indigo-800'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{voiceTarget === 'wentWell' ? 'Voice Target' : 'Dictate'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={wentWell}
                  onChange={e => setWentWell(e.target.value)}
                  placeholder="Small victories, good choices, moments of calm..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">What felt difficult or challenging?</label>
                  <button
                    type="button"
                    onClick={() => handleSelectVoiceTarget('difficulties')}
                    className={`text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                      voiceTarget === 'difficulties' ? 'text-indigo-800 underline' : 'text-slate-500 hover:text-indigo-800'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{voiceTarget === 'difficulties' ? 'Voice Target' : 'Dictate'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={difficulties}
                  onChange={e => setDifficulties(e.target.value)}
                  placeholder="Triggers, fatigue, awkward moments..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">What did I learn?</label>
                  <button
                    type="button"
                    onClick={() => handleSelectVoiceTarget('learned')}
                    className={`text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                      voiceTarget === 'learned' ? 'text-indigo-800 underline' : 'text-slate-500 hover:text-indigo-800'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{voiceTarget === 'learned' ? 'Voice Target' : 'Dictate'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={learned}
                  onChange={e => setLearned(e.target.value)}
                  placeholder="Insights into my triggers, coping skills that worked..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">What would I like to focus on tomorrow?</label>
                  <button
                    type="button"
                    onClick={() => handleSelectVoiceTarget('tomorrowFocus')}
                    className={`text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                      voiceTarget === 'tomorrowFocus' ? 'text-indigo-800 underline' : 'text-slate-500 hover:text-indigo-800'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{voiceTarget === 'tomorrowFocus' ? 'Voice Target' : 'Dictate'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={tomorrowFocus}
                  onChange={e => setTomorrowFocus(e.target.value)}
                  placeholder="One small gentle intention for the day ahead..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Personal Reflection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Personal Reflection</label>
              <button
                type="button"
                onClick={() => handleSelectVoiceTarget('formReflection')}
                className={`text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                  voiceTarget === 'formReflection' ? 'text-indigo-800 underline' : 'text-slate-500 hover:text-indigo-800'
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>{voiceTarget === 'formReflection' ? 'Voice Active Target' : 'Dictate Here'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={formReflection}
              onChange={e => setFormReflection(e.target.value)}
              placeholder="Any deeper thoughts or feelings you want to preserve..."
              className={`w-full p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                voiceTarget === 'formReflection' && isListening
                  ? 'border-indigo-500 bg-indigo-50/30'
                  : 'border-slate-200'
              }`}
            />
          </div>

          {/* Tags input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Optional Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {formTags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setFormTags(formTags.filter(t => t !== tag))}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g., sleep, evening, voice-note)..."
                className="p-2 rounded-xl border border-slate-200 text-xs w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Optional Craving, Sleep & Routine Check-In */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Optional Craving, Sleep &amp; Routine Check-In
                </div>
                <p className="text-[11px] text-slate-500">
                  Helps build your calm Progress Analytics &amp; AI reports — leave blank anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVitalsSection(v => !v)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-indigo-900 cursor-pointer shrink-0"
              >
                {showVitalsSection ? 'Hide Optional Check' : '+ Log Craving / Sleep'}
              </button>
            </div>

            {showVitalsSection && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Craving episodes today (0–5)
                  </label>
                  <select
                    value={cravingFrequency}
                    onChange={e => setCravingFrequency(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value="">Not logged</option>
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={String(n)}>
                        {n === 0 ? '0 (None today)' : n === 5 ? '5+ times' : `${n} time${n === 1 ? '' : 's'}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Peak intensity (0–10)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={cravingIntensity}
                    onChange={e => setCravingIntensity(e.target.value)}
                    placeholder="0–10"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sleep hours last night
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={16}
                    step={0.5}
                    value={sleepHours}
                    onChange={e => setSleepHours(e.target.value)}
                    placeholder="e.g., 7.5"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Daily routine steady?
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRoutineSteady(routineSteady === 'yes' ? 'unset' : 'yes')}
                      className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        routineSteady === 'yes'
                          ? 'bg-teal-700 border-teal-700 text-white'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutineSteady(routineSteady === 'no' ? 'unset' : 'no')}
                      className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        routineSteady === 'no'
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      Challenging
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSaveLog(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl cursor-pointer"
            >
              Save as Draft
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('timeline');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveLog(false)}
                className="px-5 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE LIST */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {/* Search & Mood Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reflections or notes..."
                className="w-full min-h-[44px] pl-9 pr-3 py-2 text-base sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterMood('all')}
                className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterMood === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All Moods
              </button>
              {moodOptions.map(m => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setFilterMood(m.type)}
                  className={`min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    filterMood === m.type ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Logs List */}
          {filteredLogs.length > 0 ? (
            <div className="space-y-4">
              {filteredLogs.map(log => {
                const moodObj = moodOptions.find(m => m.type === log.mood);
                return (
                  <div
                    key={log.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-700">{log.date}</span>
                        {log.isDraft && (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            Draft
                          </span>
                        )}
                        {moodObj && (
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${moodObj.color}`}
                          >
                            <span>{moodObj.emoji}</span>
                            <span>{moodObj.label}</span>
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 capitalize">· {log.type} entry</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditLog(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          title="Edit log"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDailyLog(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {log.quickNote && (
                      <p className="text-sm text-slate-800 font-medium leading-relaxed">
                        {log.quickNote}
                      </p>
                    )}

                    {log.completedActivities && log.completedActivities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {log.completedActivities.map((act, i) => (
                          <span
                            key={i}
                            className="text-xs bg-indigo-50/70 text-indigo-900 px-2.5 py-0.5 rounded-md border border-indigo-100 font-medium"
                          >
                            ✓ {act}
                          </span>
                        ))}
                      </div>
                    )}

                    {log.tags && log.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {log.tags.map(t => (
                          <span key={t} className="text-[11px] text-slate-500 font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {(typeof log.cravingFrequency === 'number' ||
                      typeof log.cravingIntensity === 'number' ||
                      typeof log.sleepHours === 'number' ||
                      typeof log.routineSteady === 'boolean') && (
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {typeof log.sleepHours === 'number' && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-900 font-semibold">
                            Sleep: {log.sleepHours}h
                          </span>
                        )}
                        {typeof log.cravingFrequency === 'number' && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-semibold">
                            Cravings: {log.cravingFrequency}/day
                            {typeof log.cravingIntensity === 'number' ? ` · Intensity ${log.cravingIntensity}/10` : ''}
                          </span>
                        )}
                        {typeof log.routineSteady === 'boolean' && (
                          <span
                            className={`px-2 py-0.5 rounded-md border font-semibold ${
                              log.routineSteady
                                ? 'bg-teal-50 border-teal-200 text-teal-900'
                                : 'bg-amber-50 border-amber-200 text-amber-900'
                            }`}
                          >
                            {log.routineSteady ? 'Steady Routine' : 'Routine Felt Difficult'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Detailed Questions if answered */}
                    {log.detailedQuestions && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                        {log.detailedQuestions.wentWell && (
                          <div>
                            <span className="font-semibold text-slate-700">Went well:</span>
                            <p className="text-slate-600 mt-0.5">{log.detailedQuestions.wentWell}</p>
                          </div>
                        )}
                        {log.detailedQuestions.difficulties && (
                          <div>
                            <span className="font-semibold text-slate-700">Difficulties:</span>
                            <p className="text-slate-600 mt-0.5">{log.detailedQuestions.difficulties}</p>
                          </div>
                        )}
                        {log.detailedQuestions.learned && (
                          <div>
                            <span className="font-semibold text-slate-700">Learned:</span>
                            <p className="text-slate-600 mt-0.5">{log.detailedQuestions.learned}</p>
                          </div>
                        )}
                        {log.detailedQuestions.tomorrowFocus && (
                          <div>
                            <span className="font-semibold text-slate-700">Tomorrow Focus:</span>
                            <p className="text-slate-600 mt-0.5">{log.detailedQuestions.tomorrowFocus}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {log.personalReflection && (
                      <div className="pt-2 text-xs text-slate-600 italic border-t border-slate-100">
                        "{log.personalReflection}"
                      </div>
                    )}

                    {log.clinicianReviewNote && (
                      <div className="pt-2.5 border-t border-slate-100 text-xs">
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                          <div className="font-bold text-emerald-900">
                            Clinician Guidance · {log.reviewedByTherapistName || 'Your Therapist'}
                          </div>
                          <p className="text-emerald-950 leading-relaxed">{log.clinicianReviewNote}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No logs found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No entries match your search criteria. Take a minute to record or speak how today went.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('create');
                }}
                className="mt-4 px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-amber-300" />
                <span>Create Voice or Text Log</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
