import React, { useState, useMemo, useEffect } from 'react';
import type { Item, InvoiceData, User } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { generateInvoiceItems } from '../services/invoiceService';

interface InvoicePageProps {
  inventory: Item[];
  invoices: InvoiceData[];
  addInvoice: (invoice: Omit<InvoiceData, 'id' | 'userId'>) => Promise<InvoiceData | null>;
  removeInvoice: (id: string) => void;
  deductInventoryForInvoice: (items: Item[]) => Promise<void>;
  navigateToInventory: () => void;
}

const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Adjust for timezone offset to prevent date from shifting
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        const day = String(adjustedDate.getDate()).padStart(2, '0');
        const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
        const year = adjustedDate.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateString; // Fallback
    }
};

// --- Icons ---
const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm-2 5a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const CloseIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


interface InvoicePreviewModalProps {
    invoice: InvoiceData;
    companyInfo: User | null;
    onClose: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ invoice, companyInfo, onClose }) => {
    const { t } = useTranslation();
    const tvaRate = 0.20; // 20%
    const totalHT = invoice.totalAmount;
    const totalTVA = totalHT * tvaRate;
    const totalTTC = totalHT + totalTVA;

    const groupedItems = useMemo(() => {
        const itemsMap = new Map<string, Item & { count: number }>();
        invoice.items.forEach(item => {
            const existing = itemsMap.get(item.id);
            if (existing) {
                existing.count += 1;
            } else {
                itemsMap.set(item.id, { ...item, count: 1 });
            }
        });
        return Array.from(itemsMap.values());
    }, [invoice.items]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';

        return () => {
          window.removeEventListener('keydown', handleEsc);
          document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div id="invoice-modal" className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 print:static print:block print:bg-white print:p-0">
            <div id="invoice-modal-content" className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:overflow-visible">
                <div className="flex justify-between items-start print:hidden">
                    <h2 className="text-2xl font-bold text-slate-800">{t('invoiceDetailTitle')}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                
                <div className="mt-6 border-t pt-6">
                    {/* Header section */}
                    <div className="mb-8">
                        {/* Company Info - Centered */}
                        <div className="text-center mb-10">
                            <h2 className="text-4xl font-serif text-blue-700">{companyInfo?.companyName || t('yourCompany')}</h2>
                            {companyInfo?.companySubtitle && <p className="text-sm text-slate-600 mt-2">{companyInfo.companySubtitle}</p>}
                        </div>

                        {/* Client Info - Placed on the right */}
                        <div className="flex justify-end mb-10">
                            <div className="text-right">
                                <p className="font-semibold text-slate-700">{t('customerNameLabel', {}, 'fr')}: <span className="font-bold">{invoice.customerName}</span></p>
                            </div>
                        </div>
                        
                        {/* Invoice Details - Left Aligned */}
                        <div className="border-b pb-8 mb-8">
                            <h3 className="text-2xl font-bold text-blue-700 mb-2">{t('invoiceTitle')}</h3>
                            <p className="font-semibold text-slate-700">{t('invoiceNumberLabel', {}, 'fr')}: <span className="font-normal">{invoice.invoiceNumber}</span></p>
                            <p className="font-semibold text-slate-700">{t('invoiceDateLabel', {}, 'fr')}: <span className="font-normal">{formatDate(invoice.invoiceDate)}</span></p>
                        </div>
                    </div>
                    
                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="py-2 px-4 text-right font-semibold text-slate-600">{t('tableHeaderItemReference')}</th>
                                <th className="py-2 px-4 text-right font-semibold text-slate-600">{t('tableHeaderItemName')}</th>
                                <th className="py-2 px-4 text-right font-semibold text-slate-600">{t('tableHeaderQuantity')}</th>
                                <th className="py-2 px-4 text-right font-semibold text-slate-600">{t('tableHeaderUnitPrice')}</th>
                                <th className="py-2 px-4 text-right font-semibold text-slate-600">{t('tableHeaderTotalHT')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedItems.map((item) => (
                                <tr key={item.id} className="border-b">
                                    <td className="py-2 px-4 text-slate-700">{item.reference}</td>
                                    <td className="py-2 px-4 text-slate-700">{item.name}</td>
                                    <td className="py-2 px-4 text-slate-700 text-center">{item.count}</td>
                                    <td className="py-2 px-4 text-slate-700">{item.price.toFixed(2)}</td>
                                    <td className="py-2 px-4 text-slate-700">{(item.price * item.count).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                     {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between py-2 border-b">
                                <span className="font-semibold text-slate-600">{t('totalHTLabel')}:</span>
                                <span className="font-semibold text-slate-800">{totalHT.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="font-semibold text-slate-600">{t('tvaLabel')} ({tvaRate * 100}%):</span>
                                <span className="font-semibold text-slate-800">{totalTVA.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 mt-2 bg-slate-100 px-2 rounded-md">
                                <span className="text-lg font-bold text-slate-800">{t('totalTTCLabel')}:</span>
                                <span className="text-lg font-bold text-slate-800">{totalTTC.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center print:hidden">
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto">
                        <PrintIcon />
                        {t('printButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const InvoicePage: React.FC<InvoicePageProps> = ({ inventory, invoices, addInvoice, removeInvoice, deductInventoryForInvoice, navigateToInventory }) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [targetTotal, setTargetTotal] = useState('');
    
    const [generatedItems, setGeneratedItems] = useState<Item[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [invoiceToPreview, setInvoiceToPreview] = useState<InvoiceData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice =>
            invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [invoices, searchTerm]);

    const handleGenerateItems = async () => {
        setIsLoading(true);
        setError('');
        setGeneratedItems(null);

        const totalTTC = parseFloat(targetTotal);
        if (isNaN(totalTTC) || totalTTC <= 0) {
            setError(t('errorInvalidAmount'));
            setIsLoading(false);
            return;
        }

        // Filter inventory to only include items available on or before the invoice date.
        const availableInventory = inventory.filter(item => item.purchaseDate <= invoiceDate);

        if (inventory.length > 0 && availableInventory.length === 0) {
            setError(t('errorNoItemsForDate'));
            setIsLoading(false);
            return;
        }

        const tvaRate = 0.20;
        const totalHT = totalTTC / (1 + tvaRate);

        try {
            const items = await generateInvoiceItems(availableInventory, totalHT, invoiceDate);
            if (items && items.length > 0) {
                setGeneratedItems(items);
            } else {
                setError(t('errorNoCombination'));
            }
        } catch (e) {
            console.error(e);
            setError(t('errorGeneratingItems'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveInvoice = async () => {
        if (!invoiceNumber.trim()) {
            setError(t('errorInvoiceNumberRequired'));
            return;
        }
        if (!customerName.trim()) {
            setError(t('errorCustomerNameRequired'));
            return;
        }
        if (!generatedItems || generatedItems.length === 0) {
            setError(t('errorNoItemsToSave'));
            return;
        }

        const totalAmount = generatedItems.reduce((sum, item) => sum + item.price, 0);
        
        const newInvoiceData: Omit<InvoiceData, 'id' | 'userId'> = {
            customerName,
            invoiceDate,
            items: generatedItems,
            totalAmount,
            invoiceNumber,
        };
        
        const newInvoice = await addInvoice(newInvoiceData);
        if (newInvoice) {
            // Deduct items from inventory after saving the invoice
            await deductInventoryForInvoice(generatedItems);
            
            setInvoiceNumber('');
            setCustomerName('');
            setTargetTotal('');
            setGeneratedItems(null);
            setError('');
            setInvoiceToPreview(newInvoice);
        } else {
            setError(t('errorSavingInvoice'));
        }
    };
    
    const calculatedTotal = useMemo(() => {
        if (!generatedItems) return 0;
        return generatedItems.reduce((sum, item) => sum + item.price, 0);
    }, [generatedItems]);

    return (
        <div className="space-y-8">
            {/* --- Invoice Generation --- */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-slate-700">{t('createInvoiceTitle')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="flex flex-col">
                        <label htmlFor="invoiceNumber" className="mb-1 text-sm font-medium text-slate-600">{t('invoiceNumberLabel')}</label>
                        <input type="text" id="invoiceNumber" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="customerName" className="mb-1 text-sm font-medium text-slate-600">{t('customerNameLabel')}</label>
                        <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500" />
                    </div>
                     <div className="flex flex-col">
                        <label htmlFor="targetTotal" className="mb-1 text-sm font-medium text-slate-600">{t('targetTotalLabel')}</label>
                        <input type="number" id="targetTotal" value={targetTotal} onChange={(e) => setTargetTotal(e.target.value)} min="0" step="0.01" className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500" placeholder={t('amountPlaceholder')} />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="invoiceDate" className="mb-1 text-sm font-medium text-slate-600">{t('invoiceDateLabel')}</label>
                        <input type="date" id="invoiceDate" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button onClick={handleGenerateItems} disabled={isLoading || inventory.length === 0} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {isLoading ? t('generatingButton') : t('generateItemsButton')}
                    </button>
                </div>
                {inventory.length === 0 && <p className="text-yellow-600 text-sm mt-2">{t('emptyInventoryWarning')}</p>}
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            {/* --- Generated Items --- */}
            {generatedItems && (
                <div className="p-6 bg-white rounded-lg shadow-sm animate-fade-in">
                    <h3 className="text-lg font-bold mb-4 text-slate-700">{t('generatedInvoiceItemsTitle')}</h3>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full bg-white">
                            <thead className="bg-slate-100 sticky top-0">
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
                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-lg font-bold text-slate-800">
                            {t('totalAmountLabel')}: {calculatedTotal.toFixed(2)}
                            <span className="text-sm font-normal text-slate-500 ml-2">({t('totalDifferenceLabel')}: {(calculatedTotal - parseFloat(targetTotal || '0') / 1.2).toFixed(2)})</span>
                        </p>
                        <button onClick={handleSaveInvoice} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
                            {t('saveInvoiceButton')}
                        </button>
                    </div>
                </div>
            )}

            {/* --- Invoice History --- */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-700">{t('invoiceHistoryTitle')} ({filteredInvoices.length})</h2>
                    <input type="text" placeholder={t('searchPlaceholderInvoice')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md w-1/3 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('invoiceNumberLabel')}</th>
                                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('customerNameLabel')}</th>
                                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderDate')}</th>
                                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('totalAmountLabel')}</th>
                                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderAction')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="hover:bg-slate-50">
                                    <td className="py-2 px-4 border-b text-slate-900">{invoice.invoiceNumber}</td>
                                    <td className="py-2 px-4 border-b text-slate-900">{invoice.customerName}</td>
                                    <td className="py-2 px-4 border-b text-slate-900">{formatDate(invoice.invoiceDate)}</td>
                                    <td className="py-2 px-4 border-b text-slate-900">{invoice.totalAmount.toFixed(2)}</td>
                                    <td className="py-2 px-4 border-b">
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <button onClick={() => setInvoiceToPreview(invoice)} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm hover:bg-blue-200">{t('viewInvoice')}</button>
                                            <button onClick={() => removeInvoice(invoice.id)} className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200">{t('deleteInvoice')}</button>
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
                    <button onClick={navigateToInventory} className="bg-slate-600 text-white px-6 py-2 rounded-md hover:bg-slate-700 transition-colors">
                        {t('goToInventoryPageButton')}
                    </button>
                </div>
            </div>
            
            {invoiceToPreview && (
                <InvoicePreviewModal
                    invoice={invoiceToPreview}
                    companyInfo={currentUser}
                    onClose={() => setInvoiceToPreview(null)}
                />
            )}
        </div>
    );
};

export default InvoicePage;