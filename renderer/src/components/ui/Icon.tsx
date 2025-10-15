import React, { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ children, className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);