import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  X,
  History,
  ArrowRight,
  PhoneCall,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AiChatRole } from '../types';

interface ClearPathAiChatProps {
  variant?: 'embedded' | 'drawer';
  role?: AiChatRole;
  className?: string;
}

const STARTER_PROMPTS: Record<AiChatRole, { en: string[]; ml: string[] }> = {
  home: {
    en: [
      'How does this app keep my data private?',
      'Which space fits my situation right now?',
      'Help me find free local help in Kerala',
    ],
    ml: [
      'എന്റെ വിവരങ്ങൾ ഇവിടെ എത്രത്തോളം സുരക്ഷിതമാണ്?',
      'എനിക്ക് അനുയോജ്യമായ വിഭാഗം ഏതാണ്?',
      'കേരളത്തിലെ സൗജന്യ സഹായ കേന്ദ്രങ്ങൾ കാണിക്കുക',
    ],
  },
  personal: {
    en: [
      'I have a strong urge right now — what helps in 2 minutes?',
      'Help me plan a steady evening routine',
      'How do I share a summary with a therapist safely?',
    ],
    ml: [
      'ഇപ്പോൾ വലിയൊരു തോന്നൽ വരുന്നു — 2 മിനിറ്റിൽ എന്ത് ചെയ്യാം?',
      'വൈകുന്നേരത്തെ സമയം നന്നായി ക്രമീകരിക്കാൻ സഹായിക്കൂ',
      'തെറാപ്പിസ്റ്റുമായി സുരക്ഷിതമായി വിവരങ്ങൾ പങ്കിടുന്നത് എങ്ങനെ?',
    ],
  },
  supporter: {
    en: [
      'How do I start a calm talk without starting an argument?',
      'What early signs should I look out for gently?',
      'Where can families get free confidential support?',
    ],
    ml: [
      'വഴക്കുണ്ടാകാതെ ശാന്തമായി സംസാരിച്ചു തുടങ്ങുന്നത് എങ്ങനെ?',
      'ആദ്യകാല ലക്ഷണങ്ങൾ എന്തൊക്കെയാണ്?',
      'കുടുംബങ്ങൾക്ക് സൗജന്യ സഹായം എവിടെ ലഭിക്കും?',
    ],
  },
  learner: {
    en: [
      'Explain dopamine and cravings in simple everyday words',
      'Give me a short, natural way to say no to friends',
      'What real-life habits rebuild brain focus fastest?',
    ],
    ml: [
      'ഡോപമിനും ആസക്തിയും ലളിതമായി വിശദീകരിക്കാമോ?',
      'കൂട്ടുകാരോട് മര്യാദയോടെ "വേണ്ട" എന്ന് പറയാൻ ഒരു വഴി തരാമോ?',
      'ശ്രദ്ധ തിരിച്ചുപിടിക്കാൻ നല്ല ശീലങ്ങൾ എന്തൊക്കെയാണ്?',
    ],
  },
  community: {
    en: [
      'Suggest a 30-minute interactive workshop for students',
      'How do we invite parents without causing fear or shame?',
      'Which Kerala districts need more free awareness work?',
    ],
    ml: [
      'വിദ്യാർത്ഥികൾക്കായി 30 മിനിറ്റ് പരിപാടി നിർദ്ദേശിക്കാമോ?',
      'ഭയപ്പെടുത്താതെ മാതാപിതാക്കളെ എങ്ങനെ പങ്കെടുപ്പിക്കാം?',
      'ഏത് ജില്ലകളിലാണ് കൂടുതൽ സഹായം ആവശ്യമുള്ളത്?',
    ],
  },
};

const ROLE_DISPLAY: Record<AiChatRole, { en: string; ml: string }> = {
  home: { en: 'General', ml: 'പൊതുവായത്' },
  personal: { en: 'Rebuild', ml: 'വ്യക്തിഗതം' },
  supporter: { en: 'Help Someone', ml: 'സഹായി' },
  learner: { en: 'Learn', ml: 'പഠനം' },
  community: { en: 'Community', ml: 'കമ്മ്യൂണിറ്റി' },
};

