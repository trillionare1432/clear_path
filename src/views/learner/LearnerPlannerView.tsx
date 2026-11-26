import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LearnerCustomPlan } from '../../types';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Plus,
} from 'lucide-react';

const TOPIC_PRESETS = [
  { id: 'neuro', label: 'Neurobiology: Dopamine & Reward Circuitry' },
  { id: 'synthetic', label: 'Synthetic Substances, MDMA & Vaping Chemistry' },
  { id: 'adolescent', label: 'Adolescent Prefrontal Cortex & Risk Vulnerability' },
  { id: 'assertive', label: 'Social Assertiveness & Scripted Refusal Skills' },
  { id: 'alcohol', label: 'Alcohol Metabolism, Hepatic & Neural Impact' },
  { id: 'peer_support', label: 'Spotting Distress in Friends Without Stigma' },
];

export const LearnerPlannerView: React.FC = () => {
  const { learnerCustomPlan, saveLearnerCustomPlan, togglePlanDayCompleted, language, t } = useApp();

  const [goalTitle, setGoalTitle] = useState('My 7-Day Prevention Science Mastery');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['neuro', 'synthetic', 'assertive']);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [dailyMinutes, setDailyMinutes] = useState<number>(15);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const generatedDays = Array.from({ length: durationDays }, (_, i) => {
      const dayNum = i + 1;
      let title = `Day ${dayNum}: Core Foundations`;
      let desc = 'Scientific exploration of neurotransmitter adaptations and executive control.';

      if (dayNum === 1) {
        title = 'Day 1: How the Brain Learns Reward';
        desc = 'Explore the ventral tegmental area (VTA), nucleus accumbens, and the dopamine surge mechanics.';
      } else if (dayNum === 2) {
        title = 'Day 2: Receptor Downregulation & Tolerance';
        desc = 'Understand why higher doses are needed and how homeostasis attempts to balance excessive stimulation.';
      } else if (dayNum === 3) {
        title = 'Day 3: The Prefrontal Cortex & Adolescent Growth';
        desc = 'Why the impulse-control center matures last and how substances disrupt myelin formation.';
      } else if (dayNum === 4) {
        title = 'Day 4: Synthetic Drugs, Vapes & Unknown Adulterants';
        desc = 'Analyze synthetic cannabinoids, fentanyl adulteration, and respiratory aerosol toxicity.';
      } else if (dayNum === 5) {
        title = 'Day 5: Real-World Social Refusal Framework';
        desc = 'Practice the Delay, Redirect, Exit, and Assert techniques in high-pressure peer scenarios.';
      } else if (dayNum === 6) {
        title = 'Day 6: Supporting a Friend in Crisis Safely';
        desc = 'Trauma-informed communication without confrontation, blame, or moral lecturing.';
      } else if (dayNum === 7) {
        title = 'Day 7: Final Synthesis & Certificate Readiness';
        desc = 'Review key clinical takeaways, complete self-assessment, and unlock official certification.';
      } else {
        title = `Day ${dayNum}: Deep Dive Mastery`;
        desc = 'Evidence-informed analysis of community prevention and resilience.';
      }

      return {
        dayNumber: dayNum,
        title,
        description: desc,
        completed: false,
      };
    });

    const newPlan: LearnerCustomPlan = {
      id: `plan-${Date.now()}`,
      goalTitle: goalTitle.trim() || 'My Substance Prevention Plan',
      topicInterests: selectedTopics,
      durationDays,
      dailyMinutes,
      startDate: new Date().toISOString().split('T')[0],
      days: generatedDays,
    };

    setTimeout(() => {
      saveLearnerCustomPlan(newPlan);
      setIsGenerating(false);
    }, 400);
  };

  const completedCount = learnerCustomPlan?.days.filter(d => d.completed).length || 0;
  const progressPercent = learnerCustomPlan
    ? Math.round((completedCount / learnerCustomPlan.days.length) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Personalized Learning Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('customLearningPlan')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Design a flexible daily study curriculum matching your specific interests, pace, and prevention goals.
          </p>
        </div>
      </div>

      {learnerCustomPlan ? (
        /* Active Plan View */
        <div className="space-y-6">
          {/* Progress Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Active Study Blueprint
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {learnerCustomPlan.goalTitle}
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                Target: {learnerCustomPlan.durationDays} Days · {learnerCustomPlan.dailyMinutes} mins/day
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-2xl font-bold text-white font-mono">
                  {completedCount}/{learnerCustomPlan.days.length}
                </span>
                <span className="text-[11px] text-indigo-300 block">Days Completed ({progressPercent}%)</span>
              </div>

              {progressPercent === 100 && (
                <div className="p-2 bg-emerald-500/20 border border-emerald-400 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>Ready for Certificate</span>
                </div>
              )}
            </div>
          </div>

          {/* Day-by-Day Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Daily Lesson Checklist
              </h3>
              <button
                onClick={() => saveLearnerCustomPlan(null as any)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Reset & Build New Plan
              </button>
            </div>

            <div className="space-y-2.5">
              {learnerCustomPlan.days.map(day => (
                <div
                  key={day.dayNumber}
                  onClick={() => togglePlanDayCompleted(day.dayNumber)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    day.completed
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-white border-slate-200/90 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        day.completed
                          ? 'bg-emerald-700 text-white'
                          : 'border-2 border-slate-300 hover:border-indigo-600 bg-white'
                      }`}
                    >
                      {day.completed && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          day.completed ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {day.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {day.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    Day {day.dayNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Plan Builder Form */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <form onSubmit={handleGeneratePlan} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Goal Title *
              </label>
              <input
                type="text"
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                placeholder="e.g. My 7-Day Neurobiology & Prevention Sprint"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>

            {/* Topics Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Key Focus Areas (Choose 2 or more)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TOPIC_PRESETS.map(preset => {
                  const isChecked = selectedTopics.includes(preset.id);
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => toggleTopic(preset.id)}
                      className={`text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration & Daily Minutes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Plan Duration
                </label>
                <div className="flex gap-2">
                  {[7, 14].map(days => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => setDurationDays(days)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        durationDays === days
                          ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {days} Days Target
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Daily Dedication
                </label>
                <select
                  value={dailyMinutes}
                  onChange={e => setDailyMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value={10}>10 Minutes / Day (Light)</option>
                  <option value={15}>15 Minutes / Day (Standard)</option>
                  <option value={25}>25 Minutes / Day (Intensive)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || selectedTopics.length === 0}
              className="w-full py-3 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Structuring Plan...' : 'Generate Structured Plan'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
