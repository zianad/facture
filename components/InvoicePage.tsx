import React, { useState, useRef } from 'react';
import type { Item, InvoiceData, User } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { generateInvoiceItems } from '../services/invoiceService';

interface InvoicePageProps {
  inventory: Item[];
  invoices: InvoiceData[];
  addInvoice: (invoice: Omit<InvoiceData, 'id' | 'userId'>) => void;
  removeInvoice: (id: string) => void;
  updateInvoice: (id: string, updatedData: Partial<Omit<InvoiceData, 'id' | 'userId'>>) => void;
  currentUser: User;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const PrintIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// A simple component to render the invoice for viewing and printing
const InvoiceDetailView: React.FC<{ invoice: InvoiceData; user: User; onClose: () => void; }> = ({ invoice, user, onClose }) => {
    const { t, language } = useTranslation();
    
    const handlePrint = () => {
        window.print();
    };
    
    const isRTL = language === 'ar';
    const totalHT = invoice.items.reduce((sum, item) => sum + item.price, 0);
    const tva = totalHT * 0.20; // Assuming 20% TVA
    const totalTTC = totalHT + tva;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .invoice-print-area, .invoice-print-area * {
                            visibility: visible;
                        }
                        .invoice-print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                    }
                `}
            </style>
            <div className="bg-white p-4 sm:p-8 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="absolute top-4 right-4 print:hidden">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                 <div className="invoice-print-area p-2">
                    <header className="flex justify-between items-start pb-6 border-b-2 border-slate-700">
                        <div className={`text-right ${isRTL ? 'text-right' : 'text-left'}`}>
                            <h1 className="text-2xl font-bold text-slate-800">{user.companyName}</h1>
                            <p className="text-slate-600">{user.companySubtitle}</p>
                            <p className="text-slate-600">{user.companyAddress}</p>
                            <p className="text-slate-600">{t('iceLabel')}: {user.companyICE}</p>
                        </div>
                        <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                            <h2 className="text-3xl font-bold uppercase text-slate-800">{t('invoiceTitle')}</h2>
                            <p className="text-slate-600">{t('invoiceNumberLabel')}: {invoice.invoiceNumber}</p>
                            <p className="text-slate-600">{t('dateLabel')}: {new Date(invoice.invoiceDate).toLocaleDateString(language)}</p>
                        </div>
                    </header>
                    <section className="my-8">
                        <div className={`bg-slate-100 p-4 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                            <h3 className="font-semibold text-slate-700">{t('clientLabel')}:</h3>
                            <p className="text-slate-900">{invoice.customerName}</p>
                        </div>
                    </section>
                    <section>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-700 text-white">
                                <tr>
                                    <th className={`py-2 px-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('tableHeaderItemReference')}</th>
                                    <th className={`py-2 px-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('tableHeaderItemName')}</th>
                                    <th className="py-2 px-3 text-center">{t('tableHeaderQuantity')}</th>
                                    <th className="py-2 px-3 text-right">{t('tableHeaderUnitPrice')}</th>
                                    <th className="py-2 px-3 text-right">{t('tableHeaderTotalHT')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-200">
                                        <td className="py-2 px-3">{item.reference}</td>
                                        <td className="py-2 px-3">{item.name}</td>
                                        <td className="py-2 px-3 text-center">1</td>
                                        <td className="py-2 px-3 text-right">{item.price.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-right">{item.price.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                    <section className="mt-8 flex justify-end">
                        <div className="w-full sm:w-1/2 md:w-1/3">
                            <div className="flex justify-between py-2 border-b">
                                <span className="font-semibold">{t('totalHTLabel')}</span>
                                <span>{totalHT.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="font-semibold">{t('tvaLabel')} (20%)</span>
                                <span>{tva.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 bg-slate-200 font-bold text-lg">
                                <span className="font-semibold">{t('totalTTCLabel')}</span>
                                <span>{totalTTC.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>
                    <footer className="mt-12 text-center text-xs text-slate-500">
                        <p>{t('invoiceFooter')}</p>
                    </footer>
                </div>
                <div className="mt-6 flex justify-end print:hidden">
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center">
                        <PrintIcon /> <span className="ml-2">{t('printButton')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


const InvoicePage: React.FC<InvoicePageProps> = ({ inventory, invoices, addInvoice, removeInvoice, currentUser }) => {
  const { t } = useTranslation();
  
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetTotal, setTargetTotal] = useState('');
  
  const [generatedItems, setGeneratedItems] = useState<Item[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({ customerName: '', targetTotal: '' });
  
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  
  const validateForm = () => {
      const newErrors = { customerName: '', targetTotal: '' };
      let isValid = true;
      if (!customerName.trim()) {
          newErrors.customerName = t('errorCustomerNameRequired');
          isValid = false;
      }
      const total = parseFloat(targetTotal);
      if (isNaN(total) || total <= 0) {
          newErrors.targetTotal = t('errorInvalidAmount');
          isValid = false;
      }
      setFormErrors(newErrors);
      return isValid;
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    setGeneratedItems(null);
    
    try {
      const items = await generateInvoiceItems(inventory, parseFloat(targetTotal), invoiceDate);
      if (items && items.length > 0) {
        setGeneratedItems(items);
      } else {
        setError(t('errorNoCombination'));
      }
    } catch (err) {
      setError(t('errorInvoiceGeneration'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveInvoice = () => {
      if (!generatedItems || !customerName) return;
      
      const newInvoice: Omit<InvoiceData, 'id' | 'userId'> = {
          customerName,
          invoiceDate,
          items: generatedItems,
          totalAmount: generatedItems.reduce((acc, item) => acc + item.price, 0),
          invoiceNumber: `INV-${Date.now()}` // Simple invoice number generation
      };
      
      addInvoice(newInvoice);
      
      // Reset form
      setCustomerName('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setTargetTotal('');
      setGeneratedItems(null);
  };
  
  const totalGeneratedAmount = generatedItems ? generatedItems.reduce((sum, item) => sum + item.price, 0) : 0;

  return (
    <div className="space-y-8">
      {selectedInvoice && <InvoiceDetailView invoice={selectedInvoice} user={currentUser} onClose={() => setSelectedInvoice(null)} />}
      
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('createNewInvoiceTitle')}</h2>
        <form onSubmit={handleGenerateInvoice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end" noValidate>
            <div className="flex flex-col">
              <label htmlFor="customerName" className="mb-1 text-sm font-medium text-slate-600">{t('customerNameLabel')}</label>
              <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={`p-2 border ${formErrors.customerName ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
              {formErrors.customerName && <p className="text-red-500 text-xs mt-1">{formErrors.customerName}</p>}
            </div>
            <div className="flex flex-col">
              <label htmlFor="invoiceDate" className="mb-1 text-sm font-medium text-slate-600">{t('invoiceDateLabel')}</label>
              <input type="date" id="invoiceDate" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="targetTotal" className="mb-1 text-sm font-medium text-slate-600">{t('targetAmountLabel')}</label>
              <input type="number" id="targetTotal" value={targetTotal} onChange={(e) => setTargetTotal(e.target.value)} min="0" step="0.01" className={`p-2 border ${formErrors.targetTotal ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
              {formErrors.targetTotal && <p className="text-red-500 text-xs mt-1">{formErrors.targetTotal}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-wait">
                {isLoading ? t('generatingButton') : t('generateButton')}
            </button>
        </form>
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>

      {generatedItems && (
          <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-bold mb-2 text-slate-700">{t('generatedItemsTitle')}</h3>
              <p className="mb-4 text-sm text-slate-600">{t('generatedAmountLabel')}: <span className="font-semibold">{totalGeneratedAmount.toFixed(2)}</span></p>
              <div className="overflow-x-auto max-h-60">
                  <table className="min-w-full bg-white text-sm">
                      <thead className="bg-slate-100 sticky top-0">
                          <tr>
                              <th className="py-2 px-3 text-right font-semibold text-slate-600">{t('tableHeaderItemReference')}</th>
                              <th className="py-2 px-3 text-right font-semibold text-slate-600">{t('tableHeaderItemName')}</th>
                              <th className="py-2 px-3 text-right font-semibold text-slate-600">{t('tableHeaderUnitPrice')}</th>
                          </tr>
                      </thead>
                      <tbody>
                          {generatedItems.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50 border-b">
                                  <td className="py-1 px-3 text-slate-900">{item.reference}</td>
                                  <td className="py-1 px-3 text-slate-900">{item.name}</td>
                                  <td className="py-1 px-3 text-slate-900">{item.price.toFixed(2)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <div className="mt-4 flex justify-end space-x-2 space-x-reverse">
                  <button onClick={() => setGeneratedItems(null)} className="bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-slate-600">{t('cancel')}</button>
                  <button onClick={handleSaveInvoice} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">{t('saveInvoiceButton')}</button>
              </div>
          </div>
      )}

      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('invoiceHistoryTitle')} ({invoices.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-100">
              <tr>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderInvoiceNumber')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderCustomerName')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderDate')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderAmount')}</th>
                <th className="py-2 px-4 border-b text-center font-semibold text-slate-600">{t('tableHeaderAction')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? invoices.sort((a,b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).map(invoice => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="py-2 px-4 border-b text-slate-900">{invoice.invoiceNumber}</td>
                  <td className="py-2 px-4 border-b text-slate-900">{invoice.customerName}</td>
                  <td className="py-2 px-4 border-b text-slate-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border-b text-slate-900">{invoice.totalAmount.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center space-x-2 space-x-reverse justify-center">
                        <button onClick={() => setSelectedInvoice(invoice)} title={t('viewInvoice')} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"><EyeIcon /></button>
                        <button onClick={() => removeInvoice(invoice.id)} title={t('deleteInvoice')} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-500">
                        {t('emptyInvoices')}
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
