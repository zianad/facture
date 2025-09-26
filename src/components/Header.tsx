// Fix: Implement the Header component with navigation, user info, and language switcher.
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, setLanguage, language } = useLanguage();

  const activeLinkStyle = {
    textDecoration: 'underline',
    fontWeight: 'bold',
  };

  const navLinkStyle = {
      color: 'blue',
      textDecoration: 'none'
  }

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc', alignItems: 'center' }}>
      <nav>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '1rem' }}>
          <li>
            <NavLink to="/invoice" style={({ isActive }) => ({...navLinkStyle, ...(isActive ? activeLinkStyle : {})})}>
              {t('invoices')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/inventory" style={({ isActive }) => ({...navLinkStyle, ...(isActive ? activeLinkStyle : {})})}>
              {t('inventory')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" style={({ isActive }) => ({...navLinkStyle, ...(isActive ? activeLinkStyle : {})})}>
              {t('profile')}
            </NavLink>
          </li>
        </ul>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>{t('welcomeMessage').replace('{username}', user?.username || 'User')}</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
        </select>
        <button onClick={logout}>{t('logout')}</button>
      </div>
    </header>
  );
};

export default Header;
