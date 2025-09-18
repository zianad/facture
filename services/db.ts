import Dexie, { type Table } from 'dexie';
import type { User, Item, InvoiceData } from '../types';

export class AppDatabase extends Dexie {
  users!: Table<User>;
  inventory!: Table<Item>;
  invoices!: Table<InvoiceData>;

  constructor() {
    super('invoiceAppDB');
    this.version(1).stores({
      users: 'id, &username, password', // Primary key: id, Unique index on username, Index on password
      inventory: 'id, userId', // Primary key: id, Index on userId
      invoices: 'id, userId', // Primary key: id, Index on userId
    });
  }
}

export const db = new AppDatabase();
