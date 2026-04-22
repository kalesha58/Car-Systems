import { Monitor, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { IMobileAccessGateProps } from './MobileAccessGate.interfaces';

const MOBILE_MAX_WIDTH_PX = 768;

const PUBLIC_MOBILE_PATHS = new Set<string>(['/delete-account']);

export const MobileAccessGate = ({ children }: IMobileAccessGateProps) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_MAX_WIDTH_PX);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_MAX_WIDTH_PX);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allowMobile = PUBLIC_MOBILE_PATHS.has(location.pathname);

  if (isMobile && !allowMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-slate-100">
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-white p-4 rounded-full shadow-sm border border-slate-100">
              <Monitor size={48} className="text-blue-600" />
              <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-1.5 rounded-full border-2 border-white">
                <Smartphone size={16} />
              </div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-3">Desktop View Required</h1>

          <p className="text-slate-600 mb-6 leading-relaxed text-sm">
            For the best experience and to perform operations securely, please access this admin panel using a desktop or
            laptop browser.
          </p>

          <div className="bg-blue-50 text-blue-800 text-xs font-medium px-4 py-3 rounded-lg border border-blue-100">
            Mobile access is currently restricted
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
