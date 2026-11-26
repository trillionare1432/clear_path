import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RedHelpDot } from '../components/RedHelpDot';
import { SubstanceIdentificationPanel } from '../components/SubstanceIdentificationPanel';
import { copyPhoneToClipboard } from '../utils/clipboard';
import {
  DeepAssessmentResult,
  FlexibleQuestionResponse,
  PersonalizedSupportPlanRecord,
  UserRole,
} from '../types';
import {
  SCOPED_STORAGE_KEYS,
  readScopedJson,
  writeScopedJson,
} from '../utils/vaultStorage';
import {
  Compass,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
  MapPin,
  RotateCcw,
  Brain,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Clock,
  Users,
  FileText,
  Info,
  Save,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  XCircle,
  HeartHandshake,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  onSelectTab: (tab: string) => void;
}

interface DeepQuestion {
  key:
    | 'frequency'
    | 'cravingIntensity'
    | 'sleepImpact'
    | 'controlDifficulty'
    | 'stressEscape'
    | 'socialTriggers'
    | 'durationMonths'
    | 'readinessScore';
  kind: 'validated_domain' | 'supplementary_context';
  title: string;
  titleMl: string;
  options: { value: number; label: string; labelMl: string }[];
}

const DEEP_QUESTIONS: DeepQuestion[] = [
  {
    key: 'frequency',
    kind: 'validated_domain',
    title: '1. Substance-use or habit frequency in an average week',
    titleMl: '1. ആഴ്ചയിൽ എത്ര തവണ ഈ ശീലമോ ഉപയോഗമോ ഉണ്ടാകാറുണ്ട്?',
    options: [
      { value: 0, label: 'Rarely / Only curious', labelMl: 'വളരെ അപൂർവ്വം' },
      { value: 1, label: '1–2 days a week', labelMl: 'ആഴ്ചയിൽ 1–2 ദിവസം' },
      { value: 2, label: '3–4 days a week', labelMl: 'ആഴ്ചയിൽ 3–4 ദിവസം' },
      { value: 3, label: 'Most evenings', labelMl: 'മിക്ക വൈകുന്നേരങ്ങളിലും' },
      { value: 4, label: 'Every single day', labelMl: 'എല്ലാ ദിവസവും' },
    ],
  },
  {
    key: 'cravingIntensity',
    kind: 'validated_domain',
    title: '2. Strength of urges or difficulty feeling settled without it',
    titleMl: '2. പ്രലോഭനമോ അസ്വസ്ഥതയോ വരുമ്പോൾ അതിന്റെ തീവ്രത എത്രത്തോളമുണ്ട്?',
    options: [
      { value: 0, label: 'Mild passing thought', labelMl: 'ചെറിയ ചിന്ത മാത്രം' },
      { value: 1, label: 'Noticeable distraction', labelMl: 'ശ്രദ്ധ മാറുന്നു' },
      { value: 2, label: 'Hard to settle for 20+ min', labelMl: '20 മിനിറ്റിലധികം അസ്വസ്ഥത' },
      { value: 3, label: 'Strong physical/mental pull', labelMl: 'ശക്തമായ മാനസിക/ശാരീരിക താല്പര്യം' },
      { value: 4, label: 'Feels nearly automatic', labelMl: 'നിയന്ത്രിക്കാൻ വളരെ പ്രയാസമാണ്' },
    ],
  },
  {
    key: 'sleepImpact',
    kind: 'supplementary_context',
    title: '3. Impact on everyday functioning (sleep, study, work, or energy)',
    titleMl: '3. ദൈനംദിന ഉറക്കത്തെയും പഠനത്തെയും ജോലിയെയും ഇത് ബാധിക്കുന്നുണ്ടോ?',
    options: [
      { value: 0, label: 'Functioning steadily', labelMl: 'നല്ല രീതിയിൽ മുന്നോട്ട് പോകുന്നു' },
      { value: 1, label: 'Occasional fatigue or delay', labelMl: 'ചില ദിവസങ്ങളിൽ ക്ഷീണം' },
      { value: 2, label: 'Frequent tiredness or missed tasks', labelMl: 'പല ദിവസവും ക്ഷീണവും തടസ്സവും' },
      { value: 3, label: 'Noticeable study/work strain', labelMl: 'പഠനത്തെയും ജോലിയെയും സാരമായി ബാധിക്കുന്നു' },
      { value: 4, label: 'Severe daily disruption', labelMl: 'ദൈനംദിന ജീവിതം താളം തെറ്റി' },
    ],
  },
  {
    key: 'controlDifficulty',
    kind: 'validated_domain',
    title: '4. Attempts to cut back or pause vs. sticking to personal limits',
    titleMl: '4. കുറയ്ക്കാനോ നിർത്താനോ ശ്രമിച്ചിട്ട് തീരുമാനങ്ങൾ തെറ്റിയിട്ടുണ്ടോ?',
    options: [
      { value: 0, label: 'No, mostly steady', labelMl: 'ഇല്ല, നിയന്ത്രണമുണ്ട്' },
      { value: 1, label: 'Slipped once or twice', labelMl: 'ഒന്നോ രണ്ടോ തവണ' },
      { value: 2, label: 'Pauses hold for a few days', labelMl: 'ചില ദിവസങ്ങൾ മാത്രം സാധിക്കുന്നു' },
      { value: 3, label: 'Often exceeds my own limit', labelMl: 'പലപ്പോഴും സ്വന്തം പരിധി ലംഘിക്കുന്നു' },
      { value: 4, label: 'Hard to pause even 24h', labelMl: 'ഒരു ദിവസം പോലും മാറിനിൽക്കാൻ പ്രയാസം' },
    ],
  },
  {
    key: 'stressEscape',
    kind: 'supplementary_context',
    title: '5. Using to cope with stress, loneliness, or emotional pain',
    titleMl: '5. സമ്മർദ്ദത്തിൽ നിന്നോ വിഷമത്തിൽ നിന്നോ ആശ്വാസത്തിനാണോ ഇത് ഉപയോഗിക്കുന്നത്?',
    options: [
      { value: 0, label: 'Not stress-driven', labelMl: 'സമ്മർദ്ദം കൊണ്ടല്ല' },
      { value: 1, label: 'Mild unwinding', labelMl: 'ചെറിയ ആശ്വാസത്തിന്' },
      { value: 2, label: 'Common evening coping cue', labelMl: 'വൈകുന്നേരത്തെ സമ്മർദ്ദം കുറയ്ക്കാൻ' },
      { value: 3, label: 'Primary coping outlet', labelMl: 'പ്രധാന ആശ്രയം ഇതാണ്' },
      { value: 4, label: 'Used during emotional spikes', labelMl: 'ഏത് വിഷമത്തിലും ഇതാണ് വഴി' },
    ],
  },
  {
    key: 'socialTriggers',
    kind: 'supplementary_context',
    title: '6. Safety, peer environments, or situations where help feels needed',
    titleMl: '6. ചുറ്റുപാടുകളോ സുഹൃത്തുക്കളോ അല്ലെങ്കിൽ സുരക്ഷാ ആശങ്കകളോ ഉണ്ടോ?',
    options: [
      { value: 0, label: 'Safe, supportive surroundings', labelMl: 'സുരക്ഷിതമായ ചുറ്റുപാടാണ്' },
      { value: 1, label: 'Occasional social pressure', labelMl: 'ചിലപ്പോൾ സുഹൃത്തുക്കളുടെ സമ്മർദ്ദം' },
      { value: 2, label: 'Hard to say no in groups', labelMl: 'കൂട്ടത്തിൽ ‘നോ’ പറയാൻ പ്രയാസം' },
      { value: 3, label: 'Frequent risky or isolated situations', labelMl: 'അപകടസാധ്യതയുള്ള സാഹചര്യങ്ങൾ' },
      { value: 4, label: 'Feel unsafe or worried about safety', labelMl: 'സുരക്ഷയെക്കുറിച്ച് കടുത്ത ആശങ്കയുണ്ട്' },
    ],
  },
  {
    key: 'durationMonths',
    kind: 'supplementary_context',
    title: '7. How long this concern has been present + existing professional care',
    titleMl: '7. ഈ ആശങ്ക എത്ര കാലമായിട്ടുണ്ട്? ഇപ്പോൾ പ്രൊഫഷണൽ സഹായം ലഭിക്കുന്നുണ്ടോ?',
    options: [
      { value: 0, label: 'Preventive / just exploring', labelMl: 'പ്രതിരോധത്തിന് മാത്രം' },
      { value: 1, label: 'Under 2 months · No care yet', labelMl: '2 മാസത്തിൽ താഴെ' },
      { value: 2, label: '2–6 months · Considering support', labelMl: '2–6 മാസം' },
      { value: 3, label: '6–18 months · Would like guidance', labelMl: '6–18 മാസം' },
      { value: 4, label: 'Over 18 months · Already seeking/in care', labelMl: '18 മാസത്തിലധികം' },
    ],
  },
  {
    key: 'readinessScore',
    kind: 'supplementary_context',
    title: '8. What kind of conversation or next step feels realistic right now?',
    titleMl: '8. ഇപ്പോൾ ഏത് തരത്തിലുള്ള തുടർന്നുള്ള സഹായമാണ് ഉചിതമായി തോന്നുന്നത്?',
    options: [
      { value: 1, label: 'Just reading privately', labelMl: 'സ്വകാര്യമായി വായിച്ചറിയാൻ' },
      { value: 2, label: 'Gentle self-guided tools', labelMl: 'ചെറിയ സ്വയം-സഹായ മാർഗ്ഗങ്ങൾ' },
      { value: 3, label: 'Talk with a qualified counselor', labelMl: 'കൗൺസിലറുമായി സംസാരിക്കാൻ' },
      { value: 4, label: 'Prepare a report for a professional visit', labelMl: 'ഡോക്ടറെ കാണാൻ റിപ്പോർട്ട് തയ്യാറാക്കാൻ' },
    ],
  },
];

