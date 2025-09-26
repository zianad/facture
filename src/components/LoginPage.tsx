// Fix: Generating full content for the LoginPage component.
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // This is a mock login. In a real app, you would call an API.
        if (username && password) {
            const mockUser: User = {
                id: '1',
                username: username,
                email: `${username}@example.com`,
                role: username.toLowerCase() === 'admin' ? 'admin' : 'user',
            };
            login(mockUser);
        } else {
            alert('Please enter username and password');
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin or any other username"
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default LoginPage;
