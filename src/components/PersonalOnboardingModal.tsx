import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClinicalTreatmentStatus,
  Language,
  PersonalOnboarding,
  RecoveryJourneyStage,
} from '../types';
import { generatePersonalizedLifePathway } from '../utils/recoveryIntelligence';
import { SCOPED_STORAGE_KEYS, readScopedJson, writeScopedJson, removeScopedKey } from '../utils/vaultStorage';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
  Bell,
  Heart,
  Stethoscope,
  Save,
  Sparkles,
  Calendar,
  Briefcase,
  X,
} from 'lucide-react';

interface Props {
  onComplete: () => void;
  allowClose?: boolean;
}

interface OnboardingDraft {
  step: number;
  journeyStage: RecoveryJourneyStage;
  primaryNeed: string;
  otherReasonText: string;
  ageRange: NonNullable<PersonalOnboarding['ageRange']>;
  clinicalTreatmentStatus: ClinicalTreatmentStatus;
  currentlyInProfessionalCare: NonNullable<PersonalOnboarding['currentlyInProfessionalCare']>;
  hasTherapistAccess: NonNullable<PersonalOnboarding['hasTherapistAccess']>;
  recoveryStartDate: string;
  educationLevel: string;
  employmentStatus: string;
  existingSkillsText: string;
  personalGoals: string[];
  familySocialSupport: NonNullable<PersonalOnboarding['familySocialSupport']>;
  immediateNeeds: string[];
  voluntarySubstanceNotes: string;
  assistanceTypes: string[];
  preferredLang: Language;
  storagePref: 'private' | 'account';
  supportPrefs: {
    reminders: boolean;
    trustedSupporter: boolean;
    professionalFinder: boolean;
  };
  reminderPreference: NonNullable<PersonalOnboarding['reminderPreference']>;
  minorConfidentialityAck: boolean;
}

const JOURNEY_STAGE_OPTIONS: Array<{
  id: RecoveryJourneyStage;
  label: string;
  desc: string;
  primaryNeedText: string;
}> = [
  {
    id: 'exploring',
    label: 'Exploring & wanting clarity',
    desc: 'I want calm information about patterns, triggers, or options.',
    primaryNeedText: 'I want to understand my situation.',
  },
  {
    id: 'starting_change',
    label: 'Ready to change habits',
    desc: 'I want practical steps for urges, daily routine, and sleep.',
    primaryNeedText: 'I want to change my current behaviour.',
  },
  {
    id: 'active_recovery',
    label: 'Currently in recovery or treatment',
    desc: 'I am actively staying steady alongside or without clinical care.',
    primaryNeedText: 'I am already receiving treatment.',
  },
  {
    id: 'maintaining',
    label: 'Maintaining stability',
    desc: 'Things feel steadier; I want relapse protection and structure.',
    primaryNeedText: 'I am supporting an ongoing recovery journey.',
  },
  {
    id: 'rebuilding_life',
    label: 'Rebuilding study, skills & work',
    desc: 'I am focusing on education, livelihood, courses, and independence.',
    primaryNeedText: 'I am rebuilding my life after treatment.',
  },
];

const CLINICAL_STATUS_OPTIONS: Array<{
  id: ClinicalTreatmentStatus;
  label: string;
  note: string;
  inCare: 'yes' | 'no' | 'prefer_not_to_say';
}> = [
  {
    id: 'self_reported_only',
    label: 'Self-reported only (personal tracking)',
    note: 'I am reflecting privately here without formal clinical records.',
    inCare: 'no',
  },
  {
    id: 'clinician_confirmed_treatment',
    label: 'In clinician-confirmed care / counselling',
    note: 'I am currently enrolled with a doctor, Vimukthi clinic, or therapist.',
    inCare: 'yes',
  },
  {
    id: 'completed_formal_care',
    label: 'Completed formal care (aftercare phase)',
    note: 'I finished inpatient or outpatient treatment and am continuing forward.',
    inCare: 'no',
  },
  {
    id: 'no_formal_treatment',
    label: 'No formal treatment right now',
    note: 'Prefer self-guided routines first; confidential Kerala support remains optional.',
    inCare: 'no',
  },
];

