import React, { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from './context/AuthContext';
import { useTranslation } from './context/LanguageContext';
import { db } from './services/db';
import type { Item, InvoiceData } from './types';

import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import InventoryPage from './components/InventoryPage';
import InvoicePage from './components/InvoicePage';
import ProfilePage from './components/ProfilePage';

// Sidebar component is included here to avoid creating new files.
const Sidebar: React.FC<{
  currentPage: string;
  setCurrentPage: (page: 'inventory' | 'invoice' | 'profile') => void;
  logout: () => void;
  username: string;
}> = ({ currentPage, setCurrentPage, logout, username }) => {
  const { t, language, changeLanguage } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(e.target.value as 'ar' | 'fr');
  };
  
  const navItems = [
    { id: 'inventory', label: t('inventoryPageTitle') },
    { id: 'invoice', label: t('invoicePageTitle') },
    { id: 'profile', label: t('profilePageTitle') },
  ];

  return (
    <div className="w-64 h-screen bg-slate-800 text-white flex flex-col fixed">
        <div className="p-4 border-b border-slate-700">
            <h1 className="text-2xl font-bold">{t('appTitle')}</h1>
            <p className="text-sm text-slate-400">{t('welcomeMessage', { username })}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as 'inventory' | 'invoice' | 'profile')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                        currentPage === item.id
                            ? 'bg-blue-600'
                            : 'hover:bg-slate-700'
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-4">
            <div>
              <label htmlFor="language-select" className="text-sm text-slate-400 block mb-1">{t('languageLabel')}</label>
              <select
                id="language-select"
                value={language}
                onChange={handleLanguageChange}
                className="w-full p-2 rounded-md bg-slate-700 text-white border border-slate-600 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <button
                onClick={logout}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
                {t('logoutButton')}
            </button>
        </div>
    </div>
  );
};


type Page = 'inventory' | 'invoice' | 'profile' | 'admin' | 'login';

function App() {
  const { currentUser, logout } = useAuth();
  // We use a separate 'view' state to manage top-level views like login/admin vs the main app's internal page.
  const [view, setView] = useState<Page>(currentUser ? 'inventory' : 'login');
  const [currentPage, setCurrentPage] = useState<'inventory' | 'invoice' | 'profile'>('inventory');
  
  const inventory = useLiveQuery(() => 
    currentUser ? db.inventory.where('userId').equals(currentUser.id).toArray() : [],
    [currentUser]
  ) || [];

  const invoices = useLiveQuery(() => 
    currentUser ? db.invoices.where('userId').equals(currentUser.id).toArray() : [],
    [currentUser]
  ) || [];
  
  const handleSetCurrentPage = (page: 'inventory' | 'invoice' | 'profile') => {
    setCurrentPage(page);
    setView(page);
  };
  
  // --- Inventory Management ---
  const addItem = useCallback(async (item: Omit<Item, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newItem: Item = {
      ...item,
      id: crypto.randomUUID(),
      userId: currentUser.id
    };
    await db.inventory.add(newItem);
  }, [currentUser]);

  const addMultipleItems = useCallback(async (items: Omit<Item, 'id' | 'userId'>[]) => {
    if (!currentUser) return;
    const newItems: Item[] = items.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      userId: currentUser.id
    }));
    await db.inventory.bulkAdd(newItems);
  }, [currentUser]);

  const removeItem = useCallback(async (id: string) => {
    await db.inventory.delete(id);
  }, []);

  const updateItem = useCallback(async (id: string, updatedData: Partial<Omit<Item, 'id' | 'userId'>>) => {
    await db.inventory.update(id, updatedData);
  }, []);


  // --- Invoice Management ---
  const addInvoice = useCallback(async (invoice: Omit<InvoiceData, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newInvoice: InvoiceData = {
      ...invoice,
      id: crypto.randomUUID(),
      userId: currentUser.id
    };
    await db.invoices.add(newInvoice);
  }, [currentUser]);

  const removeInvoice = useCallback(async (id: string) => {
    await db.invoices.delete(id);
  }, []);
  
  const updateInvoice = useCallback(async (id: string, updatedData: Partial<Omit<InvoiceData, 'id' | 'userId'>>) => {
      await db.invoices.update(id, updatedData);
  }, []);

  if (!currentUser) {
      if (view === 'admin') {
          return <AdminPage navigateToApp={() => setView('login')} />;
      }
      return <LoginPage navigateToAdmin={() => setView('admin')} />;
  }


  const renderContent = () => {
    switch (currentPage) {
      case 'inventory':
        return <InventoryPage
          inventory={inventory}
          addItem={addItem}
          addMultipleItems={addMultipleItems}
          removeItem={removeItem}
          updateItem={updateItem}
          navigateToInvoice={() => handleSetCurrentPage('invoice')}
        />;
      case 'invoice':
        return <InvoicePage 
          inventory={inventory}
          invoices={invoices}
          addInvoice={addInvoice}
          removeInvoice={removeInvoice}
          updateInvoice={updateInvoice}
          currentUser={currentUser}
          navigateToInventory={() => handleSetCurrentPage('inventory')}
        />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <InventoryPage
          inventory={inventory}
          addItem={addItem}
          addMultipleItems={addMultipleItems}
          removeItem={removeItem}
          updateItem={updateItem}
          navigateToInvoice={() => handleSetCurrentPage('invoice')}
        />;
    }
  };

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={handleSetCurrentPage}
        logout={() => {
          logout();
          setView('login');
        }} 
        username={currentUser.username}
      />
      <main className="flex-1 p-6" style={{ marginLeft: '16rem' }}> {/* ml-64 equivalent */}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;