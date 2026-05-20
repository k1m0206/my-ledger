import { FormEvent, useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saveStoredToken } from '../auth';

interface RemoteLoginViewProps {
  passwordConfigured: boolean;
  onSuccess: () => void;
}

export function RemoteLoginView({ passwordConfigured, onSuccess }: RemoteLoginViewProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError(response.status === 401 ? t('remoteLogin.incorrectPassword') : t('remoteLogin.loginFailed'));
        return;
      }

      const data = await response.json();
      saveStoredToken(data.token, data.expires_at);
      onSuccess();
    } catch {
      setError(t('remoteLogin.connectionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#f0ede6] text-[#4a4a46] flex items-center justify-center px-6">
      <div className="w-full max-w-[380px] bg-[#fdfcfb] border border-white/70 shadow-[0_24px_64px_rgba(0,0,0,0.08)] rounded-[28px] p-7">
        <div className="w-12 h-12 rounded-2xl bg-[#8b9d83] text-white flex items-center justify-center mb-5">
          <Lock size={22} />
        </div>
        <h1 className="font-serif text-2xl mb-2">My Ledger</h1>
        <p className="text-sm text-gray-500 mb-6">
          {passwordConfigured ? t('remoteLogin.enterPassword') : t('remoteLogin.noPassword')}
        </p>

        {passwordConfigured ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full outline-none px-4 py-3 bg-[#f9f8f5] rounded-xl border border-transparent focus:border-[#8b9d83]/50"
              placeholder={t('remoteLogin.accessPassword')}
              autoFocus
            />
            {error && <p className="text-sm text-[#c05656]">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full bg-[#8b9d83] disabled:opacity-50 hover:bg-[#788871] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn size={18} />
              {submitting ? t('remoteLogin.verifying') : t('remoteLogin.enterLedger')}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 leading-6">
            {t('remoteLogin.setupHint')}
          </p>
        )}
      </div>
    </div>
  );
}
