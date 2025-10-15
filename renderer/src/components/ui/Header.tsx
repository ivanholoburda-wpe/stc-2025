import React from 'react';
import { SearchIcon, BellIcon } from '../../icons';

interface HeaderProps {
  viewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ viewTitle }) => {
  return (
    <header className="flex items-center justify-between p-6 bg-gray-900 border-b border-gray-800">
      <h1 className="text-2xl font-bold uppercase tracking-widest text-white">{viewTitle}</h1>
      <div className="flex items-center gap-6">
        <div className="relative w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <BellIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
          <span className="text-white font-medium">Account</span>
        </div>
      </div>
    </header>
  );
};