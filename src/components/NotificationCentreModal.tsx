import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Bell, CheckCheck, X, ArrowRight, ShieldCheck, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateDeepLink: (role: UserRole, tab: string) => void;
}

export const NotificationCentreModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateDeepLink,
}) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearViewedNotifications,
    currentRole,
    language,
    consentPrefs,
  } = useApp();
  const [filterMode, setFilterMode] = React.useState<'all' | 'role'>('role');

  // Auto-mark unread items as read shortly after user sees them (so badge clears naturally)
  useEffect(() => {
    if (!isOpen) return;
    const hasUnread = notifications.some(n => !n.read);
    if (!hasUnread) return;
    const timer = window.setTimeout(() => {
      markAllNotificationsRead();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [isOpen, notifications, markAllNotificationsRead]);

  if (!isOpen) return null;

  const visibleNotifications = notifications.filter(n => {
    if (
      !consentPrefs.receiveCrossRoleAnnouncements &&
      currentRole &&
      n.targetRole !== currentRole &&
      n.category !== 'system'
    ) {
      return false;
    }
    if (filterMode === 'role' && currentRole) {
      return n.targetRole === currentRole || n.category === 'system';
    }
    return true;
  });

  const handleClose = () => {
    markAllNotificationsRead();
    clearViewedNotifications();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-end p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {language === 'ml' ? 'തത്സമയ അറിയിപ്പുകൾ' : 'Activity Notifications'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'ml'
                  ? 'കാണുമ്പോൾ സ്വയം മായ്ക്കപ്പെടുന്ന യഥാർത്ഥ അറിയിപ്പുകൾ'
                  : 'Real updates from your actions · auto-clears once seen'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Clear Read */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('role')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterMode === 'role' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {language === 'ml' ? 'ഈ റോൾ' : 'This Role'}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {language === 'ml' ? 'എല്ലാം' : 'All'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {visibleNotifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  markAllNotificationsRead();
                  clearViewedNotifications();
                }}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'മായ്ക്കുക' : 'Clear seen'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="text-xs font-semibold text-indigo-800 hover:text-indigo-950 inline-flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{language === 'ml' ? 'വായിച്ചു' : 'Mark read'}</span>
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {visibleNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-800">
                {language === 'ml' ? 'പുതിയ അറിയിപ്പുകളൊന്നുമില്ല.' : 'All caught up — zero pending alerts.'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'ml'
                  ? 'നിങ്ങൾ ചെക്ക്-ഇൻ, ക്വസ്റ്റ്, അല്ലെങ്കിൽ പരിശോധന പൂർത്തിയാക്കുമ്പോൾ ഇവിടെ പുതിയ അറിയിപ്പുകൾ വരും.'
                  : 'Real alerts only appear when you save check-ins, run assessments, finish quests, or create campaigns.'}
              </p>
            </div>
          ) : (
            visibleNotifications.map(item => (
              <div
                key={item.id}
                className={`p-4 transition-colors ${
                  item.read ? 'bg-white opacity-75' : 'bg-indigo-50/40'
                } hover:bg-slate-50`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="capitalize">{item.category}</span>
                    <span>·</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!item.read && (
                      <span className="text-amber-700 font-bold">· New</span>
                    )}
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1">
                  {language === 'ml' ? item.titleMl : item.title}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {language === 'ml' ? item.messageMl : item.message}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(item.id);
                      onNavigateDeepLink(item.targetRole, item.deepLinkTab);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-800 hover:text-indigo-950 cursor-pointer"
                  >
                    <span>{language === 'ml' ? 'തുറക്കുക' : 'Open section'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(item.id);
                      clearViewedNotifications();
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {language === 'ml' ? 'നീക്കം ചെയ്യുക' : 'Dismiss'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Privacy Footnote */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
          <span>
            {language === 'ml'
              ? 'കാണുന്ന അറിയിപ്പുകൾ അടയ്ക്കുമ്പോൾ സ്വയം നീക്കം ചെയ്യപ്പെടും.'
              : 'Seen notifications clear automatically when closed so your workspace stays quiet.'}
          </span>
        </div>
      </div>
    </div>
  );
};
