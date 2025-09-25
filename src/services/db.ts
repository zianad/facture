import Dexie, { Table } from 'dexie';
import { Item, InvoiceData, User } from '@/types';

export class AppDatabase extends Dexie {
  items!: Table<Item, string>;
  invoices!: Table<InvoiceData, string>;
  users!: Table<User, string>;

  constructor() {
    super('myDatabase');
    this.version(1).stores({
      items: '++id, ref, name, category, userId',
      invoices: '++id, invoiceNumber, customerName, date, userId',
      users: '++id, username',
    });
  }
}

export const db = new AppDatabase();
