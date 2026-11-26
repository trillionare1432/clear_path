import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { hashString, verifyHash } from '../utils/security';
import {
  X,
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  RotateCcw,
  AlertCircle,
  Stethoscope,
  Shield,
} from 'lucide-react';
import { ClearPathLogo } from './ClearPathLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup' | 'therapist' | 'admin';
  intendedRole?: 'personal' | 'supporter' | 'learner' | 'community' | null;
  onSuccess?: () => void;
}

const mapRoleToReason = (
  role?: 'personal' | 'supporter' | 'learner' | 'community' | null
): UserProfile['primaryReason'] => {
  if (role === 'supporter') return 'supporter';
  if (role === 'learner') return 'learner';
  if (role === 'community') return 'community';
  return 'recovery';
};

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
  intendedRole = null,
  onSuccess,
}) => {
  const {
    currentRole,
    userProfile,
    saveUserProfile,
    logoutUser,
    resetGuestVault,
    setServerSession,
    setPortalMode,
    serverAuthUser,
    clearServerSession,
    language,
    t,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'therapist' | 'admin'>(defaultMode);
  const [therapistSubMode, setTherapistSubMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // User Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageRange, setAgeRange] = useState<UserProfile['ageRange']>('young_adult');
  const [primaryReason, setPrimaryReason] = useState<UserProfile['primaryReason']>(
    mapRoleToReason(intendedRole)
  );
  const [securityQuestion, setSecurityQuestion] = useState(
    'What is your favourite childhood place or first school?'
  );
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Therapist extra fields
  const [therapistEmail, setTherapistEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [professionalCategory, setProfessionalCategory] = useState<
    | 'psychiatrist'
    | 'clinical_psychologist'
    | 'medical_practitioner'
    | 'psychiatric_social_worker'
    | 'qualified_counsellor'
    | 'other'
  >('clinical_psychologist');
  const [qualifications, setQualifications] = useState('');
  const [institution, setInstitution] = useState('');
  const [supportingDocRef, setSupportingDocRef] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('Addiction Counselling & CBT');
  const [district, setDistrict] = useState('Ernakulam');
  const [bio, setBio] = useState('');

  // Password reset fields
  const [resetUsername, setResetUsername] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetVerified, setResetVerified] = useState(false);
  const [authorityCode, setAuthorityCode] = useState('');
  const [therapistQuickCode, setTherapistQuickCode] = useState('');
  const [adminQuickCode, setAdminQuickCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      const urlHasAdmin =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('portal') === 'admin';
      setMode(urlHasAdmin ? 'admin' : defaultMode);
      setPrimaryReason(mapRoleToReason(intendedRole));
      setError(null);
      setSuccessMsg(null);
      setName('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setSecurityAnswer('');
      setTherapistEmail('');
      setContactPhone('');
      setProfessionalCategory('clinical_psychologist');
      setQualifications('');
      setInstitution('');
      setSupportingDocRef('');
      setSaveAsDraft(false);
      setLicenseNumber('');
      setBio('');
      setAuthorityCode('');
      setTherapistQuickCode('');
      setAdminQuickCode('');
      setResetUsername('');
      setResetAnswer('');
      setNewPassword('');
      setResetVerified(false);
    }
  }, [isOpen, defaultMode, intendedRole]);

  if (!isOpen) return null;

  const resolveRoleFromReason = (reason: UserProfile['primaryReason']): 'personal' | 'supporter' | 'learner' | 'community' => {
    if (intendedRole) return intendedRole;
    if (currentRole) return currentRole;
    if (reason === 'supporter') return 'supporter';
    if (reason === 'learner') return 'learner';
    if (reason === 'community') return 'community';
    return 'personal';
  };

  // Sync standard user credentials with server auth seamlessly
  const syncUserBackendSession = async (
    uname: string,
    pwd: string,
    displayName?: string,
    age?: string
  ) => {
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password: pwd }),
      });
      if (loginRes.ok) {
        const data = await loginRes.json();
        if (data.token && data.user) setServerSession(data.token, data.user);
        return data;
      }
      if (displayName) {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: uname,
            name: displayName,
            password: pwd,
            role: 'user',
            ageRange: age,
          }),
        });
        if (regRes.ok) {
          const data = await regRes.json();
          if (data.token && data.user) setServerSession(data.token, data.user);
          return data;
        }
      }
    } catch {
      // Offline graceful fallback
    }
    return null;
  };

  // Handle Standard User Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const stored = localStorage.getItem('clearpath_registered_users');
      const users: UserProfile[] = stored ? JSON.parse(stored) : [];
      const unameClean = username.trim().toLowerCase();

      const found = users.find(u => u.username.toLowerCase() === unameClean);

      if (found) {
        const isMatch = await verifyHash(password, found.passwordHash);
        if (!isMatch) {
          setError(t('invalidCredentials'));
          setSubmitting(false);
          return;
        }
        const preservedRole =
          intendedRole ||
          currentRole ||
          found.lastSelectedRole ||
          resolveRoleFromReason(found.primaryReason);

        const updated: UserProfile = {
          ...found,
          lastSelectedRole: preservedRole,
          lastLoginAt: new Date().toISOString(),
        };
        await syncUserBackendSession(unameClean, password, updated.name, updated.ageRange);
        setPortalMode('none');
        saveUserProfile(updated);
        setSuccessMsg(t('loginSuccess'));
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 500);
        return;
      }

      // If not in browser localStorage yet, verify directly against server backend
      const srvRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: unameClean, password }),
      });
      if (!srvRes.ok) {
        setError(t('invalidCredentials'));
        setSubmitting(false);
        return;
      }
      const srvData = await srvRes.json();
      setServerSession(srvData.token, srvData.user);

      if (srvData.user.role === 'therapist') {
        setPortalMode('therapist');
        onClose();
        return;
      }
      if (srvData.user.role === 'admin') {
        setPortalMode('admin');
        onClose();
        return;
      }

      const pwdHash = await hashString(password);
      const hydratedProfile: UserProfile = {
        id: srvData.user.id,
        name: srvData.user.name,
        username: srvData.user.username,
        passwordHash: pwdHash,
        ageRange: 'young_adult',
        language,
        primaryReason: mapRoleToReason(intendedRole),
        lastSelectedRole: intendedRole || currentRole || 'personal',
        securityQuestion,
        securityAnswerHash: pwdHash,
        createdAt: srvData.user.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      users.push(hydratedProfile);
      localStorage.setItem('clearpath_registered_users', JSON.stringify(users));
      setPortalMode('none');
      saveUserProfile(hydratedProfile);
      setSuccessMsg(t('loginSuccess'));
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Standard User Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a preferred name or pseudonym.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!securityAnswer.trim()) {
      setError('Please answer the security question for safe recovery.');
      return;
    }

    setSubmitting(true);
    try {
      const unameClean = username.trim().toLowerCase();
      const stored = localStorage.getItem('clearpath_registered_users');
      const users: UserProfile[] = stored ? JSON.parse(stored) : [];

      if (users.some(u => u.username.toLowerCase() === unameClean)) {
        setError('This handle is already taken. Please choose another.');
        setSubmitting(false);
        return;
      }

      // Attempt backend user creation first so IDs align cleanly
      let serverId = `user-${Date.now()}`;
      try {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: unameClean,
            name: name.trim(),
            password,
            role: 'user',
            ageRange,
          }),
        });
        if (regRes.status === 409) {
          setError('This username is already registered on the server.');
          setSubmitting(false);
          return;
        }
        if (regRes.ok) {
          const data = await regRes.json();
          if (data.token && data.user) {
            setServerSession(data.token, data.user);
            serverId = data.user.id;
          }
        }
      } catch {
        // Offline local creation preserved
      }

      const [pwdHash, answerHash] = await Promise.all([
        hashString(password),
        hashString(securityAnswer.toLowerCase().trim()),
      ]);

      const resolvedRole = resolveRoleFromReason(primaryReason);
      const newProfile: UserProfile = {
        id: serverId,
        name: name.trim(),
        username: unameClean,
        passwordHash: pwdHash,
        ageRange,
        language,
        primaryReason,
        lastSelectedRole: resolvedRole,
        securityQuestion,
        securityAnswerHash: answerHash,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      users.push(newProfile);
      localStorage.setItem('clearpath_registered_users', JSON.stringify(users));
      setPortalMode('none');
      saveUserProfile(newProfile, { isNewSignup: true });
      setSuccessMsg(t('accountCreatedSuccess'));
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 600);
    } catch {
      setError('Could not complete account creation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Therapist Portal Sign-In / Application
  const handleTherapistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (therapistSubMode === 'signup') {
        const needsCouncilLicense =
          professionalCategory === 'psychiatrist' ||
          professionalCategory === 'clinical_psychologist' ||
          professionalCategory === 'medical_practitioner';

        if (!name.trim() || !username.trim() || password.length < 6) {
          setError('Full name, username, and password (6+ chars) are required.');
          setSubmitting(false);
          return;
        }
        if (!saveAsDraft && !therapistQuickCode && needsCouncilLicense && !licenseNumber.trim()) {
          setError('Medical practitioners, psychiatrists, and clinical psychologists must provide a valid council registration/license number unless saving a draft or using a restricted verification code.');
          setSubmitting(false);
          return;
        }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            username: username.trim().toLowerCase(),
            email: therapistEmail.trim() || undefined,
            contactPhone: contactPhone.trim() || undefined,
            password,
            role: 'therapist',
            professionalCategory,
            qualifications: qualifications.trim() || undefined,
            licenseNumber: licenseNumber.trim() || undefined,
            institution: institution.trim() || undefined,
            areaOfPractice: specialization.trim(),
            specialization: specialization.trim(),
            district,
            supportingDocRef: supportingDocRef.trim() || undefined,
            saveDraft: saveAsDraft,
            quickCode: therapistQuickCode || undefined,
            bio: bio.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Could not register therapist account.');
          setSubmitting(false);
          return;
        }
        setServerSession(data.token, data.user);
        setPortalMode('therapist');
        setSuccessMsg(
          data.user?.verificationStatus === 'approved'
            ? 'Restricted therapist verification accepted. Opening your Clinical Dashboard...'
            : saveAsDraft
            ? 'Clinician draft saved (Registration Incomplete). You can enter your verification code inside the portal.'
            : 'Clinician registration submitted. You can verify inside the portal or await admin approval.'
        );
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 500);
        return;
      }

      const rawName = username.trim();
      const rawCode = authorityCode.trim();
      if (rawName.length < 2 || !rawCode) {
        setError('Please enter Clinician Name / Username and Quick Access Code.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/auth/therapist-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: rawName,
          name: rawName,
          authorityCode: rawCode,
          seedSamplePatients: rawCode !== 'iamtherapist',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not sign into Therapist Dashboard.');
        setSubmitting(false);
        return;
      }
      setServerSession(data.token, data.user);
      setPortalMode('therapist');
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      setError('Network error while connecting to Therapist Portal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Admin Quick Access ('I am admin') with optional Admin Name
  const handleAdminQuickAccess = async (codeValue: string, adminName?: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/admin-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeValue,
          name: adminName?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid administrator quick access code.');
        setSubmitting(false);
        return;
      }
      setServerSession(data.token, data.user);
      setPortalMode('admin');
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      setError('Unable to reach Admin Quick Access.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Admin Portal Sign-In (Name + Quick Access Code)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminNameClean = (name || username).trim();
    if (!adminNameClean || adminNameClean.length < 2) {
      setError('Please enter your Admin Name.');
      return;
    }
    if (!adminQuickCode.trim()) {
      setError('Please enter your Admin Quick Access Code.');
      return;
    }
    await handleAdminQuickAccess(adminQuickCode, adminNameClean);
  };

  // Handle Password Recovery
  const handleVerifySecurityAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const stored = localStorage.getItem('clearpath_registered_users');
    const users: UserProfile[] = stored ? JSON.parse(stored) : [];
    const found = users.find(u => u.username.toLowerCase() === resetUsername.trim().toLowerCase());
    if (!found) {
      setError('No profile found with that handle.');
      return;
    }
    const isMatch = await verifyHash(resetAnswer.toLowerCase().trim(), found.securityAnswerHash);
    if (!isMatch) {
      setError('Incorrect security answer.');
      return;
    }
    setResetVerified(true);
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    const stored = localStorage.getItem('clearpath_registered_users');
    const users: UserProfile[] = stored ? JSON.parse(stored) : [];
    const userIndex = users.findIndex(u => u.username.toLowerCase() === resetUsername.trim().toLowerCase());
    if (userIndex === -1) {
      setError('Profile could not be found.');
      return;
    }
    users[userIndex].passwordHash = await hashString(newPassword);
    localStorage.setItem('clearpath_registered_users', JSON.stringify(users));
    setSuccessMsg(t('passwordResetSuccess'));
    setTimeout(() => {
      setMode('signin');
      setResetVerified(false);
      setSuccessMsg(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <ClearPathLogo size="md" showWordmark={false} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {mode === 'therapist'
              ? 'Therapist Clinical Portal'
              : mode === 'admin'
              ? 'Platform Verification Admin'
              : mode === 'signup'
              ? t('createYourAccount')
              : mode === 'signin'
              ? t('welcomeBack')
              : t('resetPassword')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {mode === 'therapist'
              ? 'Separate professional login. Verification approval is required before viewing authorized client reports.'
              : mode === 'admin'
              ? 'Authorized administrator access to review clinician licenses, organizations, and audit logs.'
              : t('accountDesc')}
          </p>
        </div>

        {/* Active Session Banner */}
        {(userProfile || serverAuthUser) && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="font-bold text-indigo-950 truncate">
                Signed in as {serverAuthUser?.name || userProfile?.name} (@{serverAuthUser?.username || userProfile?.username})
              </div>
              <div className="text-[11px] text-indigo-800/80">
                {serverAuthUser?.role === 'therapist'
                  ? `Clinical status: ${serverAuthUser.verificationStatus}`
                  : serverAuthUser?.role === 'admin'
                  ? 'Administrator session active'
                  : 'Private browser vault + server sync active'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logoutUser();
                clearServerSession();
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-indigo-200 hover:bg-rose-50 hover:text-rose-700 text-indigo-950 font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Error / Success Banners */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Portal Mode Navigation Tabs (Admin stays strictly non-public) */}
        {mode !== 'forgot' && mode !== 'admin' && (
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl mb-5 text-[11px] font-bold gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('therapist');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1 ${
                mode === 'therapist' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Stethoscope className="w-3 h-3" />
              <span>Therapist</span>
            </button>
          </div>
        )}

        {/* Standard Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('usernameLabel')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. arun_phoenix"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">{t('passwordLabel')}</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                  }}
                  className="text-[11px] font-semibold text-indigo-800 hover:underline cursor-pointer"
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-900 hover:bg-indigo-950 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Signing in...' : t('signIn')}</span>
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Verified clinician or counsellor?</span>
              <button
                type="button"
                onClick={() => {
                  setMode('therapist');
                  setError(null);
                }}
                className="font-bold text-indigo-800 hover:underline cursor-pointer"
              >
                Therapist Portal
              </button>
            </div>
          </form>
        )}

        {/* Standard Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('preferredName')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('preferredNamePlaceholder')}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('usernameLabel')} *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. arun_phoenix"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('passwordLabel')} *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 chars"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('confirmPassword')} *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('ageRangeLabel')}
                </label>
                <select
                  value={ageRange}
                  onChange={e => setAgeRange(e.target.value as UserProfile['ageRange'])}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="youth">{t('ageYouth')}</option>
                  <option value="young_adult">{t('ageYoungAdult')}</option>
                  <option value="adult">{t('ageAdult')}</option>
                  <option value="senior">{t('ageSenior')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('primaryReasonLabel')}
                </label>
                <select
                  value={primaryReason}
                  onChange={e => setPrimaryReason(e.target.value as UserProfile['primaryReason'])}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="recovery">{t('reasonRecovery')}</option>
                  <option value="supporter">{t('reasonSupporter')}</option>
                  <option value="learner">{t('reasonLearner')}</option>
                  <option value="community">{t('reasonCommunity')}</option>
                  <option value="general">{t('reasonGeneral')}</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <KeyRound className="w-3.5 h-3.5 text-indigo-700" />
                <span>{t('securityQuestionLabel')}</span>
              </div>
              <input
                type="text"
                value={securityQuestion}
                onChange={e => setSecurityQuestion(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              />
              <input
                type="text"
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                placeholder="Secret answer (encrypted with SHA-256)"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-900 hover:bg-indigo-950 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Creating Account...' : t('signUp')}</span>
            </button>
          </form>
        )}

        {/* Therapist Portal Login / Registration */}
        {mode === 'therapist' && (
          <form onSubmit={handleTherapistSubmit} className="space-y-4">
            <div className="flex gap-2 p-1 bg-indigo-50 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTherapistSubMode('signin')}
                className={`flex-1 py-1.5 rounded-lg cursor-pointer ${
                  therapistSubMode === 'signin' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-indigo-700'
                }`}
              >
                Clinician Sign In
              </button>
              <button
                type="button"
                onClick={() => setTherapistSubMode('signup')}
                className={`flex-1 py-1.5 rounded-lg cursor-pointer ${
                  therapistSubMode === 'signup' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-indigo-700'
                }`}
              >
                Register Clinician (Requires Approval)
              </button>
            </div>

            {therapistSubMode === 'signup' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinician Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Dr. Ananya Menon"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Professional Category *
                    </label>
                    <select
                      value={professionalCategory}
                      onChange={e =>
                        setProfessionalCategory(
                          e.target.value as
                            | 'psychiatrist'
                            | 'clinical_psychologist'
                            | 'medical_practitioner'
                            | 'psychiatric_social_worker'
                            | 'qualified_counsellor'
                            | 'other'
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    >
                      <option value="clinical_psychologist">Clinical Psychologist (RCI)</option>
                      <option value="psychiatrist">Psychiatrist (NMC / State)</option>
                      <option value="medical_practitioner">Medical Practitioner</option>
                      <option value="psychiatric_social_worker">Psychiatric Social Worker</option>
                      <option value="qualified_counsellor">Qualified Addiction / Mental Health Counsellor</option>
                      <option value="other">Other Allied Specialist</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Council / License Number{' '}
                      {(professionalCategory === 'psychiatrist' ||
                        professionalCategory === 'clinical_psychologist' ||
                        professionalCategory === 'medical_practitioner') &&
                      !saveAsDraft
                        ? '*'
                        : '(optional for non-regulated roles)'}
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      placeholder="RCI / NMC / Kerala Medical Council ID"
                      required={
                        !saveAsDraft &&
                        (professionalCategory === 'psychiatrist' ||
                          professionalCategory === 'clinical_psychologist' ||
                          professionalCategory === 'medical_practitioner')
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qualifications
                    </label>
                    <input
                      type="text"
                      value={qualifications}
                      onChange={e => setQualifications(e.target.value)}
                      placeholder="e.g. M.Phil Clinical Psychology / MD"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Area of Practice *
                    </label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={e => setSpecialization(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      District / Region
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Institution / Clinic
                    </label>
                    <input
                      type="text"
                      value={institution}
                      onChange={e => setInstitution(e.target.value)}
                      placeholder="Hospital, clinic, or independent practice"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Supporting Verification Doc Ref
                    </label>
                    <input
                      type="text"
                      value={supportingDocRef}
                      onChange={e => setSupportingDocRef(e.target.value)}
                      placeholder="Certificate Ref / Registry URL / File ID"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Email (optional)
                    </label>
                    <input
                      type="email"
                      value={therapistEmail}
                      onChange={e => setTherapistEmail(e.target.value)}
                      placeholder="clinician@hospital.org"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone (optional)
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="+91 ..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>
              </>
            )}

            {therapistSubMode === 'signin' ? (
              <>
                <div className="p-3.5 rounded-2xl bg-[#4A154B]/5 border border-[#4A154B]/20 space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-[#4A154B] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Restricted Clinician Portal Access</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Enter your Clinician Name and Quick Access Code (<strong>iamtherapist</strong> or your own custom clinic code) to open your Clinical Dashboard directly.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinician Name or Username *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. Dr. Ananya Menon"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quick Access Code *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#059669] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={authorityCode}
                      onChange={e => setAuthorityCode(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                      placeholder="Enter iamtherapist or your custom code"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8FC] border border-[#4A154B]/25 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#059669]/30"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="dr_ananya"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Access Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {therapistSubMode === 'signup' && (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Restricted Quick Verification Code (optional — skips pending queue)
                  </label>
                  <input
                    type="text"
                    value={therapistQuickCode}
                    onChange={e => setTherapistQuickCode(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Lowercase restricted therapist code (no spaces) if provided"
                    className="w-full px-3 py-2 bg-[#FAF8FC] border border-[#059669]/40 rounded-xl text-xs text-slate-900 font-mono"
                  />
                </div>
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsDraft}
                    onChange={e => setSaveAsDraft(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Save as Incomplete Draft</strong> — Create account now and complete license or quick code inside the Therapist Portal.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#4A154B] hover:bg-[#3A103B] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-emerald-300" />
              <span>
                {submitting
                  ? 'Connecting...'
                  : therapistSubMode === 'signup'
                  ? therapistQuickCode
                    ? 'Create & Verify Clinician Dashboard'
                    : saveAsDraft
                    ? 'Save Clinician Draft'
                    : 'Submit Clinician Application'
                  : 'Open Therapist Clinical Dashboard'}
              </span>
            </button>
          </form>
        )}

        {/* Admin Portal Sign-In (2 Fields: Name + Quick Access Code) */}
        {mode === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-950">
              Platform Creator &amp; Governance Admin Console — audit who signed in &amp; when, approve clinicians, manage therapist work scope &amp; app controls, and explore all roles without separate sign-ups.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Creator Admin"
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Quick Access Code *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-teal-700 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminQuickCode}
                  onChange={e => setAdminQuickCode(e.target.value)}
                  placeholder="Enter admin quick access code..."
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-teal-50/60 border border-teal-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-teal-900 hover:bg-teal-950 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-300" />
              <span>{submitting ? 'Verifying...' : 'Open Verification Admin Console'}</span>
            </button>
          </form>
        )}

        {/* Forgot Password Flow */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            {!resetVerified ? (
              <form onSubmit={handleVerifySecurityAnswer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('usernameLabel')}
                  </label>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={e => setResetUsername(e.target.value)}
                    placeholder="Enter your username / handle"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('enterSecurityAnswer')}
                  </label>
                  <input
                    type="text"
                    value={resetAnswer}
                    onChange={e => setResetAnswer(e.target.value)}
                    placeholder="Your secret answer"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    {t('back')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Verify Answer
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('newPasswordLabel')}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save New Password
                </button>
              </form>
            )}
          </div>
        )}

        {/* Guest Continue / Clean Guest Session Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-center">
          <button
            type="button"
            onClick={() => {
              if (userProfile) logoutUser();
              onClose();
            }}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
          >
            {userProfile ? 'Switch to Guest Workspace' : t('guestContinue')}
          </button>

          <button
            type="button"
            onClick={() => {
              resetGuestVault();
              onClose();
            }}
            className="text-xs text-slate-500 hover:text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Start Clean Guest Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
