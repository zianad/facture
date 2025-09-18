import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

const ProfilePage: React.FC = () => {
    const { currentUser, updateUser } = useAuth();
    const { t } = useTranslation();

    const [username, setUsername] = useState(currentUser?.username || '');
    const [companyName, setCompanyName] = useState(currentUser?.companyName || '');
    const [companyAddress, setCompanyAddress] = useState(currentUser?.companyAddress || '');
    const [companyICE, setCompanyICE] = useState(currentUser?.companyICE || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({ username: '', password: '', companyName: '', companyAddress: '', companyICE: '' });
    const [successMessage, setSuccessMessage] = useState('');
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setCompanyName(currentUser.companyName || '');
            setCompanyAddress(currentUser.companyAddress || '');
            setCompanyICE(currentUser.companyICE || '');
        }
    }, [currentUser]);

    const validateForm = () => {
        const newErrors = { username: '', password: '', companyName: '', companyAddress: '', companyICE: '' };
        let isValid = true;

        if (!username.trim()) {
            newErrors.username = t('usernameRequired');
            isValid = false;
        }

        if (newPassword) {
            if (newPassword.length < 6) {
                newErrors.password = t('passwordMinLengthError');
                isValid = false;
            } else if (newPassword !== confirmPassword) {
                newErrors.password = t('passwordMismatchError');
                isValid = false;
            }
        }
        
        if (!companyName.trim()) {
            newErrors.companyName = t('errorCompanyNameRequired');
            isValid = false;
        }

        if (!companyAddress.trim()) {
            newErrors.companyAddress = t('errorCompanyAddressRequired');
            isValid = false;
        }

        if (!companyICE.trim()) {
            newErrors.companyICE = t('errorCompanyICERequired');
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        setServerError('');

        if (!validateForm() || !currentUser) {
            return;
        }

        const dataToUpdate: { username?: string; password?: string, companyName?: string, companyAddress?: string; companyICE?: string; } = {};
        
        if (username !== currentUser.username) {
            dataToUpdate.username = username;
        }
        if (companyName !== currentUser.companyName) {
            dataToUpdate.companyName = companyName;
        }
         if (companyAddress !== currentUser.companyAddress) {
            dataToUpdate.companyAddress = companyAddress;
        }
         if (companyICE !== currentUser.companyICE) {
            dataToUpdate.companyICE = companyICE;
        }

        if (newPassword) {
            dataToUpdate.password = newPassword;
        }

        if (Object.keys(dataToUpdate).length === 0) {
            // Nothing to update
            return;
        }
        
        // FIX: `updateUser` is an async function and must be awaited.
        const result = await updateUser(currentUser.id, dataToUpdate);

        if (result.success) {
            setSuccessMessage(t(result.message));
            setNewPassword('');
            setConfirmPassword('');
             setTimeout(() => setSuccessMessage(''), 3000);
        } else {
            setServerError(t(result.message));
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="p-8 bg-white rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold mb-6 text-slate-800">{t('profilePageTitle')}</h1>
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div>
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-slate-600">
                            {t('usernameLabel')}
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full p-2 border ${errors.username ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`}
                        />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                    </div>

                    <div>
                        <label htmlFor="company-name" className="block mb-2 text-sm font-medium text-slate-600">
                            {t('companyNameLabel')}
                        </label>
                        <input
                            id="company-name"
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className={`w-full p-2 border ${errors.companyName ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`}
                        />
                        {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                    </div>

                    <div>
                        <label htmlFor="company-address" className="block mb-2 text-sm font-medium text-slate-600">
                            {t('companyAddressLabel')}
                        </label>
                        <input
                            id="company-address"
                            type="text"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            className={`w-full p-2 border ${errors.companyAddress ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`}
                        />
                        {errors.companyAddress && <p className="text-red-500 text-xs mt-1">{errors.companyAddress}</p>}
                    </div>
                    
                    <div>
                        <label htmlFor="company-ice" className="block mb-2 text-sm font-medium text-slate-600">
                            {t('companyICELabel')}
                        </label>
                        <input
                            id="company-ice"
                            type="text"
                            value={companyICE}
                            onChange={(e) => setCompanyICE(e.target.value)}
                            className={`w-full p-2 border ${errors.companyICE ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`}
                        />
                        {errors.companyICE && <p className="text-red-500 text-xs mt-1">{errors.companyICE}</p>}
                    </div>

                    <div>
                        <label htmlFor="new-password"className="block mb-2 text-sm font-medium text-slate-600">
                            {t('newPasswordLabel')}
                        </label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full p-2 border ${errors.password ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="confirm-password"className="block mb-2 text-sm font-medium text-slate-600">
                            {t('confirmPasswordLabel')}
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full p-2 border ${errors.password ? 'border-red-500' : 'border-slate-300'} bg-slate-100 rounded-md`}
                        />
                         {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {serverError && <p className="text-sm text-red-600">{serverError}</p>}
                    {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
                    
                    <div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {t('updateProfileButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;