const STAGE1_GOALS: { id: string; label: string; desc: string }[] = [
  { id: 'reduce_or_stop', label: 'Reducing or stopping a substance', desc: 'Step-by-step pacing without shame' },
  { id: 'assess_safety', label: 'Understanding whether my habit or medicine use is becoming unsafe', desc: 'Clarity on risks & prescription context' },
  { id: 'manage_cravings', label: 'Managing cravings, triggers, or stress', desc: 'Calm grounding & urge-surfing strategies' },
  { id: 'rebuild_routines', label: 'Rebuilding study, work, or daily routines', desc: 'Sleep, structure & steady momentum' },
  { id: 'family_comm', label: 'Communicating with family or a supporter', desc: 'Healthy boundaries & open trust' },
  { id: 'verified_centres', label: 'Finding verified support centres or treatment services', desc: 'District hospitals, Vimukthi & helplines' },
  { id: 'connect_therapist', label: 'Connecting safely with an approved therapist', desc: 'Consent-controlled sharing & care prep' },
  { id: 'helping_someone', label: 'Supporting someone else I care about', desc: 'Family/friend support tools in Supporter Mode' },
];

interface DraftState {
  answers: Record<string, { responseMode: FlexibleQuestionResponse['responseMode']; optionValue?: number; optionLabel?: string; otherText?: string }>;
  safetyNote: string;
}

interface PathwaySuggestion {
  id:
    | 'immediate_safety'
    | 'self_guided_coping'
    | 'structured_cbt'
    | 'mi_values'
    | 'rebuild_routines'
    | 'preparation_reports'
    | 'professional_support'
    | 'verified_centres'
    | 'supporter_family_tools';
  title: string;
  targetTab: string;
  targetRole?: UserRole;
  whySuggested: string;
  nextStepLabel: string;
  approachCategory: string;
}

