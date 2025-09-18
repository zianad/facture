export interface Item {
  id: string;
  reference: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  purchaseDate: string; // YYYY-MM-DD
  userId: string;
}

export interface InvoiceData {
  customerName: string;
  invoiceDate: string;
  items: Item[];
  totalAmount: number;
  id: string;
  userId: string;
}

export interface User {
    id: string;
    username: string;
    password: string; // In a real app, this should be a hash
    companyName?: string;
    companyAddress?: string;
    companyICE?: string;
}