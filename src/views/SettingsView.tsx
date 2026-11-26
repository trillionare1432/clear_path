import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings as SettingsIcon,
  UserCheck,
  Shield,
  Download,
  Upload,
  AlertTriangle,
  Lock,
  History,
  RefreshCw,
  CheckCircle2,
  PhoneCall,
} from 'lucide-react';

interface Props {
  onOpenRoleSwitcher: () => void;
}

interface AuditLogItem {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  timestamp: string;
}

export const SettingsView: React.FC<Props> = ({ onOpenRoleSwitcher }) => {
  const {
    currentRole,
    userProfile,
    language,
    setLanguage,
    exportBackup,
    importBackup,
    clearAllLocalData,
    dailyLogs,
    calendarEvents,
    goals,
    consentPrefs,
    updateConsentPrefs,
    serverAuthToken,
    serverAuthUser,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Server Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadAuditLogs = useCallback(async () => {
    if (!serverAuthToken) {
      setAuditLogs([]);
      return;
    }
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/audit/logs', {
        headers: { Authorization: `Bearer ${serverAuthToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
      }
    } catch {
      // ignore offline error
    } finally {
      setLoadingLogs(false);
    }
  }, [serverAuthToken]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const result = importBackup(content);
        if (result.success) {
          setImportStatus('Backup restored successfully!');
        } else {
          setImportStatus(`Import failed: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    exportBackup();
    setExportNotice('Vault backup JSON downloaded cleanly for this account scope.');
    window.setTimeout(() => setExportNotice(null), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>System, Consent &amp; Safeguarding</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Settings &amp; Privacy Control</h1>
        <p className="text-sm text-slate-600 mt-1">
          Control your role experience, consent boundaries, youth safeguarding standards, and encrypted local backup data.
        </p>
      </div>

      {/* Role & Personalization Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Role &amp; Experience</h2>

        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Active Mode
            </span>
            <div className="text-sm font-bold text-slate-900 capitalize mt-0.5">
              {currentRole === 'supporter'
                ? 'Role 02 — Support & Guide'
                : currentRole === 'learner'
                ? 'Role 03 — Understand & Learn'
                : currentRole === 'community'
                ? 'Role 04 — Community Builder'
                : currentRole === 'personal'
                ? 'Role 01 — Personal Journey'
                : 'Not Selected'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Switching roles preserves your scoped journal logs and goals safely on this device.
            </p>
          </div>

          <button
            onClick={onOpenRoleSwitcher}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Switch Role</span>
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Interface Language
            </span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {language === 'en' ? 'English (Universal)' : 'മലയാളം (Kerala Localized)'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Switch between English and Malayalam across all dashboards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                language === 'en' ? 'bg-indigo-800 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ml')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                language === 'ml' ? 'bg-indigo-800 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              മലയാളം
            </button>
          </div>
        </div>
      </div>

      {/* Part 9: Consent Management */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-800" />
          <h2 className="text-base font-bold text-slate-900">Granular Consent Management</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900">Verified Programme &amp; Support Updates</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Allow local notices when verified public workshops or support options update.
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(consentPrefs.receiveCrossRoleAnnouncements)}
              onChange={e => updateConsentPrefs({ receiveCrossRoleAnnouncements: e.target.checked })}
              className="mt-1 accent-teal-800 w-4 h-4"
            />
          </label>

          <label className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900">Optional Action Bridges Across Roles</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Permit explicit user-approved sharing snippets to your Care Relay or Therapist Report builder.
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(consentPrefs.allowOptionalActionBridges)}
              onChange={e => updateConsentPrefs({ allowOptionalActionBridges: e.target.checked })}
              className="mt-1 accent-teal-800 w-4 h-4"
            />
          </label>

          <label className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900">Anonymized Educational Learning Gaps</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Optional aggregate topic clarity percentages (never personal entries or identifiers).
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(consentPrefs.shareAnonymizedLearningGaps)}
              onChange={e => updateConsentPrefs({ shareAnonymizedLearningGaps: e.target.checked })}
              className="mt-1 accent-teal-800 w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Part 9: Youth (12–17) Confidentiality & Safeguarding Policy */}
      <div className="bg-white border border-amber-200 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-amber-950">
          <PhoneCall className="w-4 h-4 text-amber-700" />
          <h2 className="text-base font-bold">Youth (Ages 12–17) Confidentiality &amp; Safeguarding Policy</h2>
        </div>
        <p className="prose-readable-sm text-slate-700">
          ClearPath AI isolates every account and guest session in its own private storage vault.{' '}
          <strong>Parental or Supporter Mode access to a young person&apos;s private journals, screenings, or reflections is NOT automatically authorized</strong>{' '}
          — sharing occurs strictly only when the user explicitly selects items and confirms consent.
        </p>
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
          <div className="font-bold">Immediate Safeguarding &amp; Crisis Escalation:</div>
          <div>
            In situations involving acute medical risk, overdose, intoxication, or youth safety harm: call Kerala Emergency <strong>112</strong>, Childline India <strong>1098</strong> (24/7), or Vimukthi De-Addiction Helpline <strong>14405</strong> immediately.
          </div>
        </div>
      </div>

      {/* Privacy & Local Data Management Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Data Sovereignty &amp; Account-Scoped Backup</h2>

        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-slate-700 flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-indigo-950">Account-Isolated Local Vault: </span>
            Your journals, calendar entries, screenings, and goals stay scoped strictly to{' '}
            <strong>{userProfile ? `@${userProfile.username}` : 'your active guest session'}</strong>. Shared therapy reports can be revoked anytime from Get My Report.
          </div>
        </div>

        {/* Local Storage Stats */}
        <div className="grid grid-cols-3 gap-3 text-center p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">Saved Logs</span>
            <span className="font-bold text-slate-800">{dailyLogs.length}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Calendar Events</span>
            <span className="font-bold text-slate-800">{calendarEvents.length}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Active Goals</span>
            <span className="font-bold text-slate-800">{goals.length}</span>
          </div>
        </div>

        {/* Export & Import Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Backup (JSON File)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Restore Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {exportNotice && (
          <div className="text-xs p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {importStatus && (
          <div className="text-xs p-3 rounded-xl bg-slate-100 text-slate-800 font-medium">
            {importStatus}
          </div>
        )}

        {/* Wipe Data Option */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-rose-700">
              {userProfile ? `Wipe Data for @${userProfile.username}` : 'Wipe Guest Session Data'}
            </span>
            <p className="text-[11px] text-slate-500">
              Deletes local entries, goals, and history only for this {userProfile ? 'account' : 'guest session'}. Other accounts remain untouched.
            </p>
          </div>
          <button
            onClick={() => {
              setDeleteConfirmText('');
              setShowClearConfirm(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-xl shrink-0 cursor-pointer"
          >
            Wipe Data
          </button>
        </div>
      </div>

      {/* Part 9: Professional Access Audit Log Viewer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-800" />
            <h2 className="text-base font-bold text-slate-900">Professional Access &amp; Security Audit Log</h2>
          </div>
          {serverAuthToken && (
            <button
              type="button"
              onClick={loadAuditLogs}
              disabled={loadingLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          )}
        </div>

        {!serverAuthToken ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Sign in with a verified server account or portal credentials to inspect tamper-evident report view timestamps, consent grants, revocations, and blocked unauthorized attempts.
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {auditLogs.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-indigo-900">{log.action}</span>
                  <span className="text-slate-600 ml-2">{log.detail}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            No server audit events recorded yet for @{serverAuthUser?.username}.
          </div>
        )}
      </div>

      {/* Confirmation Modal for Data Wipe (Requires typing DELETE) */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Confirm Permanent Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently erase saved logs, goals, and calendar events for{' '}
              <strong>{userProfile ? `@${userProfile.username}` : 'Guest Session'}</strong> without affecting other accounts on this device.
            </p>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                onClick={() => {
                  clearAllLocalData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-rose-700 disabled:opacity-45 text-white rounded-xl text-xs font-semibold hover:bg-rose-800 cursor-pointer"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
