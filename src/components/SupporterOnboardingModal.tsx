import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SupporterOnboarding, Language } from '../types';
import { Check, ArrowRight, ArrowLeft, HeartHandshake, Shield, Sparkles, BookOpen } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const SupporterOnboardingModal: React.FC<Props> = ({ onComplete }) => {
  const { language, setLanguage, saveSupporterOnboarding } = useApp();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [supportingWho, setSupportingWho] = useState<string>('A family member');
  const [otherRelationshipText, setOtherRelationshipText] = useState<string>('');
  const [personAwareOfSearch, setPersonAwareOfSearch] = useState<'yes' | 'no' | 'unsure'>('no');
  const [currentlyReceivingHelp, setCurrentlyReceivingHelp] = useState<'yes' | 'no' | 'unsure'>('no');
  const [mainConcern, setMainConcern] = useState<string>('I think someone may need professional help');
  const [otherConcernText, setOtherConcernText] = useState<string>('');
  const [guidanceNeeded, setGuidanceNeeded] = useState<string[]>([
    'Starting a conversation',
    'Finding professional help',
    'Supporting someone without becoming overwhelmed',
  ]);
  const [otherGuidanceText, setOtherGuidanceText] = useState<string>('');
  const [preferredLang, setPreferredLang] = useState<Language>(language);
  const [experiencePreference, setExperiencePreference] = useState<string>('A structured support plan');

  const question1Options = [
    'A family member (child, sibling, spouse, parent)',
    'A close friend',
    'A student I mentor or teach',
    'Someone I work with',
    'Someone in my community',
    'Other (describe in your own words)',
  ];

  const question2Options = [
    'I want to understand warning signs',
    'I am worried about someone\'s behaviour',
    'I think someone may need professional help',
    'Someone has asked me for help',
    'Someone is already receiving treatment',
    'Someone is rebuilding their life',
    'I want to learn how to prevent problems',
    'Other (describe in your own words)',
  ];

  const question3Options = [
    'Understanding the situation',
    'Starting a conversation',
    'Responding to difficult situations',
    'Finding professional help',
    'Supporting recovery',
    'Helping rebuild routines',
    'Understanding family responsibilities',
    'Supporting someone without becoming overwhelmed',
  ];

  const question5Options = [
    {
      title: 'Quick guidance',
      desc: 'Immediate tips on conversation scripts and verified professional helplines.',
    },
    {
      title: 'A structured support plan',
      desc: 'Step-by-step checklists, scheduled check-ins, and goal tracking.',
    },
    {
      title: 'Educational resources',
      desc: 'In-depth reading on addiction neurobiology, boundaries, and family dynamics.',
    },
    {
      title: 'Tools to organise my own support activities',
      desc: 'Dedicated support calendar, private reflection journal, and verified directories.',
    },
  ];

  const toggleGuidance = (item: string) => {
    if (guidanceNeeded.includes(item)) {
      setGuidanceNeeded(guidanceNeeded.filter(g => g !== item));
    } else {
      setGuidanceNeeded([...guidanceNeeded, item]);
    }
  };

  const handleFinish = () => {
    const combinedGuidance = otherGuidanceText.trim()
      ? [...guidanceNeeded, `Other: ${otherGuidanceText.trim()}`]
      : guidanceNeeded;
    const data: SupporterOnboarding = {
      supportingWho:
        supportingWho.startsWith('Other') && otherRelationshipText.trim()
          ? `Other: ${otherRelationshipText.trim()}`
          : supportingWho,
      otherRelationshipText: otherRelationshipText.trim() || undefined,
      personAwareOfSearch,
      currentlyReceivingHelp,
      mainConcern:
        mainConcern.startsWith('Other') && otherConcernText.trim()
          ? `Other: ${otherConcernText.trim()}`
          : mainConcern,
      otherConcernText: otherConcernText.trim() || undefined,
      guidanceNeeded: combinedGuidance,
      language: preferredLang,
      experiencePreference,
      completed: true,
    };
    setLanguage(preferredLang);
    saveSupporterOnboarding(data);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        {/* Step Header */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Supporter Setup · Step {step} of 5
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-amber-700' : i < step ? 'w-3 bg-amber-400' : 'w-3 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mb-4 p-3 rounded-xl bg-orange-50/70 border border-orange-200 flex items-start gap-2.5 text-[11px] text-orange-950">
            <Shield className="w-4 h-4 text-orange-800 shrink-0 mt-0.5" />
            <span>
              <strong>No Account Needed for Them:</strong> The person you want to support does not need a ClearPath AI account. Everything you save stays in your own supporter workspace.
            </span>
          </div>

          {/* QUESTION 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Supporting someone starts with understanding.</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  Who are you supporting &amp; what is your relationship?
                </h2>
                <p className="text-xs text-slate-500">
                  Helps tailor communication scripts and boundary guides.
                </p>
              </div>
              <div className="space-y-2">
                {question1Options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSupportingWho(opt)}
                    className={`w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between border ${
                      supportingWho === opt
                        ? 'border-amber-700 bg-amber-50/70 text-amber-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <span>{opt}</span>
                    {supportingWho === opt && (
                      <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs shrink-0 ml-2">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Optional relationship note (e.g., older sister, hostel roommate, college mentor)
                </label>
                <input
                  type="text"
                  value={otherRelationshipText}
                  onChange={e => setOtherRelationshipText(e.target.value)}
                  placeholder="Describe your relationship in your own words (optional)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Are they aware you are seeking support info?
                  </label>
                  <select
                    value={personAwareOfSearch}
                    onChange={e => setPersonAwareOfSearch(e.target.value as 'yes' | 'no' | 'unsure')}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  >
                    <option value="yes">Yes, they know</option>
                    <option value="no">No, checking quietly first</option>
                    <option value="unsure">Not sure</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Are they currently receiving professional help?
                  </label>
                  <select
                    value={currentlyReceivingHelp}
                    onChange={e => setCurrentlyReceivingHelp(e.target.value as 'yes' | 'no' | 'unsure')}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  >
                    <option value="no">No professional care yet</option>
                    <option value="yes">Yes, attending treatment/counselling</option>
                    <option value="unsure">Not sure</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* QUESTION 2 */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Context matters.</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  What is your main concern?
                </h2>
                <p className="text-xs text-slate-500">
                  We will prioritize the most helpful first action on your dashboard.
                </p>
              </div>
              <div className="space-y-2">
                {question2Options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMainConcern(opt)}
                    className={`w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between border ${
                      mainConcern === opt
                        ? 'border-amber-700 bg-amber-50/70 text-amber-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <span>{opt}</span>
                    {mainConcern === opt && (
                      <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs shrink-0 ml-2">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={otherConcernText}
                onChange={e => setOtherConcernText(e.target.value)}
                placeholder="Or add your specific concern in your own words (optional)..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          )}

          {/* QUESTION 3 */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Tailor your guidance toolkit.</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  What kind of support do you want to provide?
                </h2>
                <p className="text-xs text-slate-500">Select all topics that apply:</p>
              </div>
              <div className="space-y-2">
                {question3Options.map(opt => {
                  const isSelected = guidanceNeeded.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleGuidance(opt)}
                      className={`w-full p-3 rounded-xl text-left text-sm transition-all flex items-center justify-between border ${
                        isSelected
                          ? 'border-amber-700 bg-amber-50/70 text-amber-950 font-medium'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span>{opt}</span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs shrink-0 ml-2 ${
                          isSelected ? 'bg-amber-700 border-amber-700 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={otherGuidanceText}
                onChange={e => setOtherGuidanceText(e.target.value)}
                placeholder="Or describe another kind of support you want to provide (optional)..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          )}

          {/* QUESTION 4 */}
          {step === 4 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Language preferences</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                What language do you prefer?
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPreferredLang('en')}
                  className={`w-full p-4 rounded-xl text-left text-sm font-medium border flex items-center justify-between ${
                    preferredLang === 'en'
                      ? 'border-amber-700 bg-amber-50 text-amber-950 font-semibold'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-base font-semibold">English</div>
                    <div className="text-xs text-slate-500">Universal clinical terms & structured resources</div>
                  </div>
                  {preferredLang === 'en' && <Check className="w-5 h-5 text-amber-700" />}
                </button>

                <button
                  onClick={() => setPreferredLang('ml')}
                  className={`w-full p-4 rounded-xl text-left text-sm font-medium border flex items-center justify-between ${
                    preferredLang === 'ml'
                      ? 'border-amber-700 bg-amber-50 text-amber-950 font-semibold'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-base font-semibold">മലയാളം (Malayalam)</div>
                    <div className="text-xs text-slate-500">കേരള വിമുക്തി റിസോഴ്സുകളും കുടുംബ മാർഗ്ഗനിർദ്ദേശങ്ങളും</div>
                  </div>
                  {preferredLang === 'ml' && <Check className="w-5 h-5 text-amber-700" />}
                </button>
              </div>
            </div>
          )}

          {/* QUESTION 5 */}
          {step === 5 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Your preferred pace</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                What kind of support experience would you prefer?
              </h2>
              <div className="space-y-3">
                {question5Options.map(opt => (
                  <button
                    key={opt.title}
                    onClick={() => setExperiencePreference(opt.title)}
                    className={`w-full p-4 rounded-xl text-left border flex items-start justify-between ${
                      experiencePreference === opt.title
                        ? 'border-amber-700 bg-amber-50 text-amber-950 font-semibold'
                        : 'border-slate-200 text-slate-700 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{opt.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                    </div>
                    {experiencePreference === opt.title && (
                      <Check className="w-5 h-5 text-amber-700 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-xs font-semibold hover:bg-amber-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-amber-700 text-white rounded-xl text-xs font-semibold hover:bg-amber-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Enter Supporter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
