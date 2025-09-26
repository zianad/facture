// Represents a user in the system
export interface User {
  id: string;
  username: string;
  // password hash should not be stored on the client, this is for type definition
  password?: string; 
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyICE?: string;
  companySubtitle?: string;
}

// Represents a single item in the inventory
export interface Item {
  id: string;
  userId: string;
  ref: string;
  name: string;
  category?: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string; // YYYY-MM-DD
}

// Represents an item as part of an invoice
export interface InvoiceItem {
  name: string;
  quantity: number;
  purchasePrice: number;
}

// Represents a generated invoice
export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string | null;
  customerName: string | null;
  date: string | null; // YYYY-MM-DD
  totalAmount: number | null;
  items: InvoiceItem[];
}
