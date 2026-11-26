import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  PhoneCall,
  Shield,
  Heart,
  Eye,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { SAMPLE_SUPPORTER_PREVIEW_DATA } from '../../constants/initialData';
import { SupportPlan } from '../../types';

export const SupporterPlanView: React.FC<{ onSelectTab: (tab: string) => void }> = ({ onSelectTab }) => {
  const {
    supportPlans,
    addSupportPlan,
    deleteSupportPlan,
    toggleSupportPlanTask,
    addSupportPlanTask,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formCategory, setFormCategory] = useState('Family Member');
  const [formNotes, setFormNotes] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [initialTasks, setInitialTasks] = useState<string[]>([
    'Review conversation guide on expressing concern',
    'Schedule a quiet, low-pressure check-in',
    'Look up nearest Kerala Vimukthi clinic',
  ]);

  // Inline task addition state for an existing plan
  const [addingTaskPlanId, setAddingTaskPlanId] = useState<string | null>(null);
  const [newTaskInput, setNewTaskInput] = useState('');

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    addSupportPlan(
      {
        title: formTitle.trim(),
        objective: formObjective.trim() || 'Support and care plan',
        relationshipCategory: formCategory,
        notes: formNotes.trim() || undefined,
        followUpDate: formFollowUp || undefined,
        completed: false,
      },
      initialTasks.filter(t => t.trim().length > 0)
    );

    setFormTitle('');
    setFormObjective('');
    setFormNotes('');
    setFormFollowUp('');
    setIsModalOpen(false);
  };

  const handleAddNewTask = (planId: string) => {
    if (!newTaskInput.trim()) return;
    addSupportPlanTask(planId, newTaskInput.trim());
    setNewTaskInput('');
    setAddingTaskPlanId(null);
  };

  const SUPPORTER_PLAN_TEMPLATES = [
    {
      title: 'Prepare a Calm Conversation',
      category: 'Family Member',
      objective: 'Plan a private, low-pressure conversation focused on care and listening.',
      tasks: ['Choose a sober, unhurried time', 'Write 3 "I notice / I care" openers', 'Avoid blaming or lecturing during talk'],
    },
    {
      title: 'Find Verified Kerala Services',
      category: 'Family Member',
      objective: 'Shortlist district clinics and verified de-addiction helplines.',
      tasks: ['Call Vimukthi 14405 to ask OPD timings', 'Check 2 nearby Govt Medical College / district wards', 'Prepare questions for the intake counselor'],
    },
    {
      title: 'Help Arrange an Appointment',
      category: 'Family Member',
      objective: 'Make attending a first clinical appointment low-stress and voluntary.',
      tasks: ['Confirm OPD hours & required ID', 'Offer transport or companion support if wanted', 'Add appointment reminder to Supporter Calendar'],
    },
    {
      title: 'Understand Qualified Treatment Options',
      category: 'Family Member',
      objective: 'Learn evidence-based outpatient counselling, medical detox, and family care.',
      tasks: ['Review CRAFFT / CRAFT family guides', 'Clarify NDPS Sec 64A voluntary immunity', 'Write medical history notes for doctor'],
    },
    {
      title: 'Identify Trusted Adults & Allies',
      category: 'Student',
      objective: 'Build a small, discreet circle of safe adults who can share responsibility.',
      tasks: ['List 2 safe family members or faculty allies', 'Agree on calm, non-gossip communication', 'Share emergency helpline numbers (112 / 14405)'],
    },
    {
      title: 'Support Education & Social Reintegration',
      category: 'Student',
      objective: 'Coordinate steady routines, academic leave, or healthy peer hobbies.',
      tasks: ['Discuss manageable daily sleep & meal blocks', 'Speak gently with college counselor if needed', 'Plan 1 drug-free weekend activity together'],
    },
    {
      title: 'Protect My Own Emotional Well-Being',
      category: 'Personal Wellbeing',
      objective: 'Prevent supporter burnout with healthy boundaries and personal care.',
      tasks: ['Keep my own daily sleep and walk time', 'Step back calmly if a talk turns hostile', 'Schedule 1 check-in with counselor or trusted friend'],
    },
  ];

  const handleLoadTemplate = (tpl: typeof SUPPORTER_PLAN_TEMPLATES[0]) => {
    setFormTitle(tpl.title);
    setFormCategory(tpl.category);
    setFormObjective(tpl.objective);
    setInitialTasks(tpl.tasks);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4 text-amber-700" />
            <span>Support Coordination</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Support Action Plans</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Organize manageable steps to assist someone while protecting your own energy and boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSampleModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-900 border border-amber-300 bg-amber-50/60 hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Sample Plan</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* 7 Structured Plan Category Starters */}
      <div className="bg-white border border-orange-200/80 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-orange-900">
            Quick Start Templates (7 Recommended Supporter Plan Categories)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUPPORTER_PLAN_TEMPLATES.map(tpl => (
            <button
              key={tpl.title}
              type="button"
              onClick={() => handleLoadTemplate(tpl)}
              className="px-3 py-1.5 rounded-xl bg-orange-50/70 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-orange-950 transition-colors cursor-pointer"
            >
              + {tpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Kerala Vimukthi Helpline Callout */}
      <div className="bg-white border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-700">
            <strong>Need guidance building an intervention plan?</strong> Kerala&apos;s official Vimukthi Mission (14405) offers free family support triage.
          </div>
        </div>
        <a
          href="tel:14405"
          className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto flex items-center gap-1"
        >
          <PhoneCall className="w-3 h-3" /> Call 14405
        </a>
      </div>

      {/* Support Plans List */}
      {supportPlans.length > 0 ? (
        <div className="space-y-6">
          {supportPlans.map(plan => {
            const completedCount = plan.tasks.filter(t => t.completed).length;
            const totalCount = plan.tasks.length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={plan.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100">
                      {plan.relationshipCategory}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{plan.title}</h3>
                    {plan.objective && (
                      <p className="text-xs text-slate-600 mt-0.5">{plan.objective}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-800">{pct}% Complete</div>
                      <div className="text-[11px] text-slate-400">
                        {completedCount} of {totalCount} tasks
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSupportPlan(plan.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Tasks List */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Plan Action Steps
                  </span>
                  <div className="space-y-1.5">
                    {plan.tasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => toggleSupportPlanTask(plan.id, task.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          task.completed
                            ? 'bg-amber-50/40 border-amber-200/80 text-slate-500'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className={`text-xs font-medium ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add task inline */}
                  {addingTaskPlanId === plan.id ? (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newTaskInput}
                        onChange={e => setNewTaskInput(e.target.value)}
                        placeholder="Add specific actionable step..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                        onKeyDown={e => e.key === 'Enter' && handleAddNewTask(plan.id)}
                      />
                      <button
                        onClick={() => handleAddNewTask(plan.id)}
                        className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingTaskPlanId(null)}
                        className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingTaskPlanId(plan.id);
                        setNewTaskInput('');
                      }}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add another step</span>
                    </button>
                  )}
                </div>

                {/* Footer Notes & Follow-up */}
                {(plan.followUpDate || plan.notes) && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                    {plan.followUpDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        <span>Follow-up Date: <strong className="text-slate-700">{plan.followUpDate}</strong></span>
                      </div>
                    )}
                    {plan.notes && (
                      <div className="italic text-slate-600 line-clamp-1">
                        Note: {plan.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-4">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No support plans created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Create a gentle plan with 2 or 3 manageable steps: for example, preparing a conversation, offering a ride to a clinic, or setting a healthy personal boundary.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Create Your First Plan
            </button>
            <button
              onClick={() => setShowSampleModal(true)}
              className="px-4 py-2.5 bg-white text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold hover:bg-amber-50"
            >
              See Sample Format
            </button>
          </div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePlan}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Support Plan</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Plan Title</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Support for Rahul & Explore Kerala Health Options"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              >
                <option value="Family Member">Family Member</option>
                <option value="Friend">Friend</option>
                <option value="Student">Student / Mentee</option>
                <option value="Colleague">Colleague / Coworker</option>
                <option value="Community Member">Community Member</option>
                <option value="Personal Wellbeing">Supporter Self-Care</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Overall Objective (Optional)</label>
              <input
                type="text"
                value={formObjective}
                onChange={e => setFormObjective(e.target.value)}
                placeholder="e.g. Open a calm, non-judgmental dialogue and share Vimukthi resources"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Steps</label>
              <div className="space-y-1.5">
                {initialTasks.map((t, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={t}
                    onChange={e => {
                      const updated = [...initialTasks];
                      updated[idx] = e.target.value;
                      setInitialTasks(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-amber-600"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Follow-Up Target Date</label>
              <input
                type="date"
                value={formFollowUp}
                onChange={e => setFormFollowUp(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reminder Notes (Optional)</label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Remember to stay calm and use 'I notice' statements..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold"
              >
                Save Support Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SAMPLE FORMAT PREVIEW MODAL */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                  Read-Only Example
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Sample Support Plan Format</h3>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
              <span className="font-bold uppercase tracking-wider">Example: Supporting a Family Member</span>
              <p>
                <strong>Title:</strong> {SAMPLE_SUPPORTER_PREVIEW_DATA.supportPlans[0].title}
              </p>
              <p>
                <strong>Objective:</strong> {SAMPLE_SUPPORTER_PREVIEW_DATA.supportPlans[0].objective}
              </p>
              <div className="space-y-1 pt-1">
                {SAMPLE_SUPPORTER_PREVIEW_DATA.supportPlans[0].tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="text-amber-700 font-bold">{t.completed ? '✓' : '○'}</span>
                    <span className={t.completed ? 'line-through' : ''}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              This illustrative sample does not alter your actual data.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
