import React, { useState, useEffect } from 'react';
import type { Item, InvoiceData } from './types';
import InventoryPage from './components/InventoryPage';
import InvoicePage from './components/InvoicePage';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import ProfilePage from './components/ProfilePage';
import { useTranslation } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import { db } from './services/db';

type Page = 'inventory' | 'invoice' | 'profile';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('inventory');
  const [view, setView] = useState<'app' | 'admin'>('app');

  const { currentUser, logout } = useAuth();
  
  const [inventory, setInventory] = useState<Item[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  
  const { t, language, changeLanguage } = useTranslation();

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          const userInventory = await db.inventory.where({ userId: currentUser.id }).toArray();
          setInventory(userInventory);
          
          const userInvoices = await db.invoices.where({ userId: currentUser.id }).toArray();
          setInvoices(userInvoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));

          setCurrentPage('inventory');
          setView('app');
        } catch (error) {
          console.error("Failed to load user data from IndexedDB", error);
        }
      } else {
        // Clear data on logout
        setInventory([]);
        setInvoices([]);
      }
    };

    loadUserData();
  }, [currentUser]);


  const addItemToInventory = async (item: Omit<Item, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newItem: Item = { ...item, id: `${Date.now()}-${Math.random()}`, userId: currentUser.id };
    await db.inventory.add(newItem);
    setInventory(prev => [...prev, newItem]);
  };

  const addMultipleItemsToInventory = async (items: Omit<Item, 'id' | 'userId'>[]) => {
    if (!currentUser || items.length === 0) return;
    const newItems: Item[] = items.map(item => ({
      ...item,
      id: `${Date.now()}-${Math.random()}-${item.reference}`,
      userId: currentUser.id,
    }));
    await db.inventory.bulkAdd(newItems);
    setInventory(prev => [...prev, ...newItems]);
  };
  
  const removeItemFromInventory = async (id: string) => {
    await db.inventory.delete(id);
    setInventory(prev => prev.filter(item => item.id !== id));
  }

  const updateItemInInventory = async (id: string, updatedData: Partial<Omit<Item, 'id' | 'userId'>>) => {
    await db.inventory.update(id, updatedData);
    setInventory(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updatedData } : item
      )
    );
  };
  
  const addInvoice = async (invoice: Omit<InvoiceData, 'id' | 'userId'>) => {
     if (!currentUser) return null;
     const newInvoice: InvoiceData = {
        ...invoice,
        id: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
        userId: currentUser.id
     };
    await db.invoices.add(newInvoice);
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  const removeInvoice = async (id: string) => {
    await db.invoices.delete(id);
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  if (view === 'admin') {
      return <AdminPage navigateToApp={() => setView('app')} />;
  }

  if (!currentUser) {
    return <LoginPage navigateToAdmin={() => setView('admin')} />;
  }

  const renderMainContent = () => {
    switch (currentPage) {
      case 'inventory':
        return (
          <InventoryPage
            inventory={inventory}
            addItem={addItemToInventory}
            addMultipleItems={addMultipleItemsToInventory}
            removeItem={removeItemFromInventory}
            updateItem={updateItemInInventory}
            navigateToInvoice={() => setCurrentPage('invoice')}
          />
        );
      case 'invoice':
        return (
          <InvoicePage
            inventory={inventory}
            navigateToInventory={() => setCurrentPage('inventory')}
            invoices={invoices}
            addInvoice={addInvoice}
            removeInvoice={removeInvoice}
          />
        );
      case 'profile':
        return <ProfilePage />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-700">{t('appName')}</h1>
          <div className="flex items-center gap-x-8">
            <div className="space-x-4 space-x-reverse">
              <button
                onClick={() => setCurrentPage('inventory')}
                className={`pb-2 font-semibold ${currentPage === 'inventory' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
              >
                {t('manageInventory')}
              </button>
              <button
                onClick={() => setCurrentPage('invoice')}
                className={`pb-2 font-semibold ${currentPage === 'invoice' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
              >
                {t('createInvoice')}
              </button>
               <button
                onClick={() => setCurrentPage('profile')}
                className={`pb-2 font-semibold ${currentPage === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
              >
                {t('profileNavButton')}
              </button>
            </div>
             <div className="flex items-center gap-x-4">
               <span className="text-sm text-slate-600">{t('welcomeUser', {name: currentUser.username})}</span>
                <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600">{t('logoutButton')}</button>
              </div>
            <div className="flex items-center">
              <label htmlFor="language-select" className="sr-only">{t('language')}</label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => changeLanguage(e.target.value as 'ar' | 'fr')}
                className="p-2 border-slate-200 border rounded-md bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="ar">{t('arabic')}</option>
                <option value="fr">{t('french')}</option>
              </select>
            </div>
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-6">
        {renderMainContent()}
      </main>
       <footer className="text-center py-4 text-slate-500 text-sm">
        <p>{t('developedBy')}</p>
      </footer>
    </div>
  );
};

export default App;