import React, { useState, useMemo, useRef } from 'react';
import type { Item, InvoiceData } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { generateInvoiceItems } from '../services/invoiceService';
import { useReactToPrint } from 'react-to-print';

const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h1v-4a1 1 0 011-1h8a1 1 0 011 1v4h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>;

const InvoiceDetailView = React.forwardRef<HTMLDivElement, { invoice: InvoiceData }>(({ invoice }, ref) => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const VAT_RATE = 0.20; // 20%

    const groupedItems = useMemo(() => {
        const groups = new Map<string, { item: Item; quantity: number; totalHT: number }>();
        invoice.items.forEach(item => {
            const key = item.ref;
            if (groups.has(key)) {
                const existing = groups.get(key)!;
                existing.quantity += 1;
                existing.totalHT += item.purchasePrice;
            } else {
                groups.set(key, { item, quantity: 1, totalHT: item.purchasePrice });
            }
        });
        return Array.from(groups.values());
    }, [invoice.items]);

    const totalHT = groupedItems.reduce((sum, group) => sum + group.totalHT, 0);
    const totalTVA = totalHT * VAT_RATE;
    const totalTTC = invoice.totalAmount;

    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans text-sm">
             <style type="text/css" media="print">
                {`
                @page { size: A4; margin: 0; }
                body { -webkit-print-color-adjust: exact; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                tr { page-break-inside: avoid; }
                .invoice-table thead th {
                    -webkit-print-color-adjust: exact;
                    background-color: #f3f4f6 !important;
                 }
                `}
            </style>
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-blue-800">{currentUser?.companyName}</h1>
                <p className="text-gray-600">{currentUser?.companySubtitle}</p>
            </header>
            <div className="grid grid-cols-2 gap-4 mb-8">
                 <div>
                    <h2 className="font-bold text-lg mb-2 text-blue-700">Facture</h2>
                    <p><strong>{t('invoiceNumberLabel')}:</strong> {invoice.invoiceNumber}</p>
                    <p><strong>{t('invoiceDateLabel')}:</strong> {invoice.date}</p>
                </div>
                 <div className="text-right">
                    <h2 className="font-bold text-lg mb-2">{t('customerNameLabel')}</h2>
                    <p>{invoice.customerName}</p>
                </div>
            </div>

            <table className="w-full mb-8 invoice-table">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left font-bold">{t('ref')}</th>
                        <th className="p-2 text-left font-bold">{t('itemName')}</th>
                        <th className="p-2 text-right font-bold">{t('quantity')}</th>
                        <th className="p-2 text-right font-bold">{t('unitPriceHT')}</th>
                        <th className="p-2 text-right font-bold">{t('totalHT')}</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedItems.map(({ item, quantity, totalHT }) => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2">{item.ref}</td>
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-right">{quantity}</td>
                            <td className="p-2 text-right">{item.purchasePrice.toFixed(2)}</td>
                            <td className="p-2 text-right">{totalHT.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-8">
                <div className="w-1/2">
                    <table className="w-full">
                        <tbody>
                            <tr className="border-t">
                                <td className="p-2 font-bold">{t('totalHT')}</td>
                                <td className="p-2 text-right">{totalHT.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="p-2 font-bold">{t('totalTVA')} ({(VAT_RATE * 100).toFixed(0)}%)</td>
                                <td className="p-2 text-right">{totalTVA.toFixed(2)}</td>
                            </tr>
                            <tr className="bg-gray-200 font-bold text-lg">
                                <td className="p-2">{t('totalTTC')}</td>
                                <td className="p-2 text-right">{totalTTC.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <footer className="text-center text-xs text-gray-500 border-t pt-4">
                 <p>{currentUser?.companyAddress} - {t('phoneLabel')}: {currentUser?.companyPhone} - {t('companyICELabel')}: {currentUser?.companyICE}</p>
            </footer>
        </div>
    );
});


const InvoicePreviewModal: React.FC<{ invoice: InvoiceData, onClose: () => void }> = ({ invoice, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    // FIX: The type definitions for this version of react-to-print are incorrect.
    // 'content' is a valid option but is not in the type. Using a type cast to bypass the error.
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `facture-${invoice.invoiceNumber}`,
    } as any);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                 <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold">Aperçu de la Facture</h2>
                     <div className="flex items-center space-x-2">
                        <button onClick={handlePrint} className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700"><PrintIcon /></button>
                        <button onClick={onClose} className="text-2xl font-bold text-slate-500 hover:text-slate-800">&times;</button>
                    </div>
                </div>
                <div className="overflow-y-auto">
                   <InvoiceDetailView invoice={invoice} ref={componentRef} />
                </div>
            </div>
        </div>
    );
};

