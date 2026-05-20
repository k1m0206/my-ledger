import { useState, useEffect } from 'react';
import { ArrowLeft, KeyRound, Wifi, WifiOff, ChevronRight, Tags } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../auth';
import { CategorySettings } from './CategorySettings';
import { useToast } from '../toast';

interface SettingsViewProps {
  onBack: () => void;
}

interface Settings {
  lan_access: boolean;
  password_configured: boolean;
  access_password: string | null;
  token_ttl_hours: number;
  is_local: boolean;
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Settings>({
    lan_access: false,
    password_configured: false,
    access_password: null,
    token_ttl_hours: 168,
    is_local: false,
  });
  const [loading, setLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [showCategorySettings, setShowCategorySettings] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchIpAddress();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await authFetch('/api/settings/');
      const data = await res.json();
      setSettings(data);
      setAccessPassword(data.access_password || '');
    } catch (e) {
      console.error('Failed to fetch settings');
      showToast(t('settings.settingsLoadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchIpAddress = async () => {
    try {
      const res = await authFetch('/api/settings/ip');
      const data = await res.json();
      setIpAddress(data.ip);
    } catch (e) {
      console.error('Failed to fetch IP');
    }
  };

  const toggleLanAccess = async () => {
    const newValue = !settings.lan_access;
    try {
      const res = await authFetch('/api/settings/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lan_access: newValue }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      showToast(t('settings.settingsFailed'), 'error');
    }
  };

  const savePassword = async () => {
    try {
      const res = await authFetch('/api/settings/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_password: accessPassword }),
      });
      const data = await res.json();
      setSettings(data);
      setAccessPassword(data.access_password || '');
      showToast(t('settings.passwordSaved'), 'success');
    } catch (e) {
      showToast(t('settings.passwordSaveFailed'), 'error');
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (showCategorySettings) {
    return <CategorySettings onBack={() => setShowCategorySettings(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-[#fdfcfb] z-30 absolute inset-0 text-[#4a4a46] items-center">
      <div className="w-full lg:max-w-[450px] lg:border-l lg:border-r border-[#e5e5e5] h-full flex flex-col bg-[#fdfcfb]">
        {/* Header */}
        <div className="bg-[#fdfcfb] px-6 py-6 flex items-center border-b border-[#f0ede6]">
          <button onClick={onBack} className="p-2 -ml-2 text-[#8b9d83] hover:bg-[#f0ede6] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-serif font-medium flex-1 text-center pr-8">{t('settings.title')}</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto w-full px-6 py-6">
          <div className="space-y-6">
            {/* Language Switcher */}
            <div className="bg-[#f9f8f5] p-5 rounded-2xl">
              <p className="font-semibold mb-3">{t('settings.language')}</p>
              <div className="flex bg-white p-1 rounded-xl">
                <button
                  onClick={() => changeLanguage('zh')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${i18n.language === 'zh' ? 'bg-[#8b9d83] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t('settings.chinese')}
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${i18n.language === 'en' ? 'bg-[#8b9d83] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t('settings.english')}
                </button>
              </div>
            </div>

            {/* LAN Access Toggle */}
            <div className="bg-[#f9f8f5] p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.lan_access ? (
                    <Wifi size={24} className="text-[#8b9d83]" />
                  ) : (
                    <WifiOff size={24} className="text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold">{t('settings.lanAccess')}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {settings.lan_access ? t('settings.enabled') : t('settings.disabled')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleLanAccess}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.lan_access ? 'bg-[#8b9d83]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      settings.lan_access ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* LAN Access Details */}
              {settings.lan_access && ipAddress && (
                <div className="mt-5 pt-4 border-t border-[#e5e5e5] space-y-4">
                  {/* Access URLs */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-2">{t('settings.accessAddress')}</p>
                    <div className="space-y-2">
                      <p className="text-sm bg-white px-3 py-2 rounded-lg">
                        http://127.0.0.1:3000
                      </p>
                      <p className="text-sm bg-white px-3 py-2 rounded-lg">
                        http://{ipAddress}:3000
                      </p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <p className="text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-3">{t('settings.scanToAccess')}</p>
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=http://${ipAddress}:3000`}
                        alt={t('settings.qrAlt')}
                        width={180}
                        height={180}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">{t('settings.scanHint')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* LAN Access Password */}
            {settings.is_local && settings.lan_access && (
              <div className="bg-[#f9f8f5] p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <KeyRound size={24} className="text-[#8b9d83]" />
                  <div>
                    <p className="font-semibold">{t('settings.lanPassword')}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {settings.password_configured
                        ? t('settings.tokenValid', { hours: settings.token_ttl_hours })
                        : t('settings.notSet')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accessPassword}
                    onChange={(event) => setAccessPassword(event.target.value)}
                    className="flex-1 min-w-0 text-sm outline-none px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#8b9d83]/50 transition-colors shadow-sm"
                    placeholder={t('settings.setPassword')}
                  />
                  <button
                    onClick={savePassword}
                    className="px-4 py-2 bg-[#8b9d83] hover:bg-[#788871] text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            )}

            {/* Category Settings Link */}
            <button
              onClick={() => setShowCategorySettings(true)}
              className="w-full bg-[#f9f8f5] p-5 rounded-2xl flex items-center justify-between hover:bg-[#f0ede6] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Tags size={24} className="text-[#8b9d83]" />
                <div className="text-left">
                  <p className="font-semibold">{t('settings.categorySettings')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('settings.categoryDesc')}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            {/* Info */}
            <div className="bg-[#f9f8f5] p-5 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-2">{t('settings.instructions')}</p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• {t('settings.lanNote1')}</li>
                <li>• {t('settings.lanNote2')}</li>
                <li>• {t('settings.lanNote3')}</li>
                <li>• {t('settings.lanNote4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