export const EarlySupportNavigatorView: React.FC<Props> = ({ onSelectTab }) => {
  const {
    vaultScope,
    language,
    personalOnboarding,
    earlyAssessments,
    saveEarlyAssessment,
    setRole,
    substanceConcerns,
    upsertSubstanceConcern,
    removeSubstanceConcern,
    personalizedSupportPlan,
    savePersonalizedSupportPlan,
    serverAuthToken,
  } = useApp();

  const [mode, setMode] = useState<'navigation' | 'deep' | 'quick'>('navigation');
  const [navStage, setNavStage] = useState<1 | 2 | 3 | 4>(1);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Stage 1: What would you like help with today?
  const [selectedGoals, setSelectedGoals] = useState<string[]>(() =>
    personalizedSupportPlan?.objectives?.length
      ? personalizedSupportPlan.objectives
      : []
  );
  const [stage1Note, setStage1Note] = useState('');

  // Stage 3: Circumstances (every item has structured + Other + Not sure + Prefer not to answer)
  const [mainConcernDuration, setMainConcernDuration] = useState('not_sure');
  const [dailyDifficulty, setDailyDifficulty] = useState('moderate_strain');
  const [currentCareStatus, setCurrentCareStatus] = useState('no_care_yet');
  const [therapistAccess, setTherapistAccess] = useState('not_sure');
  const [trustedPersonAvailable, setTrustedPersonAvailable] = useState('not_sure');
  const [involveTrustedPerson, setInvolveTrustedPerson] = useState('prefer_private');
  const [helpPreference, setHelpPreference] = useState('combination');
  const [stage3Note, setStage3Note] = useState('');
  const [navSavedBanner, setNavSavedBanner] = useState(false);

  // Structured 8-Q Draft State
  const initialDraft = readScopedJson<DraftState>(
    vaultScope,
    SCOPED_STORAGE_KEYS.SCREENING_DRAFT,
    { answers: {}, safetyNote: '' }
  );

  const [flexAnswers, setFlexAnswers] = useState<DraftState['answers']>(initialDraft.answers || {});
  const [safetyNote, setSafetyNote] = useState<string>(initialDraft.safetyNote || '');
  const [draftSavedBanner, setDraftSavedBanner] = useState(false);

  const [deepLoading, setDeepLoading] = useState(false);
  const [deepResult, setDeepResult] = useState<DeepAssessmentResult | null>(null);
  const [aiContextSummary, setAiContextSummary] = useState<{
    summaryBullets: string[];
    clinicianTopics: string[];
    nonDiagnosticNotice: string;
  } | null>(null);
  const [submittedResponses, setSubmittedResponses] = useState<FlexibleQuestionResponse[]>([]);

  // Quick 60s check state
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [quickOtherText, setQuickOtherText] = useState('');
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'elevated'>('low');
  const [quickResultVisible, setQuickResultVisible] = useState(false);

  useEffect(() => {
    writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.SCREENING_DRAFT, {
      answers: flexAnswers,
      safetyNote,
    });
  }, [vaultScope, flexAnswers, safetyNote]);

  const toggleGoalOption = (id: string) => {
    setSelectedGoals(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // ClearPath Support Navigation Rule Engine (Deterministic & Transparent — 9 combinable pathways)
  const generatedPathways: PathwaySuggestion[] = useMemo(() => {
    const paths: PathwaySuggestion[] = [];
    const goalsSet = new Set(selectedGoals);
    const hasMedConcern = substanceConcerns.some(c => c.isMedication);
    const hasUnverifiedCustom = substanceConcerns.some(c => c.verificationStatus === 'unverified');

    if (dailyDifficulty === 'urgent_distress') {
      paths.push({
        id: 'immediate_safety',
        title: '1. Immediate Safety & Urgent Human Support',
        targetTab: 'support',
        approachCategory: 'Safety First & Crisis Triage',
        whySuggested:
          'You noted high daily strain or acute distress. Speaking calmly with a live professional takes priority over questionnaires.',
        nextStepLabel: 'View Verified 24/7 Helplines & Urgent Care',
      });
    }

    if (
      goalsSet.has('manage_cravings') ||
      helpPreference === 'self_guided' ||
      helpPreference === 'combination'
    ) {
      paths.push({
        id: 'self_guided_coping',
        title: 'Self-Guided Urge & Trigger Regulation',
        targetTab: 'games',
        approachCategory: 'Acute Craving & Grounding Tools',
        whySuggested:
          'You asked for help managing cravings, triggers, or self-guided coping exercises between sessions.',
        nextStepLabel: 'Open Cognitive Lab & Craving Reset',
      });
    }

    if (
      goalsSet.has('reduce_or_stop') ||
      goalsSet.has('assess_safety') ||
      goalsSet.has('manage_cravings') ||
      paths.length === 0
    ) {
      paths.push({
        id: 'structured_cbt',
        title: 'CBT-Inspired Trigger & Thought-Action Exercises',
        targetTab: 'tools',
        approachCategory: 'Cognitive Behavioural Reflections',
        whySuggested:
          'Helps map high-risk hours, stress cues, and realistic alternative habits without shame or pressure.',
        nextStepLabel: 'Open My Support Pathways',
      });
    }

    if (goalsSet.has('reduce_or_stop') || helpPreference === 'combination') {
      paths.push({
        id: 'mi_values',
        title: 'Explore My Motivation (Ambivalence & Values Check)',
        targetTab: 'tools',
        approachCategory: 'Motivational Reflection',
        whySuggested:
          'Supports clarifying what feels worth changing at your own pace—especially when part of you feels undecided.',
        nextStepLabel: 'Open Motivational Tool',
      });
    }

    if (
      goalsSet.has('rebuild_routines') ||
      dailyDifficulty === 'moderate_strain' ||
      dailyDifficulty === 'high_strain'
    ) {
      paths.push({
        id: 'rebuild_routines',
        title: 'Rebuild My Life & Daily Stability Anchors',
        targetTab: 'rebuild',
        approachCategory: 'Routine, Education & Work Continuity',
        whySuggested:
          'Creates low-pressure sleep, study, work, and healthy recreation goals you can pause or adjust anytime.',
        nextStepLabel: 'Open Rebuild My Life Plan',
      });
    }

    if (
      goalsSet.has('connect_therapist') ||
      goalsSet.has('assess_safety') ||
      hasMedConcern ||
      hasUnverifiedCustom ||
      currentCareStatus === 'in_care'
    ) {
      paths.push({
        id: 'preparation_reports',
        title: 'Prepare Structured Support Report ("Get My Report")',
        targetTab: 'report',
        approachCategory: 'Appointment & Care Preparation',
        whySuggested: hasMedConcern
          ? 'Includes your prescription medicine context clearly (without assuming misuse) so a doctor or pharmacist can review safely.'
          : hasUnverifiedCustom
          ? 'Carries your custom substance description accurately for clinician review without inventing details.'
          : 'Organizes your story cleanly so you do not have to repeat everything during a clinical visit.',
        nextStepLabel: 'Prepare & Review Report',
      });
    }

    if (
      goalsSet.has('connect_therapist') ||
      therapistAccess === 'looking' ||
      therapistAccess === 'have_therapist' ||
      helpPreference === 'professional' ||
      helpPreference === 'combination'
    ) {
      paths.push({
        id: 'professional_support',
        title: 'My Professional Support & Permission Controls',
        targetTab: 'professional',
        approachCategory: 'Consent-Controlled Clinical Connection',
        whySuggested:
          'Search administrator-verified therapists, accept invitations by email or invite code, and control all 10 data categories granularly.',
        nextStepLabel: 'Open My Professional Support',
      });
    }

    if (
      goalsSet.has('verified_centres') ||
      hasMedConcern ||
      dailyDifficulty === 'high_strain' ||
      currentCareStatus === 'no_care_yet'
    ) {
      paths.push({
        id: 'verified_centres',
        title: 'Verified Treatment & De-Addiction Services Directory',
        targetTab: 'support',
        approachCategory: 'Verified Treatment & Helplines (Kerala)',
        whySuggested:
          'Provides checked government hospitals, Vimukthi clinics, 14405, 14446, and 14416 Tele-MANAS without guesswork.',
        nextStepLabel: 'Explore Verified Services & Map',
      });
    }

    if (goalsSet.has('family_comm') || involveTrustedPerson === 'yes_with_limits') {
      paths.push({
        id: 'supporter_family_tools',
        title: 'Family Communication & Selective Supporter Boundaries',
        targetTab: 'rebuild',
        approachCategory: 'Boundary-Safe Supporter Connection',
        whySuggested:
          'Opt-in share a single goal milestone without ever exposing private reflections or screening assessments.',
        nextStepLabel: 'Review Family Boundaries',
      });
    }

    if (goalsSet.has('helping_someone')) {
      paths.push({
        id: 'supporter_family_tools',
        title: 'Dedicated Supporter Mode Workspace',
        targetTab: 'dashboard',
        targetRole: 'supporter',
        approachCategory: 'Caregiver & Family Guidance',
        whySuggested:
          'You indicated you are supporting someone else. Supporter Mode gives you talk scripts, center matching, and burnout protection.',
        nextStepLabel: 'Switch to Supporter Mode',
      });
    }

    return paths;
  }, [selectedGoals, substanceConcerns, dailyDifficulty, currentCareStatus, therapistAccess, involveTrustedPerson, helpPreference]);

  const handleSaveNavigationAndPlan = async (advanceToStage4: boolean) => {
    const selectedGoalLabels = STAGE1_GOALS.filter(g => selectedGoals.includes(g.id)).map(g => g.label);
    const defaultObjectives =
      selectedGoalLabels.length > 0
        ? selectedGoalLabels
        : ['Understand my current patterns calmly and choose realistic support'];

    const existingActivities = personalizedSupportPlan?.educationalActivities || [];
    const mergedActivities: PersonalizedSupportPlanRecord['educationalActivities'] = generatedPathways.map(p => {
      const prev = existingActivities.find(a => a.id === p.id);
      return {
        id: p.id,
        category: p.approachCategory,
        title: p.title,
        reason: p.whySuggested,
        source: 'self_guided',
        status: prev?.status || 'active',
        notes: prev?.notes,
      };
    });

    const reviewDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const planPayload: PersonalizedSupportPlanRecord = {
      id: personalizedSupportPlan?.id || `plan-${Date.now()}`,
      updatedAt: new Date().toISOString(),
      reviewDate: personalizedSupportPlan?.reviewDate || reviewDate,
      selectedPaths: generatedPathways.map(p => p.id),
      pathwayReasons: generatedPathways.map(p => ({
        pathId: p.id,
        label: p.title,
        whyShown: p.whySuggested,
      })),
      objectives: defaultObjectives,
      approaches: generatedPathways.map(p => p.approachCategory),
      educationalActivities: mergedActivities,
      userDefinedActivities: personalizedSupportPlan?.userDefinedActivities || [],
      nextSteps: generatedPathways.map(p => p.nextStepLabel),
    };

    savePersonalizedSupportPlan(planPayload);

    if (serverAuthToken) {
      try {
        await fetch('/api/intake', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serverAuthToken}`,
          },
          body: JSON.stringify({
            helpObjectives: defaultObjectives,
            substanceConcernIds: substanceConcerns.map(c => c.id),
            mainConcernDuration,
            dailyDifficulty,
            currentCareStatus,
            therapistAccess,
            trustedPersonAvailable,
            involveTrustedPerson,
            helpPreference,
            personalNote: [stage1Note, stage3Note].filter(Boolean).join(' | '),
            recommendedPathways: generatedPathways.map(p => p.id),
          }),
        });
        await fetch('/api/support-plan', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serverAuthToken}`,
          },
          body: JSON.stringify(planPayload),
        });
      } catch {
        // offline saved locally
      }
    }

    setNavSavedBanner(true);
    setTimeout(() => setNavSavedBanner(false), 2400);
    if (advanceToStage4) {
      setNavStage(4);
    }
  };

  const handleTogglePlanActivityStatus = (
    approachId: string,
    nextStatus: 'active' | 'paused' | 'discontinued'
  ) => {
    if (!personalizedSupportPlan) return;
    const updated: PersonalizedSupportPlanRecord = {
      ...personalizedSupportPlan,
      updatedAt: new Date().toISOString(),
      educationalActivities: (personalizedSupportPlan.educationalActivities || []).map(a =>
        a.id === approachId ? { ...a, status: nextStatus } : a
      ),
    };
    savePersonalizedSupportPlan(updated);
    if (serverAuthToken) {
      fetch('/api/support-plan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  };

  const focusOptions =
    language === 'ml'
      ? [
          { id: 'sleep', label: 'ഉറക്കക്കുറവും ക്ഷീണവും' },
          { id: 'cravings', label: 'വൈകുന്നേരങ്ങളിലെ അസ്വസ്ഥത / പ്രലോഭനം' },
          { id: 'social', label: 'സുഹൃത്തുക്കളിൽ നിന്നുള്ള സമ്മർദ്ദം' },
          { id: 'stress', label: 'പഠന/ജോലി സമ്മർദ്ദം' },
          { id: 'medical', label: 'വിദഗ്ദ്ധ ഡോക്ടറുടെ ഉപദേശം ആവശ്യമാണ്' },
          { id: 'unsure', label: 'എനിക്ക് ഉറപ്പില്ല (I’m not sure)' },
          { id: 'prefer_not', label: 'ഉത്തരം പറയാൻ ആഗ്രഹിക്കുന്നില്ല (Prefer not to answer)' },
        ]
      : [
          { id: 'sleep', label: 'Disrupted sleep & low morning energy' },
          { id: 'cravings', label: 'Evening restlessness or strong urges' },
          { id: 'social', label: 'Peer environments pulling me back' },
          { id: 'stress', label: 'High academic or work pressure' },
          { id: 'medical', label: 'Looking for qualified clinical care' },
          { id: 'unsure', label: "I'm not sure" },
          { id: 'prefer_not', label: 'I prefer not to answer' },
        ];

  const handleCopy14405 = async () => {
    const ok = await copyPhoneToClipboard('14405');
    if (ok) {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const toggleFocus = (id: string) => {
    setSelectedFocus(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const setQuestionOption = (qKey: string, val: number, label: string) => {
    setFlexAnswers(prev => ({
      ...prev,
      [qKey]: { responseMode: 'option', optionValue: val, optionLabel: label, otherText: prev[qKey]?.otherText },
    }));
  };

  const setQuestionMode = (
    qKey: string,
    responseMode: FlexibleQuestionResponse['responseMode'],
    otherText?: string
  ) => {
    setFlexAnswers(prev => ({
      ...prev,
      [qKey]: {
        responseMode,
        otherText: otherText !== undefined ? otherText : prev[qKey]?.otherText || '',
      },
    }));
  };

  const handleSaveResumeNotice = () => {
    writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.SCREENING_DRAFT, {
      answers: flexAnswers,
      safetyNote,
    });
    setDraftSavedBanner(true);
    setTimeout(() => setDraftSavedBanner(false), 2200);
  };

  const handleRunDeepAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeepLoading(true);

    const numericAnswers: Record<DeepQuestion['key'], number> = {
      frequency: 1,
      cravingIntensity: 1,
      sleepImpact: 1,
      controlDifficulty: 1,
      stressEscape: 1,
      socialTriggers: 1,
      durationMonths: 1,
      readinessScore: 2,
    };

    const structuredList: FlexibleQuestionResponse[] = DEEP_QUESTIONS.map(q => {
      const entry = flexAnswers[q.key];
      if (entry?.responseMode === 'option' && typeof entry.optionValue === 'number') {
        numericAnswers[q.key] = entry.optionValue;
      }
      return {
        questionId: q.key,
        questionText: language === 'ml' ? q.titleMl : q.title,
        questionKind: q.kind,
        responseMode: entry?.responseMode || 'prefer_not_to_answer',
        optionLabel: entry?.optionLabel,
        numericValue: entry?.optionValue,
        otherText: entry?.otherText?.trim() || undefined,
      };
    });

    const freeTexts = structuredList
      .map(r => r.otherText)
      .filter((x): x is string => Boolean(x));
    if (safetyNote.trim()) freeTexts.push(safetyNote.trim());

    try {
      const [assessRes, summaryRes] = await Promise.all([
        fetch('/api/ai/deep-assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: numericAnswers, language }),
        }),
        freeTexts.length > 0
          ? fetch('/api/ai/summarize-context', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ texts: freeTexts, language }),
            })
          : Promise.resolve(null),
      ]);

      const data: DeepAssessmentResult = await assessRes.json();
      let summaryData: {
        summaryBullets: string[];
        clinicianTopics: string[];
        nonDiagnosticNotice: string;
      } | null = null;
      if (summaryRes && summaryRes.ok) {
        summaryData = await summaryRes.json();
      }

      setSubmittedResponses(structuredList);
      setAiContextSummary(summaryData);
      setDeepResult(data);

      saveEarlyAssessment({
        mode: 'deep',
        instrumentNotice:
          'Supplementary User-Context & Domain Reflection (Non-Diagnostic; CRAFFT 2.1 exact wording omitted pending Boston Children’s Hospital reproduction permission)',
        focusAreas: structuredList
          .filter(r => r.responseMode === 'option' && r.optionLabel)
          .slice(0, 4)
          .map(r => r.optionLabel!),
        intensityLevel:
          data.relianceScore >= 65
            ? 'elevated'
            : data.relianceScore >= 35
            ? 'moderate'
            : 'low',
        recommendedPathway: 'Educational & Professional Care Navigation (Not a Medical Diagnosis)',
        actionSteps: data.inAppSolutions.map(s => `${s.label}: ${s.reason}`),
        flexibleResponses: structuredList,
        aiContextSummary: summaryData || undefined,
        deepResult: data,
      });
    } finally {
      setDeepLoading(false);
    }
  };

  const handleOpenSolution = (targetRole: string, tabKey: string) => {
    if (
      targetRole === 'personal' ||
      targetRole === 'supporter' ||
      targetRole === 'learner' ||
      targetRole === 'community'
    ) {
      if (targetRole !== 'personal') {
        setRole(targetRole as UserRole);
      }
    }
    onSelectTab(tabKey);
  };

  const handleGenerateQuickPathway = () => {
    const focuses = [...selectedFocus];
    if (quickOtherText.trim()) focuses.push(`Other: ${quickOtherText.trim()}`);

    const pathway =
      intensity === 'elevated' || selectedFocus.includes('medical')
        ? 'Connect with a Qualified Human Counselor / Verified Care Centre'
        : intensity === 'moderate'
        ? 'Structured Self-Support + Cognitive Lab + Optional Clinician Consultation'
        : 'Steady Daily Routines + Preventive Coping Tools';

    const steps =
      intensity === 'elevated' || selectedFocus.includes('medical')
        ? [
            'Call Kerala Vimukthi (14405) or Tele-MANAS (14416) for confidential human guidance.',
            'Browse verified local professionals and medical centres in Support & Maps.',
            'Prepare a clear summary in Get My Report so you do not have to repeat your story.',
          ]
        : [
            'Explore My Support Pathways (CBT-inspired exercises & coping resources).',
            'Use Cognitive Lab grounding resets whenever evening restlessness rises.',
            'Optionally save a weekly check-in to spot helpful patterns.',
          ];

    saveEarlyAssessment({
      mode: 'quick',
      instrumentNotice: 'Voluntary 60-Second Personal Focus Check (Non-Diagnostic)',
      focusAreas: focuses.length > 0 ? focuses : ['Prefer not to specify'],
      intensityLevel: intensity,
      recommendedPathway: pathway,
      actionSteps: steps,
    });
    setQuickResultVisible(true);
  };

  const latestQuick = earlyAssessments.find(a => a.mode !== 'deep') || earlyAssessments[0];
  const isYouth = personalOnboarding?.ageRange === '12_17';

  // Emergency First Screen — hides questionnaires and surfaces urgent lifelines immediately
  if (emergencyActive) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
        <div className="bg-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-200">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
            <span>Immediate Safety Gateway · No Questionnaires</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Your immediate safety comes first.
          </h1>
          <p className="text-sm text-rose-100 leading-relaxed">
            If someone is experiencing trouble breathing, unconsciousness, seizures, chest pain, suspected poisoning/overdose, or an immediate mental health crisis, contact emergency medical help right now:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href="tel:112"
              className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-between transition-colors"
            >
              <div>
                <div className="text-lg font-extrabold font-mono-tabular">112</div>
                <div className="text-xs text-rose-100">National Emergency Medical / Ambulance</div>
              </div>
              <PhoneCall className="w-5 h-5" />
            </a>
            <a
              href="tel:14405"
              className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="text-lg font-extrabold font-mono-tabular">14405</div>
                <div className="text-xs font-semibold text-slate-900">Kerala Vimukthi 24/7 Helpline</div>
              </div>
              <PhoneCall className="w-5 h-5" />
            </a>
            <a
              href="tel:14416"
              className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-between border border-white/15"
            >
              <div>
                <div className="text-lg font-extrabold font-mono-tabular">14416</div>
                <div className="text-xs text-rose-100">Tele-MANAS 24/7 Mental Health Support</div>
              </div>
              <PhoneCall className="w-4 h-4" />
            </a>
            <a
              href="tel:14446"
              className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-between border border-white/15"
            >
              <div>
                <div className="text-lg font-extrabold font-mono-tabular">14446</div>
                <div className="text-xs text-rose-100">National De-Addiction Helpline (NAPDDR)</div>
              </div>
              <PhoneCall className="w-4 h-4" />
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-black/25 border border-white/15 text-xs text-rose-50 space-y-1.5">
            <div className="font-bold text-amber-200">While help is on the way:</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>Stay with a trusted adult, family member, or go to the nearest hospital casualty ward.</li>
              <li>Do not try unverified home remedies or detoxification tricks.</li>
              <li>On Android/mobile phones, tap any number above or view local Government Hospitals on Care Map.</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectTab('support')}
              className="px-4 py-2.5 rounded-xl bg-white text-rose-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Open Nearest Govt. Emergency Hospitals</span>
            </button>
            <button
              type="button"
              onClick={() => setEmergencyActive(false)}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
            >
              I am safe now — Return to Support Navigation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Immediate Safety Check Banner (Always visible before screening/intake) */}
      <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs text-rose-950">
          <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block">Immediate Safety Check:</strong>
            <span>
              Is anyone right now experiencing breathing trouble, fainting, seizures, severe withdrawal, or an acute crisis?
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEmergencyActive(true)}
          className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold shrink-0 cursor-pointer"
        >
          Yes — Show 24/7 Emergency Help
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Header + Mode Switch */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4 text-amber-600" />
              <span>
                {language === 'ml'
                  ? 'സ്വയം വിലയിരുത്തൽ വഴികാട്ടി · രോഗനിർണ്ണയമല്ല'
                  : 'My Situation · Progressive Support Navigation'}
              </span>
              <RedHelpDot role="personal" tabKey="navigator" compact />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight">
              {language === 'ml' ? 'എന്റെ സാഹചര്യം മനസ്സിലാക്കുക' : 'Understand My Situation'}
            </h1>
            <p className="editorial-subtitle text-slate-600 mt-2 max-w-2xl">
              {language === 'ml'
                ? 'നിങ്ങളുടെ അനുഭവം സ്വന്തം വാക്കുകളിൽ ക്രമീകരിക്കാനും അനുയോജ്യമായ പ്രൊഫഷണൽ സഹായവും സ്വയം-സഹായ വഴികളും കണ്ടെത്താനും ഇത് സഹായിക്കും.'
                : 'Clarify what you need across 4 calm stages, select or describe substances/medicines without stigma, and generate your customizable Personal Support Plan.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 self-start gap-1">
            <button
              type="button"
              onClick={() => setMode('navigation')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'navigation'
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>4-Stage Navigation</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('deep')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'deep'
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span>Reflection (8 Qs)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'quick'
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quick (60s)
            </button>
          </div>
        </div>

        {/* Scientific Transparency & CRAFFT 2.1 Compliance Disclosure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1.5 leading-relaxed">
            <div className="font-extrabold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-800 shrink-0" />
              <span>Screening vs. Clinical Assessment vs. Diagnosis</span>
            </div>
            <p>
              ClearPath organizes your priorities and offers evidence-informed support pathways—it is <strong>NOT a medical diagnosis</strong>, AI risk score, or automated treatment order.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5 leading-relaxed">
            <div className="font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                {isYouth
                  ? 'Adolescent Screening Notice (CRAFFT 2.1 Compliance)'
                  : 'Instrument Provenance & Licensing Transparency'}
              </span>
            </div>
            <p>
              For youth aged 12–21, standardized clinical screening uses Boston Children’s Hospital <strong>CRAFFT 2.1</strong>. ClearPath respects reproduction licensing and labels these items strictly as <strong>Supplementary User-Context Reflections</strong>.
            </p>
          </div>
        </div>

        {/* MODE 0 (PRIMARY): 4-STAGE PROGRESSIVE CLEARPATH SUPPORT NAVIGATION */}
        {mode === 'navigation' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Step Progress Indicator */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { n: 1, title: '1. Goals Today' },
                { n: 2, title: '2. Substance & Rx' },
                { n: 3, title: '3. Situation' },
                { n: 4, title: '4. Support Plan' },
              ].map(st => (
                <button
                  key={st.n}
                  type="button"
                  onClick={() => setNavStage(st.n as 1 | 2 | 3 | 4)}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold text-center transition-all cursor-pointer ${
                    navStage === st.n
                      ? 'bg-indigo-950 border-indigo-950 text-white shadow-xs'
                      : navStage > st.n
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {st.title}
                </button>
              ))}
            </div>

            {navSavedBanner && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                <span>Saved privately to your Personal Support Plan. You can adjust pacing anytime.</span>
              </div>
            )}

            {/* STAGE 1: WHAT WOULD YOU LIKE HELP WITH TODAY? */}
            {navStage === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Stage 1: What would you like help with today?
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select any combination that reflects what feels most helpful right now.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STAGE1_GOALS.map(goal => {
                    const active = selectedGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoalOption(goal.id)}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                          active
                            ? 'bg-indigo-50 border-indigo-700 ring-1 ring-indigo-600'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {goal.label}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{goal.desc}</div>
                        </div>
                        {active && <CheckCircle2 className="w-4 h-4 text-indigo-800 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>

                {selectedGoals.includes('helping_someone') && (
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-orange-950">
                    <div>
                      <strong>Helping a loved one?</strong> Supporter Mode has dedicated scripts, family guides, and Kerala clinic matching tailored for you.
                    </div>
                    <button
                      type="button"
                      onClick={() => setRole('supporter')}
                      className="px-3.5 py-2 rounded-xl bg-[#9A3412] text-white font-bold shrink-0 cursor-pointer"
                    >
                      Open Supporter Mode
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Anything else you want to note in your own words? (Optional)
                  </label>
                  <input
                    type="text"
                    value={stage1Note}
                    onChange={e => setStage1Note(e.target.value)}
                    placeholder="Optional short note about your goal..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNavStage(2)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Stage 2: Substance &amp; Rx Identification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: SUBSTANCE & MEDICINE IDENTIFICATION (50 ENTRIES + CUSTOM + RX DISTINCTION) */}
            {navStage === 2 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Stage 2: Substance &amp; Medication Identification (Optional)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Select one, multiple, or skip if not applicable. Medicine options include gentle prescription context questions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNavStage(3)}
                    className="text-xs font-bold text-slate-600 hover:text-indigo-950 underline cursor-pointer"
                  >
                    Skip for now &rarr;
                  </button>
                </div>

                <SubstanceIdentificationPanel
                  compactHeader
                  concerns={substanceConcerns}
                  onUpsertConcern={upsertSubstanceConcern}
                  onRemoveConcern={removeSubstanceConcern}
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setNavStage(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Stage 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavStage(3)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Stage 3: Circumstances</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: UNDERSTANDING SITUATION & CIRCUMSTANCES */}
            {navStage === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Stage 3: Circumstances &amp; Support Context
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    All questions are voluntary. Answering helps tailor realistic support pathways.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">
                      How long has this concern been around?
                    </label>
                    <select
                      value={mainConcernDuration}
                      onChange={e => setMainConcernDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <option value="recent_weeks">A few weeks / recent</option>
                      <option value="few_months">Several months</option>
                      <option value="long_term">Over a year / ongoing</option>
                      <option value="not_sure">Not sure</option>
                      <option value="prefer_not">Prefer not to answer</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Current day-to-day difficulty (sleep, study, work, mood)?
                    </label>
                    <select
                      value={dailyDifficulty}
                      onChange={e => setDailyDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <option value="mild_manageable">Mild — mostly manageable</option>
                      <option value="moderate_strain">Moderate strain on sleep or focus</option>
                      <option value="high_strain">Heavy strain making daily life hard</option>
                      <option value="urgent_distress">Acute distress / feeling unsafe</option>
                      <option value="prefer_not">Prefer not to answer</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Are you currently receiving medical or therapeutic care?
                    </label>
                    <select
                      value={currentCareStatus}
                      onChange={e => setCurrentCareStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <option value="in_care">Yes — currently seeing a doctor or counsellor</option>
                      <option value="no_care_yet">No — not currently in care</option>
                      <option value="looking">Searching for verified care</option>
                      <option value="prefer_not">Prefer not to answer</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Access to an approved therapist or counsellor?
                    </label>
                    <select
                      value={therapistAccess}
                      onChange={e => setTherapistAccess(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <option value="have_therapist">Yes — want to prepare &amp; share reports</option>
                      <option value="looking">Would like to find one cleanly</option>
                      <option value="not_now">Not seeking therapist contact right now</option>
                      <option value="not_sure">I&apos;m not sure</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Trusted adult, family member, or supporter in your life?
                    </label>
                    <select
                      value={trustedPersonAvailable}
                      onChange={e => setTrustedPersonAvailable(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <option value="yes">Yes, someone trustworthy</option>
                      <option value="no">No one I feel safe telling yet</option>
                      <option value="not_sure">Unsure</option>
                      <option value="prefer_not">Prefer not to answer</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Preferred style of help right now?
                    </label>
                    <select
                      value={helpPreference}
                      onChange={e => setHelpPreference(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <option value="combination">A gentle combination (self-tools + optional care)</option>
                      <option value="self_guided">Private self-guided exercises &amp; structure</option>
                      <option value="professional">Professional guidance or clinic referral</option>
                      <option value="not_sure">Show options so I can decide</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Involvement of a trusted person &amp; optional personal note:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={involveTrustedPerson}
                      onChange={e => setInvolveTrustedPerson(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    >
                      <option value="prefer_private">Keep everything strictly private for now</option>
                      <option value="yes_with_limits">Share only selected goals with clear boundaries</option>
                      <option value="unsure">Decide later</option>
                    </select>
                    <input
                      type="text"
                      value={stage3Note}
                      onChange={e => setStage3Note(e.target.value)}
                      placeholder="Optional note about your situation (never diagnosed)..."
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNavStage(2)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Stage 2</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveNavigationAndPlan(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Progress</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveNavigationAndPlan(true)}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate My Support Pathways &amp; Plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: ADAPTIVE SUPPORT PATHWAYS + EDITABLE PERSONALIZED SUPPORT PLAN */}
            {navStage === 4 && (
              <div className="space-y-6">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#0F172A] text-white space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      ClearPath Support Navigation · Adaptive Combinable Plan
                    </span>
                    <button
                      type="button"
                      onClick={() => setNavStage(1)}
                      className="px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
                    >
                      Adjust Inputs
                    </button>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold">
                    Your Personalized Support Pathways ({generatedPathways.length} Matched)
                  </h2>
                  <p className="text-xs text-indigo-100 leading-relaxed max-w-3xl">
                    These pathways explain clearly <strong>why each option is shown</strong> based on what you selected. You can combine self-guided strategies with professional guidance, and pause or modify any self-guided activity anytime without penalty.
                  </p>
                </div>

                {/* Combined Pathways Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedPathways.map(path => (
                    <div
                      key={`${path.id}-${path.title}`}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-950">
                          {path.approachCategory}
                        </span>
                        <h3 className="text-base font-extrabold text-indigo-950">{path.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong className="text-slate-800">Why this is shown:</strong> {path.whySuggested}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenSolution(path.targetRole || 'personal', path.targetTab)}
                        className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center justify-between cursor-pointer"
                      >
                        <span>{path.nextStepLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Active Editable Personalized Support Plan */}
                {personalizedSupportPlan && (
                  <div className="p-5 rounded-3xl border border-indigo-200 bg-indigo-50/40 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-800">
                          Active Personal Support Plan · Review Date: {personalizedSupportPlan.reviewDate}
                        </div>
                        <h3 className="text-base font-extrabold text-indigo-950 mt-0.5">
                          Customize Activity Status &amp; Boundaries
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectTab('report')}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-indigo-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Include in Get My Report</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(personalizedSupportPlan.educationalActivities || []).map(app => (
                        <div
                          key={app.id}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-900">{app.title}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  app.source === 'clinician_assigned'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {app.source === 'clinician_assigned' ? 'Clinician-Assigned' : 'Self-Guided'}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                                  app.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : app.status === 'paused'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {app.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{app.reason}</p>
                          </div>

                          {app.source === 'self_guided' && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleTogglePlanActivityStatus(app.id, 'active')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                  app.status === 'active'
                                    ? 'bg-indigo-950 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                <PlayCircle className="w-3 h-3" />
                                <span>Active</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePlanActivityStatus(app.id, 'paused')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                  app.status === 'paused'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                <PauseCircle className="w-3 h-3" />
                                <span>Pause</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePlanActivityStatus(app.id, 'discontinued')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                  app.status === 'discontinued'
                                    ? 'bg-slate-700 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                }`}
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Discontinue</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 1: FLEXIBLE REFLECTION (8 Qs) */}
        {mode === 'deep' && !deepResult && (
          <form onSubmit={handleRunDeepAssessment} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                Every question includes <strong>Other (own words)</strong>, <strong>I&apos;m not sure</strong>, and <strong>I prefer not to answer</strong>. Your draft auto-saves privately.
              </span>
              <button
                type="button"
                onClick={handleSaveResumeNotice}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{draftSavedBanner ? 'Draft Saved!' : 'Save & Resume Later'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {DEEP_QUESTIONS.map(q => {
                const current = flexAnswers[q.key];
                return (
                  <div key={q.key} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {language === 'ml' ? q.titleMl : q.title}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {q.kind === 'validated_domain'
                          ? 'Support Domain Context'
                          : 'Supplementary Context'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {q.options.map(opt => {
                        const active =
                          current?.responseMode === 'option' && current.optionValue === opt.value;
                        const labelText = language === 'ml' ? opt.labelMl : opt.label;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setQuestionOption(q.key, opt.value, labelText)}
                            className={`p-2.5 rounded-xl border text-left text-[11px] font-semibold transition-all cursor-pointer ${
                              active
                                ? 'bg-indigo-950 border-indigo-950 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                            }`}
                          >
                            {labelText}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setQuestionMode(q.key, 'other')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          current?.responseMode === 'other'
                            ? 'bg-amber-50 border-amber-500 text-amber-950'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        Other (describe in my own words)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionMode(q.key, 'unsure')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          current?.responseMode === 'unsure'
                            ? 'bg-indigo-100 border-indigo-400 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        I&apos;m not sure
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionMode(q.key, 'prefer_not_to_answer')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          current?.responseMode === 'prefer_not_to_answer'
                            ? 'bg-slate-800 border-slate-800 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        I prefer not to answer
                      </button>
                    </div>

                    {(current?.responseMode === 'other' || Boolean(current?.otherText)) && (
                      <textarea
                        rows={2}
                        value={current?.otherText || ''}
                        onChange={e =>
                          setQuestionMode(
                            q.key,
                            current?.responseMode === 'option' ? current.responseMode : 'other',
                            e.target.value
                          )
                        }
                        placeholder="Optional: explain your situation in your own words (never converted into a diagnosis)..."
                        className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                );
              })}

              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Anything else on your mind or safety concerns you want noted for your own review? (Optional)
                </label>
                <textarea
                  rows={2}
                  value={safetyNote}
                  onChange={e => setSafetyNote(e.target.value)}
                  placeholder="Write freely in your own words..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>Saved privately in your local browser vault. Never shared automatically.</span>
              </div>
              <button
                type="submit"
                disabled={deepLoading}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {deepLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Organizing Your Summary...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>{language === 'ml' ? 'ഫലം കാണുക' : 'Review My Responses & Next Options'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* CALM, NON-ALARMING RESULTS SCREEN */}
        {mode === 'deep' && deepResult && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#0F172A] text-white rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Voluntary Situation Summary · Non-Diagnostic
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
                    Your Reflection Overview &amp; Support Options
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDeepResult(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit / Retake</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 prose-readable-sm text-indigo-50 space-y-1.5">
                <div>
                  <strong>What this can establish:</strong> It organizes your stated patterns, triggers, sleep or daily strain, and how ready you feel for support.
                </div>
                <div>
                  <strong>What this cannot establish:</strong> It is NOT a medical diagnosis, severity label, or clinical risk verdict. Only a qualified physician or psychologist can provide clinical assessment.
                </div>
              </div>

              <p className="prose-readable text-indigo-50">{deepResult.neurobiologySummary}</p>

              <div className="p-4 rounded-2xl bg-black/25 border border-white/10 flex items-start gap-3 prose-readable-sm">
                <Clock className="w-4 h-4 text-amber-300 shrink-0 mt-1" />
                <div>
                  <strong className="text-amber-200">Recovery &amp; Adaptation Note: </strong>
                  <span className="text-indigo-100">{deepResult.timelineEstimate}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                Summary of Your Recorded Answers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {submittedResponses.map(r => (
                  <div key={r.questionId} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900">{r.questionText}</div>
                    <div className="text-indigo-800 font-semibold">
                      {r.responseMode === 'other'
                        ? `In your words: ${r.otherText || '[Left blank]'}`
                        : r.responseMode === 'unsure'
                        ? "I'm not sure"
                        : r.responseMode === 'prefer_not_to_answer'
                        ? 'I prefer not to answer (respected)'
                        : r.optionLabel}
                    </div>
                  </div>
                ))}
              </div>

              {aiContextSummary && aiContextSummary.summaryBullets.length > 0 && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
                  <div className="font-bold">{aiContextSummary.nonDiagnosticNotice}</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {aiContextSummary.summaryBullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  {aiContextSummary.clinicianTopics.length > 0 && (
                    <div className="pt-1 font-semibold">
                      Helpful topics to discuss with a clinician:{' '}
                      {aiContextSummary.clinicianTopics.join(' · ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Prepare &ldquo;Get My Report&rdquo; or Share with Explicit Consent</span>
                </h3>
                <p className="text-xs text-slate-700">
                  Compile these selected reflections into a printable PDF or authorize sharing directly with an approved therapist.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('report')}
                className="px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Open GET MY REPORT</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="editorial-kicker text-indigo-950">
                Suggested Next-Step Pathways (Choose What Fits You)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deepResult.inAppSolutions.map((sol, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOpenSolution(sol.targetRole, sol.tabKey)}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/50 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {sol.targetRole} workspace
                        </span>
                        <ArrowRight className="w-4 h-4 text-indigo-700 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="text-base font-extrabold text-indigo-950 pt-1">{sol.label}</div>
                      <p className="prose-readable-sm text-slate-600">{sol.reason}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Optional Community &amp; Peer Path</span>
                </div>
                <p className="prose-readable-sm text-slate-700">{deepResult.communityRecommendation}</p>
                <button
                  type="button"
                  onClick={() => onSelectTab('tools')}
                  className="text-xs font-bold text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                >
                  <span>Open My Support Pathways</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-rose-950">
                    Speak with a Qualified Counselor (24/7 Free)
                  </span>
                  <span className="font-mono-tabular text-xs font-bold text-rose-800">14405</span>
                </div>
                <p className="prose-readable-sm text-rose-950/85">
                  Reach Kerala Vimukthi clinicians or filter district wards on Care Map.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="tel:14405"
                    className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 14405</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopy14405}
                    className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-100 text-rose-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPhone ? 'Copied!' : 'Copy Number'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('support')}
                    className="px-3.5 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    <span>Care Map</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: QUICK CHECK (60s) */}
        {mode === 'quick' &&
          (!quickResultVisible ? (
            <div className="space-y-6">
              <div className="space-y-2.5">
                <h2 className="text-sm font-bold text-slate-900">
                  {language === 'ml'
                    ? '1. നിലവിൽ ശ്രദ്ധ വേണ്ട കാര്യങ്ങൾ (നിർബന്ധമില്ല):'
                    : '1. Which areas feel hardest to manage right now? (Optional)'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {focusOptions.map(opt => {
                    const active = selectedFocus.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleFocus(opt.id)}
                        className={`p-3.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {active && <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={quickOtherText}
                  onChange={e => setQuickOtherText(e.target.value)}
                  placeholder="Other: describe in your own words (optional)..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-2.5">
                <h2 className="text-sm font-bold text-slate-900">
                  2. What pace of support fits best this week?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'low', label: 'Steady / Gentle Routine' },
                      { id: 'moderate', label: 'Structured Self-Support + Check-ins' },
                      { id: 'elevated', label: 'Urgent Clinical / Counselor Guidance' },
                    ] as const
                  ).map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setIntensity(lvl.id)}
                      className={`p-3 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                        intensity === lvl.id
                          ? 'bg-indigo-950 border-indigo-950 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateQuickPathway}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>View Recommended Next Steps</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-800">
                  Recommended Pathway (Non-Diagnostic)
                </span>
                <button
                  type="button"
                  onClick={() => setQuickResultVisible(false)}
                  className="text-xs font-bold text-indigo-950 underline cursor-pointer"
                >
                  Change choices
                </button>
              </div>
              <h3 className="text-lg font-extrabold text-indigo-950">
                {latestQuick?.recommendedPathway}
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                {(latestQuick?.actionSteps || []).map((st, idx) => (
                  <li key={idx}>{st}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectTab('tools')}
                  className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold cursor-pointer"
                >
                  Open My Support Pathways
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('support')}
                  className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-950 text-xs font-bold cursor-pointer"
                >
                  Care Map &amp; 14405
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
