import React from 'react';

interface PlaceholderViewProps {
  title: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title }) => (
  <div className="flex-grow flex items-center justify-center p-8">
    <h2 className="text-4xl font-bold text-gray-600">{title}</h2>
  </div>
);