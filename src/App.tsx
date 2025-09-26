// Fix: Provide a functional App component implementation.
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
// Fix: Correct paths to components based on the provided file structure.
import InvoicePage from '../components/InvoicePage';
import InventoryPage from '../components/InventoryPage';
import AdminPage from '../components/AdminPage';
import ProfilePage from '../components/ProfilePage';
import LoginPage from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Fix: Create a ProtectedRoute component to handle authentication for specific routes.
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        // In a real app, you might redirect to a login page using useNavigate
        return <LoginPage />;
    }
    return children;
};

// Fix: Abstract main content into AppContent to ensure hooks like useAuth are called within their provider's scope.
function AppContent() {
  return (
    <Router>
      <Header />
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invoice" element={<InvoicePage />} />

          <Route path="/inventory" element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<InvoicePage />} /> {/* Default page */}
        </Routes>
      </main>
    </Router>
  );
}

// Fix: Main App component now wraps content with AuthProvider.
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
