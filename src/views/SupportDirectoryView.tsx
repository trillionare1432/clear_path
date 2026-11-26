import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { KERALA_DISTRICTS } from '../constants/initialData';
import { SupportCenter, UnifiedDirectoryCategory, UnifiedDirectoryItem, VerifiedSupportServiceRecord } from '../types';
import {
  Stethoscope,
  PhoneCall,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Heart,
  Search,
  ShieldCheck,
  Navigation,
  Map as MapIcon,
  Calendar,
  Check,
  Copy,
  ClipboardCheck,
  AlertCircle,
  XCircle,
  Share2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  NotebookPen,
  Trash2,
  HelpCircle,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { GoogleMapsSupportLocator } from '../components/GoogleMapsSupportLocator';
import { RedHelpDot } from '../components/RedHelpDot';
import {
  CARE_RELAY_STATUS_META,
  CareRelayRecord,
  SupportNeedFocus,
  buildReferralHandoffSummary,
  filterSupportServices,
  getActiveSharedSupporterItems,
} from '../utils/careRelay';
import { copyPhoneToClipboard } from '../utils/clipboard';
import { SCOPED_STORAGE_KEYS, readScopedJson, writeScopedJson } from '../utils/vaultStorage';

interface CareMatchResult {
  claritySummary: string;
  whyThisFits: string;
  whatItProvides: string[];
  recommendedNeedFocus: SupportNeedFocus;
  preferGovt: boolean;
  nextBestStep: string;
  needsEmergencyHelp: boolean;
  source?: string;
}

export const SupportDirectoryView: React.FC = () => {
  const {
    currentRole,
    vaultScope,
    supportCenters,
    toggleSaveCenter,
    language,
    t,
    addCalendarEvent,
    supporterEvents,
    addSupporterCalendarEvent,
    toggleSupporterCalendarEvent,
    deleteSupporterCalendarEvent,
    supporterReflections,
    addSupporterReflection,
    deleteSupporterReflection,
    careRelays,
    createCareRelay,
    updateCareRelayStatus,
    revokeCareRelayConsent,
    sharedSupporterItems,
    shareItemWithSupporter,
    revokeSharedSupporterItem,
    realtimeTick,
  } = useApp();

  const isSupporter = currentRole === 'supporter';
  const savedCount = supportCenters.filter(c => c.isSaved).length;

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [supportNeed, setSupportNeed] = useState<SupportNeedFocus>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'ml'>('all');
  const [costFilter, setCostFilter] = useState<'all' | 'free_govt'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedCenterForMap, setSelectedCenterForMap] = useState<SupportCenter | null>(null);
  const [displayMode, setDisplayMode] = useState<'map' | 'split'>('split');
  const [copied14405, setCopied14405] = useState(false);
  const [verifiedServices, setVerifiedServices] = useState<VerifiedSupportServiceRecord[]>([]);
  const [unifiedItems, setUnifiedItems] = useState<UnifiedDirectoryItem[]>([]);
  const [unifiedCounts, setUnifiedCounts] = useState<Record<UnifiedDirectoryCategory, number> | null>(null);
  const [selectedUnifiedCategory, setSelectedUnifiedCategory] = useState<'all' | UnifiedDirectoryCategory>('all');
  const [copiedServiceId, setCopiedServiceId] = useState<string | null>(null);

  // Calendar save badge per facility card
  const [calendarSavedId, setCalendarSavedId] = useState<string | null>(null);

  // Care Relay Draft Drawer state
  const [relayDraftCenter, setRelayDraftCenter] = useState<SupportCenter | null>(null);
  const [relayNeed, setRelayNeed] = useState<SupportNeedFocus>('counselling');
  const [relayLang, setRelayLang] = useState<'en' | 'ml'>(language);
  const [relayCallbackWindow, setRelayCallbackWindow] = useState('Weekdays 10:00 AM - 1:00 PM');
  const [relayIncludeDistrict, setRelayIncludeDistrict] = useState(true);
  const [relayConsentChecked, setRelayConsentChecked] = useState(false);
  const [copiedRelayId, setCopiedRelayId] = useState<string | null>(null);

  // Appointment scheduling helper for a specific relay
  const [apptDates, setApptDates] = useState<Record<string, string>>({});
  const [apptTimes, setApptTimes] = useState<Record<string, string>>({});

  // Role-Aware AI Guided Center Finder (4-Step Quiz)
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizRelation, setQuizRelation] = useState('partner_spouse');
  const [quizSituation, setQuizSituation] = useState(
    isSupporter ? 'first_signs_refusal' : 'stress_sleep_loop'
  );
  const [quizUrgency, setQuizUrgency] = useState<'urgent' | 'soon' | 'exploring'>('soon');
  const [quizCareSetting, setQuizCareSetting] = useState('free_govt');
  const [quizDistrict, setQuizDistrict] = useState('All Districts');
  const [quizLang, setQuizLang] = useState<'en' | 'ml'>(language);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<CareMatchResult | null>(null);

  // Supporter Notes & Appointment Saver inline state
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState('10:30');
  const [apptNote, setApptNote] = useState('');
  const [apptSavedToast, setApptSavedToast] = useState(false);

  // Part 5E / Part 2.7: Scoped Questions to Prepare for Professionals
  const questionsStorageKey = isSupporter
    ? SCOPED_STORAGE_KEYS.SUPPORTER_PROFESSIONAL_QS
    : SCOPED_STORAGE_KEYS.CLINICAL_CARE_NOTES;

  const DEFAULT_PRO_QUESTIONS = [
    {
      id: 'pq-1',
      text: 'Is outpatient counselling appropriate first, or is an inpatient medical assessment needed?',
      selected: true,
    },
    {
      id: 'pq-2',
      text: 'How do confidentiality protections and NDPS Section 64A voluntary treatment safeguards apply?',
      selected: true,
    },
    {
      id: 'pq-3',
      text: 'What withdrawal warning signs mean we should immediately visit urgent medical care?',
      selected: true,
    },
    {
      id: 'pq-4',
      text: 'How can family or trusted adults support attendance without escalating conflict?',
      selected: false,
    },
    {
      id: 'pq-5',
      text: 'What follow-up visit cadence and evidence-based therapy options are available here?',
      selected: false,
    },
  ];

  const [proQuestions, setProQuestions] = useState<
    Array<{ id: string; text: string; selected: boolean }>
  >(() => readScopedJson(vaultScope, questionsStorageKey, DEFAULT_PRO_QUESTIONS));
  const [newProQuestion, setNewProQuestion] = useState('');
  const [copiedQuestionsToast, setCopiedQuestionsToast] = useState(false);

  useEffect(() => {
    setProQuestions(readScopedJson(vaultScope, questionsStorageKey, DEFAULT_PRO_QUESTIONS));
  }, [vaultScope, questionsStorageKey]);

  useEffect(() => {
    let active = true;
    fetch('/api/services/verified')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (active && data && Array.isArray(data.services)) {
          setVerifiedServices(data.services);
        }
      })
      .catch(() => {
        // Offline safe fallback: Kerala map directory below stays loaded
      });

    fetch('/api/directory/unified')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (active && data && Array.isArray(data.items)) {
          setUnifiedItems(data.items);
          if (data.categoryCounts) {
            setUnifiedCounts(data.categoryCounts);
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [realtimeTick]);

  const updateProQuestions = (
    next: Array<{ id: string; text: string; selected: boolean }>
  ) => {
    setProQuestions(next);
    writeScopedJson(vaultScope, questionsStorageKey, next);
  };

  const handleToggleProQuestion = (id: string) => {
    updateProQuestions(
      proQuestions.map(q => (q.id === id ? { ...q, selected: !q.selected } : q))
    );
  };

  const handleAddProQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newProQuestion.trim();
    if (!cleaned) return;
    updateProQuestions([
      { id: 'pq-custom-' + Date.now(), text: cleaned, selected: true },
      ...proQuestions,
    ]);
    setNewProQuestion('');
  };

  const handleDeleteProQuestion = (id: string) => {
    updateProQuestions(proQuestions.filter(q => q.id !== id));
  };

  const handleCopyProQuestions = async () => {
    const selectedTexts = proQuestions.filter(q => q.selected).map((q, i) => `${i + 1}. ${q.text}`);
    const payload =
      selectedTexts.length > 0
        ? `Questions for Clinician / De-Addiction Appointment:\n${selectedTexts.join('\n')}`
        : 'No questions selected yet.';
    const ok = await copyPhoneToClipboard(payload);
    if (ok) {
      setCopiedQuestionsToast(true);
      setTimeout(() => setCopiedQuestionsToast(false), 2000);
    }
  };

  const activeSharedIds = new Set(getActiveSharedSupporterItems(sharedSupporterItems).map(i => i.id));

  const categories = [
    { key: 'all', label: language === 'ml' ? 'എല്ലാ സേവനങ്ങളും' : 'All Services' },
    {
      key: 'government_deaddiction',
      label: language === 'ml' ? 'സർക്കാർ ലഹരിവിമുക്ത വാർഡുകൾ' : 'Govt. De-Addiction Centers',
    },
    {
      key: 'hospital',
      label: language === 'ml' ? 'മെഡിക്കൽ കോളേജ് / ജില്ലാ ആശുപത്രി' : 'District Hospitals & Medical Colleges',
    },
    { key: 'counselling', label: language === 'ml' ? 'കൗൺസിലിംഗ് & ട്രയാജ്' : 'Counselling & Triage' },
  ];

  const needOptions: { id: SupportNeedFocus; label: string }[] = [
    { id: 'all', label: 'All Support Needs' },
    { id: 'urgent_helpline', label: '24/7 Helpline & Triage' },
    { id: 'medical_detox', label: 'Medical Evaluation / Detox' },
    { id: 'counselling', label: 'Counselling & CBT' },
    { id: 'family_guidance', label: 'Family Guidance' },
    { id: 'rehab_aftercare', label: 'Aftercare & Continuity' },
  ];

  const filteredUnifiedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unifiedItems.filter(item => {
      if (selectedUnifiedCategory !== 'all' && item.category !== selectedUnifiedCategory) return false;
      if (
        selectedDistrict !== 'All Districts' &&
        item.district !== 'All Kerala' &&
        item.district.toLowerCase() !== selectedDistrict.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.services || []).join(' ').toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q)
      );
    });
  }, [unifiedItems, selectedUnifiedCategory, selectedDistrict, searchQuery]);

  const filteredCenters = useMemo(
    () =>
      filterSupportServices(supportCenters, {
        district: selectedDistrict,
        category: selectedCategory,
        supportNeed,
        language: languageFilter,
        costFilter,
        savedOnly: showSavedOnly,
        query: searchQuery,
      }),
    [
      supportCenters,
      selectedDistrict,
      selectedCategory,
      supportNeed,
      languageFilter,
      costFilter,
      showSavedOnly,
      searchQuery,
    ]
  );

  // Recommended centers after finishing the AI Guided Quiz
  const quizRecommendedCenters = useMemo(() => {
    if (!quizResult) return [];
    const districtMatched = filterSupportServices(supportCenters, {
      district: quizDistrict,
      supportNeed: quizResult.recommendedNeedFocus,
      costFilter: quizResult.preferGovt ? 'free_govt' : 'all',
    });

    if (districtMatched.length > 0) {
      return districtMatched.slice(0, 3);
    }

    // Fallback to all verified centers in the chosen district so all 14 Kerala districts always surface local care
    const anyInDistrict = supportCenters.filter(
      c => quizDistrict === 'All Districts' || c.district === quizDistrict
    );
    if (anyInDistrict.length > 0) {
      const helpline = supportCenters.find(c => c.id === 'vimukthi-central');
      return helpline && !anyInDistrict.some(c => c.id === helpline.id)
        ? [anyInDistrict[0], helpline]
        : anyInDistrict.slice(0, 3);
    }

    return supportCenters.slice(0, 3);
  }, [quizResult, quizDistrict, supportCenters]);

  const previewSummary = useMemo(() => {
    if (!relayDraftCenter) return null;
    return buildReferralHandoffSummary({
      centerName: relayDraftCenter.name,
      district: relayDraftCenter.district,
      supportNeed: relayNeed,
      preferredLanguage: relayLang,
      preferredCallbackWindow: relayCallbackWindow,
      consentGranted: true,
      includeDistrictInSummary: relayIncludeDistrict,
    });
  }, [relayDraftCenter, relayNeed, relayLang, relayCallbackWindow, relayIncludeDistrict]);

  const handleSaveCenterVisitToCalendar = (
    center: SupportCenter,
    customDate?: string,
    customTime?: string
  ) => {
    const todayISO = new Date().toISOString().split('T')[0];
    const eventPayload = {
      title: `Visit / Call: ${center.name}`,
      date: customDate || todayISO,
      startTime: customTime || '10:00',
      category: 'appointment' as const,
      notes: `${center.district} · Phone: ${center.phone} · Hours: ${center.openingHours}`,
      reminder: true,
      completed: false,
    };

    if (isSupporter) {
      addSupporterCalendarEvent(eventPayload);
    } else {
      addCalendarEvent(eventPayload);
    }

    setCalendarSavedId(center.id);
    setTimeout(() => setCalendarSavedId(null), 2400);
  };

  const handleOpenRelayModal = (center: SupportCenter) => {
    setRelayDraftCenter(center);
    setRelayNeed(
      supportNeed !== 'all' ? supportNeed : center.phone === '14405' ? 'urgent_helpline' : 'counselling'
    );
    setRelayLang(language);
    setRelayConsentChecked(false);
  };

  const handleConfirmRelayCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relayDraftCenter || !relayConsentChecked) return;
    createCareRelay({
      center: relayDraftCenter,
      supportNeed: relayNeed,
      preferredLanguage: relayLang,
      preferredCallbackWindow: relayCallbackWindow,
      consentGranted: true,
      includeDistrictInSummary: relayIncludeDistrict,
    });
    setRelayDraftCenter(null);
    setRelayConsentChecked(false);
  };

  const handleCopyCallSheet = async (relay: CareRelayRecord) => {
    const ok = await copyPhoneToClipboard(
      `${relay.centerName} (${relay.centerPhone})\n\n${relay.sharedSummaryText}`
    );
    if (ok) {
      setCopiedRelayId(relay.id);
      setTimeout(() => setCopiedRelayId(null), 2000);
    }
  };

  const handleRunCareMatch = async () => {
    setQuizLoading(true);
    try {
      const res = await fetch('/api/ai/care-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: isSupporter ? 'supporter' : 'personal',
          district: quizDistrict,
          situation: isSupporter ? `${quizRelation}:${quizSituation}` : quizSituation,
          urgency: quizUrgency,
          careSetting: quizCareSetting,
          preferredLanguage: quizLang,
          language,
        }),
      });
      const data: CareMatchResult = await res.json();
      setQuizResult(data);
      // Sync directory map filter smoothly to their selected district
      setSelectedDistrict(quizDistrict);
      setSupportNeed('all');
      const firstLocal = supportCenters.find(
        c => quizDistrict === 'All Districts' || c.district === quizDistrict
      );
      if (firstLocal) {
        setSelectedCenterForMap(firstLocal);
      }
    } catch {
      setQuizResult({
        claritySummary:
          'We matched your district with verified government and Vimukthi care options in Kerala.',
        whyThisFits: 'Selected to provide calm, confidential guidance with minimal overwhelm.',
        whatItProvides: [
          'Free 24/7 confidential telephonic triage (14405)',
          'District Hospital / Medical College OPD assessment',
          'Individual and family counselling support',
        ],
        recommendedNeedFocus: 'counselling',
        preferGovt: true,
        nextBestStep: 'Review the recommended district facility below or dial 14405 first.',
        needsEmergencyHelp: quizUrgency === 'urgent',
        source: 'fallback',
      });
      setSelectedDistrict(quizDistrict);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSaveSupporterNoteInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    addSupporterReflection({
      date: new Date().toISOString().split('T')[0],
      type: 'quick',
      mood: 'steady',
      quickNote: noteDraft.trim(),
      tags: ['care_map_note'],
    });
    setNoteDraft('');
    setNoteSavedToast(true);
    setTimeout(() => setNoteSavedToast(false), 2400);
  };

  const handleSaveSupporterAppointmentInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptTitle.trim() || !apptDate) return;
    addSupporterCalendarEvent({
      title: apptTitle.trim(),
      date: apptDate,
      startTime: apptTime || '10:30',
      category: 'appointment',
      notes: apptNote.trim() || undefined,
      reminder: true,
      completed: false,
    });
    setApptTitle('');
    setApptNote('');
    setApptSavedToast(true);
    setTimeout(() => setApptSavedToast(false), 2400);
  };

  const supporterQuizQuestions = {
    step1Title:
      language === 'ml' ? 'നിങ്ങൾ ആരെയാണ് സഹായിക്കാൻ ശ്രമിക്കുന്നത്?' : 'Who are you trying to support?',
    step1Options: [
      { id: 'child_teen', label: 'Child or Student', desc: 'School, hostel, or college age' },
      { id: 'partner_spouse', label: 'Partner or Spouse', desc: 'Living together in the household' },
      { id: 'sibling_friend', label: 'Friend or Sibling', desc: 'Peer or close relative' },
      { id: 'parent_elder', label: 'Parent or Older Relative', desc: 'Long-term habit concern' },
    ],
    step2Title:
      language === 'ml' ? 'ഇപ്പോഴത്തെ അവസ്ഥ എന്താണ്?' : 'What best describes the situation right now?',
    step2Options: [
      {
        id: 'urgent_withdrawal',
        label: 'Severe withdrawal or safety warning',
        desc: 'Tremors, severe distress, or acute crisis',
      },
      {
        id: 'first_signs_refusal',
        label: 'First signs & refuses to talk',
        desc: 'Defensive reactions when topic is raised',
      },
      {
        id: 'open_to_help',
        label: 'Wants to stop or open to counseling',
        desc: 'Ready to meet a professional or clinic',
      },
      {
        id: 'family_orientation',
        label: 'We as a family need guidance first',
        desc: 'Want doctor/counselor advice before acting',
      },
    ],
    step3Title:
      language === 'ml' ? 'ഏത് തരം സഹായമാണ് അനുയോജ്യം?' : 'What kind of center or guidance fits best?',
    step3Options: [
      { id: 'free_govt', label: 'Free Govt. / Vimukthi Clinic', desc: 'District hospital OPD or mission unit' },
      { id: 'inpatient_detox', label: 'Medical Detox & Ward', desc: 'Supervised stabilization & doctor care' },
      { id: 'family_guidance', label: 'Family Counselling First', desc: 'Guidance session for caregivers & relatives' },
      { id: 'helpline', label: '24/7 Confidential Helpline (14405)', desc: 'Talk by phone before visiting in person' },
    ],
  };

  const personalQuizQuestions = {
    step1Title:
      language === 'ml' ? 'ഇപ്പോൾ ഏറ്റവും ബുദ്ധിമുട്ടുള്ള കാര്യം എന്താണ്?' : 'What feels hardest for you right now?',
    step1Options: [
      {
        id: 'withdrawal_physical',
        label: 'Strong physical urges or withdrawal',
        desc: 'Shaking, insomnia, sweating, or intense discomfort',
      },
      {
        id: 'stress_sleep_loop',
        label: 'Stress, sleep & evening cravings',
        desc: 'Want help breaking daily triggers privately',
      },
      {
        id: 'private_counseling',
        label: 'Want confidential 1-on-1 counseling',
        desc: 'Talk safely with a trained clinical psychologist',
      },
      {
        id: 'aftercare_stability',
        label: 'Staying steady after cutting back',
        desc: 'Looking for check-ins and relapse prevention',
      },
    ],
    step2Title:
      language === 'ml' ? 'എത്ര വേഗത്തിൽ സഹായം വേണം?' : 'How soon would you like support?',
    step2Options: [
      { id: 'urgent', label: 'Right now / today', desc: 'Need immediate confidential direction' },
      { id: 'soon', label: 'Within a few days', desc: 'Planning a calm OPD or counseling visit' },
      { id: 'exploring', label: 'Just exploring privately', desc: 'Saving verified options for when I am ready' },
    ],
    step3Title:
      language === 'ml' ? 'ഏത് തരം കേന്ദ്രമാണ് തിരയുന്നത്?' : 'Which kind of center feels most comfortable?',
    step3Options: [
      { id: 'free_govt', label: 'Free Govt. / Vimukthi Unit', desc: 'Confidential district hospital OPD' },
      { id: 'counselling', label: 'Outpatient Counselling & CBT', desc: 'Talk therapy without hospital admission' },
      { id: 'inpatient_detox', label: 'Medical College / Detox Ward', desc: 'Supervised short medical care' },
      { id: 'helpline', label: 'Confidential Call First (14405)', desc: 'Speak anonymously before visiting anywhere' },
    ],
  };

  const accentBadge = isSupporter ? 'text-orange-800' : 'text-indigo-800';
  const accentBorder = isSupporter ? 'border-orange-200' : 'border-indigo-200';
  const primaryBtnClass = isSupporter
    ? 'bg-[#9A3412] hover:bg-[#7C2D12] text-white'
    : 'bg-indigo-950 hover:bg-indigo-900 text-white';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${accentBadge}`}>
            <Stethoscope className="w-4 h-4 text-amber-600" />
            <span>
              {isSupporter
                ? language === 'ml'
                  ? 'സപ്പോർട്ടർ കെയർ മാപ്പ് & ചികിത്സാ കേന്ദ്രങ്ങൾ'
                  : 'Supporter Care Match & Verified Directory'
                : language === 'ml'
                ? 'അംഗീകൃത ആരോഗ്യ കേന്ദ്രങ്ങൾ'
                : 'Care Relay & Verified Directory'}
            </span>
            <RedHelpDot role={currentRole || 'personal'} tabKey="support" compact />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('mapsTitle')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isSupporter
              ? 'Find verified de-addiction units across all 14 Kerala districts, run the supporter center quiz, and save private notes & appointment dates.'
              : t('mapsSub')}
          </p>
        </div>

        {/* View & Saved Resources Toggle */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            aria-pressed={showSavedOnly}
            onClick={() => setShowSavedOnly(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              showSavedOnly
                ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${showSavedOnly ? 'text-rose-600 fill-rose-600' : 'text-rose-600'}`}
            />
            <span>
              {language === 'ml' ? 'പ്രിയപ്പെട്ടവ' : 'Saved Resources'} ({savedCount})
            </span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDisplayMode('split')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                displayMode === 'split' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-indigo-700" />
              <span>{language === 'ml' ? 'മാപ്പും വിവരങ്ങളും' : 'Map & List'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('map')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                displayMode === 'map' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-700" />
              <span>{language === 'ml' ? 'മാപ്പ് മാത്രം' : 'Map Only'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Vimukthi 14405 Banner */}
      <div
        className={`rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isSupporter
            ? 'bg-gradient-to-r from-[#7C2D12] via-[#9A3412] to-[#431407]'
            : 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900'
        }`}
      >
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'ml' ? 'കേരള സർക്കാർ വിമുക്തി മിഷൻ' : 'Official Government of Kerala · All 14 Districts'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            Vimukthi 24/7 Helpline: 14405
          </h2>
          <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
            {t('vimukthiDesc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="tel:14405"
            className="px-5 py-3 bg-amber-500 text-indigo-950 hover:bg-amber-400 rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{t('callNow')}</span>
          </a>
          <button
            type="button"
            onClick={async () => {
              const ok = await copyPhoneToClipboard('14405');
              if (ok) {
                setCopied14405(true);
                setTimeout(() => setCopied14405(false), 1800);
              }
            }}
            className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{copied14405 ? 'Copied 14405!' : 'Copy 14405'}</span>
          </button>
          <a
            href="tel:112"
            className="px-4 py-3 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{language === 'ml' ? 'അത്യാഹിതം: 112' : 'Emergency 112'}</span>
          </a>
        </div>
      </div>

      {/* OFFICIAL VERIFIED NATIONAL & KERALA PUBLIC SUPPORT SERVICES DIRECTORY */}
      {verifiedServices.length > 0 && (
        <section className={`bg-white border ${accentBorder} rounded-3xl p-5 sm:p-6 shadow-xs space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className={`text-[11px] font-extrabold uppercase tracking-wider ${accentBadge}`}>
                Verified Public &amp; National Helplines ({verifiedServices.length})
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Official Emergency, Tele-MANAS &amp; De-Addiction Contacts
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Admin-audited · Official sources with verification dates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {verifiedServices.map(svc => (
              <div
                key={svc.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-extrabold text-slate-900 leading-snug">{svc.organization}</div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                        svc.verificationStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {svc.verificationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">{svc.purposeSummary}</div>
                  <div className="text-[11px] text-slate-500">
                    {svc.location} · {svc.hours}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`tel:${svc.verifiedContact.replace(/\s+/g, '')}`}
                      className={`px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 tabular-nums ${primaryBtnClass}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{svc.verifiedContact}</span>
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyPhoneToClipboard(svc.verifiedContact);
                        if (ok) {
                          setCopiedServiceId(svc.id);
                          setTimeout(() => setCopiedServiceId(null), 1800);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      {copiedServiceId === svc.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Verified: {svc.lastVerified}</span>
                    {svc.officialSourceUrl && (
                      <a
                        href={svc.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-indigo-800 hover:underline"
                      >
                        <span>Official Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ROLE-AWARE AI GUIDED CENTER FINDER (ALL-KERALA 4-STEP QUIZ) */}
      <section className={`bg-white border ${accentBorder} rounded-3xl p-5 sm:p-6 shadow-xs space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSupporter ? 'bg-orange-100 text-orange-800' : 'bg-indigo-50 text-indigo-800'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[11px] font-extrabold uppercase tracking-wider ${accentBadge}`}>
                {isSupporter
                  ? 'Role 02 · Supporter AI Center Guide (All Kerala)'
                  : 'Role 01 · AI Guided Center Finder (All Kerala)'}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {isSupporter
                  ? 'Not sure which Kerala center fits your loved one?'
                  : 'Not sure which center matches what you need?'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Answer 4 quick, private questions — ClearPath AI clarifies what fits and explains exactly what the center provides.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setQuizOpen(v => !v);
              if (!quizOpen) {
                setQuizStep(1);
                setQuizResult(null);
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer ${primaryBtnClass}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{quizOpen ? 'Hide Guided Finder' : 'Start AI Center Quiz'}</span>
          </button>
        </div>

        {quizOpen && !quizResult && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            {/* Step Progress */}
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold ${accentBadge}`}>Step {quizStep} of 4</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map(n => (
                  <span
                    key={n}
                    className={`h-1.5 rounded-full transition-all ${
                      n === quizStep
                        ? `w-7 ${isSupporter ? 'bg-[#9A3412]' : 'bg-indigo-950'}`
                        : n < quizStep
                        ? `w-4 ${isSupporter ? 'bg-amber-500' : 'bg-indigo-400'}`
                        : 'w-4 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1 */}
            {quizStep === 1 && (
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {isSupporter ? supporterQuizQuestions.step1Title : personalQuizQuestions.step1Title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(isSupporter
                    ? supporterQuizQuestions.step1Options
                    : personalQuizQuestions.step1Options
                  ).map(opt => {
                    const selected = isSupporter ? quizRelation === opt.id : quizSituation === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (isSupporter) {
                            setQuizRelation(opt.id);
                          } else {
                            setQuizSituation(opt.id);
                          }
                          setQuizStep(2);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selected
                            ? isSupporter
                              ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-400'
                              : 'bg-indigo-50 border-indigo-700 ring-1 ring-indigo-600'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold text-slate-900">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {quizStep === 2 && (
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {isSupporter ? supporterQuizQuestions.step2Title : personalQuizQuestions.step2Title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(isSupporter
                    ? supporterQuizQuestions.step2Options
                    : personalQuizQuestions.step2Options
                  ).map(opt => {
                    const selected = isSupporter ? quizSituation === opt.id : quizUrgency === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (isSupporter) {
                            setQuizSituation(opt.id);
                            if (opt.id === 'urgent_withdrawal') setQuizUrgency('urgent');
                            else setQuizUrgency('soon');
                          } else {
                            setQuizUrgency(opt.id as 'urgent' | 'soon' | 'exploring');
                          }
                          setQuizStep(3);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selected
                            ? isSupporter
                              ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-400'
                              : 'bg-indigo-50 border-indigo-700 ring-1 ring-indigo-600'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold text-slate-900">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {quizStep === 3 && (
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {isSupporter ? supporterQuizQuestions.step3Title : personalQuizQuestions.step3Title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(isSupporter
                    ? supporterQuizQuestions.step3Options
                    : personalQuizQuestions.step3Options
                  ).map(opt => {
                    const selected = quizCareSetting === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setQuizCareSetting(opt.id);
                          setQuizStep(4);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selected
                            ? isSupporter
                              ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-400'
                              : 'bg-indigo-50 border-indigo-700 ring-1 ring-indigo-600'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold text-slate-900">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {quizStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {language === 'ml'
                    ? 'കേരളത്തിലെ ജില്ലയും ഭാഷയും തിരഞ്ഞെടുക്കുക'
                    : 'Choose your Kerala District & Preferred Language'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      District across Kerala (All 14 covered)
                    </label>
                    <select
                      value={quizDistrict}
                      onChange={e => setQuizDistrict(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
                    >
                      {KERALA_DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Language comfort at the center
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuizLang('ml')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                          quizLang === 'ml'
                            ? isSupporter
                              ? 'bg-[#9A3412] text-white border-[#9A3412]'
                              : 'bg-indigo-950 text-white border-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        Malayalam
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizLang('en')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                          quizLang === 'en'
                            ? isSupporter
                              ? 'bg-[#9A3412] text-white border-[#9A3412]'
                              : 'bg-indigo-950 text-white border-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setQuizStep(3)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={quizLoading}
                    onClick={handleRunCareMatch}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 ${primaryBtnClass}`}
                  >
                    {quizLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Finding Best Match...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Get Clear Center Match</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {quizStep > 1 && quizStep < 4 && (
              <div className="flex justify-start pt-1">
                <button
                  type="button"
                  onClick={() => setQuizStep(s => Math.max(1, s - 1))}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous step</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI CLARITY RECOMMENDATION RESULTS */}
        {quizOpen && quizResult && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                isSupporter
                  ? 'bg-orange-50/70 border-orange-200'
                  : 'bg-indigo-50/70 border-indigo-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${accentBadge}`}>
                  Your Recommended Kerala Match · {quizDistrict}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuizResult(null);
                    setQuizStep(1);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-950 underline cursor-pointer"
                >
                  Change Answers
                </button>
              </div>

              <p className="prose-readable-sm text-slate-900 font-semibold">
                {quizResult.claritySummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    You Asked For · Why This Fits
                  </div>
                  <p className="text-slate-800 leading-relaxed">{quizResult.whyThisFits}</p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    What This Center Provides
                  </div>
                  <ul className="space-y-1">
                    {quizResult.whatItProvides.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-900 flex items-start gap-2 pt-1">
                <ArrowRight className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Next step: {quizResult.nextBestStep}</span>
              </div>
            </div>

            {/* Matched Centers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quizRecommendedCenters.map(center => (
                <div
                  key={center.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                      <span>{center.district}</span>
                      <span className={accentBadge}>{center.costInfo || 'Govt. Verified'}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1">{center.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">{center.services.slice(0, 2).join(' · ')}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCenterForMap(center)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      Locate on Map
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveCenterVisitToCalendar(center)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      {calendarSavedId === center.id ? 'Saved!' : 'Save Visit Date'}
                    </button>
                    <a
                      href={`tel:${center.phone.replace(/\s+/g, '')}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${primaryBtnClass}`}
                    >
                      <PhoneCall className="w-3 h-3 text-amber-300" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SUPPORTER DEDICATED NOTES & APPOINTMENT DATE SAVER (Visible in Role 02 Care Map) */}
      {isSupporter && (
        <section className="bg-white border border-orange-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-orange-100">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-800">
                Role 02 Supporter Organizer · Private Device Vault
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Supporter Private Notes &amp; Saved Appointment Dates
              </h2>
              <p className="text-xs text-slate-600">
                Keep questions for doctors, hospital call notes, and confirmed visit dates safely synced to your Supporter Journal &amp; Calendar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Save Supporter Note */}
            <form onSubmit={handleSaveSupporterNoteInline} className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 inline-flex items-center gap-1.5">
                  <NotebookPen className="w-4 h-4 text-orange-700" />
                  <span>Quick Supporter Note</span>
                </span>
                {noteSavedToast && (
                  <span className="text-[11px] font-bold text-orange-900">Saved to Journal!</span>
                )}
              </div>

              <textarea
                rows={2}
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                placeholder="Write a private observation, phone call note, or 2 questions to ask the counselor..."
                className="w-full p-2.5 text-xs rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />

              <button
                type="submit"
                disabled={!noteDraft.trim()}
                className="px-4 py-2 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
              >
                Save Private Note
              </button>

              {supporterReflections.length > 0 && (
                <div className="pt-2 space-y-1.5 max-h-36 overflow-y-auto">
                  {supporterReflections.slice(0, 3).map(r => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono-tabular text-slate-400">{r.date}</span>
                        <p className="text-slate-800 font-medium truncate">
                          {r.quickNote || r.detailedAnswers?.learnedToday || 'Saved entry'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSupporterReflection(r.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer shrink-0"
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* Save Date Appointment */}
            <form onSubmit={handleSaveSupporterAppointmentInline} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-700" />
                  <span>Save Appointment / Clinic Date</span>
                </span>
                {apptSavedToast && (
                  <span className="text-[11px] font-bold text-orange-900">Saved to Calendar!</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={apptTitle}
                  onChange={e => setApptTitle(e.target.value)}
                  placeholder="e.g. Vimukthi OPD consultation"
                  className="sm:col-span-2 p-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="date"
                  value={apptDate}
                  onChange={e => setApptDate(e.target.value)}
                  className="p-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="time"
                  value={apptTime}
                  onChange={e => setApptTime(e.target.value)}
                  className="p-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={apptNote}
                  onChange={e => setApptNote(e.target.value)}
                  placeholder="Optional doctor / room note..."
                  className="sm:col-span-2 p-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={!apptTitle.trim() || !apptDate}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
              >
                Save Date Appointment
              </button>

              {supporterEvents.length > 0 && (
                <div className="pt-2 space-y-1.5 max-h-36 overflow-y-auto">
                  {supporterEvents
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 4)
                    .map(ev => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSupporterCalendarEvent(ev.id)}
                          className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
                        >
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              ev.completed
                                ? 'bg-[#9A3412] border-[#9A3412] text-white'
                                : 'border-slate-300 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </span>
                          <div className="min-w-0">
                            <div className={`font-bold truncate ${ev.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {ev.title}
                            </div>
                            <div className="text-[10px] font-mono-tabular text-slate-500">
                              {ev.date} {ev.startTime ? `· ${ev.startTime}` : ''}
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSupporterCalendarEvent(ev.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer shrink-0"
                          aria-label="Delete appointment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </form>
          </div>
        </section>
      )}

      {/* Part 5E / Part 2.7: Prepare Questions for Professionals + Severe Care Safety Boundary */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${accentBadge}`}>
              {isSupporter
                ? 'Part 5E · Prepare Questions for Professionals'
                : 'Appointment Prep · Questions for Your Clinician'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Prepare Questions Before Calling or Visiting a Center</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Select or add questions to bring to an intake desk, counsellor, or Vimukthi OPD consultation.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyProQuestions}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            {copiedQuestionsToast ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-300" />
                <span>Copied Questions</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-300" />
                <span>Copy Selected ({proQuestions.filter(q => q.selected).length})</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important Medical Care Boundary:</strong> Severe substance-use disorder and acute physical withdrawal require qualified medical supervision and clinical care. A family member or supporter cannot safely manage severe withdrawal or medical dependence alone — please contact a doctor, Govt. Medical College, District Hospital, or <strong>Vimukthi 14405</strong>.
          </p>
        </div>

        <form onSubmit={handleAddProQuestion} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newProQuestion}
            onChange={e => setNewProQuestion(e.target.value)}
            placeholder="Add your own question for the doctor or counsellor..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          <button
            type="submit"
            disabled={!newProQuestion.trim()}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-45 cursor-pointer ${primaryBtnClass}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {proQuestions.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-start justify-between gap-2 text-xs transition-colors ${
                item.selected ? 'bg-slate-50 border-indigo-200' : 'bg-white border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleProQuestion(item.id)}
                className="flex items-start gap-2.5 text-left cursor-pointer flex-1 min-w-0"
              >
                <span
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                    item.selected
                      ? isSupporter
                        ? 'bg-[#9A3412] border-[#9A3412] text-white'
                        : 'bg-indigo-950 border-indigo-950 text-white'
                      : 'border-slate-300 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3" />
                </span>
                <span className={item.selected ? 'font-semibold text-slate-900 leading-relaxed' : 'text-slate-600 leading-relaxed'}>
                  {item.text}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProQuestion(item.id)}
                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer shrink-0"
                aria-label="Remove question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Needs Helper + Multi-Criteria Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="space-y-1.5">
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${accentBadge}`}>
            Filter Verified Centers Across All 14 Kerala Districts
          </span>
          <div className="flex flex-wrap gap-1.5">
            {needOptions.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSupportNeed(n.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  supportNeed === n.id
                    ? isSupporter
                      ? 'bg-[#9A3412] border-[#9A3412] text-white'
                      : 'bg-indigo-950 border-indigo-950 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ml' ? 'ആശുപത്രി, സ്ഥലം, 14405...' : 'Search centre, district or 14405...'}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
          >
            {KERALA_DISTRICTS.map(dist => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
          >
            {categories.map(c => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              value={languageFilter}
              onChange={e => setLanguageFilter(e.target.value as 'all' | 'en' | 'ml')}
              className="flex-1 p-2 text-xs rounded-xl border border-slate-200 bg-white"
              aria-label="Language support filter"
            >
              <option value="all">All Languages</option>
              <option value="ml">Malayalam</option>
              <option value="en">English</option>
            </select>

            <button
              type="button"
              onClick={() => setCostFilter(prev => (prev === 'all' ? 'free_govt' : 'all'))}
              className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border whitespace-nowrap cursor-pointer ${
                costFilter === 'free_govt'
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-950'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Free / Govt
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            {filteredCenters.length}{' '}
            {language === 'ml' ? 'കേന്ദ്രങ്ങൾ ലഭ്യമാണ്' : 'verified facilities match your filter'}
          </span>
          <button
            type="button"
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showSavedOnly ? 'text-rose-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{language === 'ml' ? 'സൂക്ഷിച്ചവ മാത്രം' : `Saved Resources (${savedCount})`}</span>
          </button>
        </div>
      </div>

      {/* Consent-Scoped Care Relay Active Handoff Tracker */}
      {careRelays.length > 0 && (
        <section className="bg-white border border-indigo-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                Care Relay · Local Referral &amp; Follow-Up Tracker
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-indigo-950">
                Your Consent-Scoped Support Inquiries ({careRelays.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 max-w-sm">
              Note: ClearPath AI has no live hospital booking API. Calling or visiting the verified number completes external intake.
            </span>
          </div>

          <div className="space-y-3">
            {careRelays.map(relay => {
              const statusMeta = CARE_RELAY_STATUS_META[relay.status];
              const isShared = activeSharedIds.has(`share-relay-${relay.id}`);
              const draftDate =
                apptDates[relay.id] || relay.appointmentDate || new Date().toISOString().split('T')[0];
              const draftTime = apptTimes[relay.id] || relay.appointmentTime || '10:30';

              return (
                <div
                  key={relay.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    relay.revokedAt ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-indigo-50/40 border-indigo-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-indigo-950">{relay.centerName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-200">
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{statusMeta.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {!relay.revokedAt && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyCallSheet(relay)}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedRelayId === relay.id ? (
                              <>
                                <Check className="w-3 h-3 text-indigo-700" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Call Sheet</span>
                              </>
                            )}
                          </button>

                          <a
                            href={`tel:${relay.centerPhone.replace(/\s+/g, '')}`}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-950 text-white text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <PhoneCall className="w-3 h-3 text-amber-300" />
                            <span>Call {relay.centerPhone}</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {!relay.revokedAt && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 whitespace-pre-line font-mono">
                      {relay.sharedSummaryText}
                    </div>
                  )}

                  {!relay.revokedAt && relay.status !== 'closed' && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-indigo-100">
                      {/* Honest Manual Status Progression */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                          Update Honest Stage:
                        </span>
                        {(
                          [
                            { st: 'awaiting_provider_response', label: 'Awaiting Reply' },
                            { st: 'provider_contacted', label: 'Contacted' },
                            { st: 'appointment_confirmed', label: 'Confirmed' },
                            { st: 'follow_up_requested', label: 'Follow-up' },
                            { st: 'closed', label: 'Closed' },
                          ] as const
                        ).map(btn => (
                          <button
                            key={btn.st}
                            type="button"
                            onClick={() =>
                              updateCareRelayStatus(relay.id, btn.st, {
                                appointmentDate: btn.st === 'appointment_confirmed' ? draftDate : undefined,
                                appointmentTime: btn.st === 'appointment_confirmed' ? draftTime : undefined,
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                              relay.status === btn.st
                                ? 'bg-indigo-950 text-white border-indigo-950'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Appointment Date -> Calendar + Optional Supporter Share + Revoke */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="date"
                          value={draftDate}
                          onChange={e => setApptDates(prev => ({ ...prev, [relay.id]: e.target.value }))}
                          className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                        />
                        <input
                          type="time"
                          value={draftTime}
                          onChange={e => setApptTimes(prev => ({ ...prev, [relay.id]: e.target.value }))}
                          className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const matched = supportCenters.find(c => c.id === relay.centerId);
                            if (matched) handleSaveCenterVisitToCalendar(matched, draftDate, draftTime);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Save Appt to Calendar</span>
                        </button>

                        {!isSupporter &&
                          (isShared ? (
                            <button
                              type="button"
                              onClick={() => revokeSharedSupporterItem(`share-relay-${relay.id}`)}
                              className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-[11px] font-bold cursor-pointer"
                            >
                              Revoke Share
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                shareItemWithSupporter({
                                  id: `share-relay-${relay.id}`,
                                  kind: 'upcoming_appointment',
                                  title: `Clinic Visit: ${relay.centerName}`,
                                  detail: `Scheduled date ${draftDate} at ${draftTime} (${relay.district}). Private triage notes excluded.`,
                                  targetDate: draftDate,
                                  consentGranted: true,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-900 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Share Date</span>
                            </button>
                          ))}

                        <button
                          type="button"
                          onClick={() => revokeCareRelayConsent(relay.id)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Revoke Consent</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5-Category Verified Kerala Map Filter & Unified Highlights */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className={`text-xs font-extrabold uppercase tracking-wider ${accentBadge}`}>
              5 Verified Support &amp; Healthy Activity Categories
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Explore Rehab Centres, Hospitals, Therapists, Programmes &amp; Skill Hubs
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Pick a category to filter pins on the Kerala map and see trusted public services near your district. Personal home locations are never shown.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'All Categories' },
              {
                id: 'rehabilitation',
                label: `Rehabilitation Centres${unifiedCounts ? ` (${unifiedCounts.rehabilitation})` : ''}`,
              },
              {
                id: 'hospital_emergency',
                label: `Hospitals & 24/7 Care${unifiedCounts ? ` (${unifiedCounts.hospital_emergency})` : ''}`,
              },
              {
                id: 'qualified_professional',
                label: `Verified Professionals${unifiedCounts ? ` (${unifiedCounts.qualified_professional})` : ''}`,
              },
              {
                id: 'community_programme',
                label: `Community Programmes${unifiedCounts ? ` (${unifiedCounts.community_programme})` : ''}`,
              },
              {
                id: 'education_skills',
                label: `Sports, Education & Skills${unifiedCounts ? ` (${unifiedCounts.education_skills})` : ''}`,
              },
            ] as const
          ).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedUnifiedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap cursor-pointer transition-colors ${
                selectedUnifiedCategory === cat.id
                  ? isSupporter
                    ? 'bg-[#9A3412] border-[#9A3412] text-white'
                    : 'bg-indigo-950 border-indigo-950 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Interactive Google Map */}
        <GoogleMapsSupportLocator
          centers={filteredCenters}
          unifiedItems={filteredUnifiedItems}
          activeUnifiedCategory={selectedUnifiedCategory}
          selectedCenter={selectedCenterForMap}
          onSelectCenter={setSelectedCenterForMap}
          heightClassName={displayMode === 'map' ? 'h-[580px]' : 'h-[400px]'}
        />

        {selectedUnifiedCategory !== 'all' && filteredUnifiedItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {filteredUnifiedItems.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-indigo-800">
                    <span>{item.categoryLabel || item.category.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500">{item.district}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{item.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description || (item.services || []).join(' · ')}
                  </p>
                  <div className="text-xs text-slate-500">
                    {item.address} · {item.hours}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {item.phone ? (
                    <a
                      href={`tel:${item.phone.replace(/\s+/g, '')}`}
                      className={`px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 whitespace-nowrap ${primaryBtnClass}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{item.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-500 font-semibold">
                      {item.sourceLabel || item.verifiedStatus || 'Verified'}
                    </span>
                  )}
                  {item.coordinates && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${item.coordinates.lat},${item.coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Navigation className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Directions</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Facility Cards List */}
      {displayMode === 'split' && (
        filteredCenters.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
            <Heart className="w-7 h-7 text-rose-400 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-900">
              {showSavedOnly ? 'No Saved Resources Yet' : 'No Matching Resources Found'}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {showSavedOnly
                ? 'Tap the Save to Favorites heart icon on any support resource card to bookmark it for quick access.'
                : 'Try adjusting your district, category, or search keywords.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSavedOnly(false);
                setSearchQuery('');
                setSelectedDistrict('All Districts');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold cursor-pointer"
            >
              Show All Resources
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCenters.map(center => (
            <div
              key={center.id}
              onClick={() => setSelectedCenterForMap(center)}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
                selectedCenterForMap?.id === center.id
                  ? 'border-indigo-700 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        center.isGovt
                          ? 'bg-indigo-100 text-indigo-950'
                          : 'bg-amber-100 text-amber-950'
                      }`}
                    >
                      {center.isGovt ? 'Government Hospital' : 'Partner Clinic'}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-500">{center.district}</span>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      toggleSaveCenter(center.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Save to Favorites"
                    aria-label="Save to Favorites"
                    aria-pressed={center.isSaved}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        center.isSaved ? 'text-rose-600 fill-rose-600' : ''
                      }`}
                    />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5">{center.name}</h3>
                <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-2.5 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <span>{center.address}</span>
                </p>

                {/* Verified Metadata Box */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1 mb-3">
                  <div>
                    <strong className="text-slate-800">Hours:</strong> {center.openingHours}
                  </div>
                  {center.costInfo && (
                    <div>
                      <strong className="text-slate-800">Cost:</strong> {center.costInfo}
                    </div>
                  )}
                  {center.eligibility && (
                    <div>
                      <strong className="text-slate-800">Eligibility:</strong> {center.eligibility}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/70">
                    <span>
                      Languages: {(center.languagesSupported || ['Malayalam', 'English']).join(', ')}
                    </span>
                    <span>
                      Verified: {center.sourceOfVerification || 'Govt. Directory'} · {center.lastVerified}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {language === 'ml' ? 'പ്രധാന സേവനങ്ങൾ:' : 'Services Offered:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {center.services.map((srv, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${center.coordinates.lat},${center.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{t('directionsOnMaps')}</span>
                  </a>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleSaveCenterVisitToCalendar(center);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {calendarSavedId === center.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Saved to Calendar</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Save Visit</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleOpenRelayModal(center);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Care Relay</span>
                  </button>

                  <a
                    href={`tel:${center.phone.replace(/\s+/g, '')}`}
                    onClick={e => e.stopPropagation()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors ${primaryBtnClass}`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {/* Consent-Scoped Care Relay Drawer / Modal */}
      {relayDraftCenter && previewSummary && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleConfirmRelayCreate}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-8"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Consent-Scoped Care Relay
                </span>
                <h3 className="text-lg font-extrabold text-indigo-950 mt-0.5">
                  {relayDraftCenter.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRelayDraftCenter(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                ClearPath AI prepares a minimal local handoff call sheet so you do not have to explain everything from scratch. Because external hospital EHR/booking webhooks are not connected, you remain in control and call/visit the clinic directly.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Support Need Focus
                </label>
                <select
                  value={relayNeed}
                  onChange={e => setRelayNeed(e.target.value as SupportNeedFocus)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {needOptions
                    .filter(n => n.id !== 'all')
                    .map(n => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Language
                </label>
                <select
                  value={relayLang}
                  onChange={e => setRelayLang(e.target.value as 'en' | 'ml')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="ml">Malayalam / English</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Contact / OPD Window (Optional)
              </label>
              <input
                type="text"
                value={relayCallbackWindow}
                onChange={e => setRelayCallbackWindow(e.target.value)}
                placeholder="e.g., Weekdays 10 AM - 1 PM"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={relayIncludeDistrict}
                onChange={e => setRelayIncludeDistrict(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-700"
              />
              <span>Include District preference ({relayDraftCenter.district}) in summary</span>
            </label>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Minimal Summary Preview (Zero Journals Shared)
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 whitespace-pre-line">
                {previewSummary.summaryText}
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 cursor-pointer">
              <input
                type="checkbox"
                checked={relayConsentChecked}
                onChange={e => setRelayConsentChecked(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-indigo-700"
              />
              <span>
                <strong>Explicit Consent:</strong> Create this minimal call sheet locally for my consultation with{' '}
                {relayDraftCenter.name}. I can revoke or delete it anytime.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRelayDraftCenter(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!relayConsentChecked}
                className={`px-5 py-2.5 rounded-xl disabled:opacity-45 text-xs font-extrabold cursor-pointer ${primaryBtnClass}`}
              >
                Prepare Care Relay Handoff
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