interface InvoicePageProps {
  inventory: Item[];
  invoices: InvoiceData[];
  addInvoice: (invoice: Omit<InvoiceData, 'id' | 'userId'>) => Promise<InvoiceData>;
  removeInvoice: (id: string) => void;
  deductInventoryForInvoice: (invoice: InvoiceData) => void;
}

const InvoicePage: React.FC<InvoicePageProps> = ({ inventory, invoices, addInvoice, removeInvoice, deductInventoryForInvoice }) => {
  const { t } = useTranslation();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState({ invoiceNumber: '', customerName: '', targetAmount: '', invoiceDate: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { invoiceNumber: '', customerName: '', targetAmount: '', invoiceDate: '' };
    let isValid = true;
    if(!invoiceNumber.trim()){ newErrors.invoiceNumber = t('errorInvoiceNumberRequired'); isValid = false; }
    if (!customerName.trim()) { newErrors.customerName = t('errorCustomerNameRequired'); isValid = false; }
    if (parseFloat(targetAmount) <= 0 || isNaN(parseFloat(targetAmount))) { newErrors.targetAmount = t('errorAmountPositive'); isValid = false; }
    if (!invoiceDate) { newErrors.invoiceDate = t('errorDateRequired'); isValid = false; }
    setErrors(newErrors);

    if (isValid) {
        setIsLoading(true);
        const target = parseFloat(targetAmount);
        const targetHT = target / 1.20; 

        // Filter inventory by date
        const availableInventory = inventory.filter(item => new Date(item.purchaseDate) <= new Date(invoiceDate));

        if (availableInventory.length === 0) {
            alert(t('errorNoItemsForDate'));
            setIsLoading(false);
            return;
        }

        const items = await generateInvoiceItems(availableInventory, targetHT, invoiceDate);

        if (items) {
             const newInvoiceData: Omit<InvoiceData, 'id' | 'userId'> = {
                invoiceNumber,
                customerName,
                date: invoiceDate,
                totalAmount: target,
                items,
            };
            const savedInvoice = await addInvoice(newInvoiceData);
            await deductInventoryForInvoice(savedInvoice);
            
            // Reset form
            setInvoiceNumber('');
            setCustomerName('');
            setTargetAmount('');
        } else {
            alert(t('errorNoCombination'));
        }
        setIsLoading(false);
    }
  };
  
  const handleRemoveInvoice = (invoiceId: string) => {
    if (window.confirm(t('cancelInvoiceConfirmation'))) {
        removeInvoice(invoiceId);
    }
  };

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  return (
    <div className="space-y-8">
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('createNewInvoice')}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end" noValidate>
            <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('invoiceNumberLabel')}</label>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className={`w-full p-2 border ${errors.invoiceNumber ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
                {errors.invoiceNumber && <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber}</p>}
            </div>
            <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('customerNameLabel')}</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className={`w-full p-2 border ${errors.customerName ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
            </div>
            <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('totalAmountTTC')}</label>
                <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="Ex: 1250.75" className={`w-full p-2 border ${errors.targetAmount ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
                {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount}</p>}
            </div>
             <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('invoiceDateLabel')}</label>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={`w-full p-2 border ${errors.invoiceDate ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
                {errors.invoiceDate && <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 transition-colors flex items-center justify-center">
                {isLoading ? t('generatingInvoice') : t('generateInvoiceButton')}
            </button>
        </form>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('invoiceHistory')} ({sortedInvoices.length})</h2>
        <div className="overflow-x-auto">
           <table className="min-w-full bg-white">
             <thead className="bg-slate-100">
               <tr>
                 <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('invoiceNumberLabel')}</th>
                 <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('customerNameLabel')}</th>
                 <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('date')}</th>
                 <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('totalAmount')}</th>
                 <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('actions')}</th>
               </tr>
             </thead>
             <tbody>
                {sortedInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4 border-b">{invoice.invoiceNumber}</td>
                        <td className="py-2 px-4 border-b">{invoice.customerName}</td>
                        <td className="py-2 px-4 border-b">{invoice.date}</td>
                        <td className="py-2 px-4 border-b">{invoice.totalAmount.toFixed(2)}</td>
                        <td className="py-2 px-4 border-b">
                            <div className="flex items-center justify-end space-x-2 space-x-reverse">
                                <button onClick={() => setSelectedInvoice(invoice)} title={t('view')} className="text-blue-600 hover:text-blue-800 p-1"><EyeIcon /></button>
                                <button onClick={() => handleRemoveInvoice(invoice.id)} title={t('cancelInvoice')} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                            </div>
                        </td>
                    </tr>
                ))}
             </tbody>
           </table>
        </div>
      </div>
      {selectedInvoice && <InvoicePreviewModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  );
};

export default InvoicePage;