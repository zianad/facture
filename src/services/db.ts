// Fix: Generating full content for the mock database service.
// This is a mock database service.
// In a real application, this would interact with a database like IndexedDB, localStorage, or a remote API.

import { User } from "../types";

const users: User[] = [
    { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin' },
    { id: '2', username: 'user', email: 'user@example.com', role: 'user' },
];

export const db = {
    users: {
        findByUsername: async (username: string): Promise<User | undefined> => {
            return users.find(u => u.username === username);
        }
    }
};
