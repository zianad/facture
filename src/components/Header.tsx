import React from 'react';
import { Link } from 'react-router-dom';
// Fix: Use relative paths for imports
import { useAuth } from '../context/AuthContext';
// Fix: Use relative paths for imports
import { useLanguage } from '../../context/LanguageContext';

const Header: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as 'en' | 'fr' | 'ar');
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc', alignItems: 'center' }}>
      <nav>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0, padding: 0 }}>
          <li><Link to="/invoice">{t('invoices')}</Link></li>
          <li><Link to="/inventory">{t('inventory')}</Link></li>
          {isAuthenticated && <li><Link to="/profile">{t('profile')}</Link></li>}
        </ul>
      </nav>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
         {isAuthenticated && user && <span>{t('welcomeMessage').replace('{username}', user.username)}</span>}
        <select value={language} onChange={handleLanguageChange}>
            {/* Fix: Add English language option */}
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
        </select>
        {isAuthenticated ? (
          <button onClick={logout}>{t('logout')}</button>
        ) : (
          <Link to="/login"><button>Login</button></Link>
        )}
      </div>
    </header>
  );
};

export default Header;
