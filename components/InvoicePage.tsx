import React, { useState, useRef } from 'react';
import type { Item, InvoiceData } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { generateInvoiceItems } from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';

// Props interface based on App.tsx usage
interface InvoicePageProps {
  inventory: Item[];
  invoices: InvoiceData[];
  addInvoice: (invoice: Omit<InvoiceData, 'id' | 'userId'>) => Promise<InvoiceData | null>;
  removeInvoice: (id: string) => void;
  navigateToInventory: () => void;
}

// Icons
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
  );

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
        <path d="M13 11.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
);


const InvoicePage: React.FC<InvoicePageProps> = ({
  inventory,
  invoices,
  addInvoice,
  removeInvoice,
  navigateToInventory,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetTotal, setTargetTotal] = useState('');
  
  const [generatedItems, setGeneratedItems] = useState<Item[] | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<InvoiceData | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerateItems = async () => {
    setError(null);
    setGeneratedItems(null);

    const target = parseFloat(targetTotal);
    if (!customerName.trim()) {
        setError(t('errorCustomerNameRequired'));
        return;
    }
    if (isNaN(target) || target <= 0) {
      setError(t('errorInvalidTargetAmount'));
      return;
    }
    if (inventory.length === 0) {
      setError(t('errorEmptyInventory'));
      return;
    }

    setIsLoading(true);
    try {
      const items = await generateInvoiceItems(inventory, target, invoiceDate);
      if (items && items.length > 0) {
        setGeneratedItems(items);
        const total = items.reduce((sum, item) => sum + item.price, 0);
        setCalculatedTotal(total);
      } else {
        setError(t('errorNoCombinationFound'));
        setGeneratedItems([]);
      }
    } catch (e) {
      console.error(e);
      setError(t('errorGenerationFailed'));
      setGeneratedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!generatedItems || generatedItems.length === 0 || !customerName) return;

    const invoiceNumber = `INV-${Date.now()}`;
    const newInvoiceData: Omit<InvoiceData, 'id' | 'userId'> = {
      customerName,
      invoiceDate,
      items: generatedItems,
      totalAmount: calculatedTotal,
      invoiceNumber,
    };

    const savedInvoice = await addInvoice(newInvoiceData);
    if (savedInvoice) {
        // Reset form
        setCustomerName('');
        setTargetTotal('');
        setGeneratedItems(null);
        setCalculatedTotal(0);
        setError(null);

        // Trigger print for the newly created invoice
        handlePrint(savedInvoice);
    }
  };

  const handlePrint = (invoice: InvoiceData) => {
    setInvoiceToPrint(invoice);
    // Use a timeout to allow the print component to render before printing
    setTimeout(() => {
        window.print();
        setInvoiceToPrint(null);
    }, 100);
  };
  
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return dateString; // Fallback
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setTargetTotal('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setGeneratedItems(null);
    setCalculatedTotal(0);
    setError(null);
  };

  const renderPrintableInvoice = () => {
    if (!invoiceToPrint || !currentUser) return null;

    const groupedItems = invoiceToPrint.items.reduce((acc, item) => {
        const existing = acc.find(i => i.reference === item.reference);
        if (existing) {
            existing.quantity += 1;
            existing.totalPrice += item.price;
        } else {
            acc.push({ ...item, quantity: 1, totalPrice: item.price });
        }
        return acc;
    }, [] as (Item & { quantity: number; totalPrice: number })[]);

    return (
        <div className="print:block hidden" ref={printRef}>
            <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">{currentUser.companyName || t('appName')}</h1>
                        <p>{currentUser.companyAddress}</p>
                        <p>ICE: {currentUser.companyICE}</p>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-right">{t('invoiceTitle')}</h2>
                        <p className="text-right">{t('invoiceNumberLabel')}: {invoiceToPrint.invoiceNumber}</p>
                        <p className="text-right">{t('invoiceDateLabel')}: {formatDate(invoiceToPrint.invoiceDate)}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold border-b pb-1 mb-2">{t('billToLabel')}</h3>
                    <p>{invoiceToPrint.customerName}</p>
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-2">{t('tableHeaderItemReference')}</th>
                            <th className="p-2">{t('tableHeaderItemName')}</th>
                            <th className="p-2 text-right">{t('tableHeaderQuantity')}</th>
                            <th className="p-2 text-right">{t('tableHeaderUnitPrice')}</th>
                            <th className="p-2 text-right">{t('tableHeaderTotalHT')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedItems.map((item, index) => (
                            <tr key={`${item.id}-${index}`} className="border-b">
                                <td className="p-2">{item.reference}</td>
                                <td className="p-2">{item.name}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                                <td className="p-2 text-right">{item.totalPrice.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mt-4">
                    <div className="w-1/3">
                        <div className="flex justify-between font-bold">
                            <span>{t('totalHTLabel')}</span>
                            <span>{invoiceToPrint.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-xs text-center">
                    <p>{t('invoiceFooter')}</p>
                </div>
            </div>
        </div>
    );
  };


  return (
    <div className="space-y-8">
      {renderPrintableInvoice()}
      <div className="print:hidden">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-slate-700">{t('createInvoiceTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col">
                    <label htmlFor="customerName" className="mb-1 text-sm font-medium text-slate-600">{t('customerNameLabel')}</label>
                    <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md"/>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="invoiceDate" className="mb-1 text-sm font-medium text-slate-600">{t('invoiceDateLabel')}</label>
                    <input type="date" id="invoiceDate" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md"/>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="targetTotal" className="mb-1 text-sm font-medium text-slate-600">{t('targetTotalLabel')}</label>
                    <input type="number" id="targetTotal" value={targetTotal} onChange={(e) => setTargetTotal(e.target.value)} placeholder="e.g. 15000.00" min="0" step="0.01" className="p-2 border border-slate-300 bg-slate-100 rounded-md"/>
                </div>
                <button onClick={handleGenerateItems} disabled={isLoading} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400">
                    {isLoading ? t('generatingButton') : t('generateItemsButton')}
                </button>
            </div>
             {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          {generatedItems && (
            <div className="p-6 bg-white rounded-lg shadow-sm mt-8">
              <h3 className="text-lg font-bold mb-4 text-slate-700">{t('generatedInvoicePreviewTitle')}</h3>
              {generatedItems.length > 0 ? (
                <>
                  <div className="overflow-x-auto mb-4">
                     <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderItemReference')}</th>
                                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderItemName')}</th>
                                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderUnitPrice')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {generatedItems.map((item, index) => (
                                <tr key={`${item.id}-${index}`} className="hover:bg-slate-50">
                                    <td className="py-2 px-4 border-b text-slate-900">{item.reference}</td>
                                    <td className="py-2 px-4 border-b text-slate-900">{item.name}</td>
                                    <td className="py-2 px-4 border-b text-slate-900">{item.price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="flex justify-end items-center mb-4">
                      <div className="text-right">
                          <p className="font-semibold text-slate-600">{t('targetTotalLabel')}: <span className="font-bold text-slate-800">{parseFloat(targetTotal).toFixed(2)}</span></p>
                          <p className="font-semibold text-slate-600">{t('calculatedTotalLabel')}: <span className="font-bold text-slate-800">{calculatedTotal.toFixed(2)}</span></p>
                          <p className="font-semibold text-slate-600">{t('differenceLabel')}: <span className={`font-bold ${Math.abs(calculatedTotal - parseFloat(targetTotal)) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>{(calculatedTotal - parseFloat(targetTotal)).toFixed(2)}</span></p>
                      </div>
                  </div>
                  <div className="flex justify-end space-x-4 space-x-reverse">
                    <button onClick={resetForm} className="bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-slate-600">{t('clearButton')}</button>
                    <button onClick={handleSaveInvoice} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">{t('saveAndPrintButton')}</button>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">{t('noItemsGenerated')}</p>
              )}
            </div>
          )}

          <div className="p-6 bg-white rounded-lg shadow-sm mt-8">
            <h2 className="text-xl font-bold mb-4 text-slate-700">{t('recentInvoicesTitle')} ({invoices.length})</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderInvoiceNumber')}</th>
                            <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderCustomer')}</th>
                            <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderDate')}</th>
                            <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderAmount')}</th>
                            <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderAction')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length > 0 ? invoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-slate-50">
                                <td className="py-2 px-4 border-b text-slate-900">{invoice.invoiceNumber}</td>
                                <td className="py-2 px-4 border-b text-slate-900">{invoice.customerName}</td>
                                <td className="py-2 px-4 border-b text-slate-900">{formatDate(invoice.invoiceDate)}</td>
                                <td className="py-2 px-4 border-b text-slate-900">{invoice.totalAmount.toFixed(2)}</td>
                                <td className="py-2 px-4 border-b">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <button onClick={() => handlePrint(invoice)} title={t('print')} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100">
                                            <PrintIcon />
                                        </button>
                                        <button onClick={() => removeInvoice(invoice.id)} title={t('deleteUser')} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-slate-500">{t('emptyInvoices')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             <div className="mt-6 text-center">
                <button onClick={navigateToInventory} className="bg-gray-200 text-slate-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors">
                    {t('goToInventoryPageButton')}
                </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default InvoicePage;
