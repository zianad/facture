// Fix: Provide a mock database implementation for storing invoice data.
// In a real-world application, this could connect to IndexedDB, localStorage,
// or a remote database service.

export interface InvoiceItem {
    name: string;
    quantity: number;
    purchasePrice: number;
}
export interface Invoice {
    id: string;
    invoiceNumber: string | null;
    customerName: string | null;
    date: string | null;
    totalAmount: number | null;
    items: InvoiceItem[];
}

// Mock database using an in-memory array.
const invoices: Invoice[] = [];

export const db = {
    invoices: {
        async add(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
            const newInvoice = { ...invoiceData, id: Date.now().toString() };
            invoices.push(newInvoice);
            console.log('Invoice added to mock DB:', newInvoice);
            return newInvoice;
        },
        async getAll(): Promise<Invoice[]> {
            console.log('Fetching all invoices from mock DB.');
            return [...invoices];
        }
    }
};

export default db;
