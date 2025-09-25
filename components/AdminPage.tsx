import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

interface AdminPageProps {
  navigateToApp: () => void;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);


const AdminPage: React.FC<AdminPageProps> = ({ navigateToApp }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [newCompanyICE, setNewCompanyICE] = useState('');
  const [newCompanySubtitle, setNewCompanySubtitle] = useState('');

  const [formError, setFormError] = useState({username: '', password: '', companyName: '', companyAddress: ''});
  const [successMessage, setSuccessMessage] = useState('');

  const { users, addUser, removeUser } = useAuth();
  const { t } = useTranslation();
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {username: '', password: '', companyName: '', companyAddress: ''};
    let isValid = true;
    if(!newUsername.trim()){ newErrors.username = t('usernameRequired'); isValid = false; }
    if(!newUserPassword.trim()){ newErrors.password = t('passwordRequired'); isValid = false; }
    if(!newCompanyName.trim()){ newErrors.companyName = t('errorCompanyNameRequired'); isValid = false; }
    if(!newCompanyAddress.trim()){ newErrors.companyAddress = t('errorCompanyAddressRequired'); isValid = false; }
    setFormError(newErrors);

    if(isValid){
      const success = await addUser({
        username: newUsername,
        password: newUserPassword,
        companyName: newCompanyName,
        companyAddress: newCompanyAddress,
        companyPhone: newCompanyPhone,
        companyICE: newCompanyICE,
        companySubtitle: newCompanySubtitle,
      });
      if (success) {
        setNewUsername('');
        setNewUserPassword('');
        setNewCompanyName('');
        setNewCompanyAddress('');
        setNewCompanyPhone('');
        setNewCompanyICE('');
        setNewCompanySubtitle('');
        setSuccessMessage(t('userCreatedSuccess'));
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  return (
    <div className="space-y-8 container mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">{t('adminPageTitle')}</h1>
        <button onClick={navigateToApp} className="text-sm text-blue-600 hover:underline">
            {t('goBackButton')}
        </button>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('createNewUser')}</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('usernameLabel')}</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className={`w-full p-2 border ${formError.username ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
                {formError.username && <p className="text-red-500 text-xs mt-1">{formError.username}</p>}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('passwordLabel')}</label>
                <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className={`w-full p-2 border ${formError.password ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
                {formError.password && <p className="text-red-500 text-xs mt-1">{formError.password}</p>}
              </div>
               <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('companyNameLabel')}</label>
                <input type="text" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className={`w-full p-2 border ${formError.companyName ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
                {formError.companyName && <p className="text-red-500 text-xs mt-1">{formError.companyName}</p>}
              </div>
               <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('companyAddressLabel')}</label>
                <input type="text" value={newCompanyAddress} onChange={(e) => setNewCompanyAddress(e.target.value)} className={`w-full p-2 border ${formError.companyAddress ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`} />
                {formError.companyAddress && <p className="text-red-500 text-xs mt-1">{formError.companyAddress}</p>}
              </div>
               <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('companyPhoneLabel')}</label>
                <input type="text" value={newCompanyPhone} onChange={(e) => setNewCompanyPhone(e.target.value)} className="w-full p-2 border border-slate-300 bg-slate-100 rounded-md" />
              </div>
               <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">{t('companyICELabel')}</label>
                <input type="text" value={newCompanyICE} onChange={(e) => setNewCompanyICE(e.target.value)} className="w-full p-2 border border-slate-300 bg-slate-100 rounded-md" />
              </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-600">{t('companySubtitleLabel')}</label>
            <input type="text" value={newCompanySubtitle} onChange={(e) => setNewCompanySubtitle(e.target.value)} className="w-full p-2 border border-slate-300 bg-slate-100 rounded-md" />
          </div>
          <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">{t('addUserButton')}</button>
        </form>
        {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-700">{t('existingUsers')} ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-100">
              <tr>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('usernameLabel')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('companyNameLabel')}</th>
                <th className="py-2 px-4 border-b text-right font-semibold text-slate-600">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="py-2 px-4 border-b text-slate-900">{user.username}</td>
                  <td className="py-2 px-4 border-b text-slate-900">{user.companyName}</td>
                  <td className="py-2 px-4 border-b">
                    <button onClick={() => removeUser(user.id)} className="text-red-500 hover:text-red-700 p-1">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;