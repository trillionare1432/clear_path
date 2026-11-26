import React from 'react';
import { useApp } from '../context/AppContext';
import { ClearPathAiChat } from '../components/ClearPathAiChat';
import { Shield, PhoneCall } from 'lucide-react';

export const ClearPathGuideView: React.FC = () => {
  const { language } = useApp();
  const isMl = language === 'ml';

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isMl ? 'ക്ലിയർപാത്ത് എഐ സഹായി' : 'ClearPath AI Guide'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isMl
              ? 'ലളിതവും ചെറുതുമായ ഉത്തരങ്ങൾ — നിങ്ങളുടെ പഴയ ചാറ്റുകൾ ഇവിടെ സുരക്ഷിതമായി സൂക്ഷിക്കും.'
              : 'Short, everyday answers tailored to your goals. All past chats stay saved privately.'}
          </p>
        </div>

        <a
          href="tel:14405"
          className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <PhoneCall className="w-4 h-4" />
          <span>{isMl ? 'സൗജന്യ വിമുക്തി 14405' : 'Free Vimukthi Helpline: 14405'}</span>
        </a>
      </div>

      <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
        <Shield className="w-4 h-4 text-indigo-700 shrink-0" />
        <span>
          {isMl
            ? 'ഇത് ലളിതമായ വിവരങ്ങളും സഹായവും നൽകുന്നു — ഡോക്ടറുടെ പരിശോധനയ്ക്ക് പകരമല്ല.'
            : 'Practical everyday guidance only — never replaces a doctor or licensed therapist.'}
        </span>
      </div>

      <ClearPathAiChat variant="embedded" role="personal" />
    </div>
  );
};
