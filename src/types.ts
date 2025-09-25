
export interface Item {
  /** Unique identifier for the item */
  id: string;
  /** Reference or SKU for the item */
  ref: string;
  /** Name of the item */
  name: string;
  /** Category of the item */
  category: string;
  /** The price at which the item was purchased */
  purchasePrice: number;
  /** The quantity of the item in stock */
  quantity: number;
  /** The date the item was purchased, in YYYY-MM-DD format */
  purchaseDate: string;
  /** The ID of the user who owns this item */
  userId: string;
}

export interface InvoiceData {
  /** Unique identifier for the invoice */
  id: string;
  /** The sequential number of the invoice */
  invoiceNumber: string;
  /** The name of the customer on the invoice */
  customerName: string;
  /** The date the invoice was issued, in YYYY-MM-DD format */
  date: string;
  /** The total amount of the invoice, including taxes (TTC) */
  totalAmount: number;
  /** An array of items included in the invoice */
  items: Item[];
  /** The ID of the user who created this invoice */
  userId: string;
}

export interface User {
    /** Unique identifier for the user */
    id:string;
    /** The username for login */
    username: string;
    /** The password for login. Should be hashed in a real application. */
    password: string;
    /** The name of the user's company */
    companyName?: string;
    /** The address of the user's company */
    companyAddress?: string;
    /** The phone number of the user's company */
    companyPhone?: string;
    /** The company's legal identifier (Identifiant Commun de l'Entreprise) */
    companyICE?: string;
    /** A subtitle or slogan for the company, for use on invoices */
    companySubtitle?: string;
}
