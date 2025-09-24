import type { Item } from '../types';

/**
 * Generates a list of items for an invoice by using a local Web Worker
 * to solve the knapsack-like problem.
 * It finds a combination of items from the inventory that totals
 * as close as possible to the target amount.
 *
 * @param inventory The full list of available inventory items.
 * @param targetTotal The target total amount for the invoice (HT - hors taxes).
 * @param _invoiceDate The date of the invoice (unused, kept for signature).
 * @returns A promise that resolves to an array of Item objects for the invoice, or null if no combination is possible.
 */
export const generateInvoiceItems = (
  inventory: Item[],
  targetTotal: number,
  _invoiceDate: string
): Promise<Item[] | null> => {
  return new Promise((resolve, reject) => {
    // Filter out items that cannot be part of a solution.
    const availableItems = inventory.filter(item => item.quantity > 0 && item.purchasePrice > 0);
    
    if (availableItems.length === 0 || targetTotal <= 0) {
      console.warn("Inventory is empty or target is zero. Cannot generate invoice items.");
      resolve([]); // Resolve with an empty array.
      return;
    }

    // The solver is in a separate worker file to avoid blocking the main UI thread.
    const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent<Item[] | null>) => {
      resolve(event.data);
      worker.terminate(); // Clean up the worker after it's done.
    };

    worker.onerror = (error) => {
      console.error('Error from solver worker:', error);
      // Resolve with null to indicate failure, which the UI can handle as "not found".
      resolve(null);
      worker.terminate();
    };

    // Send the necessary data to the worker to start the calculation.
    worker.postMessage({
      items: availableItems,
      target: targetTotal,
    });
  });
};