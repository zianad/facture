import { db } from './db';
import { InvoiceData } from '../types';

export const invoiceService = {
  getAllInvoices: async (userId: string): Promise<InvoiceData[]> => {
    return db.invoices.where('userId').equals(userId).toArray();
  },

  addInvoice: async (invoice: Omit<InvoiceData, 'id'>): Promise<string> => {
    // Note: In a real app, IDs should be handled more robustly.
    const id = crypto.randomUUID();
    return db.invoices.add({ ...invoice, id });
  },

  getInvoiceById: async (id: string): Promise<InvoiceData | undefined> => {
    return db.invoices.get(id);
  },

  deleteInvoice: async (id: string): Promise<void> => {
    return db.invoices.delete(id);
  },
};
