import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  subtitle?: string;
  darkSurface?: boolean;
  hideSubtitleMobile?: boolean;
}

export const ClearPathLogo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  subtitle,
  darkSurface = false,
  hideSubtitleMobile = false,
}) => {
  const iconDims =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';

  const titleClass =
    size === 'lg'
      ? 'text-xl font-extrabold tracking-tight'
      : size === 'sm'
      ? 'text-sm font-extrabold tracking-tight'
      : 'text-base font-extrabold tracking-tight';

  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      {/* Bespoke ClearPath AI Emblem: Sculpted Deep Indigo Prism Shield + Ascending Sunrise Amber Horizon */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDims} shrink-0 drop-shadow-xs`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cpIndigoGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>
          <linearGradient id="cpAmberPath" x1="12" y1="33" x2="29" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
        </defs>

        {/* Rounded Octagonal / Prism Frame */}
        <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#cpIndigoGrad)" />
        <rect
          x="2.75"
          y="2.75"
          width="34.5"
          height="34.5"
          rx="10.25"
          stroke={darkSurface ? 'rgba(255,255,255,0.22)' : 'rgba(199,210,254,0.35)'}
          strokeWidth="1.25"
        />

        {/* Subtle Indigo Concentric Arcs */}
        <path
          d="M9 28.5C12.2 21.8 18.8 17.5 29.5 16.5"
          stroke="rgba(165,180,252,0.35)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Ascending Sunrise Amber Pathway */}
        <path
          d="M11 31C14.8 25.5 18.6 20.6 25.2 13.5"
          stroke="url(#cpAmberPath)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Clean Directional Chevron + Dawn Apex */}
        <path
          d="M21 12.2H27.2V18.4"
          stroke="#FBBF24"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11.2" cy="30.8" r="2.2" fill="#FDE68A" />
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-0.5 whitespace-nowrap">
            <span className={`${titleClass} ${darkSurface ? 'text-white' : 'text-indigo-950'}`}>
              ClearPath
            </span>
            <span className={`${titleClass} ${darkSurface ? 'text-amber-400' : 'text-amber-600'}`}>
              AI
            </span>
          </div>
          {subtitle && (
            <span
              className={`text-[10px] font-semibold tracking-wide mt-0.5 whitespace-nowrap ${
                size === 'sm' || hideSubtitleMobile ? 'hidden sm:block ' : ''
              }${
                darkSurface ? 'text-indigo-200/80' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
