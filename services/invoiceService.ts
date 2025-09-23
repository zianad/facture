import type { Item } from '../types';

// A simplified version of the Item type for the AI prompt
interface PromptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// The expected format of a single item object returned by the AI service
interface AiGeneratedItem {
    id: string;
    name: string;
    price: number;
}

/**
 * Generates a list of items for an invoice by calling the AI service.
 * It tries to find a combination of items from the inventory that totals
 * as close as possible to the target amount.
 *
 * @param inventory The full list of available inventory items.
 * @param targetTotal The target total amount for the invoice (HT - hors taxes).
 * @param _invoiceDate The date of the invoice (currently unused by the AI but kept for signature consistency).
 * @returns A promise that resolves to an array of Item objects for the invoice, or null if an error occurs.
 */
export const generateInvoiceItems = async (
  inventory: Item[],
  targetTotal: number,
  _invoiceDate: string
): Promise<Item[] | null> => {
  // The API needs a simplified list of items with their available quantities.
  const itemsForPrompt: PromptItem[] = inventory
    .filter(item => item.quantity > 0 && item.price > 0)
    .map(({ id, name, price, quantity }) => ({
      id,
      name,
      price,
      quantity,
    }));

  if (itemsForPrompt.length === 0) {
    console.warn("Inventory is empty or has no items with positive price/quantity. Cannot generate invoice items.");
    return []; // Return empty array, consistent with AI behavior for no possible combination.
  }
  
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemsForPrompt,
        targetTotal,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Gracefully handle non-JSON error bodies.
      console.error('Error from AI service:', errorData.details || response.statusText);
      return null;
    }

    const result: AiGeneratedItem[] = await response.json();

    if (!Array.isArray(result)) {
        console.error('AI service returned an unexpected data format.');
        return null;
    }

    // The AI returns a flat list of items, where duplicates mean multiple units of the same item.
    // We need to map these simplified item objects back to the full Item objects from our inventory.
    const inventoryMap = new Map<string, Item>(inventory.map(item => [item.id, item]));
    const invoiceItems: Item[] = [];
    
    for (const aiItem of result) {
        const fullItem = inventoryMap.get(aiItem.id);
        if (fullItem) {
            // Push a copy of the item to represent one unit being used in the invoice.
            // The InvoicePreview component will handle grouping these items by counting occurrences.
            invoiceItems.push({ ...fullItem });
        } else {
            console.warn(`AI returned an item with ID "${aiItem.id}" which was not found in the original inventory.`);
        }
    }
    
    return invoiceItems;

  } catch (error) {
    console.error('Failed to call or process response from invoice generation API:', error);
    return null;
  }
};
