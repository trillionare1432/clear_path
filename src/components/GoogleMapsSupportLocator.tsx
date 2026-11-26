import React, { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { SupportCenter, UnifiedDirectoryCategory, UnifiedDirectoryItem } from '../types';
import {
  PhoneCall,
  Navigation,
  ShieldCheck,
  ExternalLink,
  HeartPulse,
  Building2,
  UserCheck,
  Users,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface MapMarkerEntity {
  id: string;
  name: string;
  category: UnifiedDirectoryCategory;
  categoryLabel: string;
  district: string;
  address: string;
  phone?: string;
  hours?: string;
  coordinates: { lat: number; lng: number };
  verifiedBy?: string;
  centerRef?: SupportCenter;
}

interface Props {
  centers: SupportCenter[];
  unifiedItems?: UnifiedDirectoryItem[];
  activeUnifiedCategory?: 'all' | UnifiedDirectoryCategory;
  selectedCenter?: SupportCenter | null;
  onSelectCenter: (center: SupportCenter) => void;
  heightClassName?: string;
}

const CATEGORY_STYLE: Record<
  UnifiedDirectoryCategory,
  { label: string; pinBg: string; badgeClass: string; Icon: React.FC<{ className?: string }> }
> = {
  rehabilitation: {
    label: 'Rehab Centre',
    pinBg: 'bg-teal-700 text-white',
    badgeClass: 'text-teal-800 bg-teal-50 border-teal-200',
    Icon: Building2,
  },
  hospital_emergency: {
    label: 'Hospital & 24/7 Care',
    pinBg: 'bg-indigo-900 text-amber-300',
    badgeClass: 'text-indigo-900 bg-indigo-50 border-indigo-200',
    Icon: HeartPulse,
  },
  qualified_professional: {
    label: 'Verified Professional',
    pinBg: 'bg-purple-800 text-white',
    badgeClass: 'text-purple-900 bg-purple-50 border-purple-200',
    Icon: UserCheck,
  },
  community_programme: {
    label: 'Community Programme',
    pinBg: 'bg-emerald-700 text-white',
    badgeClass: 'text-emerald-900 bg-emerald-50 border-emerald-200',
    Icon: Users,
  },
  education_skills: {
    label: 'Sports, Education & Skills',
    pinBg: 'bg-amber-600 text-white',
    badgeClass: 'text-amber-900 bg-amber-50 border-amber-200',
    Icon: GraduationCap,
  },
};

export const GoogleMapsSupportLocator: React.FC<Props> = ({
  centers,
  unifiedItems = [],
  activeUnifiedCategory = 'all',
  selectedCenter,
  onSelectCenter,
  heightClassName = 'h-[460px]',
}) => {
  const { language, t } = useApp();
  const [activeMarker, setActiveMarker] = useState<MapMarkerEntity | null>(null);
  const [mapAuthFailed, setMapAuthFailed] = useState(false);

  const apiKey = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const hasValidApiKey = /^AIza[0-9A-Za-z_-]{20,}$/.test(apiKey);
  const canRenderInteractiveMap = hasValidApiKey && !mapAuthFailed;

  useEffect(() => {
    const handleMapError = () => setMapAuthFailed(true);
    window.addEventListener('gmp-map-auth-error', handleMapError);
    window.addEventListener('gmp-quota-exceeded', handleMapError);
    return () => {
      window.removeEventListener('gmp-map-auth-error', handleMapError);
      window.removeEventListener('gmp-quota-exceeded', handleMapError);
    };
  }, []);

  const markers = useMemo<MapMarkerEntity[]>(() => {
    const markerMap = new globalThis.Map<string, MapMarkerEntity>();

    if (
      activeUnifiedCategory === 'all' ||
      activeUnifiedCategory === 'hospital_emergency' ||
      activeUnifiedCategory === 'rehabilitation'
    ) {
      centers.forEach(c => {
        const mappedCat: UnifiedDirectoryCategory =
          c.category === 'rehabilitation' || c.category === 'aftercare'
            ? 'rehabilitation'
            : 'hospital_emergency';
        if (activeUnifiedCategory !== 'all' && mappedCat !== activeUnifiedCategory) return;
        markerMap.set(`center-${c.id}`, {
          id: `center-${c.id}`,
          name: c.name,
          category: mappedCat,
          categoryLabel: c.isGovt ? 'Govt. Care Centre' : 'Verified Care Partner',
          district: c.district,
          address: c.address,
          phone: c.phone,
          hours: c.openingHours,
          coordinates: c.coordinates,
          verifiedBy: c.sourceOfVerification || 'Govt. Directory',
          centerRef: c,
        });
      });
    }

    unifiedItems.forEach(item => {
      if (!item.coordinates) return;
      if (activeUnifiedCategory !== 'all' && item.category !== activeUnifiedCategory) return;
      const key = `unified-${item.id}`;
      if (!markerMap.has(key)) {
        const styleMeta = CATEGORY_STYLE[item.category];
        markerMap.set(key, {
          id: key,
          name: item.name,
          category: item.category,
          categoryLabel: item.categoryLabel || styleMeta?.label || item.category,
          district: item.district,
          address: item.address,
          phone: item.phone || undefined,
          hours: item.hours,
          coordinates: item.coordinates,
          verifiedBy: item.sourceLabel || item.verifiedStatus || 'Verified',
        });
      }
    });

    return Array.from(markerMap.values());
  }, [centers, unifiedItems, activeUnifiedCategory]);

  const highlightedMarker = useMemo(() => {
    if (activeMarker) return activeMarker;
    if (selectedCenter) {
      return markers.find(m => m.centerRef?.id === selectedCenter.id) || null;
    }
    return null;
  }, [activeMarker, selectedCenter, markers]);

  const defaultCenter = selectedCenter
    ? selectedCenter.coordinates
    : { lat: 10.16, lng: 76.34 };

  return (
    <div className={`w-full ${heightClassName} relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-100 flex flex-col`}>
      {canRenderInteractiveMap ? (
        <APIProvider apiKey={apiKey} language={language === 'ml' ? 'ml' : 'en'} region="IN">
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={selectedCenter ? 12 : 8}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {markers.map(marker => {
              const style = CATEGORY_STYLE[marker.category] || CATEGORY_STYLE.hospital_emergency;
              const IconComp = style.Icon;
              const isSelected = highlightedMarker?.id === marker.id;
              return (
                <AdvancedMarker
                  key={marker.id}
                  position={marker.coordinates}
                  title={`${marker.name} (${marker.categoryLabel})`}
                  onClick={() => {
                    setActiveMarker(marker);
                    if (marker.centerRef) {
                      onSelectCenter(marker.centerRef);
                    }
                  }}
                >
                  <div
                    className={`p-2 rounded-2xl shadow-md transition-transform hover:scale-110 cursor-pointer flex items-center justify-center ring-2 ring-white ${
                      style.pinBg
                    } ${isSelected ? 'scale-125 ring-4 ring-amber-400' : ''}`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                </AdvancedMarker>
              );
            })}

            {highlightedMarker && (
              <InfoWindow
                position={highlightedMarker.coordinates}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div className="p-2 max-w-xs text-slate-800 space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{highlightedMarker.categoryLabel}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    {highlightedMarker.name}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {highlightedMarker.address} · {highlightedMarker.district}
                  </p>
                  {highlightedMarker.hours && (
                    <p className="text-xs text-slate-500">{highlightedMarker.hours}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    {highlightedMarker.phone && (
                      <a
                        href={`tel:${highlightedMarker.phone.replace(/\s+/g, '')}`}
                        className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
                        <span>{language === 'ml' ? 'വിളിക്കുക' : 'Call'}</span>
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${highlightedMarker.coordinates.lat},${highlightedMarker.coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Navigation className="w-3.5 h-3.5 text-indigo-700" />
                      <span>{language === 'ml' ? 'വഴി' : 'Directions'}</span>
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      ) : (
        <div className="w-full h-full p-5 sm:p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {t('mapsTitle')}
              </span>
            </div>
            <span className="text-xs text-slate-200 font-semibold">
              {markers.length} {language === 'ml' ? 'കേന്ദ്രങ്ങൾ സജീവം' : 'Verified Locations Shown'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-4 overflow-y-auto max-h-[300px] pr-1">
            {markers.slice(0, 6).map(m => (
              <div
                key={m.id}
                onClick={() => {
                  setActiveMarker(m);
                  if (m.centerRef) onSelectCenter(m.centerRef);
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all space-y-1.5 ${
                  highlightedMarker?.id === m.id
                    ? 'bg-indigo-800/70 border-amber-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-amber-300 font-semibold">
                  <span>{m.district}</span>
                  <span className="truncate">{m.categoryLabel}</span>
                </div>
                <h5 className="text-sm font-bold text-white line-clamp-1">{m.name}</h5>
                <p className="text-xs text-slate-300 line-clamp-1">{m.address}</p>
                <div className="flex items-center gap-2 pt-1.5 border-t border-white/10 text-xs">
                  {m.phone && (
                    <a
                      href={`tel:${m.phone.replace(/\s+/g, '')}`}
                      onClick={e => e.stopPropagation()}
                      className="font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{m.phone}</span>
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${m.coordinates.lat},${m.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="ml-auto text-slate-200 hover:text-white inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Directions</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 pt-2 border-t border-white/10">
            <span>Public Verified Kerala Services Only · Private user locations are never shown on maps</span>
            <span className="text-amber-300 font-mono">Kerala 8.5°–12.5° N</span>
          </div>
        </div>
      )}
    </div>
  );
};
