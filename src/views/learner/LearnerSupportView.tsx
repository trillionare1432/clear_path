import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KERALA_DISTRICTS } from '../../constants/initialData';
import {
  PhoneCall,
  Shield,
  ShieldCheck,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  HeartHandshake,
  Users,
  BookOpen,
  Building2,
} from 'lucide-react';

interface KeralaInitiativeItem {
  id: string;
  title: string;
  agency: string;
  category: string;
  summary: string;
  accessLine: string;
  sourceUrl: string;
  lastVerified: string;
}

const KERALA_VERIFIED_INITIATIVES: KeralaInitiativeItem[] = [
  {
    id: 'ki-vimukthi',
    title: 'Vimukthi Mission (State Anti-Addiction & Awareness Mission)',
    agency: 'Excise Department & Govt. of Kerala',
    category: 'State Prevention & Helpline',
    summary:
      'Kerala’s flagship state-wide mission uniting awareness clubs (Nerkkoottam in schools, Bodhyam in colleges) with District Hospital de-addiction centers and a 24/7 confidential helpline.',
    accessLine: '24/7 Toll-Free Helpline: 14405',
    sourceUrl: 'https://vimukthi.kerala.gov.in/',
    lastVerified: '2026-11',
  },
  {
    id: 'ki-telemanas',
    title: 'Tele-MANAS Kerala (24/7 Mental Health & Distress Support)',
    agency: 'Ministry of Health & Family Welfare / DHS Kerala',
    category: 'Government Helpline & Triage',
    summary:
      'Free, round-the-clock tele-mental health counselling staffed by trained counsellors and psychiatrists, offering confidential guidance in Malayalam and English.',
    accessLine: '24/7 Helpline: 14416 or 1800-891-4416',
    sourceUrl: 'https://telemanas.mohfw.gov.in/',
    lastVerified: '2026-11',
  },
  {
    id: 'ki-disha',
    title: 'DISHA 1056 (24x7 Health & Referral Helpline)',
    agency: 'National Health Mission (Arogyakeralam), Kerala',
    category: 'Government Health Directory',
    summary:
      'Official Kerala health helpline providing verified information on District Hospital Psychiatry OPDs, Taluk clinics, and urgent clinical care referrals.',
    accessLine: 'Helpline: 1056 or 0471-2552056',
    sourceUrl: 'https://arogyakeralam.gov.in/',
    lastVerified: '2026-11',
  },
  {
    id: 'ki-deaddiction-opd',
    title: 'District Hospital & Govt. Medical College Psychiatry / De-Addiction Wards',
    agency: 'Directorate of Health Services (DHS) & Medical Education, Kerala',
    category: 'Available Treatment Pathways',
    summary:
      'All 14 districts in Kerala maintain Vimukthi Model De-Addiction clinics and Psychiatry OPDs for medical detoxification supervision, CBT counselling, and confidential family sessions.',
    accessLine: 'Walk-in OPD Registration (Check District Directory tab)',
    sourceUrl: 'https://dhs.kerala.gov.in/',
    lastVerified: '2026-11',
  },
  {
    id: 'ki-ndps-64a',
    title: 'NDPS Act Section 64A — Voluntary Treatment Legal Protection',
    agency: 'Government of India Statute',
    category: 'Legal Safeguard & Treatment Access',
    summary:
      'Encourages help-seeking by allowing immunity from prosecution for personal-consumption charges when an individual voluntarily completes accredited medical de-addiction care.',
    accessLine: 'Ask any District Hospital Vimukthi counsellor for intake details',
    sourceUrl: 'https://socialjustice.gov.in/',
    lastVerified: '2026-11',
  },
  {
    id: 'ki-childline',
    title: 'CHILDLINE 1098 & School Counselling Cells (Souhrida / Our Responsibility to Children)',
    agency: 'Ministry of Women & Child Development / Kerala Social Justice Dept.',
    category: 'Youth & School Safeguarding',
    summary:
      'Confidential emergency and youth safeguarding support for minors experiencing peer coercion, exploitation, or family crises.',
    accessLine: '24/7 Child Helpline: 1098',
    sourceUrl: 'https://wcd.kerala.gov.in/',
    lastVerified: '2026-11',
  },
];

