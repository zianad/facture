// Fix: Generating full content for the types file.
export interface User {
  id: string;
  username: string;
  email: string;
  company?: string;
  role: 'admin' | 'user';
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  purchasePrice: number;
}

export interface ExtractedInvoiceData {
  invoiceNumber: string | null;
  customerName: string | null;
  date: string | null;
  totalAmount: number | null;
  items: InvoiceItem[];
}
