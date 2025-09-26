// Fix: Generating full content for the mock invoice service.
import { ExtractedInvoiceData } from '../types';

// This is a mock invoice service.
// In a real application, this would interact with a backend API to save/retrieve invoice data.

let invoices: ExtractedInvoiceData[] = [];

export const invoiceService = {
    /**
     * Saves an extracted invoice.
     * @param invoiceData The data extracted from the invoice.
     * @returns The saved invoice data with a potential ID from the backend.
     */
    saveInvoice: async (invoiceData: ExtractedInvoiceData): Promise<ExtractedInvoiceData> => {
        console.log('Saving invoice:', invoiceData);
        invoices.push(invoiceData);
        // In a real app, you might get an ID back from the server
        return Promise.resolve(invoiceData);
    },

    /**
     * Retrieves all saved invoices.
     * @returns A list of all invoices.
     */
    getInvoices: async (): Promise<ExtractedInvoiceData[]> => {
        console.log('Fetching invoices');
        return Promise.resolve(invoices);
    }
};