export const ClearPathAiChat: React.FC<ClearPathAiChatProps> = ({
  variant = 'embedded',
  role,
  className = '',
}) => {
  const {
    currentRole,
    language,
    aiChatSessions,
    activeAiSessionId,
    isAiDrawerOpen,
    aiPendingContext,
    aiLoading,
    personalizationProfile,
    closeAiAssistant,
    clearAiPendingContext,
    createNewAiSession,
    selectAiSession,
    deleteAiSession,
    clearAllAiSessions,
    sendAiChatMessage,
    navigateToRoleTab,
  } = useApp();

  const resolvedRole: AiChatRole = role || currentRole || 'home';
  const [input, setInput] = useState('');
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  const sortedSessions = [...aiChatSessions].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  const activeSession =
    sortedSessions.find(s => s.id === activeAiSessionId) || sortedSessions[0] || null;

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, aiLoading]);

  useEffect(() => {
    if (variant !== 'drawer' || !isAiDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAiAssistant();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [variant, isAiDrawerOpen, closeAiAssistant]);

  if (variant === 'drawer' && !isAiDrawerOpen) {
    return null;
  }

  const starters = (STARTER_PROMPTS[resolvedRole] || STARTER_PROMPTS.home)[
    language === 'ml' ? 'ml' : 'en'
  ];

  const handleSend = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || aiLoading) return;
    if (!customText) setInput('');
    await sendAiChatMessage(text, {
      role: resolvedRole,
      contextRef: aiPendingContext || undefined,
      sessionId: activeSession?.id,
    });
  };

  const formatShortTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const chatCore = (
    <div
      className={`flex flex-col md:flex-row bg-white border border-slate-200 rounded-2xl overflow-hidden ${
        variant === 'drawer' ? 'h-full rounded-none md:rounded-l-2xl border-0 md:border-l' : 'min-h-[540px] max-h-[76vh]'
      } ${className}`}
    >
      {/* Desktop Chat History Sidebar */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        <div className="p-3 border-b border-slate-200">
          <button
            type="button"
            onClick={() => createNewAiSession(resolvedRole)}
            className="w-full min-h-[44px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{language === 'ml' ? 'പുതിയ ചാറ്റ്' : 'New Chat'}</span>
          </button>
        </div>

        <div className="px-3 pt-3 pb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span>{language === 'ml' ? 'പഴയ സംഭാഷണങ്ങൾ' : 'Saved Chats'}</span>
          {sortedSessions.length > 0 && (
            confirmClearHistory ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    clearAllAiSessions();
                    setConfirmClearHistory(false);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                >
                  {language === 'ml' ? 'ഉറപ്പിക്കുക' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearHistory(false)}
                  className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
                >
                  {language === 'ml' ? 'വേണ്ട' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearHistory(true)}
                className="text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer"
              >
                {language === 'ml' ? 'ചരിത്രം മായ്ക്കുക' : 'Clear History'}
              </button>
            )
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sortedSessions.length === 0 ? (
            <p className="px-2.5 py-4 text-xs text-slate-500 leading-relaxed">
              {language === 'ml'
                ? 'നിങ്ങളുടെ ചോദ്യങ്ങളും ഉത്തരങ്ങളും ഇവിടെ സൂക്ഷിക്കും.'
                : 'Your past AI questions and answers stay saved privately here.'}
            </p>
          ) : (
            sortedSessions.map(sess => {
              const isSelected = activeSession?.id === sess.id;
              return (
                <div
                  key={sess.id}
                  className={`group flex items-start gap-1.5 rounded-xl px-2.5 py-2 transition-colors ${
                    isSelected
                      ? 'bg-white border border-slate-200 text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectAiSession(sess.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {sess.title || 'New Chat'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate tabular-nums">
                      {ROLE_DISPLAY[sess.role]?.[language === 'ml' ? 'ml' : 'en'] || 'General'} · {formatShortTime(sess.updatedAt)} · {sess.messages.length}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAiSession(sess.id)}
                    title={language === 'ml' ? 'നീക്കം ചെയ്യുക' : 'Delete chat'}
                    aria-label={language === 'ml' ? 'നീക്കം ചെയ്യുക' : 'Delete chat'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Pane */}
      <div className="flex-1 min-w-0 flex flex-col bg-white">
        {/* Top Bar */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {language === 'ml' ? 'ക്ലിയർപാത്ത് എഐ സഹായി' : 'ClearPath AI Guide'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {language === 'ml'
                ? `${personalizationProfile.name ? `${personalizationProfile.name}-നായി ക്രമീകരിച്ചത് · ` : ''}ലളിതവും ചെറുതുമായ ഉത്തരങ്ങൾ`
                : `${personalizationProfile.name ? `Tailored for ${personalizationProfile.name} · ` : ''}Brief answers in plain words`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowMobileHistory(prev => !prev)}
              className="md:hidden min-h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
            >
              <History className="w-4 h-4" />
              <span>{language === 'ml' ? 'ചരിത്രം' : `Chats (${sortedSessions.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                createNewAiSession(resolvedRole);
                setShowMobileHistory(false);
              }}
              className="md:hidden min-h-[44px] px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ml' ? 'പുതിയത്' : 'New'}</span>
            </button>

            {variant === 'drawer' && (
              <button
                type="button"
                onClick={closeAiAssistant}
                aria-label="Close AI chat"
                className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Mobile History Panel */}
        {showMobileHistory && (
          <div className="md:hidden border-b border-slate-200 bg-slate-50 p-3 max-h-56 overflow-y-auto space-y-2">
            {sortedSessions.length > 0 && (
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/80 text-xs">
                <span className="font-semibold text-slate-600">
                  {language === 'ml' ? 'സംരക്ഷിച്ച ചാറ്റുകൾ' : 'Saved Chats'}
                </span>
                {confirmClearHistory ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        clearAllAiSessions();
                        setConfirmClearHistory(false);
                        setShowMobileHistory(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      {language === 'ml' ? 'എല്ലാം മായ്ക്കുക' : 'Confirm Clear'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(false)}
                      className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
                    >
                      {language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearHistory(true)}
                    className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                  >
                    {language === 'ml' ? 'ചരിത്രം മായ്ക്കുക' : 'Clear History'}
                  </button>
                )}
              </div>
            )}
            {sortedSessions.length === 0 ? (
              <p className="text-xs text-slate-500">
                {language === 'ml' ? 'പഴയ ചാറ്റുകൾ ഒന്നും ഇല്ല.' : 'No saved chats yet.'}
              </p>
            ) : (
              sortedSessions.map(sess => (
                <div
                  key={sess.id}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${
                    activeSession?.id === sess.id
                      ? 'bg-white border-indigo-200 text-slate-900'
                      : 'bg-white/70 border-slate-200 text-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      selectAiSession(sess.id);
                      setShowMobileHistory(false);
                    }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-xs font-semibold truncate">{sess.title || 'New Chat'}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {ROLE_DISPLAY[sess.role]?.[language === 'ml' ? 'ml' : 'en'] || 'General'} · {formatShortTime(sess.updatedAt)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAiSession(sess.id)}
                    aria-label="Delete chat"
                    className="p-2 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="max-w-xl mx-auto py-4 space-y-5">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-sm font-bold text-slate-900">
                  {language === 'ml'
                    ? `${personalizationProfile.name ? `നമസ്കാരം ${personalizationProfile.name}, ` : ''}എന്താണ് അറിയേണ്ടത്?`
                    : `${personalizationProfile.name ? `Hi ${personalizationProfile.name}, ` : ''}how can I help right now?`}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {language === 'ml'
                    ? 'വായിക്കുമ്പോൾ മനസ്സിലാകാത്ത കാര്യങ്ങളോ, അടുത്ത ചുവടോ, സഹായ കേന്ദ്രങ്ങളോ ചെറുതായി ചോദിക്കാം. ഞാൻ 2-3 ചെറിയ വരികളിൽ ലളിതമായി ഉത്തരം തരാം.'
                    : 'Ask about anything you are reading, calm steps for cravings, or free help nearby. Replies stay short (2-3 simple lines) and tailored to you.'}
                </p>
                {personalizationProfile.topGoal && (
                  <p className="text-xs text-indigo-700 font-medium pt-1">
                    {language === 'ml'
                      ? `നിങ്ങളുടെ ലക്ഷ്യം: ${personalizationProfile.topGoal}`
                      : `Your current focus: ${personalizationProfile.topGoal}`}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  {language === 'ml' ? 'വേഗത്തിൽ ചോദിക്കാവുന്നവ' : 'Tap to ask'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {starters.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left text-xs sm:text-sm font-medium text-slate-700 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg, idx) => {
              const isLatestAssistant =
                msg.sender === 'assistant' && idx === activeSession.messages.length - 1;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {msg.contextRef?.topicTitle && (
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-indigo-600">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>
                        {language === 'ml' ? 'വായിക്കുന്ന വിഷയം:' : 'About:'} {msg.contextRef.topicTitle}
                      </span>
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {msg.needsEmergencyHelp && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                        <p className="text-xs font-bold text-rose-900">
                          {language === 'ml'
                            ? 'അടിയന്തര സഹായ നമ്പറുകൾ (സൗജന്യം)'
                            : 'Immediate Free Help (24x7)'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href="tel:112"
                            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call 112 (Emergency)</span>
                          </a>
                          <a
                            href="tel:14405"
                            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call 14405 (Vimukthi)</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {msg.sender === 'assistant' && msg.suggestedAction && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/80">
                        <button
                          type="button"
                          onClick={() =>
                            navigateToRoleTab(
                              msg.suggestedAction!.role,
                              msg.suggestedAction!.tab
                            )
                          }
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-xs font-semibold text-indigo-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <span>{msg.suggestedAction.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isLatestAssistant &&
                    msg.followUpSuggestions &&
                    msg.followUpSuggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%] sm:max-w-[78%]">
                        {msg.followUpSuggestions.map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => handleSend(sugg)}
                            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-xs font-medium text-slate-700 transition-colors"
                          >
                            {sugg}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              );
            })
          )}

          {aiLoading && (
            <div className="flex items-start">
              <div className="rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 text-sm text-slate-500">
                {language === 'ml' ? 'ആലോചിക്കുന്നു...' : 'Writing a brief answer...'}
              </div>
            </div>
          )}
          <div ref={scrollEndRef} />
        </div>

        {/* Attached Topic Context + Composer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white space-y-2.5">
          {aiPendingContext?.topicTitle && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <p className="text-xs font-semibold text-indigo-900 truncate">
                  {language === 'ml' ? 'ചോദ്യം വിഷയത്തെക്കുറിച്ച്:' : 'Asking about:'}{' '}
                  {aiPendingContext.topicTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={clearAiPendingContext}
                aria-label="Clear attached topic"
                className="p-1 text-indigo-600 hover:text-indigo-900 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                language === 'ml'
                  ? 'ലളിതമായി എന്തും ചോദിക്കൂ...'
                  : 'Ask anything in simple words...'
              }
              className="flex-1 min-w-0 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || aiLoading}
              aria-label={language === 'ml' ? 'അയക്കുക' : 'Send'}
              className="min-h-[44px] px-4 sm:px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ml' ? 'ചോദിക്കുക' : 'Ask'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  if (variant === 'drawer') {
    return (
      <div
        className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs"
        onClick={e => {
          if (e.target === e.currentTarget) closeAiAssistant();
        }}
      >
        <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col">
          {chatCore}
        </div>
      </div>
    );
  }

  return chatCore;
};
