// Fix: Provide a functional LoginPage component implementation.
import React from 'react';
// Fix: Correct path to AuthContext.
import { useAuth } from '../context/AuthContext';

// Fix: Implement LoginPage component to demonstrate authentication flow.
const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();

  const handleLogin = () => {
    // In a real app, you'd have form fields and validation.
    // This is a simple simulation.
    login();
  };

  if (isAuthenticated) {
    return (
        <div>
            <h1>Already Logged In</h1>
            <p>You are already logged in. Navigate using the header.</p>
        </div>
    );
  }

  return (
    <div>
      <h1>Login</h1>
      <p>Please log in to continue to protected pages.</p>
      <button onClick={handleLogin}>Log In</button>
    </div>
  );
};

export default LoginPage;
