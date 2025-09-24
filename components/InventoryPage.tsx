
import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { Item } from '../types';
import { useTranslation } from '../context/LanguageContext';

// Re-usable icons
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>);
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>);
const SaveIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>);
const CancelIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>);


interface InventoryPageProps {
  inventory: Item[];
  addItem: (items: Omit<Item, 'id' | 'userId'>[]) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updatedData: Partial<Omit<Item, 'id'|'userId'>>) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ inventory, addItem, removeItem, updateItem }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newItem, setNewItem] = useState({ ref: '', name: '', category: '', purchasePrice: 0, quantity: 0, purchaseDate: new Date().toISOString().split('T')[0] });
  const [errors, setErrors] = useState({ ref: '', name: '', purchasePrice: '', quantity: '', purchaseDate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Item; direction: 'asc' | 'desc' } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Item>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        const newItems = json.map(row => ({
          ref: String(row['Référence'] || ''),
          name: String(row["Nom de l'article"] || ''),
          category: String(row['Catégorie'] || 'N/A'),
          purchasePrice: parseFloat(row['P.U'] || 0),
          quantity: parseInt(row['Quantité'] || 0, 10),
          purchaseDate: new Date().toISOString().split('T')[0]
        }));

        addItem(newItems);
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  const validateForm = (itemData: typeof newItem): boolean => {
    const newErrors = { ref: '', name: '', purchasePrice: '', quantity: '', purchaseDate: '' };
    let isValid = true;
    if (!itemData.ref.trim()) { newErrors.ref = t('errorRefRequired'); isValid = false; }
    if (!itemData.name.trim()) { newErrors.name = t('errorNameRequired'); isValid = false; }
    if (itemData.purchasePrice <= 0) { newErrors.purchasePrice = t('errorPricePositive'); isValid = false; }
    if (itemData.quantity < 0) { newErrors.quantity = t('errorQuantityPositive'); isValid = false; }
    if (!itemData.purchaseDate) { newErrors.purchaseDate = t('errorDateRequired'); isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm(newItem)) {
      addItem([newItem]);
      setNewItem({ ref: '', name: '', category: '', purchasePrice: 0, quantity: 0, purchaseDate: new Date().toISOString().split('T')[0] });
    }
  };

  const handleEditClick = (item: Item) => {
    setEditingItemId(item.id);
    setEditFormData({
      ref: item.ref,
      name: item.name,
      category: item.category,
      purchasePrice: item.purchasePrice,
      quantity: item.quantity,
      purchaseDate: item.purchaseDate,
    });
  };
  
  const handleCancelClick = () => {
    setEditingItemId(null);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };
  
  const handleSaveClick = (itemId: string) => {
    updateItem(itemId, editFormData);
    setEditingItemId(null);
  };

  const sortedInventory = useMemo(() => {
    let sortableItems = [...inventory];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [inventory, sortConfig]);
  
  const requestSort = (key: keyof Item) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredInventory = useMemo(() => sortedInventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  ), [sortedInventory, searchTerm]);

  const inventorySummary = useMemo(() => {
    return {
      uniqueArticles: inventory.length,
      totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: inventory.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0)
    };
  }, [inventory]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg shadow-sm text-center">
              <h3 className="text-lg font-semibold text-slate-500">{t('totalUniqueItems')}</h3>
              <p className="text-3xl font-bold text-slate-800">{inventorySummary.uniqueArticles}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm text-center">
              <h3 className="text-lg font-semibold text-slate-500">{t('totalItemQuantity')}</h3>
              <p className="text-3xl font-bold text-slate-800">{inventorySummary.totalQuantity.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm text-center">
              <h3 className="text-lg font-semibold text-slate-500">{t('totalInventoryValue')}</h3>
              <p className="text-3xl font-bold text-slate-800">{inventorySummary.totalValue.toFixed(2)}</p>
          </div>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('importItemsTitle')}</h2>
        <div className="flex space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx, .xls"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <UploadIcon /> {t('importFromExcelButton')}
          </button>
        </div>
      </div>
      
       <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('addNewItem')}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-start" noValidate>
          <div className="lg:col-span-1">
            <label htmlFor="ref" className="block text-sm font-medium text-slate-700">{t('ref')}</label>
            <input type="text" name="ref" id="ref" value={newItem.ref} onChange={handleInputChange} className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${errors.ref ? 'border-red-500' : 'border-slate-300'}`} />
            {errors.ref && <p className="text-red-500 text-xs mt-1">{errors.ref}</p>}
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('name')}</label>
            <input type="text" name="name" id="name" value={newItem.name} onChange={handleInputChange} className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${errors.name ? 'border-red-500' : 'border-slate-300'}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="purchasePrice" className="block text-sm font-medium text-slate-700">{t('purchasePrice')}</label>
            <input type="number" name="purchasePrice" id="purchasePrice" value={newItem.purchasePrice} onChange={handleInputChange} className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${errors.purchasePrice ? 'border-red-500' : 'border-slate-300'}`} />
            {errors.purchasePrice && <p className="text-red-500 text-xs mt-1">{errors.purchasePrice}</p>}
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">{t('quantity')}</label>
            <input type="number" name="quantity" id="quantity" value={newItem.quantity} onChange={handleInputChange} className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${errors.quantity ? 'border-red-500' : 'border-slate-300'}`} />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-slate-700">{t('purchaseDate')}</label>
            <input type="date" name="purchaseDate" id="purchaseDate" value={newItem.purchaseDate} onChange={handleInputChange} className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${errors.purchaseDate ? 'border-red-500' : 'border-slate-300'}`} />
            {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
          </div>
          <div className="lg:col-span-1 self-end">
            <button type="submit" className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center w-full">
              <PlusIcon /> {t('addItemButton')}
            </button>
          </div>
        </form>
      </div>


      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-700">{t('currentInventory')} ({filteredInventory.length})</h2>
          <input type="text" placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border border-slate-300 bg-slate-100 rounded-md w-1/3" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-100">
              <tr>
                {['ref', 'name', 'purchasePrice', 'quantity', 'purchaseDate'].map((key) => (
                    <th key={key} className="py-2 px-4 border-b text-right font-semibold text-slate-600 cursor-pointer" onClick={() => requestSort(key as keyof Item)}>
                        {t(key)}{sortConfig?.key === key ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                ))}
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                   {editingItemId === item.id ? (
                        <>
                            <td className="py-2 px-4 border-b"><input type="text" name="ref" value={editFormData.ref} onChange={handleEditFormChange} className="w-full p-1 border border-slate-300 rounded-md" /></td>
                            <td className="py-2 px-4 border-b"><input type="text" name="name" value={editFormData.name} onChange={handleEditFormChange} className="w-full p-1 border border-slate-300 rounded-md" /></td>
                            <td className="py-2 px-4 border-b"><input type="number" name="purchasePrice" value={editFormData.purchasePrice} onChange={handleEditFormChange} className="w-full p-1 border border-slate-300 rounded-md" /></td>
                            <td className="py-2 px-4 border-b"><input type="number" name="quantity" value={editFormData.quantity} onChange={handleEditFormChange} className="w-full p-1 border border-slate-300 rounded-md" /></td>
                            <td className="py-2 px-4 border-b"><input type="date" name="purchaseDate" value={editFormData.purchaseDate} onChange={handleEditFormChange} className="w-full p-1 border border-slate-300 rounded-md" /></td>
                            <td className="py-2 px-4 border-b">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <button onClick={() => handleSaveClick(item.id)} title={t('save')} className="text-green-600 hover:text-green-800 p-1"><SaveIcon /></button>
                                    <button onClick={handleCancelClick} title={t('cancel')} className="text-slate-500 hover:text-slate-700 p-1"><CancelIcon /></button>
                                </div>
                            </td>
                        </>
                    ) : (
                        <>
                            <td className="py-2 px-4 border-b text-slate-900">{item.ref}</td>
                            <td className="py-2 px-4 border-b text-slate-900">{item.name}</td>
                            <td className="py-2 px-4 border-b text-slate-900">{item.purchasePrice.toFixed(2)}</td>
                            <td className="py-2 px-4 border-b text-slate-900">{item.quantity}</td>
                            <td className="py-2 px-4 border-b text-slate-900">{item.purchaseDate}</td>
                            <td className="py-2 px-4 border-b">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <button onClick={() => handleEditClick(item)} title={t('edit')} className="text-blue-600 hover:text-blue-800 p-1"><EditIcon /></button>
                                    <button onClick={() => removeItem(item.id)} title={t('delete')} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                </div>
                            </td>
                        </>
                    )}
                </tr>
              )) : (
                <tr>
                    <td colSpan={6} className="text-center py-4 text-slate-500">{t('noItemsFound')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
