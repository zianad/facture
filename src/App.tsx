// Fix: Generating full content for the main App component.
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import InvoicePage from './components/InvoicePage';
import InventoryPage from './components/InventoryPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import { User } from './types';

const HomePage = () => {
    const { isAuthenticated, user } = useAuth();
    return (
        <div>
            <h1>Home</h1>
            {isAuthenticated ? <p>Welcome back, {user?.username}!</p> : <p>Please log in.</p>}
        </div>
    );
};

interface ProtectedRouteProps {
    children: React.ReactElement;
    roles?: User['role'][];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (roles && user && !roles.includes(user.role)) {
         return <Navigate to="/" replace />;
    }

    return children;
};

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return (
        <Router>
            <Header />
            <main style={{ padding: '1rem' }}>
                <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
                    
                    <Route path="/" element={<HomePage />} />

                    <Route path="/invoices" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
                    <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    
                    <Route path="/admin" element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminPage />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </Router>
    );
}

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </LanguageProvider>
    );
};

export default App;
