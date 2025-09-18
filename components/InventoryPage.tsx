import React, { useState, useMemo } from 'react';
import type { Item } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface InventoryPageProps {
  inventory: Item[];
  addItem: (item: Omit<Item, 'id' | 'userId'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updatedData: Partial<Omit<Item, 'id' | 'userId'>>) => void;
  navigateToInvoice: () => void;
}

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

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


const SortIcon = () => (
    <svg className="h-4 w-4 text-slate-400 group-hover:text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l3.47-3.47a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const SortAscIcon = () => (
  <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const SortDescIcon = () => (
  <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);


type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'reference' | 'name' | 'price' | 'purchaseDate';
interface SortConfig {
  key: SortableKeys | null;
  direction: SortDirection;
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

const InventoryPage: React.FC<InventoryPageProps> = ({ inventory, addItem, removeItem, updateItem, navigateToInvoice }) => {
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState({ reference: '', name: '', category: '', price: '', quantity: '1', purchaseDate: new Date().toISOString().split('T')[0] });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [errors, setErrors] = useState({ reference: '', name: '', category: '', price: '', quantity: '', purchaseDate: '' });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ reference: '', name: '', category: '', price: '', quantity: '', purchaseDate: '' });
  const [editErrors, setEditErrors] = useState({ reference: '', name: '', category: '', price: '', quantity: '', purchaseDate: '' });


  const inventorySummary = useMemo(() => {
    const totalUniqueItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { totalUniqueItems, totalQuantity, totalValue };
  }, [inventory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors = { reference: '', name: '', category: '', price: '', quantity: '', purchaseDate: '' };
    let isValid = true;

    if (!newItem.reference.trim()) {
      newErrors.reference = t('errorReferenceRequired');
      isValid = false;
    }
    if (!newItem.name.trim()) {
      newErrors.name = t('errorItemNameRequired');
      isValid = false;
    }
    if (!newItem.category.trim()) {
      newErrors.category = t('errorCategoryRequired');
      isValid = false;
    }

    const price = parseFloat(newItem.price);
    if (isNaN(price) || price <= 0) {
      newErrors.price = t('errorInvalidPrice');
      isValid = false;
    }

    const quantity = parseInt(newItem.quantity, 10);
    if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        newErrors.quantity = t('errorInvalidQuantity');
        isValid = false;
    }

    if (!newItem.purchaseDate || isNaN(new Date(newItem.purchaseDate).getTime())) {
      newErrors.purchaseDate = t('errorInvalidDate');
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      addItem({ ...newItem, price: parseFloat(newItem.price), quantity: parseInt(newItem.quantity, 10) });
      setNewItem({ reference: '', name: '', category: '', price: '', quantity: '1', purchaseDate: new Date().toISOString().split('T')[0] });
      setErrors({ reference: '', name: '', category: '', price: '', quantity: '', purchaseDate: '' });
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAndFilteredInventory = useMemo(() => {
    let sortableItems = [...filteredInventory];
    if (sortConfig.key) {
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            let comparison = 0;
            if (sortConfig.key === 'price') {
                comparison = (aValue as number) - (bValue as number);
            } else if (sortConfig.key === 'purchaseDate') {
                comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
            } else { // 'name' or 'reference'
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }
    return sortableItems;
  }, [filteredInventory, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (sortConfig.key !== key) {
        return <SortIcon />;
    }
    if (sortConfig.direction === 'ascending') {
        return <SortAscIcon />;
    }
    return <SortDescIcon />;
  };

    const handleEditClick = (item: Item) => {
        setEditingItemId(item.id);
        setEditFormData({
            reference: item.reference,
            name: item.name,
            category: item.category,
            price: String(item.price),
            quantity: String(item.quantity),
            purchaseDate: item.purchaseDate,
        });
        setEditErrors({ reference: '', name: '', category: '', price: '', quantity: '', purchaseDate: '' });
    };

    const handleCancelClick = () => {
        setEditingItemId(null);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateEditForm = (): boolean => {
        const newErrors = { reference: '', name: '', category: '', price: '', quantity: '', purchaseDate: '' };
        let isValid = true;
        if (!editFormData.reference.trim()) {
            newErrors.reference = t('errorReferenceRequired');
            isValid = false;
        }
        if (!editFormData.name.trim()) {
            newErrors.name = t('errorItemNameRequired');
            isValid = false;
        }
        if (!editFormData.category.trim()) {
            newErrors.category = t('errorCategoryRequired');
            isValid = false;
        }
        const price = parseFloat(editFormData.price);
        if (isNaN(price) || price <= 0) {
            newErrors.price = t('errorInvalidPrice');
            isValid = false;
        }
        const quantity = parseInt(editFormData.quantity, 10);
        if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
            newErrors.quantity = t('errorInvalidQuantity');
            isValid = false;
        }
        if (!editFormData.purchaseDate || isNaN(new Date(editFormData.purchaseDate).getTime())) {
            newErrors.purchaseDate = t('errorInvalidDate');
            isValid = false;
        }
        setEditErrors(newErrors);
        return isValid;
    };


    const handleSaveClick = (itemId: string) => {
        if (validateEditForm()) {
            updateItem(itemId, {
                reference: editFormData.reference,
                name: editFormData.name,
                category: editFormData.category,
                price: parseFloat(editFormData.price),
                quantity: parseInt(editFormData.quantity, 10),
                purchaseDate: editFormData.purchaseDate,
            });
            setEditingItemId(null);
        }
    };


  return (
    <div className="space-y-8">
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('addNewItemTitle')}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-start" noValidate>
          <div className="flex flex-col">
            <label htmlFor="reference" className="mb-1 text-sm font-medium text-slate-600">{t('referenceLabel')}</label>
            <input type="text" id="reference" name="reference" value={newItem.reference} onChange={handleInputChange} className={`p-2 border ${errors.reference ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
            {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference}</p>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="name" className="mb-1 text-sm font-medium text-slate-600">{t('itemNameLabel')}</label>
            <input type="text" id="name" name="name" value={newItem.name} onChange={handleInputChange} className={`p-2 border ${errors.name ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="category" className="mb-1 text-sm font-medium text-slate-600">{t('categoryLabel')}</label>
            <input type="text" id="category" name="category" value={newItem.category} onChange={handleInputChange} className={`p-2 border ${errors.category ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="price" className="mb-1 text-sm font-medium text-slate-600">{t('unitPriceLabel')}</label>
            <input type="number" id="price" name="price" value={newItem.price} onChange={handleInputChange} min="0" step="0.01" className={`p-2 border ${errors.price ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="quantity" className="mb-1 text-sm font-medium text-slate-600">{t('quantityLabel')}</label>
            <input type="number" id="quantity" name="quantity" value={newItem.quantity} onChange={handleInputChange} min="1" step="1" className={`p-2 border ${errors.quantity ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="purchaseDate" className="mb-1 text-sm font-medium text-slate-600">{t('purchaseDateLabel')}</label>
            <input type="date" id="purchaseDate" name="purchaseDate" value={newItem.purchaseDate} onChange={handleInputChange} className={`p-2 border ${errors.purchaseDate ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
            {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
          </div>
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center mt-6">
            <PlusIcon />
            {t('addItemButton')}
          </button>
        </form>
      </div>

       <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('inventorySummaryTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-100 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('totalUniqueItems')}</h3>
            <p className="text-3xl font-bold text-slate-800">{inventorySummary.totalUniqueItems}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('totalItemQuantity')}</h3>
            <p className="text-3xl font-bold text-slate-800">{inventorySummary.totalQuantity}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('totalInventoryValue')}</h3>
            <p className="text-3xl font-bold text-slate-800">{inventorySummary.totalValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-700">{t('currentInventoryTitle')} ({sortedAndFilteredInventory.length})</h2>
            <input type="text" placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-100">
              <tr>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">
                    <button onClick={() => requestSort('reference')} className="flex items-center space-x-1 space-x-reverse group">
                        <span>{t('tableHeaderItemReference')}</span>
                        {getSortIcon('reference')}
                    </button>
                </th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">
                    <button onClick={() => requestSort('name')} className="flex items-center space-x-1 space-x-reverse group">
                        <span>{t('tableHeaderItemName')}</span>
                        {getSortIcon('name')}
                    </button>
                </th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderCategory')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">
                    <button onClick={() => requestSort('price')} className="flex items-center space-x-1 space-x-reverse group">
                        <span>{t('tableHeaderUnitPrice')}</span>
                        {getSortIcon('price')}
                    </button>
                </th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderQuantity')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">
                    <button onClick={() => requestSort('purchaseDate')} className="flex items-center space-x-1 space-x-reverse group">
                        <span>{t('tableHeaderPurchaseDate')}</span>
                        {getSortIcon('purchaseDate')}
                    </button>
                </th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('tableHeaderAction')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredInventory.length > 0 ? sortedAndFilteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 align-top">
                   {editingItemId === item.id ? (
                    <>
                        <td className="py-2 px-4 border-b">
                            <input type="text" name="reference" value={editFormData.reference} onChange={handleEditFormChange} className={`w-full p-1 border ${editErrors.reference ? 'border-red-500' : 'border-slate-300'} bg-white rounded-md text-sm`} />
                            {editErrors.reference && <p className="text-red-500 text-xs mt-1">{editErrors.reference}</p>}
                        </td>
                        <td className="py-2 px-4 border-b">
                            <input type="text" name="name" value={editFormData.name} onChange={handleEditFormChange} className={`w-full p-1 border ${editErrors.name ? 'border-red-500' : 'border-slate-300'} bg-white rounded-md text-sm`} />
                            {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
                        </td>
                        <td className="py-2 px-4 border-b">
                            <input type="text" name="category" value={editFormData.category} onChange={handleEditFormChange} className={`w-full p-1 border ${editErrors.category ? 'border-red-500' : 'border-slate-300'} bg-white rounded-md text-sm`} />
                            {editErrors.category && <p className="text-red-500 text-xs mt-1">{editErrors.category}</p>}
                        </td>
                        <td className="py-2 px-4 border-b">
                            <input type="number" name="price" value={editFormData.price} onChange={handleEditFormChange} className={`w-full p-1 border ${editErrors.price ? 'border-red-500' : 'border-slate-300'} bg-white rounded-md text-sm`} min="0" step="0.01" />
                            {editErrors.price && <p className="text-red-500 text-xs mt-1">{editErrors.price}</p>}
                        </td>
                        <td className="py-2 px-4 border-b">
                            <input type="number" name="quantity" value={editFormData.quantity} onChange={handleEditFormChange} className={`w-full p-1 border ${editErrors.quantity ? 'border-red-500' : 'border-slate-300'} bg-white rounded-md text-sm`} min="1" step="1"/>
                            {editErrors.quantity && <p className="text-red-500 text-xs mt-1">{editErrors.quantity}</p>}
                        </td>
                        <td className="py-2 px-4 border-b">
                            <input type="date" name="purchaseDate" value={editFormData.purchaseDate} onChange={handleEditFormChange} className={`w-full p-1 border ${editErrors.purchaseDate ? 'border-red-500' : 'border-slate-300'} bg-white rounded-md text-sm`} />
                            {editErrors.purchaseDate && <p className="text-red-500 text-xs mt-1">{editErrors.purchaseDate}</p>}
                        </td>
                        <td className="py-2 px-4 border-b">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <button onClick={() => handleSaveClick(item.id)} title={t('save')} className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100">
                                    <SaveIcon />
                                </button>
                                <button onClick={handleCancelClick} title={t('cancel')} className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100">
                                    <CancelIcon />
                                </button>
                            </div>
                        </td>
                    </>
                ) : (
                    <>
                        <td className="py-2 px-4 border-b text-slate-900">{item.reference}</td>
                        <td className="py-2 px-4 border-b text-slate-900">{item.name}</td>
                        <td className="py-2 px-4 border-b text-slate-900">{item.category}</td>
                        <td className="py-2 px-4 border-b text-slate-900">{item.price.toFixed(2)}</td>
                        <td className="py-2 px-4 border-b text-slate-900">{item.quantity}</td>
                        <td className="py-2 px-4 border-b text-slate-900">{formatDate(item.purchaseDate)}</td>
                        <td className="py-2 px-4 border-b">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button onClick={() => handleEditClick(item)} title={t('edit')} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100">
                                <EditIcon />
                            </button>
                            <button onClick={() => removeItem(item.id)} title={t('deleteUser')} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                                <TrashIcon />
                            </button>
                          </div>
                        </td>
                    </>
                )}
                </tr>
              )) : (
                <tr>
                    <td colSpan={7} className="text-center py-4 text-slate-500">
                        {searchTerm ? t('emptyInventorySearch') : t('emptyInventory')}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {inventory.length > 0 && (
            <div className="mt-6 text-center">
                <button onClick={navigateToInvoice} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
                    {t('goToInvoicePageButton')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;