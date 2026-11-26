import React from 'react';
import { useApp } from '../../context/AppContext';
import { ClearPathAiChat } from '../../components/ClearPathAiChat';
import { PhoneCall, Shield } from 'lucide-react';

export const SupporterGuideView: React.FC = () => {
  const { language } = useApp();
  const isMl = language === 'ml';

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/70">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isMl ? 'സപ്പോർട്ടർ AI സഹായി' : 'Supporter AI Guide'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isMl
              ? 'ശാന്തമായി സംസാരിക്കാനും പ്രിയപ്പെട്ടവരെ സഹായിക്കാനും ചെറിയ, ലളിതമായ നിർദ്ദേശങ്ങൾ.'
              : 'Short, practical answers for calm conversations, personal boundaries, and Kerala help centers.'}
          </p>
        </div>

        <a
          href="tel:14405"
          className="min-h-[44px] px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <PhoneCall className="w-4 h-4" />
          <span>{isMl ? 'വിമുക്തി 14405 വിളിക്കുക' : 'Call Vimukthi 14405'}</span>
        </a>
      </div>

      <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
        <Shield className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          {isMl
            ? 'നിങ്ങളുടെ ചോദ്യങ്ങളും ചാറ്റ് ചരിത്രവും സ്വകാര്യമായി സൂക്ഷിക്കുന്നു.'
            : 'Your questions and chat history stay private to your own vault.'}
        </span>
      </div>

      <ClearPathAiChat variant="embedded" role="supporter" />
    </div>
  );
};
