export async function copyPhoneToClipboard(number: string): Promise<boolean> {
  const clean = number.replace(/[^0-9+]/g, '') || number;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(clean);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = clean;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export const VERIFIED_HELPLINES = [
  {
    id: 'vimukthi',
    name: 'Kerala Vimukthi Helpline',
    nameMl: 'കേരള വിമുക്തി ഹെൽപ്പ്‌ലൈൻ',
    desc: '24/7 Toll-Free De-Addiction & Family Guidance',
    descMl: '24/7 സൗജന്യ കൗൺസിലിംഗും ചികിത്സാ സഹായവും',
    number: '14405',
  },
  {
    id: 'disha',
    name: 'DISHA Kerala Health',
    nameMl: 'ദിശ (DISHA) ആരോഗ്യ സഹായം',
    desc: '24/7 Psychological & Tele-Health Counseling',
    descMl: '24/7 മാനസികാരോഗ്യ കൗൺസിലിംഗ്',
    number: '1056',
  },
  {
    id: 'childline',
    name: 'Childline Youth Support',
    nameMl: 'ചൈൽഡ്‌ലൈൻ യുവജന സഹായം',
    desc: '24/7 Care for Students & Minors Under 18',
    descMl: 'വിദ്യാർത്ഥികൾക്കുള്ള അടിയന്തര സുരക്ഷാ നമ്പർ',
    number: '1098',
  },
  {
    id: 'emergency',
    name: 'National Emergency',
    nameMl: 'അടിയന്തര സഹായം (112)',
    desc: 'Immediate Medical / Ambulance / Police Dispatch',
    descMl: 'അടിയന്തര മെഡിക്കൽ, ആംബുലൻസ് സേവനം',
    number: '112',
  },
] as const;
