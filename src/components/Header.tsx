// Fix: Generating full content for the Header component.
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f0f0f0' }}>
            <nav>
                <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
                {isAuthenticated && (
                    <>
                        <Link to="/invoices" style={{ marginRight: '1rem' }}>{t('invoices')}</Link>
                        <Link to="/inventory" style={{ marginRight: '1rem' }}>{t('inventory')}</Link>
                        <Link to="/profile" style={{ marginRight: '1rem' }}>{t('profile')}</Link>
                        {user?.role === 'admin' && <Link to="/admin" style={{ marginRight: '1rem' }}>Admin</Link>}
                    </>
                )}
            </nav>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {isAuthenticated ? (
                    <>
                        <span style={{ marginRight: '1rem' }}>{t('welcomeMessage').replace('{username}', user?.username || '')}</span>
                        <button onClick={logout}>{t('logout')}</button>
                    </>
                ) : (
                     <Link to="/login">Login</Link>
                )}
                 <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'ar')} style={{ marginLeft: '1rem' }}>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                </select>
            </div>
        </header>
    );
};

export default Header;
