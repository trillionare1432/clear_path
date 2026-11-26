import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HeartHandshake,
  Search,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Building2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { VERIFIED_COMMUNITY_PARTNERS } from '../../constants/communityData';
import { KERALA_DISTRICTS } from '../../constants/communityData';

export const CommunityPartnersView: React.FC = () => {
  const { language } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = VERIFIED_COMMUNITY_PARTNERS.filter(partner => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.nameMl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDistrict =
      districtFilter === 'all' ||
      partner.district === districtFilter ||
      partner.district === 'Statewide';

    const matchesType = typeFilter === 'all' || partner.type === typeFilter;

    return matchesSearch && matchesDistrict && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>{language === 'ml' ? 'സഹായ ശൃംഖല' : 'Support Directory'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'കേരള വിമുക്തി & റഫറൽ കേന്ദ്രങ്ങൾ' : 'Kerala Support & Referral Partners'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ml'
              ? 'വിദ്യാർത്ഥികൾക്കും കുടുംബങ്ങൾക്കും അടിയന്തര വൈദ്യസഹായവും കൗൺസിലിംഗും നൽകുന്നതിനായുള്ള അംഗീകൃത കേന്ദ്രങ്ങൾ.'
              : 'Verified government de-addiction wards, Vimukthi Mission centres, and crisis helplines across Kerala.'}
          </p>
        </div>
      </div>

      {/* Emergency Helpline Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-teal-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Statewide 24/7 Crisis Helplines</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Immediate Clinical & Emergency Intervention Lines
            </h2>
            <p className="text-xs text-teal-100/80 max-w-xl">
              School principals, counsellors, and community coordinators can directly route students or families in acute distress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:14405"
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Vimukthi 14405</span>
            </a>
            <a
              href="tel:112"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Police Emergency 112</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by center name, location, or services offered..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
          />
        </div>

        {/* District Filter */}
        <select
          value={districtFilter}
          onChange={e => setDistrictFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-700"
        >
          <option value="all">All Districts</option>
          {KERALA_DISTRICTS.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-700"
        >
          <option value="all">All Center Types</option>
          <option value="government">Government / State Mission</option>
          <option value="district_hospital">District Hospital / Medical College</option>
          <option value="ngo">Registered NGO</option>
        </select>

        <span className="text-xs text-slate-400 font-mono ml-auto">
          {filtered.length} {filtered.length === 1 ? 'partner' : 'partners'}
        </span>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(partner => (
          <div
            key={partner.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {partner.district}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {partner.name}
                </h3>
                {language === 'ml' && (
                  <p className="text-xs text-teal-800 font-medium mt-0.5">{partner.nameMl}</p>
                )}
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{partner.address}</span>
                </p>
              </div>

              {/* Services List */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Key Clinical Services:
                </span>
                <ul className="space-y-1">
                  {partner.services.map((svc, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                      <span className="line-clamp-1">{svc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{partner.timing}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              {partner.tollFree ? (
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Toll Free:</span>
                  <span className="font-mono font-bold text-teal-800">{partner.tollFree}</span>
                </div>
              ) : (
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Contact:</span>
                  <span className="font-mono font-bold text-slate-800">{partner.phone}</span>
                </div>
              )}

              <a
                href={`tel:${partner.tollFree || partner.phone}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Center</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
