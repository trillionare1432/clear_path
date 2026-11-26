import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Maps Platform Auth & Quota Handler
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-map-auth-error'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map(a => String(a)).join(' ');
  if (
    msg.includes('InvalidKeyMapError') ||
    msg.includes('ApiNotActivatedMapError') ||
    msg.includes('RefererNotAllowedMapError')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-map-auth-error'));
  } else if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(<App />);