const PERSONAL_GOAL_CHIPS = [
  'Steady daily routine & sleep',
  'Stay free from impulsive cravings',
  'Resume school / college / courses',
  'Learn practical job or trade skills',
  'Start apprenticeship or full-time work',
  'Rebuild trust with family & safe friends',
  'Financial stability & small business',
];

const IMMEDIATE_NEED_CHIPS: Array<{ id: string; label: string }> = [
  { id: 'craving_support', label: 'Managing cravings & urges' },
  { id: 'sleep_routine', label: 'Sleep & evening structure' },
  { id: 'education_skills', label: 'Education or skill courses' },
  { id: 'job_livelihood', label: 'Jobs, trades & livelihood' },
  { id: 'family_communication', label: 'Family & social support' },
  { id: 'professional_care', label: 'Finding a clinic or counsellor' },
];

export const PersonalOnboardingModal: React.FC<Props> = ({ onComplete, allowClose }) => {
  const { language, setLanguage, personalOnboarding, savePersonalOnboarding, vaultScope } = useApp();

  const savedDraft = readScopedJson<Partial<OnboardingDraft> | null>(
    vaultScope,
    SCOPED_STORAGE_KEYS.ONBOARDING_P1_DRAFT,
    null
  );

  const [step, setStep] = useState<number>(savedDraft?.step || 1);
  const [journeyStage, setJourneyStage] = useState<RecoveryJourneyStage>(
    savedDraft?.journeyStage || personalOnboarding?.journeyStage || 'starting_change'
  );
  const [primaryNeed, setPrimaryNeed] = useState<string>(
    savedDraft?.primaryNeed || personalOnboarding?.primaryNeed || 'I want to understand my situation.'
  );
  const [otherReasonText, setOtherReasonText] = useState<string>(
    savedDraft?.otherReasonText || personalOnboarding?.otherReasonText || ''
  );
  const [ageRange, setAgeRange] = useState<NonNullable<PersonalOnboarding['ageRange']>>(
    savedDraft?.ageRange || personalOnboarding?.ageRange || '18_24'
  );
  const [clinicalTreatmentStatus, setClinicalTreatmentStatus] = useState<ClinicalTreatmentStatus>(
    savedDraft?.clinicalTreatmentStatus ||
      personalOnboarding?.clinicalTreatmentStatus ||
      'self_reported_only'
  );
  const [currentlyInProfessionalCare, setCurrentlyInProfessionalCare] = useState<
    NonNullable<PersonalOnboarding['currentlyInProfessionalCare']>
  >(savedDraft?.currentlyInProfessionalCare || personalOnboarding?.currentlyInProfessionalCare || 'no');
  const [hasTherapistAccess, setHasTherapistAccess] = useState<
    NonNullable<PersonalOnboarding['hasTherapistAccess']>
  >(savedDraft?.hasTherapistAccess || personalOnboarding?.hasTherapistAccess || 'looking');
  const [recoveryStartDate, setRecoveryStartDate] = useState<string>(
    savedDraft?.recoveryStartDate || personalOnboarding?.recoveryStartDate || ''
  );
  const [educationLevel, setEducationLevel] = useState<string>(
    savedDraft?.educationLevel || personalOnboarding?.educationLevel || '+2 / Higher Secondary'
  );
  const [employmentStatus, setEmploymentStatus] = useState<string>(
    savedDraft?.employmentStatus || personalOnboarding?.employmentStatus || 'Looking for opportunities'
  );
  const [existingSkillsText, setExistingSkillsText] = useState<string>(
    savedDraft?.existingSkillsText || (personalOnboarding?.existingSkills || []).join(', ')
  );
  const [personalGoals, setPersonalGoals] = useState<string[]>(
    savedDraft?.personalGoals ||
      personalOnboarding?.personalGoals || ['Steady daily routine & sleep', 'Learn practical job or trade skills']
  );
  const [familySocialSupport, setFamilySocialSupport] = useState<
    NonNullable<PersonalOnboarding['familySocialSupport']>
  >(savedDraft?.familySocialSupport || personalOnboarding?.familySocialSupport || 'some');
  const [immediateNeeds, setImmediateNeeds] = useState<string[]>(
    savedDraft?.immediateNeeds || personalOnboarding?.immediateNeeds || ['sleep_routine', 'education_skills']
  );
  const [voluntarySubstanceNotes, setVoluntarySubstanceNotes] = useState<string>(
    savedDraft?.voluntarySubstanceNotes || personalOnboarding?.voluntarySubstanceNotes || ''
  );
  const [assistanceTypes, setAssistanceTypes] = useState<string[]>(
    savedDraft?.assistanceTypes ||
      personalOnboarding?.assistanceTypes || ['Understanding and information.', 'Building a gentle weekly life-rebuild rhythm.']
  );
  const [preferredLang, setPreferredLang] = useState<Language>(
    savedDraft?.preferredLang || personalOnboarding?.language || language
  );
  const [storagePref, setStoragePref] = useState<'private' | 'account'>(
    savedDraft?.storagePref || personalOnboarding?.storagePreference || 'private'
  );
  const [supportPrefs, setSupportPrefs] = useState(
    savedDraft?.supportPrefs ||
      personalOnboarding?.supportPreferences || {
        reminders: true,
        trustedSupporter: false,
        professionalFinder: true,
      }
  );
  const [reminderPreference, setReminderPreference] = useState<
    NonNullable<PersonalOnboarding['reminderPreference']>
  >(savedDraft?.reminderPreference || personalOnboarding?.reminderPreference || 'gentle_in_app');
  const [minorConfidentialityAck, setMinorConfidentialityAck] = useState<boolean>(
    savedDraft?.minorConfidentialityAck ?? personalOnboarding?.minorConfidentialityAck ?? false
  );
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  // Auto-persist draft per scope
  useEffect(() => {
    writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.ONBOARDING_P1_DRAFT, {
      step,
      journeyStage,
      primaryNeed,
      otherReasonText,
      ageRange,
      clinicalTreatmentStatus,
      currentlyInProfessionalCare,
      hasTherapistAccess,
      recoveryStartDate,
      educationLevel,
      employmentStatus,
      existingSkillsText,
      personalGoals,
      familySocialSupport,
      immediateNeeds,
      voluntarySubstanceNotes,
      assistanceTypes,
      preferredLang,
      storagePref,
      supportPrefs,
      reminderPreference,
      minorConfidentialityAck,
    });
  }, [
    vaultScope,
    step,
    journeyStage,
    primaryNeed,
    otherReasonText,
    ageRange,
    clinicalTreatmentStatus,
    currentlyInProfessionalCare,
    hasTherapistAccess,
    recoveryStartDate,
    educationLevel,
    employmentStatus,
    existingSkillsText,
    personalGoals,
    familySocialSupport,
    immediateNeeds,
    voluntarySubstanceNotes,
    assistanceTypes,
    preferredLang,
    storagePref,
    supportPrefs,
    reminderPreference,
    minorConfidentialityAck,
  ]);

  const buildOnboardingPayload = (): PersonalOnboarding => {
    const skills = existingSkillsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const base: PersonalOnboarding = {
      primaryNeed: otherReasonText.trim() ? `Other: ${otherReasonText.trim()}` : primaryNeed,
      otherReasonText: otherReasonText.trim() || undefined,
      ageRange,
      currentlyInProfessionalCare,
      hasTherapistAccess,
      assistanceTypes,
      preferredSupportMethods: assistanceTypes,
      reminderPreference,
      minorConfidentialityAck: ageRange === '12_17' ? minorConfidentialityAck : true,
      language: preferredLang,
      storagePreference: storagePref,
      supportPreferences: supportPrefs,
      journeyStage,
      clinicalTreatmentStatus,
      educationLevel: educationLevel.trim() || undefined,
      employmentStatus: employmentStatus.trim() || undefined,
      existingSkills: skills,
      personalGoals,
      familySocialSupport,
      immediateNeeds,
      voluntarySubstanceNotes: voluntarySubstanceNotes.trim() || undefined,
      recoveryStartDate: recoveryStartDate.trim() || undefined,
      completed: true,
    };

    const pathway = generatePersonalizedLifePathway(base);
    return {
      ...base,
      personalizedPathway: pathway,
    };
  };

  const previewPathway = useMemo(
    () => buildOnboardingPayload().personalizedPathway!,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      journeyStage,
      clinicalTreatmentStatus,
      immediateNeeds,
      personalGoals,
      familySocialSupport,
      currentlyInProfessionalCare,
      reminderPreference,
      primaryNeed,
    ]
  );

  const toggleGoalChip = (goal: string) => {
    setPersonalGoals(prev => (prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]));
  };

  const toggleImmediateNeed = (id: string) => {
    setImmediateNeeds(prev => (prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]));
  };

  const handleSaveDraftAndPause = () => {
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2000);
  };

  const handleFinish = () => {
    const data = buildOnboardingPayload();
    removeScopedKey(vaultScope, SCOPED_STORAGE_KEYS.ONBOARDING_P1_DRAFT);
    setLanguage(preferredLang);
    savePersonalOnboarding(data);
    onComplete();
  };

  const totalSteps = 6;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 flex flex-col justify-between max-h-[92vh] overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Recover &amp; Rebuild · Step {step} of {totalSteps}
              </span>
              {savedDraft && !personalOnboarding?.completed && (
                <span className="ml-2 text-[11px] font-medium text-amber-700">(Resumed progress)</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleFinish}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
              >
                Skip non-essential
              </button>
              <div className="hidden sm:flex gap-1">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'w-5 bg-indigo-900' : i < step ? 'w-2.5 bg-amber-500' : 'w-2.5 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              {allowClose && (
                <button
                  type="button"
                  onClick={onComplete}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  aria-label="Close setup"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* STEP 1: CURRENT JOURNEY STAGE */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Non-diagnostic reflection only. Pick what best matches where you stand today.
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Where are you in your journey right now?
              </h2>
              <div className="space-y-2">
                {JOURNEY_STAGE_OPTIONS.map(opt => {
                  const selected = journeyStage === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setJourneyStage(opt.id);
                        setPrimaryNeed(opt.primaryNeedText);
                      }}
                      className={`w-full p-3.5 rounded-xl text-left transition-all flex items-center justify-between border cursor-pointer ${
                        selected
                          ? 'border-indigo-800 bg-indigo-50/80 text-indigo-950'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold">{opt.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                      </div>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-indigo-900 text-amber-300 flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  In your own words (optional)
                </label>
                <textarea
                  rows={2}
                  value={otherReasonText}
                  onChange={e => setOtherReasonText(e.target.value)}
                  placeholder="Share anything else about your current situation..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900"
                />
              </div>
            </div>
          )}

          {/* STEP 2: CLINICAL CARE STATUS VS SELF-REPORTED & OPTIONAL START DATE */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Self-reported tracking is kept separate from clinician-confirmed treatment.
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Age, care status &amp; start date
                </h2>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Age range</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: '12_17', label: '12–17 (Youth)' },
                    { id: '18_24', label: '18–24 (Young Adult)' },
                    { id: '25_44', label: '25–44 (Adult)' },
                    { id: '45_plus', label: '45+ (Adult)' },
                    { id: 'prefer_not_to_say', label: 'Prefer not to say' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAgeRange(item.id as NonNullable<PersonalOnboarding['ageRange']>)}
                      className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                        ageRange === item.id
                          ? 'border-indigo-800 bg-indigo-50 text-indigo-950'
                          : 'border-slate-200 text-slate-700 bg-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {ageRange === '12_17' && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                  <p className="font-bold">Youth Privacy &amp; Safety (Ages 12–17)</p>
                  <p>
                    Private notes are never auto-shared. For urgent safety concerns, contact Childline <strong>1098</strong> or Emergency <strong>112</strong>.
                  </p>
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={minorConfidentialityAck}
                      onChange={e => setMinorConfidentialityAck(e.target.checked)}
                    />
                    <span>I understand how youth privacy works.</span>
                  </label>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Care &amp; treatment distinction (clearly separated)
                </label>
                <div className="space-y-2">
                  {CLINICAL_STATUS_OPTIONS.map(opt => {
                    const selected = clinicalTreatmentStatus === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setClinicalTreatmentStatus(opt.id);
                          setCurrentlyInProfessionalCare(opt.inCare);
                          if (opt.id === 'clinician_confirmed_treatment') setHasTherapistAccess('yes');
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-indigo-800 bg-indigo-50 text-indigo-950'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{opt.note}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Optional Recovery Start Date (editable anytime, no setback punishment)</span>
                </label>
                <input
                  type="date"
                  value={recoveryStartDate}
                  onChange={e => setRecoveryStartDate(e.target.value)}
                  className="w-full sm:w-56 p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                />
              </div>
            </div>
          )}

          {/* STEP 3: EDUCATION, WORK, SKILLS & LIFE GOALS */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Powers your Opportunity Engine &amp; Personal Development Pathways (never shares clinical data).
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Education, work, skills &amp; goals
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Education Level</label>
                  <select
                    value={educationLevel}
                    onChange={e => setEducationLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value="Schooling in progress">Schooling in progress</option>
                    <option value="10th / SSLC">10th / SSLC</option>
                    <option value="+2 / Higher Secondary">+2 / Higher Secondary</option>
                    <option value="ITI / Diploma / Vocational">ITI / Diploma / Vocational</option>
                    <option value="Graduate / Degree">Graduate / Degree</option>
                    <option value="Postgraduate or Other">Postgraduate or Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work / Study Situation</label>
                  <select
                    value={employmentStatus}
                    onChange={e => setEmploymentStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value="Student">Student</option>
                    <option value="Looking for opportunities">Looking for work or training</option>
                    <option value="Part-time or gig work">Part-time or freelance work</option>
                    <option value="Full-time employed">Full-time employed</option>
                    <option value="Self-employed / Family business">Self-employed / Small venture</option>
                    <option value="Taking time to stabilize first">Taking time to stabilize first</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Existing skills or interests (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={existingSkillsText}
                  onChange={e => setExistingSkillsText(e.target.value)}
                  placeholder="e.g., typing, Excel, driving, electrical work, cooking, English"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Personal goals that matter to you
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PERSONAL_GOAL_CHIPS.map(goal => {
                    const active = personalGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoalChip(goal)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          active
                            ? 'bg-indigo-950 border-indigo-950 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SOCIAL SUPPORT, IMMEDIATE NEEDS & VOLUNTARY SUBSTANCE NOTES */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Everything here is optional and stays private.</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Immediate needs &amp; support circle
                </h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  What would help most right now?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {IMMEDIATE_NEED_CHIPS.map(item => {
                    const active = immediateNeeds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleImmediateNeed(item.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                          active
                            ? 'border-indigo-800 bg-indigo-50 text-indigo-950'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-indigo-800 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Family or safe social support around you
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'strong', label: 'Strong support' },
                    { id: 'some', label: 'Some support' },
                    { id: 'limited', label: 'Limited / alone' },
                    { id: 'prefer_not_to_say', label: 'Prefer not to say' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setFamilySocialSupport(
                          opt.id as NonNullable<PersonalOnboarding['familySocialSupport']>
                        )
                      }
                      className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                        familySocialSupport === opt.id
                          ? 'border-indigo-800 bg-indigo-50 text-indigo-950'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional private notes (habits, routines, or substances you want to change)
                </label>
                <textarea
                  rows={2}
                  value={voluntarySubstanceNotes}
                  onChange={e => setVoluntarySubstanceNotes(e.target.value)}
                  placeholder="Optional: e.g., late-night stress habits, screen fatigue, alcohol, nicotine, or skip completely..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                />
              </div>
            </div>
          )}

          {/* STEP 5: LANGUAGE, PRIVACY & REMINDERS */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Language, storage &amp; gentle control</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Your language &amp; privacy preferences
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredLang('en')}
                  className={`p-3 rounded-xl text-left border cursor-pointer ${
                    preferredLang === 'en'
                      ? 'border-indigo-800 bg-indigo-50 text-indigo-950 font-semibold'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  <div className="text-sm font-bold">English</div>
                  <div className="text-[11px] text-slate-500">Clear guidance</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLang('ml')}
                  className={`p-3 rounded-xl text-left border cursor-pointer ${
                    preferredLang === 'ml'
                      ? 'border-indigo-800 bg-indigo-50 text-indigo-950 font-semibold'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  <div className="text-sm font-bold">മലയാളം</div>
                  <div className="text-[11px] text-slate-500">കേരള വിമുക്തി</div>
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60 flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-800 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Strict Clinical Isolation Guarantee
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Your substance notes, cravings, and logs stay strictly private and are never included in your non-clinical Opportunity Resume or Recovery Passport.
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-indigo-700" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Gentle check-in prompts</div>
                      <div className="text-[11px] text-slate-500">Low-pressure daily or weekly reminders</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={supportPrefs.reminders}
                    onChange={e => {
                      setSupportPrefs({ ...supportPrefs, reminders: e.target.checked });
                      setReminderPreference(e.target.checked ? 'gentle_in_app' : 'none');
                    }}
                    className="w-4 h-4 text-indigo-800 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Optional trusted supporter sharing later</div>
                      <div className="text-[11px] text-slate-500">Always off by default until you consent</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={supportPrefs.trustedSupporter}
                    onChange={e => setSupportPrefs({ ...supportPrefs, trustedSupporter: e.target.checked })}
                    className="w-4 h-4 text-indigo-800 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="w-4 h-4 text-indigo-700" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Kerala Care Map &amp; therapist prep</div>
                      <div className="text-[11px] text-slate-500">Show verified Vimukthi clinics &amp; Get My Report</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={supportPrefs.professionalFinder}
                    onChange={e => setSupportPrefs({ ...supportPrefs, professionalFinder: e.target.checked })}
                    className="w-4 h-4 text-indigo-800 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: GENERATED PERSONALIZED LIFE PATHWAY SUMMARY */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Your Personalized Life Pathway</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Clear, calm starting pathway ready
              </h2>

              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-indigo-200 text-[11px] font-bold text-indigo-900">
                  {previewPathway.careStatusLabel}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{previewPathway.careStatusDetail}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Recommended Focus Areas</div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {previewPathway.focusAreas.map(area => (
                    <li key={area} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-700 mt-0.5 shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5 text-xs">
                <div className="font-bold text-amber-950">First Gentle Step</div>
                <p className="text-amber-950">{previewPathway.firstGentleStep}</p>
                <p className="text-[11px] text-amber-900/80 pt-1">{previewPathway.weeklyRhythm}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <Briefcase className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>
                  Suggested Development Pathways: <strong>{previewPathway.recommendedDevTrackIds.length} active tracks</strong> ready in Opportunities &amp; Skills.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveDraftAndPause}
              className="px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{draftSavedToast ? 'Progress Saved' : 'Save Draft'}</span>
            </button>
          </div>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-indigo-950 text-white rounded-xl text-xs font-bold hover:bg-indigo-900 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>{step === totalSteps - 1 ? 'Generate Pathway' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Enter Recover &amp; Rebuild</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
