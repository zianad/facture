
import React, { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from './context/AuthContext';
import { db } from './services/db';
import type { Item, InvoiceData } from './types';

import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import Header from './components/Header';
import InventoryPage from './components/InventoryPage';
import InvoicePage from './components/InvoicePage';
import ProfilePage from './components/ProfilePage';

type Page = 'inventory' | 'invoices' | 'profile' | 'admin' | 'login';

function App() {
  const { currentUser, logout } = useAuth();
  const [view, setView] = useState<Page>(currentUser ? 'invoices' : 'login');
  
  const inventory = useLiveQuery(() => 
    currentUser ? db.inventory.where('userId').equals(currentUser.id).toArray() : [],
    [currentUser]
  ) || [];

  const invoices = useLiveQuery(() => 
    currentUser ? db.invoices.where('userId').equals(currentUser.id).toArray() : [],
    [currentUser]
  ) || [];
  
  const addItems = useCallback(async (items: Omit<Item, 'id' | 'userId'>[]) => {
    if (!currentUser) return;
    const itemsToAdd = items.map(item => ({ ...item, id: crypto.randomUUID(), userId: currentUser.id }));
    await db.inventory.bulkAdd(itemsToAdd);
  }, [currentUser]);

  const removeItem = useCallback(async (id: string) => {
    await db.inventory.delete(id);
  }, []);

  const updateItem = useCallback(async (id: string, updatedData: Partial<Omit<Item, 'id'|'userId'>>) => {
    await db.inventory.update(id, updatedData);
  }, []);
  
  const addInvoice = useCallback(async (invoice: Omit<InvoiceData, 'id' | 'userId'>): Promise<InvoiceData> => {
    if (!currentUser) {
      // This was causing the type error. A non-returning path in an async function
      // makes the return type a union with `void`. Throwing an error ensures
      // all successful paths return an InvoiceData.
      throw new Error("Current user is not set, cannot add invoice.");
    }
    const newInvoice: InvoiceData = { ...invoice, id: crypto.randomUUID(), userId: currentUser.id };
    await db.invoices.add(newInvoice);
    return newInvoice;
  }, [currentUser]);

  const removeInvoice = useCallback(async (invoiceId: string) => {
    const invoiceToDelete = await db.invoices.get(invoiceId);
    if (!invoiceToDelete) return;
    
    // Restore inventory quantities
    const updates = invoiceToDelete.items.map(invoiceItem => {
        return db.inventory.where({ ref: invoiceItem.ref, userId: currentUser?.id }).modify(item => {
            item.quantity += 1; // Assuming each item in invoice has quantity of 1
        });
    });

    await Promise.all(updates);
    await db.invoices.delete(invoiceId);
  }, [currentUser]);
  
  const deductInventoryForInvoice = useCallback(async (invoice: InvoiceData) => {
      const itemRefs = invoice.items.map(item => item.ref);
      const uniqueRefs = [...new Set(itemRefs)];
      
      for(const ref of uniqueRefs){
          const quantityToDeduct = invoice.items.filter(item => item.ref === ref).length;
          await db.inventory.where({ ref, userId: currentUser?.id }).modify(item => {
              item.quantity -= quantityToDeduct;
          });
      }
  }, [currentUser]);

  if (!currentUser) {
      if (view === 'admin') {
          return <AdminPage navigateToApp={() => setView('login')} />;
      }
      return <LoginPage navigateToAdmin={() => setView('admin')} />;
  }

  const renderContent = () => {
    switch (view) {
      case 'inventory':
        return <InventoryPage
          inventory={inventory}
          addItems={addItems}
          removeItem={removeItem}
          updateItem={updateItem}
        />;
      case 'invoices':
        return <InvoicePage
          inventory={inventory}
          invoices={invoices}
          addInvoice={addInvoice}
          removeInvoice={removeInvoice}
          deductInventoryForInvoice={deductInventoryForInvoice}
        />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <InvoicePage 
            inventory={inventory}
            invoices={invoices}
            addInvoice={addInvoice}
            removeInvoice={removeInvoice}
            deductInventoryForInvoice={deductInventoryForInvoice}
        />;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <Header 
        currentPage={view} 
        setCurrentPage={setView}
        logout={() => {
          logout();
          setView('login');
        }} 
        username={currentUser.username}
      />
      <main className="p-6">
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-xs text-slate-500">
         Smart Invoice Generator © 2024
      </footer>
    </div>
  );
}

export default App;
