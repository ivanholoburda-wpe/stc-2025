import React from 'react';
import { BaseSettingFieldProps } from './BaseSettingFieldProps';

export const SecretField: React.FC<BaseSettingFieldProps> = ({ optionKey, value, onChange, label, description }) => {
    const [showSecret, setShowSecret] = React.useState(false);

    return (
        <div className="p-5 border border-gray-700 rounded-lg bg-gray-800">
            <label htmlFor={optionKey} className="block text-sm font-medium text-gray-300 mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    type={showSecret ? "text" : "password"}
                    id={optionKey}
                    value={value}
                    onChange={(e) => onChange(optionKey, e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                />
                <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                    {showSecret ? '🙈' : '👁️'}
                </button>
            </div>
            {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
        </div>
    );
};
