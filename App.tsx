import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import LoginPage from './components/LoginPage';
import InventoryPage from './components/InventoryPage';
import InvoicePage from './components/InvoicePage';
import AdminPage from './components/AdminPage';
import ProfilePage from './components/ProfilePage';
import Header from './components/Header';

// A wrapper for protected routes
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <MainApp />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

const MainApp = () => {
  const { user } = useAuth();

  return (
    <div>
      {user && <Header />}
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
          <Route path="/invoices" element={<PrivateRoute><InvoicePage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
