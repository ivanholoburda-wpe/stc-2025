import React from 'react';
import { UploadCloudIcon } from '../../icons';
import { ParsingResult } from '../../api/types';

interface DashboardViewProps {
  onReadFile: () => Promise<void>;
  parsingResult: ParsingResult;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onReadFile, parsingResult }) => (
  <div className="flex-grow flex items-center justify-center p-8">
    <div className="w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-xl flex flex-col items-center justify-center p-16 text-center">
      <UploadCloudIcon className="w-16 h-16 text-gray-500 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Select root folder</h2>
      <p className="text-gray-400 mb-6">Choose a file to display its content below.</p>
      <button
        onClick={onReadFile}
        className="bg-gray-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-500 transition-colors"
      >
        Search file
      </button>
      {parsingResult && (
        <div className="mt-8 w-full text-left">
          <h3 className="text-lg font-semibold text-white mb-2">File content:</h3>
          <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 text-sm max-h-60 overflow-auto">
            Snapshot was taken, snapshotId = {parsingResult.data.snapshotId}
          </pre>
        </div>
      )}
    </div>
  </div>
);