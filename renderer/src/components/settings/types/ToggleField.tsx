import React from 'react';
import { BaseSettingFieldProps } from './BaseSettingFieldProps';

export const ToggleField: React.FC<BaseSettingFieldProps> = ({ optionKey, value, onChange, label, description }) => {
    const isOnline = value === 'online';

    return (
        <div className="p-5 border border-gray-700 rounded-lg bg-gray-800">
            <h2 className="text-lg font-semibold mb-3 text-gray-200">{label}</h2>
            <div className="flex items-center space-x-4">
                <label htmlFor={optionKey} className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input
                            type="checkbox"
                            id={optionKey}
                            className="sr-only"
                            checked={isOnline}
                            onChange={() => onChange(optionKey, isOnline ? 'offline' : 'online')}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${isOnline ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isOnline ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-gray-300 font-medium">
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                </label>
            </div>
            {description && <p className="text-sm text-gray-500 mt-3">{description}</p>}
        </div>
    );
};