import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Fix: Use relative paths for imports
import { AuthProvider, useAuth } from './context/AuthContext';
// Fix: Use relative paths for imports
import { LanguageProvider } from '../context/LanguageContext';

// Page components
// Fix: Use relative paths for imports
import Header from './components/Header';
// Fix: Use relative paths for imports
import LoginPage from './components/LoginPage';
// Fix: Use relative paths for imports
import InvoicePage from '../components/InvoicePage';
// Fix: Use relative paths for imports
import InventoryPage from '../components/InventoryPage';
// Fix: Use relative paths for imports
import ProfilePage from '../components/ProfilePage';
// Fix: Use relative paths for imports
import AdminPage from '../components/AdminPage';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <LanguageProvider>
        <AuthProvider>
            <BrowserRouter>
                <Header />
                <main style={{ padding: '1rem' }}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/invoice" replace />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/invoice" element={
                            <ProtectedRoute>
                                <InvoicePage />
                            </ProtectedRoute>
                        } />
                        <Route path="/inventory" element={
                            <ProtectedRoute>
                                <InventoryPage />
                            </ProtectedRoute>
                        } />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute>
                                    <AdminPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/invoice" replace />} />
                    </Routes>
                </main>
            </BrowserRouter>
        </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
