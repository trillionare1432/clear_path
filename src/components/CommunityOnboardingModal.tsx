import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users2,
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  School,
  Heart,
  Briefcase,
  Lock,
} from 'lucide-react';
import { CommunityOnboarding, CommunityOrgType, CommunityOrganisation } from '../types';
import { KERALA_DISTRICTS } from '../constants/communityData';

interface CommunityOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ServerOrgCategory =
  | 'healthcare'
  | 'programme_organizer'
  | 'educational_institution'
  | 'community_org';

export const CommunityOnboardingModal: React.FC<CommunityOnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { saveCommunityOnboarding, language, serverAuthToken } = useApp();

  const [step, setStep] = useState<1 | 2>(1);

  // Part 7A Permission Tier & Category
  const [roleResponsibility, setRoleResponsibility] = useState('');
  const [orgType, setOrgType] = useState<CommunityOrgType>('school');
  const [serverCategory, setServerCategory] = useState<ServerOrgCategory>('educational_institution');
  const [district, setDistrict] = useState('Ernakulam');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([
    'school_awareness',
    'youth_engagement',
  ]);
  const [mode] = useState<'create_workspace' | 'join_existing'>('create_workspace');

  // Org & Verification Details (Part 7A)
  const [orgName, setOrgName] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [verificationDocRef, setVerificationDocRef] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleObjective = (id: string) => {
    if (selectedObjectives.includes(id)) {
      setSelectedObjectives(selectedObjectives.filter(o => o !== id));
    } else {
      setSelectedObjectives([...selectedObjectives, id]);
    }
  };

  const objectiveOptions = [
    { id: 'school_awareness', label: 'School & College Awareness Drives', labelMl: 'സ്കൂൾ & കോളേജ് ബോധവൽക്കരണം' },
    { id: 'youth_engagement', label: 'Youth Peer Ambassador Training', labelMl: 'യുവജന പിയർ അംബാസഡർ പരിശീലനം' },
    { id: 'teacher_training', label: 'Educator & Teacher Early Recognition', labelMl: 'അധ്യാപക പരിശീലനം' },
    { id: 'family_dialogue', label: 'Parent & Community Dialogue Circles', labelMl: 'കുടുംബ-രക്ഷിതാക്കൾക്കുള്ള സംഭാഷണങ്ങൾ' },
    { id: 'clinical_linkage', label: 'Referral Bridges to Verified Kerala Centers', labelMl: 'ചികിത്സാ കേന്ദ്രങ്ങളുമായുള്ള ബന്ധം' },
    { id: 'restorative_policy', label: 'Restorative Student Support Policies', labelMl: 'വിദ്യാർത്ഥി സംരക്ഷണ നയങ്ങൾ' },
  ];

  const orgTypeOptions: {
    type: CommunityOrgType;
    serverCat: ServerOrgCategory;
    permissionNote: string;
    label: string;
    labelMl: string;
    icon: React.ElementType;
  }[] = [
    {
      type: 'institution',
      serverCat: 'healthcare',
      permissionNote: 'Service listings, referral bridges & aggregate district data (clinical access requires separate Therapist Portal auth)',
      label: 'Healthcare Professional / Clinical Desk',
      labelMl: 'ആരോഗ്യ വിദഗ്ധൻ / ക്ലിനിക്കൽ സ്ഥാപനം',
      icon: Building2,
    },
    {
      type: 'independent_educator',
      serverCat: 'programme_organizer',
      permissionNote: 'Publish & manage verified awareness events, workshops & pre/post evaluations',
      label: 'Programme Organizer / Prevention Educator',
      labelMl: 'പ്രോഗ്രാം ഓർഗനൈസർ / എഡ്യൂക്കേറ്റർ',
      icon: Briefcase,
    },
    {
      type: 'school',
      serverCat: 'educational_institution',
      permissionNote: 'Campus clubs, educator workshops, and student prevention resource scheduling',
      label: 'Educational Institution (School / College)',
      labelMl: 'വിദ്യാഭ്യാസ സ്ഥാപനം (സ്കൂൾ / കോളേജ്)',
      icon: School,
    },
    {
      type: 'ngo',
      serverCat: 'community_org',
      permissionNote: 'Community drives, volunteer task tracking, and public awareness campaigns',
      label: 'NGO / Community Organization',
      labelMl: 'എൻ.ജി.ഒ / കമ്മ്യൂണിറ്റി സംഘടന',
      icon: Heart,
    },
    {
      type: 'community_group',
      serverCat: 'community_org',
      permissionNote: 'Neighbourhood drives, parent dialogues, and event coordination',
      label: 'Youth Club / Residents Association',
      labelMl: 'റസിഡൻസ് അസോസിയേഷൻ / ക്ലബ്ബ്',
      icon: Users2,
    },
  ];

  const selectedTierMeta = orgTypeOptions.find(o => o.type === orgType) || orgTypeOptions[0];

  const handleComplete = async () => {
    setSubmitting(true);
    const resolvedOrgName =
      orgName.trim() ||
      (orgType === 'school' ? 'Kerala Model Campus Prevention Hub' : 'District Prevention Network');
    const resolvedRole = roleResponsibility.trim() || 'Community Coordinator';
    const resolvedIntendedUse =
      description.trim() || 'Active community programme for substance prevention and youth support.';

    const onboardingData: CommunityOnboarding = {
      roleResponsibility: resolvedRole,
      orgType,
      district,
      objectives: selectedObjectives,
      language,
      mode,
      completed: true,
    };

    const orgData: Partial<CommunityOrganisation> = {
      name: resolvedOrgName,
      type: orgType,
      district,
      coordinatorName: coordinatorName.trim() || 'Lead Coordinator',
      coordinatorDesignation: resolvedRole,
      coordinatorPhone: coordinatorPhone.trim(),
      description: resolvedIntendedUse,
    };

    if (serverAuthToken) {
      try {
        await fetch('/api/community/orgs/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serverAuthToken}`,
          },
          body: JSON.stringify({
            name: resolvedOrgName,
            district,
            category: serverCategory,
            professionalRole: resolvedRole,
            contactEmail: contactEmail.trim() || undefined,
            contactPhone: coordinatorPhone.trim() || undefined,
            verificationDocRef: verificationDocRef.trim() || undefined,
            intendedUse: resolvedIntendedUse,
          }),
        });
      } catch {
        // Local workspace initialization continues cleanly even if network call fails
      }
    }

    saveCommunityOnboarding(onboardingData, orgData);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Users2 className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-teal-700">
                {language === 'ml' ? 'കമ്മ്യൂണിറ്റി സജ്ജീകരണം' : 'Part 7A · Organization & Professional Setup'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {language === 'ml' ? 'വർക്ക്‌സ്‌പേസ് കോൺഫിഗറേഷൻ' : 'Community & Professionals'}
              </h2>
            </div>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono">
            Step {step} of 2
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-5 pt-5">
            <p className="text-sm text-slate-600">
              {language === 'ml'
                ? 'നിങ്ങളുടെ കമ്മ്യൂണിറ്റി, സ്കൂൾ അല്ലെങ്കിൽ ഓർഗനൈസേഷന്റെ പ്രതിരോധ പ്രവർത്തനങ്ങൾ ചിട്ടപ്പെടുത്തുന്നതിനായി വിവരങ്ങൾ രേഖപ്പെടുത്തുക.'
                : 'Select your permission tier to coordinate prevention drives, programmes, and aggregated district analytics.'}
            </p>

            {/* Part 7A Permission Category Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {language === 'ml' ? 'ഓർഗനൈസേഷൻ / പ്രൊഫഷണൽ വിഭാഗം' : 'Organization & Permission Category'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {orgTypeOptions.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = orgType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        setOrgType(opt.type);
                        setServerCategory(opt.serverCat);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-semibold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-teal-700' : 'text-slate-400'}`} />
                      <span className="text-xs">{language === 'ml' ? opt.labelMl : opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Permission scope:</strong> {selectedTierMeta.permissionNote}. Platform Administrators verify organizations via the separate Admin Portal login.
                </span>
              </div>
            </div>

            {/* User's Role & Operating District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'ml' ? 'നിങ്ങളുടെ പദവി / ചുമതല' : 'Your Professional Role *'}
                </label>
                <input
                  type="text"
                  value={roleResponsibility}
                  onChange={e => setRoleResponsibility(e.target.value)}
                  placeholder={
                    language === 'ml'
                      ? 'ഉദാ: പ്രോഗ്രാം കോർഡിനേറ്റർ, അധ്യാപകൻ'
                      : 'e.g. Programme Coordinator, NSS Officer, Principal'
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'ml' ? 'പ്രവർത്തന ജില്ല' : 'Operating District (Kerala)'}
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 appearance-none bg-white pr-8"
                  >
                    {KERALA_DISTRICTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Prevention Objectives Multi-Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {language === 'ml' ? 'പ്രധാന പ്രതിരോധ ലക്ഷ്യങ്ങൾ' : 'Primary Prevention Objectives'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {objectiveOptions.map(obj => {
                  const checked = selectedObjectives.includes(obj.id);
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => toggleObjective(obj.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        checked
                          ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-medium'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                          checked
                            ? 'bg-teal-700 border-teal-700 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs">{language === 'ml' ? obj.labelMl : obj.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>{language === 'ml' ? 'തുടരുക' : 'Continue to Verification Details'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-5">
            <p className="text-sm text-slate-600">
              {language === 'ml'
                ? 'നിങ്ങളുടെ ഓർഗനൈസേഷന്റെ ഔദ്യോഗിക പേരും വിവരങ്ങളും രേഖപ്പെടുത്തുക.'
                : 'Provide organization contact and verification details. Public programme listings require Administrator approval.'}
            </p>

            {/* Organisation Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'ml' ? 'സ്ഥാപനത്തിന്റെ / ഗ്രൂപ്പിന്റെ പേര് *' : 'Organization or Institution Name *'}
              </label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder={
                  language === 'ml'
                    ? 'ഉദാ: സെന്റ് മേരീസ് എച്ച്.എസ്.എസ് വിമുക്തി ക്ലബ്ബ്'
                    : 'e.g. St. Teresa College Prevention Council or Kozhikode Youth Forum'
                }
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Coordinator & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Coordinator / Lead Name
                </label>
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={e => setCoordinatorName(e.target.value)}
                  placeholder="e.g. Dr. Thomas Mathew"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="e.g. outreach@institution.org"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={coordinatorPhone}
                  onChange={e => setCoordinatorPhone(e.target.value)}
                  placeholder="e.g. +91 94470 00000"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Verification Registration / ID Ref
                </label>
                <input
                  type="text"
                  value={verificationDocRef}
                  onChange={e => setVerificationDocRef(e.target.value)}
                  placeholder="e.g. NGO-KL-2026-041 / UDISE / NMC ID"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Intended Use */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'ml' ? 'പ്രവർത്തന വിവരണം' : 'Intended Use of ClearPath Platform'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={
                  language === 'ml'
                    ? 'വിദ്യാർത്ഥികൾക്കും യുവാക്കൾക്കുമിടയിൽ ലഹരിവിരുദ്ധ ബോധവൽക്കരണവും പിന്തുണയും നൽകുക.'
                    : 'Coordinating campus awareness seminars, teacher orientation, and anonymous pre/post knowledge evaluations.'
                }
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Non-identifying privacy pledge */}
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/60 flex items-start gap-3 text-xs text-teal-900">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Strict Data Boundary: </span>
                Role 04 workspaces never access private Recover &amp; Rebuild screenings, daily mood logs, or personal health records.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {language === 'ml' ? 'പിന്നോട്ട്' : 'Back'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleComplete}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-teal-300" />
                <span>{submitting ? 'Saving...' : 'Initialize Workspace'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
