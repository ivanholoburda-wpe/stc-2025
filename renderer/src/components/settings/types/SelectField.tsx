import React from 'react';
import { BaseSettingFieldProps } from './BaseSettingFieldProps';

export const SelectField: React.FC<BaseSettingFieldProps> = ({ optionKey, value, onChange, label, description, options, optionDisplayNames }) => {
    if (!options || options.length === 0) {
        return (
            <div className="p-5 border border-red-700 rounded-lg bg-red-900/20">
                <label className="block text-sm font-medium text-red-400 mb-2">
                    {label}
                </label>
                <p className="text-xs text-red-400">Configuration error: No options provided for this select field.</p>
            </div>
        );
    }

    const getDisplayName = (option: string): string => {
        if (optionDisplayNames && optionDisplayNames[option]) {
            return optionDisplayNames[option];
        }
        return option.charAt(0).toUpperCase() + option.slice(1);
    };

    return (
        <div className="p-5 border border-gray-700 rounded-lg bg-gray-800">
            <label htmlFor={optionKey} className="block text-sm font-medium text-gray-300 mb-2">
                {label}
            </label>
            <select
                id={optionKey}
                value={value}
                onChange={(e) => onChange(optionKey, e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
                {options.map((option) => (
                    <option key={option} value={option} className="bg-gray-900">
                        {getDisplayName(option)}
                    </option>
                ))}
            </select>
            {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
        </div>
    );
};
