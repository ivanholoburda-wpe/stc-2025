import React from 'react';
import { XIcon } from '../../icons';

interface ModalProps {
  message: string;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Notification</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <p>{message}</p>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};