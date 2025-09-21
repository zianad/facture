import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

interface LoginPageProps {
  navigateToAdmin: () => void;
}

const SUPER_ADMIN_PASSWORD = '0000';

const LoginPage: React.FC<LoginPageProps> = ({ navigateToAdmin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === SUPER_ADMIN_PASSWORD) {
      navigateToAdmin();
      return;
    }
    
    const success = await login(password, false); // rememberMe is handled by AuthContext now
    if (!success) {
      setError(t('loginFailedError'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-slate-700">{t('loginTitle')}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password"className="block mb-2 text-sm font-medium text-slate-600">
              {t('passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('loginButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;