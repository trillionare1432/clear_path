import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Edit3, Check, Heart, Shield, Wind, RefreshCw, X } from 'lucide-react';

const MOTIVATION_QUOTES_EN = [
  'Cravings are neurochemical waves that peak and dissolve within 15–20 minutes. Riding the wave builds permanent neural resilience.',
  'Your prefrontal cortex rebuilds executive control every single day you maintain clean habits.',
  'Healing is not about being flawless; it is about choosing your direction one steady step at a time.',
  'Dopamine receptors upregulate with consistent sleep and routine. Your natural joy is steadily returning.',
  'A slip is a data point, not a verdict. What matters is your immediate return to your healthy anchors.',
];

const MOTIVATION_QUOTES_ML = [
  'ലഹരിയുടെ ആസക്തികൾ 15-20 മിനിറ്റിനുള്ളിൽ തനിയെ കുറയുന്ന തരംഗങ്ങളാണ്. ക്ഷമയോടെ കാത്തിരിക്കുമ്പോൾ നിങ്ങളുടെ മനസ്സ് കൂടുതൽ ശക്തമാകുന്നു.',
  'ഓരോ ശുദ്ധമായ ദിവസവും നിങ്ങളുടെ തലച്ചോറിൻ്റെ നിയന്ത്രണ ശേഷി പുനർനിർമ്മിക്കുന്നു.',
  'മാറ്റം എന്നത് പെട്ടെന്നുണ്ടാകുന്ന ഒന്നല്ല; ഓരോ ചെറിയ നല്ല തീരുമാനവും വലിയ വിജയമാണ്.',
  'ചിട്ടയായ ഉറക്കവും ദിനചര്യയും തലച്ചോറിലെ ഡോപമൈൻ സന്തുലിതാവസ്ഥ തിരികെ കൊണ്ടുവരുന്നു.',
  'വീഴ്ചകൾ തളർത്താനല്ല, കൂടുതൽ ജാഗ്രതയോടെ മുന്നേറാനുള്ള ഓർമ്മപ്പെടുത്തലുകളാണ്.',
];

export const MotivationBar: React.FC = () => {
  const { motivationAnchor, saveMotivationWhy, language, t } = useApp();

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isEditingWhy, setIsEditingWhy] = useState(false);
  const [tempWhy, setTempWhy] = useState(motivationAnchor.personalWhy || '');
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timerSeconds, setTimerSeconds] = useState(60);

  // Rotate quote daily or on manual tap
  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    setQuoteIndex(dayOfYear % MOTIVATION_QUOTES_EN.length);
  }, []);

  // Guided breathing loop
  useEffect(() => {
    if (!isBreathingModalOpen) return;

    const interval = setInterval(() => {
      setTimerSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);

    const phaseInterval = setInterval(() => {
      setBreathPhase(p => {
        if (p === 'inhale') return 'hold';
        if (p === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4500);

    return () => {
      clearInterval(interval);
      clearInterval(phaseInterval);
    };
  }, [isBreathingModalOpen]);

  const handleSaveWhy = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempWhy.trim()) {
      saveMotivationWhy(tempWhy.trim());
      setIsEditingWhy(false);
    }
  };

  const currentQuote =
    language === 'ml' ? MOTIVATION_QUOTES_ML[quoteIndex] : MOTIVATION_QUOTES_EN[quoteIndex];

  return (
    <>
      <div className="w-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md mb-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          {/* Left: Neuroscience Mindset Quote */}
          <div className="max-w-xl space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t('dailyMotivation')}</span>
              <button
                onClick={() => setQuoteIndex(i => (i + 1) % MOTIVATION_QUOTES_EN.length)}
                className="ml-2 text-emerald-400 hover:text-white transition-colors"
                title="Next mindset spark"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed italic">
              "{currentQuote}"
            </p>

            {/* Personal Why Anchor */}
            <div className="pt-2 flex items-start gap-2 text-xs">
              <Heart className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <div className="flex-1">
                {isEditingWhy ? (
                  <form onSubmit={handleSaveWhy} className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={tempWhy}
                      onChange={e => setTempWhy(e.target.value)}
                      placeholder={t('whyPlaceholder')}
                      className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-full"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shrink-0 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>{t('save')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingWhy(false)}
                      className="text-xs text-slate-300 hover:text-white px-2"
                    >
                      {t('cancel')}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="text-slate-300 text-[11px]">
                      {t('myPersonalWhy')}:{' '}
                      <strong className="text-white font-semibold">
                        {motivationAnchor.personalWhy || 'For my health, my loved ones, and inner peace.'}
                      </strong>
                    </span>
                    <button
                      onClick={() => {
                        setTempWhy(motivationAnchor.personalWhy);
                        setIsEditingWhy(true);
                      }}
                      className="text-slate-400 hover:text-emerald-300 transition-colors opacity-70 group-hover:opacity-100"
                      title={t('editMyWhy')}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Craving / Calming Reset Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setTimerSeconds(60);
                setIsBreathingModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-2xl text-xs font-bold text-emerald-200 hover:text-white flex items-center gap-2 shadow-xs transition-transform active:scale-95"
            >
              <Wind className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>{t('quickGrounding')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guided 60-Second Breathing Reset Modal */}
      {isBreathingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 text-center text-white shadow-2xl relative">
            <button
              onClick={() => setIsBreathingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              {t('calmBreathing')}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {language === 'ml'
                ? 'നിങ്ങളുടെ ശ്വാസത്തിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക. ഹൃദയമിടിപ്പ് ക്രമപ്പെടട്ടെ.'
                : 'Downregulate nervous system arousal. Inhale, hold, and gently release.'}
            </p>

            {/* Breathing Animation Circle */}
            <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  breathPhase === 'inhale'
                    ? 'scale-110 bg-emerald-500/20 ring-4 ring-emerald-400/40'
                    : breathPhase === 'hold'
                    ? 'scale-105 bg-teal-500/30 ring-4 ring-teal-400/60'
                    : 'scale-75 bg-slate-800 ring-2 ring-slate-700'
                }`}
              />
              <div className="relative z-10">
                <span className="text-lg font-bold uppercase tracking-wider text-emerald-300 block">
                  {breathPhase === 'inhale'
                    ? language === 'ml' ? 'ശ്വാസമെടുക്കുക' : 'Inhale'
                    : breathPhase === 'hold'
                    ? language === 'ml' ? 'പിടിച്ചുനിർത്തുക' : 'Hold'
                    : language === 'ml' ? 'ശ്വാസം പുറത്തുവിടുക' : 'Exhale'}
                </span>
                <span className="text-xs text-slate-400 font-mono mt-1 block">
                  {timerSeconds}s remaining
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              {language === 'ml'
                ? 'ഈ ആസക്തി ഇപ്പോൾ കടന്നുപോകും. നിങ്ങളുടെ ലക്ഷ്യത്തിൽ ഉറച്ചുനിൽക്കുക.'
                : 'Notice the urge as physical sensation without acting on it. It will crest and fade.'}
            </p>

            <button
              onClick={() => setIsBreathingModalOpen(false)}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-xs font-bold text-white transition-colors"
            >
              {language === 'ml' ? 'പൂർത്തിയായി' : 'I Feel Grounded Now'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
