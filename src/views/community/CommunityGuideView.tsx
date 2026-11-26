import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClearPathAiChat } from '../../components/ClearPathAiChat';
import {
  Bot,
  Sparkles,
  Copy,
  Check,
  Send,
  Layers,
  Calendar,
  BookOpen,
  FileText,
  Users,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

export const CommunityGuideView: React.FC = () => {
  const { communityOrg, communityProgrammes, language, addCommunityProgramme } = useApp();

  const [guideMode, setGuideMode] = useState<'chat' | 'generator'>('chat');
  const [promptType, setPromptType] = useState<
    'workshop_agenda' | 'teacher_training' | 'community_dialogue' | 'policy_draft'
  >('workshop_agenda');

  const [targetAudience, setTargetAudience] = useState('High school students (Grades 9-12)');
  const [sessionFocus, setSessionFocus] = useState(
    'Refusal assertiveness & synthetic substance myth busting'
  );
  const [duration, setDuration] = useState('45 minutes');
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [addedAsProgramme, setAddedAsProgramme] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setAddedAsProgramme(false);

    setTimeout(() => {
      let draft = '';
      if (promptType === 'workshop_agenda') {
        draft = `CLEARPATH AI COMMUNITY WORKSHOP AGENDA
TITLE: ${sessionFocus.toUpperCase()}
TARGET AUDIENCE: ${targetAudience}
RECOMMENDED DURATION: ${duration}
ORGANISATION: ${communityOrg?.name || 'Community Prevention Centre'}

SESSION STRUCTURE:
1. Psychological Safety & Ground Rules (05-08 mins)
   - Establish non-judgmental environment: No confessions asked, shared mutual respect.
   - Icebreaker: Anonymous Myth vs Fact slips ("Do energy drinks with stimulants count?").

2. Science of the Developing Brain (10-12 mins)
   - Explain prefrontal cortex development and why substances target impulse regulation.
   - Emphasize neuroplasticity: Healthy habits rewrite neural pathways.

3. Roleplay & Refusal Scenarios (15 mins)
   - The "Delay & Redirect" method: "Not today, let's grab food after coaching class."
   - The "Firm Boundary" method: Clear, steady eye contact, non-aggressive "No thanks."
   - Safe Exit: Having an agreed family code word for pickup without questions.

4. Local Help Linkages & Q&A (08-10 mins)
   - Sharing confidential school counsellor contact.
   - Kerala Vimukthi Helpline 14405 & Emergency 112.
   - Collection of anonymous exit feedback cards.`;
      } else if (promptType === 'teacher_training') {
        draft = `EDUCATOR GUIDANCE MANUAL: EARLY DETECTION WITHOUT STIGMA
MODULE: Teacher & Mentor Compass
FOCUS: ${sessionFocus}

TRAINING OUTLINE FOR FACULTY:
1. Understanding the Spectrum of Distress
   - Distinguish temporary academic burnout from substance use indicators.
   - Watch for clustering signals (chronic fatigue + sudden friendship isolation + academic drops).

2. How to Speak with a Concerned Student
   - Never interrogate in front of other students or in hallways.
   - Use welfare framing: "I care about how you are doing" instead of "Are you doing drugs?"
   - Avoid threatening expulsion as the primary opening statement.

3. Kerala Legal & Departmental Framework
   - Working in coordination with school Vimukthi club coordinators.
   - Confidential referral protocols to certified clinical psychologists.`;
      } else if (promptType === 'community_dialogue') {
        draft = `COMMUNITY PARENT-TEEN DIALOGUE CIRCLE
THEME: Open Family Communication Against Substance Pressures
AUDIENCE: ${targetAudience}

FACILITATION GUIDE:
1. Opening (10 mins)
   - Normalizing the modern stress faced by youth: Academic pressure, online temptations.
2. The "Listening Bench" Exercise (20 mins)
   - Parents practise listening for 3 minutes without interrupting or giving immediate lectures.
3. Safe Family Agreements (15 mins)
   - The "Safe Ride Home" contract: If a teenager feels unsafe in a peer party, they can call for help immediately without fear of punishment.
4. Helpline & Resource Handover (10 mins)
   - Distributing Kerala Vimukthi 14405 flyers.`;
      } else {
        draft = `CAMPUS RESTORATIVE SUBSTANCE SUPPORT POLICY DRAFT
FOR: ${communityOrg?.name || 'Educational Institution'}

POLICY OBJECTIVES:
1. Maintain drug-free academic grounds while prioritizing medical and psychological care over automatic punitive expulsion.
2. Mandatory assessment by a licensed clinical counsellor upon first identified concern.
3. Creation of an Individual Rehabilitation Continuity Agreement with student and parents.
4. Active peer leadership through Vimukthi youth clubs.`;
      }

      setGeneratedDraft(draft);
      setGenerating(false);
    }, 600);
  };

  const handleCopy = () => {
    if (generatedDraft) {
      navigator.clipboard.writeText(generatedDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToProgrammes = () => {
    if (!generatedDraft) return;

    addCommunityProgramme({
      title: sessionFocus,
      category:
        promptType === 'teacher_training'
          ? 'teacher_training'
          : promptType === 'community_dialogue'
          ? 'family_awareness'
          : 'school_awareness',
      objective: `Tailored intervention generated via AI Assistant focusing on ${sessionFocus}`,
      targetAudience,
      location: communityOrg?.name || 'Campus Venue',
      district: communityOrg?.district || 'Ernakulam',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      coordinatorId: 'lead',
      teamMemberIds: [],
      requiredResources: 'Classroom projector, print handbooks, feedback slips',
      budget: 5000,
      status: 'planning',
      expectedOutcomes: 'Deliver structured evidence-based session with participant feedback.',
      notes: generatedDraft,
    });

    setAddedAsProgramme(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" />
            <span>{language === 'ml' ? 'AI സഹായി' : 'Community AI Guide'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'കമ്മ്യൂണിറ്റി AI ചാറ്റ് & അജണ്ട ജനറേറ്റർ' : 'Community AI Chat & Workshop Generator'}
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
            {language === 'ml'
              ? 'ലളിതമായ ചോദ്യങ്ങൾ ചോദിക്കുകയോ സ്കൂൾ പരിപാടികൾക്കുള്ള അജണ്ടകൾ തയ്യാറാക്കുകയോ ചെയ്യാം.'
              : 'Ask brief questions with saved chat history, or draft structured school & community session outlines.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setGuideMode('chat')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              guideMode === 'chat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'AI ചാറ്റ് & ചരിത്രം' : 'AI Chat & History'}</span>
          </button>
          <button
            type="button"
            onClick={() => setGuideMode('generator')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              guideMode === 'generator'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'അജണ്ട ജനറേറ്റർ' : 'Session Outline'}</span>
          </button>
        </div>
      </div>

      {guideMode === 'chat' ? (
        <ClearPathAiChat variant="embedded" role="community" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">Configure Outline</h2>
          </div>

          {/* Generator Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Template Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'workshop_agenda', label: 'Classroom Student Workshop Agenda', icon: BookOpen },
                { id: 'teacher_training', label: 'Teacher Early Identification Guide', icon: Users },
                { id: 'community_dialogue', label: 'Parent-Teen Dialogue Circle', icon: Calendar },
                { id: 'policy_draft', label: 'Restorative Campus Policy Draft', icon: FileText },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = promptType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPromptType(item.id as any)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-teal-50 border-teal-700 text-teal-950 font-semibold shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Focus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Core Topic / Challenge
            </label>
            <input
              type="text"
              value={sessionFocus}
              onChange={e => setSessionFocus(e.target.value)}
              placeholder="e.g. Synthetic drugs awareness and refusal techniques"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              placeholder="e.g. Higher Secondary Students, Ages 15-18"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Estimated Duration
            </label>
            <select
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
            >
              <option value="45 minutes">45 minutes (Standard Classroom Period)</option>
              <option value="60 minutes">60 minutes (Special Assembly)</option>
              <option value="90 minutes">90 minutes (In-Depth Workshop)</option>
              <option value="Half-day seminar">Half-day seminar (Faculty / PTA)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>{generating ? 'Drafting Blueprint...' : 'Generate Session Blueprint'}</span>
          </button>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Generated Agenda & Blueprint</h2>
              {generatedDraft && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSaveToProgrammes}
                    disabled={addedAsProgramme}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 disabled:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{addedAsProgramme ? 'Saved as Programme!' : 'Save as Programme'}</span>
                  </button>
                </div>
              )}
            </div>

            {generatedDraft ? (
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 text-slate-800 prose-readable whitespace-pre-line border border-slate-200 max-h-[540px] overflow-y-auto">
                {generatedDraft}
              </div>
            ) : (
              <div className="text-center py-24 px-6 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No blueprint generated yet</h3>
                <p className="prose-readable-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                  Configure the session focus, audience, and duration on the left, then click generate to create an evidence-based facilitation blueprint.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              All blueprints adhere to trauma-informed, non-stigmatizing prevention science guidelines.
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
