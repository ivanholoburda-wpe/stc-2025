import React from 'react';
import { BaseSettingFieldProps } from './BaseSettingFieldProps';

export const NumberField: React.FC<BaseSettingFieldProps> = ({ optionKey, value, onChange, label, description }) => (
    <div className="p-5 border border-gray-700 rounded-lg bg-gray-800">
        <label htmlFor={optionKey} className="block text-sm font-medium text-gray-300 mb-2">
            {label}
        </label>
        <input
            type="number"
            id={optionKey}
            value={value}
            onChange={(e) => onChange(optionKey, e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
    </div>
);
