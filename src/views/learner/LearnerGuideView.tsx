import React from 'react';
import { useApp } from '../../context/AppContext';
import { ClearPathAiChat } from '../../components/ClearPathAiChat';
import { PhoneCall, Shield } from 'lucide-react';

export const LearnerGuideView: React.FC = () => {
  const { language } = useApp();
  const isMl = language === 'ml';

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isMl ? 'പഠന AI സഹായി' : 'Learning AI Guide'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isMl
              ? 'പാഠങ്ങളിലെ സംശയങ്ങൾ, മസ്തിഷ്ക ശാസ്ത്രം, കൂട്ടുകാരുടെ സമ്മർദ്ദം നേരിടൽ എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.'
              : 'Ask about any lesson, brain science, myths vs facts, or how to say no easily.'}
          </p>
        </div>

        <a
          href="tel:14405"
          className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <PhoneCall className="w-4 h-4" />
          <span>{isMl ? 'വിമുക്തി സഹായം 14405' : 'Need Human Help? Call 14405'}</span>
        </a>
      </div>

      <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
        <Shield className="w-4 h-4 text-sky-700 shrink-0" />
        <span>
          {isMl
            ? 'ശാസ്ത്രീയ വസ്തുതകൾ ലളിതമായ ഭാഷയിൽ — എല്ലാ ചാറ്റുകളും ഇവിടെ സേവ് ചെയ്യപ്പെടും.'
            : 'Short everyday explanations backed by public health facts — your chat history stays saved.'}
        </span>
      </div>

      <ClearPathAiChat variant="embedded" role="learner" />
    </div>
  );
};
