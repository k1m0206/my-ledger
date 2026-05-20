import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeView } from './components/HomeView';
import { AddLedgerView } from './components/AddLedgerView';
import { SettingsView } from './components/SettingsView';
import { RemoteLoginView } from './components/RemoteLoginView';
import { AuthStatus, authHeaders } from './auth';

export default function App() {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<'home' | 'add' | 'settings'>('home');
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const checkAuth = async () => {
    setCheckingAuth(true);
    try {
      const response = await fetch('/api/auth/status', { headers: authHeaders() });
      const data = await response.json();
      setAuthStatus(data);
    } catch {
      setAuthStatus(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (checkingAuth) {
    return (
      <div className="h-[100dvh] bg-[#f0ede6] text-[#4a4a46] flex items-center justify-center">
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (!authStatus?.authenticated) {
    return (
      <RemoteLoginView
        passwordConfigured={Boolean(authStatus?.password_configured)}
        onSuccess={checkAuth}
      />
    );
  }

  return (
    <div className="h-[100dvh] bg-[#f0ede6] text-[#4a4a46] flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Desk Atmosphere */}
      <div className="hidden lg:block absolute top-12 left-12 opacity-40">
        <div className="text-4xl font-serif italic text-[#8b9d83]">My Ledger</div>
        <div className="text-xs tracking-widest uppercase mt-1">Personal Finance Dashboard</div>
      </div>

      {/* Main App Container. Full size on small screens, expanded window on lg+ */}
      <div className="w-full h-full lg:h-[800px] lg:max-w-[1100px] lg:rounded-[32px] lg:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] lg:border border-white/50 bg-[#fdfcfb] flex flex-col relative overflow-hidden">

        <div className="flex-1 w-full relative h-full overflow-hidden">
          {currentView === 'home' && (
            <HomeView
              onAddClick={() => setCurrentView('add')}
              onSettingsClick={() => setCurrentView('settings')}
            />
          )}

          {currentView === 'add' && (
            <AddLedgerView
              onBack={() => setCurrentView('home')}
              onSuccess={() => setCurrentView('home')}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              onBack={() => setCurrentView('home')}
            />
          )}
        </div>

      </div>
    </div>
  );
}
