import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
    const { logout, user } = useAuth();
    
    // Basic styling for active NavLink
    const activeLinkStyle = {
        textDecoration: 'underline',
    };

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
            <nav style={{ display: 'flex', gap: '1rem' }}>
                <NavLink to="/" style={({ isActive }) => isActive ? activeLinkStyle : undefined }>Inventory</NavLink>
                <NavLink to="/invoices" style={({ isActive }) => isActive ? activeLinkStyle : undefined }>Invoices</NavLink>
                <NavLink to="/profile" style={({ isActive }) => isActive ? activeLinkStyle : undefined }>Profile</NavLink>
                <NavLink to="/admin" style={({ isActive }) => isActive ? activeLinkStyle : undefined }>Admin</NavLink>
            </nav>
            <div>
                <span>Welcome, {user?.username}</span>
                <button onClick={logout} style={{ marginLeft: '1rem' }}>Logout</button>
            </div>
        </header>
    );
};

export default Header;
