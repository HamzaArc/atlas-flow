import { QuoteLineItem } from '../types';

/**
 * Calculates the final Sell Price based on Buy Price + Markup logic.
 */
export const calculateSellPrice = (item: QuoteLineItem): number => {
  if (item.markupType === 'FIXED_AMOUNT') {
    return item.buyPrice + item.markupValue;
  } 
  
  // Assuming markupValue is a percentage (e.g., 20 for 20%)
  // Formula: Buy / (1 - Margin) or Buy * (1 + Markup)? 
  // Standard Logistics usually uses Markup on Cost: Buy * (1 + (Markup/100))
  return item.buyPrice * (1 + (item.markupValue / 100));
};

export const calculateLineTotal = (item: QuoteLineItem): number => {
  // Assuming quantity is 1 for generic items, or add quantity to your LineItem interface later.
  // Based on your interface, I don't see a 'quantity' field, so I will assume 1 or that it's part of the description logic.
  // If you add a quantity field later, update this: return calculateSellPrice(item) * item.quantity;
  return calculateSellPrice(item);
};

export const calculateQuoteTotal = (items: QuoteLineItem[]): number => {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
};