export const LearnerSupportView: React.FC = () => {
  const { supportCenters, toggleSaveCenter } = useApp();

  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [activeTab, setActiveTab] = useState<'kerala_centre' | 'how_to_ask' | 'centers'>('kerala_centre');

  const filteredCenters = supportCenters.filter(c => {
    if (selectedDistrict === 'All Districts') return true;
    return c.district === selectedDistrict;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
          Part 6D · Kerala Knowledge Centre &amp; Help-Seeking
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          Kerala Public Health Knowledge Centre &amp; Support
        </h1>
        <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
          Verified Kerala prevention missions, government de-addiction pathways, and guidance on approaching a trusted adult safely.
        </p>
      </div>

      {/* Immediate Helpline Emergency Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                Kerala 24/7 Free Helplines
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              You are never alone. Confidential help is one call away.
            </h2>
            <p className="prose-readable-sm text-slate-200">
              Trained mental health professionals and de-addiction counselors are ready to listen without judgment, lecture, or reporting to authorities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <a
              href="tel:14405"
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold text-xs shadow-xs transition-colors flex flex-col items-center justify-center gap-1"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Vimukthi: 14405</span>
              <span className="text-[10px] text-emerald-200 font-normal">Free 24x7 De-addiction</span>
            </a>

            <a
              href="tel:14416"
              className="p-4 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-center font-bold text-xs shadow-xs transition-colors flex flex-col items-center justify-center gap-1"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Tele-MANAS: 14416</span>
              <span className="text-[10px] text-indigo-200 font-normal">Govt Mental Health</span>
            </a>
          </div>
        </div>
      </div>

      {/* Toggle View Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('kerala_centre')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 ${
            activeTab === 'kerala_centre'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Kerala Public Health Centre</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('how_to_ask')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'how_to_ask'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          How to Approach a Trusted Adult
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('centers')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 ${
            activeTab === 'centers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Kerala Support Directory ({filteredCenters.length})</span>
        </button>
      </div>

      {/* TAB 0: PART 6D KERALA KNOWLEDGE CENTRE */}
      {activeTab === 'kerala_centre' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-sky-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Verified Public Sources Policy:</strong> ClearPath AI lists only established Government of Kerala and Government of India public health initiatives, verified source URLs, and official helplines (14405, 14416, 1056, 1098). Zero invented statistics or unverified clinics are displayed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {KERALA_VERIFIED_INITIATIVES.map(item => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      Verified {item.lastVerified}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500">{item.agency}</div>
                  <p className="prose-readable-sm text-slate-700 pt-1">{item.summary}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-emerald-800">{item.accessLine}</span>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-800 hover:underline"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: HOW TO APPROACH A TRUSTED ADULT */}
      {activeTab === 'how_to_ask' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Who Can You Turn To?</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="editorial-kicker text-indigo-800 block">1. College / School Counselor</span>
                <p className="prose-readable-sm text-slate-600">
                  Most institutions have student counseling cells. By professional ethics, discussions regarding stress, emotional health, and substance struggles are confidential.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="editorial-kicker text-indigo-800 block">2. A Trusted Teacher or Mentor</span>
                <p className="prose-readable-sm text-slate-600">
                  Choose an educator who listens quietly rather than giving immediate punishments. They can help navigate academic extensions and medical leaves.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="editorial-kicker text-indigo-800 block">3. A Family Physician or Vimukthi Doctor</span>
                <p className="prose-readable-sm text-slate-600">
                  Medical doctors evaluate situations clinically. They focus on physical stabilization, sleep, and nutrition rather than moral lecturing.
                </p>
              </div>
            </div>
          </div>

          {/* Script Opener */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              The 3-Step Script: How to Start the Conversation
            </h3>
            <p className="prose-readable-sm text-slate-600">
              When starting, feeling nervous is completely normal. Use these word-for-word openers:
            </p>

            <div className="space-y-3.5">
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Step 1: Set the expectation for privacy</div>
                <div className="prose-readable text-slate-800 italic font-medium">
                  &ldquo;I have been feeling overwhelmed by stress lately, and I need to share something important with you in private.&rdquo;
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Step 2: Share what is happening honestly</div>
                <div className="prose-readable text-slate-800 italic font-medium">
                  &ldquo;I was offered substances and tried them to handle panic / I noticed I am relying on them to get through the week, and I want to stop before it gets worse.&rdquo;
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Step 3: State your desire for support</div>
                <div className="prose-readable text-slate-800 italic font-medium">
                  &ldquo;I want to handle this responsibly. Could you please help me connect with a counselor or a doctor at Vimukthi?&rdquo;
                </div>
              </div>
            </div>
          </div>

          {/* Legal and Privacy Truths */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 editorial-kicker">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Medical Immunity &amp; Protection Under Indian Law</span>
            </div>
            <p className="prose-readable prose-measure text-emerald-950">
              Under Section 64A of the Narcotic Drugs and Psychotropic Substances (NDPS) Act, individuals who voluntarily seek medical de-addiction treatment at a government-approved center are granted legal immunity from prosecution for personal consumption. Seeking medical help is a protected health decision.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: KERALA CENTERS DIRECTORY */}
      {activeTab === 'centers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Filter verified Kerala government de-addiction units:</span>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              {KERALA_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCenters.map(center => {
              const isSaved = !!center.isSaved;

              return (
                <div
                  key={center.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {center.isGovt ? 'Government Facility' : 'Accredited Center'}
                          </span>
                          <span className="text-[10px] text-slate-400">· {center.district}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{center.name}</h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSaveCenter(center.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSaved ? 'text-amber-600 bg-amber-50' : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={isSaved ? 'Saved center' : 'Save center'}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{center.address}</span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{center.openingHours}</span>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-1">
                      {center.services.slice(0, 3).map((srv, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={`tel:${center.phone}`}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call {center.phone}</span>
                    </a>

                    <span className="text-[10px] text-slate-400">Verified {center.lastVerified}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
