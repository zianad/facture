import React, { useState, useMemo, useRef } from 'react';
import type { InvoiceData, Item, User } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { generateInvoiceItems } from '../services/invoiceService';
// NOTE: This component uses `react-to-print`. Ensure this library is installed in your project.
// You can install it with: npm install react-to-print
import { useReactToPrint } from 'react-to-print';

// --- ICONS (to avoid creating new files) ---

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

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


// --- INVOICE TEMPLATE (to avoid creating new files) ---

type InvoiceTemplateProps = {
  invoice: InvoiceData | null;
  user: User | null;
};

const InvoiceTemplateComponent = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ invoice, user }, ref) => {
    const { t, language } = useTranslation();

    if (!invoice || !user) {
        return <div ref={ref}></div>;
    }

    const totalHT = invoice.items.reduce((sum, item) => sum + item.price, 0);
    const tvaRate = 0.20; // Assuming 20% TVA
    const tva = totalHT * tvaRate;
    const totalTTC = totalHT + tva;
    
    // Group items for display
    const groupedItems = invoice.items.reduce((acc, item) => {
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
        <div ref={ref} className={`p-10 bg-white text-sm text-slate-800 font-sans ${language === 'ar' ? 'rtl font-serif' : 'ltr'}`}>
            <header className="flex justify-between items-start mb-10">
                <div className="text-right">
                    <h1 className="text-2xl font-bold uppercase text-slate-900">{user.companyName}</h1>
                    <p className="text-slate-600">{user.companySubtitle}</p>
                    <p className="text-slate-500">{user.companyAddress}</p>
                    <p className="text-slate-500">{t('iceLabel')}: {user.companyICE}</p>
                </div>
                <div className="text-left">
                     <h2 className="text-2xl font-bold uppercase text-slate-900">{t('invoiceTitle')}</h2>
                     <p>{t('invoiceNumberLabel')}: {invoice.invoiceNumber}</p>
                     <p>{t('dateLabel')}: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
            </header>
            
            <section className="mb-10">
                <div className="border border-slate-300 p-4 rounded-md">
                     <h3 className="font-semibold text-slate-600 mb-2">{t('billToLabel')}</h3>
                     <p className="font-bold">{invoice.customerName}</p>
                </div>
            </section>
            
            <section>
                 <table className="w-full text-right">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-2 font-semibold">{t('tableHeaderItemReference')}</th>
                            <th className="p-2 font-semibold">{t('tableHeaderItemName')}</th>
                            <th className="p-2 font-semibold">{t('tableHeaderQuantity')}</th>
                            <th className="p-2 font-semibold">{t('tableHeaderUnitPrice')}</th>
                            <th className="p-2 font-semibold">{t('tableHeaderTotalHT')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedItems.map((item) => (
                             <tr key={item.reference} className="border-b">
                                <td className="p-2">{item.reference}</td>
                                <td className="p-2">{item.name}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">{item.price.toFixed(2)}</td>
                                <td className="p-2">{item.totalPrice.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </section>
            
            <section className="mt-8 flex justify-end">
                <div className="w-1/2">
                    <table className="w-full text-right">
                        <tbody>
                            <tr>
                                <td className="p-2 font-semibold">{t('totalHTLabel')}:</td>
                                <td className="p-2">{totalHT.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold">{t('tvaLabel')} ({(tvaRate * 100).toFixed(0)}%):</td>
                                <td className="p-2">{tva.toFixed(2)}</td>
                            </tr>
                            <tr className="font-bold text-lg bg-slate-100">
                                <td className="p-2">{t('totalTTCLabel')}:</td>
                                <td className="p-2">{totalTTC.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
            
            <footer className="mt-20 pt-4 border-t text-center text-xs text-slate-500">
                <p>{t('invoiceFooter')}</p>
                <p>{user.companyName} - {user.companyAddress}</p>
            </footer>
        </div>
    );
});
InvoiceTemplateComponent.displayName = 'InvoiceTemplateComponent';


// --- INVOICE PAGE COMPONENT ---

interface InvoicePageProps {
  inventory: Item[];
  invoices: InvoiceData[];
  addInvoice: (invoice: Omit<InvoiceData, 'id' | 'userId'>) => void;
  removeInvoice: (id: string) => void;
  updateInvoice: (id: string, updatedData: Partial<Omit<InvoiceData, 'id' | 'userId'>>) => void;
  currentUser: User;
  navigateToInventory: () => void;
}

const InvoicePage: React.FC<InvoicePageProps> = ({
  inventory,
  invoices,
  addInvoice,
  removeInvoice,
  currentUser,
  navigateToInventory
}) => {
  const { t } = useTranslation();
  const [newInvoiceData, setNewInvoiceData] = useState({
    customerName: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    targetTotal: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const componentToPrintRef = useRef<HTMLDivElement>(null);
  // FIX: Suppress TypeScript error on the `content` property, which is a valid option for `useReactToPrint`.
  // @ts-ignore
  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    documentTitle: selectedInvoice ? `Invoice-${selectedInvoice.invoiceNumber}` : 'Invoice',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const target = parseFloat(newInvoiceData.targetTotal);
    if (!newInvoiceData.customerName.trim() || !newInvoiceData.invoiceDate || isNaN(target) || target <= 0) {
      setError(t('errorInvalidInvoiceData'));
      return;
    }
    
    setIsGenerating(true);
    try {
      const items = await generateInvoiceItems(inventory, target, newInvoiceData.invoiceDate);
      
      if (!items || items.length === 0) {
        setError(t('errorNoItemCombination'));
        setIsGenerating(false);
        return;
      }
      
      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
      const invoiceNumber = `INV-${String(Date.now()).slice(-6)}`;
      
      await addInvoice({
        customerName: newInvoiceData.customerName,
        invoiceDate: newInvoiceData.invoiceDate,
        items,
        totalAmount,
        invoiceNumber,
      });

      setNewInvoiceData({ customerName: '', invoiceDate: new Date().toISOString().split('T')[0], targetTotal: '' });
      
    } catch (err) {
      console.error("Error generating invoice:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`${t('errorGeneratingInvoice')}: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredInvoices = useMemo(() => invoices.filter(invoice =>
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ), [invoices, searchTerm]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
  }, [filteredInvoices]);

  const viewInvoice = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
  };
  
  const printInvoice = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setTimeout(() => {
        handlePrint();
    }, 100);
  };

  const closeModal = () => {
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-8">
      {/* Form for creating new invoice */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('createInvoiceTitle')}</h2>
        <form onSubmit={handleGenerateInvoice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col">
                <label htmlFor="customerName" className="mb-1 text-sm font-medium text-slate-600">{t('customerNameLabel')}</label>
                <input type="text" id="customerName" name="customerName" value={newInvoiceData.customerName} onChange={handleInputChange} className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col">
                <label htmlFor="invoiceDate" className="mb-1 text-sm font-medium text-slate-600">{t('invoiceDateLabel')}</label>
                <input type="date" id="invoiceDate" name="invoiceDate" value={newInvoiceData.invoiceDate} onChange={handleInputChange} className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col">
                <label htmlFor="targetTotal" className="mb-1 text-sm font-medium text-slate-600">{t('invoiceTargetTotalLabel')}</label>
                <input type="number" id="targetTotal" name="targetTotal" value={newInvoiceData.targetTotal} onChange={handleInputChange} min="0" step="0.01" placeholder={t('invoiceTargetTotalPlaceholder')} className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={isGenerating} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 flex items-center justify-center disabled:bg-slate-400 disabled:cursor-wait">
                <PlusIcon />
                {isGenerating ? t('generatingInvoiceButton') : t('generateInvoiceButton')}
            </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* List of existing invoices */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-700">{t('existingInvoicesTitle')} ({sortedInvoices.length})</h2>
            <input type="text" placeholder={t('searchInvoicePlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md w-1/3 focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('invoiceNumberHeader')}</th>
                    <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('customerNameHeader')}</th>
                    <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('dateHeader')}</th>
                    <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('totalAmountHeader')}</th>
                    <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderAction')}</th>
                  </tr>
                </thead>
                <tbody>
                    {sortedInvoices.length > 0 ? sortedInvoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-slate-50">
                            <td className="py-2 px-4 border-b text-slate-900">{invoice.invoiceNumber}</td>
                            <td className="py-2 px-4 border-b text-slate-900">{invoice.customerName}</td>
                            <td className="py-2 px-4 border-b text-slate-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                            <td className="py-2 px-4 border-b text-slate-900">{invoice.totalAmount.toFixed(2)}</td>
                            <td className="py-2 px-4 border-b">
                                <div className="flex items-center justify-end space-x-2 space-x-reverse">
                                    <button onClick={() => viewInvoice(invoice)} title={t('viewInvoice')} className="text-sky-600 hover:text-sky-800 p-1"><EyeIcon /></button>
                                    <button onClick={() => printInvoice(invoice)} title={t('printInvoice')} className="text-indigo-600 hover:text-indigo-800 p-1"><PrintIcon /></button>
                                    <button onClick={() => removeInvoice(invoice.id)} title={t('deleteInvoice')} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-slate-500">
                                {searchTerm ? t('emptyInvoiceSearch') : t('emptyInvoices')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="mt-6 text-center">
            <button onClick={navigateToInventory} className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors">
                {t('goToInventoryPageButton')}
            </button>
        </div>
      </div>

      {/* Invoice Modal for viewing */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative my-8">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold">{t('invoiceDetailTitle')} - {selectedInvoice.invoiceNumber}</h3>
                    <button onClick={closeModal} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
                </div>
                <div className="p-6">
                    <InvoiceTemplateComponent invoice={selectedInvoice} user={currentUser} />
                </div>
                <div className="p-4 border-t flex justify-end space-x-2">
                    <button onClick={closeModal} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-md hover:bg-slate-300">{t('closeButton')}</button>
                    <button onClick={() => printInvoice(selectedInvoice)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                      <PrintIcon/> <span className="mx-2">{t('printButton')}</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Hidden component for printing */}
      <div className="hidden">
          <InvoiceTemplateComponent ref={componentToPrintRef} invoice={selectedInvoice} user={currentUser} />
      </div>
    </div>
  );
};

export default InvoicePage;