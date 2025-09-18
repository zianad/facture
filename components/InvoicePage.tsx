import React, { useState, useEffect } from 'react';
import type { Item, InvoiceData, User } from '../types';
import { generateInvoiceItems } from '../services/invoiceService';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface InvoicePageProps {
  inventory: Item[];
  navigateToInventory: () => void;
  invoices: InvoiceData[];
  addInvoice: (invoice: Omit<InvoiceData, 'id' | 'userId'>) => Promise<InvoiceData | null>;
  removeInvoice: (id: string) => void;
}

const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return dateString; // Fallback
    }
};

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm-1 8H8v-2h4v2z" clipRule="evenodd" />
    </svg>
);

interface InvoicePreviewProps {
    invoice: InvoiceData;
    user: User | null;
}


const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, user }) => {
    const { t } = useTranslation();
    
    const tFr = (key: string, options?: { [key: string]: string | number }) => t(key, options, 'fr');

    const handlePrint = () => {
        window.print();
    };

    interface GroupedItem {
        id: string;
        reference: string;
        name: string;
        category: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }

    const groupedItems = invoice.items.reduce((acc: Map<string, GroupedItem>, item) => {
        const key = `${item.reference}-${item.name}-${item.price}`; // Group by reference, name and price
        const existing = acc.get(key);
        if (existing) {
            existing.quantity += 1;
            existing.totalPrice += item.price;
        } else {
            acc.set(key, {
                id: item.id,
                reference: item.reference,
                name: item.name,
                category: item.category,
                quantity: 1,
                unitPrice: item.price,
                totalPrice: item.price,
            });
        }
        return acc;
    }, new Map<string, GroupedItem>());

    const itemsToRender = Array.from(groupedItems.values());

    const totalHT = itemsToRender.reduce((sum, item) => sum + item.totalPrice, 0);
    const tva = totalHT * 0.20;
    const totalTTC = totalHT + tva;


    return (
        <div className="mt-8">
            <style>
                {`@media print {
                    body * { visibility: hidden; }
                    #invoice-section, #invoice-section * { visibility: visible; }
                    #invoice-section { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        font-size: 12px;
                    }
                    .no-print { display: none; }
                }`}
            </style>
            <div id="invoice-section" className="p-8 bg-white rounded-lg shadow-lg border border-slate-200 text-black">
                <header className="text-center mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold">{user?.companyName || tFr('companyName')}</h1>
                    <p className="text-sm">{tFr('companySlogan')}</p>
                </header>
                
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="text-left">
                        <h2 className="text-xl font-bold mb-2">{tFr('invoiceTitle')}</h2>
                        <p><span className="font-semibold">{tFr('invoiceNumberLabel')}:</span> {invoice.id}</p>
                        <p><span className="font-semibold">{tFr('invoiceDateLabel')}:</span> {formatDate(invoice.invoiceDate)}</p>
                    </div>
                     <div className="text-right">
                        <p className="font-semibold pt-8">{tFr('clientNameLabel')}: {invoice.customerName}</p>
                    </div>
                </div>


                <table className="min-w-full mb-8 border border-slate-300">
                    <thead className="bg-blue-600 text-white">
                        <tr>
                            <th className="py-2 px-3 border-r border-blue-400 text-left font-semibold">{tFr('tableHeaderReference')}</th>
                            <th className="py-2 px-3 border-r border-blue-400 text-left font-semibold">{tFr('tableHeaderDescription')}</th>
                            <th className="py-2 px-3 border-r border-blue-400 text-right font-semibold">{tFr('tableHeaderPU')}</th>
                            <th className="py-2 px-3 border-r border-blue-400 text-right font-semibold">{tFr('tableHeaderQuantity')}</th>
                            <th className="py-2 px-3 text-right font-semibold">{tFr('tableHeaderTotalHT')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-black">
                        {itemsToRender.map((groupedItem) => (
                            <tr key={`${groupedItem.reference}-${groupedItem.name}`} className="border-b border-slate-300">
                                <td className="py-1 px-3 border-r border-slate-300">{groupedItem.reference}</td>
                                <td className="py-1 px-3 border-r border-slate-300">{groupedItem.name}</td>
                                <td className="py-1 px-3 border-r border-slate-300 text-right">{groupedItem.unitPrice.toFixed(2)}</td>
                                <td className="py-1 px-3 border-r border-slate-300 text-right">{groupedItem.quantity}</td>
                                <td className="py-1 px-3 text-right">{groupedItem.totalPrice.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-16">
                    <div className="w-1/2 md:w-2/5">
                        <table className="min-w-full border border-slate-300">
                           <tbody className="text-black">
                               <tr className="border-b border-slate-300">
                                   <td className="text-right p-2 font-semibold">{totalHT.toFixed(2)}</td>
                                   <td className="font-semibold p-2 border-l border-slate-300 bg-blue-600 text-white text-right">{tFr('totalHT')}</td>
                               </tr>
                               <tr className="border-b border-slate-300">
                                   <td className="text-right p-2">{tva.toFixed(2)}</td>
                                   <td className="font-semibold p-2 border-l border-slate-300 bg-blue-600 text-white text-right">{tFr('totalTVA')}</td>
                               </tr>
                               <tr>
                                   <td className="text-right p-2 font-bold">{totalTTC.toFixed(2)}</td>
                                   <td className="font-semibold p-2 border-l border-slate-300 bg-blue-600 text-white text-right">{tFr('totalTTC')}</td>
                               </tr>
                           </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end mb-16">
                    <p>{tFr('signatureLabel')}</p>
                </div>

                <footer className="text-center text-xs border-t pt-4">
                    <p className="font-semibold mb-2">{tFr('noReturnsMessage')}</p>
                    {user?.companyAddress && <p>{user.companyAddress}</p>}
                    <p>{tFr('companyFooterLegalDynamic', { ice: user?.companyICE || 'N/A' })}</p>
                </footer>
            </div>
            <div className="text-center mt-6 no-print">
                <button onClick={handlePrint} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center mx-auto">
                    <PrintIcon />
                    <span>{tFr('printInvoiceButton')}</span>
                </button>
            </div>
        </div>
    );
};


const InvoicePage: React.FC<InvoicePageProps> = ({ inventory, navigateToInventory, invoices, addInvoice, removeInvoice }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [details, setDetails] = useState({ customerName: '', totalAmount: '', invoiceDate: new Date().toISOString().split('T')[0] });
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    'loadingMessage1',
    'loadingMessage2',
    'loadingMessage3',
    'loadingMessage4',
  ];

  useEffect(() => {
    let interval: number | undefined;
    if (isLoading) {
      interval = window.setInterval(() => {
        setLoadingMessageIndex((prevIndex) =>
          (prevIndex + 1) % loadingMessages.length
        );
      }, 3000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, loadingMessages.length]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedInvoice(null);
    
    if (!details.customerName.trim()) {
        setError(t('errorCustomerNameRequired'));
        return;
    }

    const totalTTC = parseFloat(details.totalAmount);
    if (isNaN(totalTTC) || totalTTC <= 0) {
      setError(t('errorInvalidTotalAmount'));
      return;
    }

    if (!details.invoiceDate || isNaN(new Date(details.invoiceDate).getTime())) {
        setError(t('errorInvalidInvoiceDate'));
        return;
    }
    
    setIsLoading(true);
    const targetHT = totalTTC / 1.20;
    const items = await generateInvoiceItems(inventory, targetHT, details.invoiceDate);
    
    setIsLoading(false);
    if (items) {
      const invoiceData: Omit<InvoiceData, 'id' | 'userId'> = {
        customerName: details.customerName,
        invoiceDate: details.invoiceDate,
        items: items,
        totalAmount: totalTTC,
      };
      const newInvoice = await addInvoice(invoiceData);
      if (newInvoice) {
        setGeneratedInvoice(newInvoice);
      }
    } else {
      setError(t('errorNoItemsFound'));
    }
  };

  const handleViewInvoice = (invoice: InvoiceData) => {
    setGeneratedInvoice(invoice);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm(t('confirmDeleteInvoice'))) {
      removeInvoice(id);
      if (generatedInvoice?.id === id) {
        setGeneratedInvoice(null);
      }
    }
  };


  return (
    <div className="space-y-8">
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('createInvoiceTitle')}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end" noValidate>
          <div className="flex flex-col">
            <label htmlFor="customerName" className="mb-1 text-sm font-medium text-slate-600">{t('customerNameLabel')}</label>
            <input type="text" id="customerName" name="customerName" value={details.customerName} onChange={handleInputChange} className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="totalAmount" className="mb-1 text-sm font-medium text-slate-600">{t('totalAmountLabel')}</label>
            <input type="number" id="totalAmount" name="totalAmount" value={details.totalAmount} onChange={handleInputChange} min="0.01" step="0.01" className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="invoiceDate" className="mb-1 text-sm font-medium text-slate-600">{t('invoiceDateLabelOld')}</label>
            <input type="date" id="invoiceDate" name="invoiceDate" value={details.invoiceDate} onChange={handleInputChange} className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button type="submit" disabled={isLoading} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center">
             {isLoading ? t('generatingInvoice') : t('generateInvoiceButton')}
          </button>
        </form>
      </div>
      
       {isLoading && (
        <div className="p-6 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-center">
            <div className="flex justify-center items-center mb-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <p className="font-semibold text-lg transition-opacity duration-500">{t(loadingMessages[loadingMessageIndex])}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 border border-red-200 rounded-lg">
          <p className="font-bold">{t('errorTitle')}</p>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && generatedInvoice && <InvoicePreview invoice={generatedInvoice} user={currentUser} />}

      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('invoiceHistoryTitle')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-100">
              <tr>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('historyInvoiceID')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('historyCustomerName')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('historyDate')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('historyTotalAmount')}</th>
                <th className="py-2 px-4 border-b text-center font-semibold text-slate-600">{t('historyActions')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="py-2 px-4 border-b text-slate-900">{inv.id}</td>
                  <td className="py-2 px-4 border-b text-slate-900">{inv.customerName}</td>
                  <td className="py-2 px-4 border-b text-slate-900">{formatDate(inv.invoiceDate)}</td>
                  <td className="py-2 px-4 border-b text-slate-900">{inv.totalAmount.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                       <button onClick={() => handleViewInvoice(inv)} className="bg-blue-100 text-blue-700 px-3 py-1 text-sm rounded-md hover:bg-blue-200">
                          {t('viewButton')}
                       </button>
                       <button onClick={() => handleDeleteInvoice(inv.id)} className="bg-red-100 text-red-700 px-3 py-1 text-sm rounded-md hover:bg-red-200">
                           {t('deleteButton')}
                       </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-slate-500">
                    {t('noInvoicesFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;