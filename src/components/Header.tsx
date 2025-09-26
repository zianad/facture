// Fix: Provide a functional Header component implementation.
import React from 'react';
import { Link } from 'react-router-dom';
// Fix: Correct paths to context hooks.
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// Fix: Implement Header component with navigation, auth state, and language selection.
const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <nav>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0, padding: 0 }}>
          <li><Link to="/invoice">Invoices</Link></li>
          <li><Link to="/inventory">Inventory</Link></li>
          {isAuthenticated && <li><Link to="/profile">Profile</Link></li>}
          {isAuthenticated && <li><Link to="/admin">Admin</Link></li>}
        </ul>
      </nav>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span>{t('greeting')}!</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}>
            <option value="en">English</option>
            <option value="fr">Français</option>
        </select>
        {isAuthenticated ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <Link to="/login"><button>Login</button></Link>
        )}
      </div>
    </header>
  );
};

export default Header;
