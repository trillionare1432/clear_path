import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { HeartHandshake, BookOpen, Users2, ArrowLeft, Shield, CheckCircle, Sparkles, PhoneCall } from 'lucide-react';

interface Props {
  role: UserRole;
  onSwitchToPersonal: () => void;
  onOpenRoleSwitcher: () => void;
}

export const AdaptiveRolePlaceholderView: React.FC<Props> = ({
  role,
  onSwitchToPersonal,
  onOpenRoleSwitcher,
}) => {
  const roleConfigs = {
    supporter: {
      title: 'ROLE 02 — SUPPORTER WORKSPACE',
      badge: 'Family, Allies & Friends',
      colorBg: 'bg-amber-50/70 border-amber-200/80',
      textColor: 'text-amber-900',
      accentColor: 'bg-amber-700 text-white hover:bg-amber-800',
      icon: <HeartHandshake className="w-8 h-8 text-amber-700" />,
      greeting: 'Supporting a loved one safely and constructively.',
      description:
        'This dedicated space is architected to guide family members and friends. It provides communication scripts, boundary protection to prevent burnout, and steps for connecting someone to professional medical help.',
      toolsPreview: [
        'Boundary Self-Assessment & Burnout Prevention',
        'How to Speak with Compassion Without Enabling',
        'Recognizing Crisis Signs and Acute Overdose Protocols',
        'Kerala Vimukthi Family Counseling Coordination',
      ],
    },
    learner: {
      title: 'ROLE 03 — LEARNER WORKSPACE',
      badge: 'Students & Curious Minds',
      colorBg: 'bg-sky-50/70 border-sky-200/80',
      textColor: 'text-sky-900',
      accentColor: 'bg-sky-700 text-white hover:bg-sky-800',
      icon: <BookOpen className="w-8 h-8 text-sky-700" />,
      greeting: 'Evidence-based understanding of the mind and habits.',
      description:
        'A dedicated learning environment designed for young adults, students, and educators. Explore the neuroscience of dopamine, how habits take root, and master social peer-refusal strategies.',
      toolsPreview: [
        'The Neurobiology of Habits & Dopamine Pathways',
        'Social Pressure Refusal Simulators',
        'Debunking Common Myths About Chemical Dependence',
        'Stress, Exams, and Healthy Coping Mechanisms',
      ],
    },
    community: {
      title: 'ROLE 04 — COMMUNITY BUILDER',
      badge: 'Schools, NGOs & Local Leaders',
      colorBg: 'bg-teal-50/70 border-teal-200/80',
      textColor: 'text-teal-900',
      accentColor: 'bg-teal-700 text-white hover:bg-teal-800',
      icon: <Users2 className="w-8 h-8 text-teal-700" />,
      greeting: 'Civic prevention and school community initiatives.',
      description:
        'Designed for teachers, student counselors, youth clubs, and civic coordinators to lead substance prevention campaigns across Kerala’s panchayats and campuses.',
      toolsPreview: [
        'Campus Prevention Workshop Curriculum',
        'Vimukthi Anti-Drug Club Toolkit for Schools',
        'Hosting Empathetic Community Listening Circles',
        'Emergency Directory of District Medical Officers',
      ],
    },
  };

  const current = roleConfigs[role as 'supporter' | 'learner' | 'community'] || roleConfigs.supporter;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Role Banner */}
      <div className={`p-8 rounded-3xl border ${current.colorBg} shadow-xs space-y-4`}>
        <div className="flex items-start justify-between">
          <div className="p-3 bg-white rounded-2xl shadow-xs">{current.icon}</div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white/80 px-3 py-1 rounded-full border border-slate-200/60">
            {current.badge}
          </span>
        </div>

        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{current.title}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{current.greeting}</h1>
          <p className="text-sm text-slate-700 leading-relaxed mt-2 max-w-2xl">{current.description}</p>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={onSwitchToPersonal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Personal Journey (Role 01)</span>
          </button>
          <button
            onClick={onOpenRoleSwitcher}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Switch to Another Role
          </button>
        </div>
      </div>

      {/* Architecture Readiness & Module Blueprint */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Dedicated Role Architecture</h2>
            <p className="text-xs text-slate-500">
              Structured foundation ready for the next dedicated development prompt.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
            Role Data Isolated & Safe
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {current.toolsPreview.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3"
            >
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-800">{item}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pre-configured in ClearPath AI&apos;s role workspace.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Safe Data Isolation Guarantee */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>
            <strong>Data Privacy Boundary: </strong>
            Switching into this role does not expose, wipe, or overwrite your private Role 01 Personal Journey logs or calendar routines.
          </span>
        </div>
      </div>
    </div>
  );
};
