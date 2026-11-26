import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Search,
  Bookmark,
  BookmarkCheck,
  Printer,
  Share2,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { VERIFIED_EDUCATIONAL_RESOURCES } from '../../constants/communityData';
import { CommunityResource } from '../../types';

type ResourceTab = 'guides' | 'scripts';

export const CommunityResourcesView: React.FC = () => {
  const { bookmarkedResourceIds, toggleBookmarkResource, language } = useApp();

  const [resourceTab, setResourceTab] = useState<ResourceTab>('guides');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [activeResource, setActiveResource] = useState<CommunityResource | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedToolkitId, setCopiedToolkitId] = useState<string | null>(null);

  const quickToolkits = [
    {
      id: 'tk-assembly',
      title: '45-Min School Session Script',
      desc: 'Simple non-scary outline covering brain myths, saying no, and 14405 help.',
      text: `CLEARPATH AI 45-MIN CLASSROOM SESSION\n1. Safe Rules (5 min): No judging, no names.\n2. Brain Science (10 min): Why teens build habits fast & how healthy routines reset focus.\n3. Saying No Smoothly (15 min): "Not my thing, let's grab food."\n4. Help Numbers (10 min): School counsellor + Kerala Vimukthi 14405 (24/7 free & private).`,
    },
    {
      id: 'tk-parent',
      title: 'Parent PTA Talk Checklist',
      desc: 'Helps parents listen calmly without pushing kids into hiding.',
      text: `CLEARPATH AI PARENT MEETING GUIDE\n- Speak calmly 1-on-1; avoid scolding in front of others.\n- Watch patterns (sudden sleep changes, dropping friends), not single bad days.\n- Set a "No-Judgement Ride Home" rule so teens always call you safely.\n- Free parent guidance anytime: Kerala Vimukthi 14405.`,
    },
    {
      id: 'tk-poster',
      title: 'Noticeboard Helpline Block',
      desc: 'Copy-ready text for school corridors, NSS boards, and club WhatsApp groups.',
      text: `NEED SOMEONE TO TALK TO? IT STAYS PRIVATE.\n• Kerala Vimukthi Helpline: 14405 (24/7 Free & Confidential)\n• DISHA Health Helpline: 1056\n• Emergency Medical Help: 112 / 108\nShared via ClearPath AI Community Network`,
    },
  ];

  const handleCopyToolkit = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToolkitId(id);
    setTimeout(() => setCopiedToolkitId(null), 1800);
  };

  const filtered = VERIFIED_EDUCATIONAL_RESOURCES.filter(res => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.titleMl && res.titleMl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      res.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFormat = selectedFormat === 'all' || res.format === selectedFormat;
    const matchesBookmark = !onlyBookmarked || bookmarkedResourceIds.includes(res.id);

    return matchesSearch && matchesFormat && matchesBookmark;
  });

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Dedicated Focused Inline Resource Reader (No Cramped Popup Modal)
  if (activeResource) {
    const playlist = filtered.length > 0 ? filtered : VERIFIED_EDUCATIONAL_RESOURCES;
    const currentIdx = playlist.findIndex(r => r.id === activeResource.id);
    const prevRes = currentIdx > 0 ? playlist[currentIdx - 1] : null;
    const nextRes =
      currentIdx >= 0 && currentIdx + 1 < playlist.length ? playlist[currentIdx + 1] : null;
    const isSaved = bookmarkedResourceIds.includes(activeResource.id);

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-tab-fade">
        {/* Top Reader Navigation Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:px-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveResource(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Resource Library</span>
            </button>
            <span className="hidden sm:inline text-xs font-mono-tabular text-slate-500">
              Guide {currentIdx >= 0 ? currentIdx + 1 : 1} of {playlist.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => toggleBookmarkResource(activeResource.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSaved ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-teal-700" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyText(activeResource.downloadOrPrintContent)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{copied ? 'Copied!' : 'Copy Outline'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Clean Spacious Guide Article */}
        <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-9 shadow-xs space-y-7">
          <header className="pb-5 border-b border-slate-100 space-y-2.5">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 inline-block">
              {activeResource.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
              {language === 'ml' && activeResource.titleMl
                ? activeResource.titleMl
                : activeResource.title}
            </h1>
            <p className="editorial-subtitle text-slate-600">{activeResource.summary}</p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-700" />
                {activeResource.targetAudience}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                {activeResource.suggestedDuration}
              </span>
            </div>
          </header>

          <div>
            <h2 className="editorial-kicker text-slate-500 mb-3">Core Curriculum Takeaways</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeResource.keyPoints.map((pt, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 prose-readable-sm text-slate-800 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-1" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="editorial-kicker text-slate-500 mb-3">
              Session Blueprint &amp; Facilitator Script
            </h2>
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 text-slate-800 prose-readable whitespace-pre-line border border-slate-200">
              {activeResource.downloadOrPrintContent}
            </div>
          </div>

          {/* Bottom Previous / Next Guide Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={!prevRes}
              onClick={() => {
                if (prevRes) {
                  setActiveResource(prevRes);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Guide</span>
            </button>

            <button
              type="button"
              disabled={!nextRes}
              onClick={() => {
                if (nextRes) {
                  setActiveResource(nextRes);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>{language === 'ml' ? 'വിദ്യാഭ്യാസ വിഭവങ്ങൾ' : 'Prevention Resource Library'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'വർക്ക്‌ഷോപ്പുകളും പാഠ്യപദ്ധതികളും' : 'Workshop Guides & Ready Scripts'}
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            {language === 'ml'
              ? 'ക്ലാസ്സ് മുറികൾ, അധ്യാപകർ, രക്ഷിതാക്കൾ എന്നിവർക്കായുള്ള തെളിവ് അടിസ്ഥാനമാക്കിയുള്ള പ്രിവൻഷൻ ഗൈഡുകൾ.'
              : 'Open full classroom outlines cleanly with Next/Previous controls, or copy 1-click school scripts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setResourceTab('guides')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              resourceTab === 'guides'
                ? 'bg-teal-800 text-white border-teal-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Full Workshop Guides ({VERIFIED_EDUCATIONAL_RESOURCES.length})
          </button>
          <button
            type="button"
            onClick={() => setResourceTab('scripts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              resourceTab === 'scripts'
                ? 'bg-teal-800 text-white border-teal-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            1-Click Scripts ({quickToolkits.length})
          </button>
        </div>
      </div>

      {/* TAB 1: FULL WORKSHOP GUIDES */}
      {resourceTab === 'guides' && (
        <div className="space-y-6 animate-tab-fade">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by topic, keyword, or audience..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
              />
            </div>

            <select
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-700"
            >
              <option value="all">All Resource Formats</option>
              <option value="workshop_outline">Workshop Outline</option>
              <option value="teacher_guide">Teacher Guide</option>
              <option value="student_activity">Student / Peer Activity</option>
              <option value="policy_template">Institutional Policy</option>
            </select>

            <button
              type="button"
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                onlyBookmarked
                  ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({bookmarkedResourceIds.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(res => {
              const isSaved = bookmarkedResourceIds.includes(res.id);
              return (
                <div
                  key={res.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {res.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBookmarkResource(res.id)}
                        className="text-slate-400 hover:text-teal-700 p-1 cursor-pointer"
                        title={isSaved ? 'Remove Bookmark' : 'Bookmark Resource'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-teal-700 fill-teal-700" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 line-clamp-2 leading-snug">
                        {language === 'ml' && res.titleMl ? res.titleMl : res.title}
                      </h3>
                      <p className="prose-readable-sm text-slate-600 mt-1.5 line-clamp-3">
                        {res.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{res.targetAudience}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Duration: {res.suggestedDuration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                      {res.format.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveResource(res)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Read Guide</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 1-CLICK SCRIPTS & POSTERS */}
      {resourceTab === 'scripts' && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-6 space-y-4 animate-tab-fade">
          <div>
            <h2 className="text-lg font-extrabold text-teal-950">
              Ready-to-Use Educator &amp; Club Scripts
            </h2>
            <p className="prose-readable-sm text-slate-600 mt-1">
              Copy a classroom outline, parent checklist, or helpline notice in one click—no formatting needed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickToolkits.map(tk => (
              <div
                key={tk.id}
                className="bg-white border border-teal-200/80 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900">{tk.title}</h3>
                  <p className="prose-readable-sm text-slate-600">{tk.desc}</p>
                  <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {tk.text}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyToolkit(tk.id, tk.text)}
                  className="w-full py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedToolkitId === tk.id ? (
                    <Check className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedToolkitId === tk.id ? 'Copied!' : 'Copy Ready Text'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
