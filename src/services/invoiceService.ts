// Fix: Implement invoice service with functions to save and retrieve invoices.
import { db, Invoice } from './db';

// This service handles invoice-related business logic.

/**
 * Saves an extracted invoice data to the database.
 * @param invoiceData The invoice data extracted from an image.
 * @returns The saved invoice object with an ID.
 */
export async function saveInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
    // Here you could add validation or other business logic
    // before saving the invoice to the database.
    
    if (!invoiceData.customerName && !invoiceData.invoiceNumber) {
        throw new Error("Invalid invoice data: missing customer name or invoice number.");
    }

    const savedInvoice = await db.invoices.add(invoiceData);
    return savedInvoice;
}

/**
 * Retrieves all invoices.
 * @returns A list of all saved invoices.
 */
export async function getAllInvoices(): Promise<Invoice[]> {
    return await db.invoices.getAll();
}
