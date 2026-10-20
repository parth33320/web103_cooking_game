import React from 'react';

/**
 * Reusable Spinner component for loading states and async action buttons.
 *
 * Inputs: { size: 'small'|'medium'|'large', color: string, style: object }
 * Outputs: JSX.Element (<span data-testid="spinner" className="spinner spinner-[size]">)
 */
export function Spinner({ size = 'medium', color = 'currentColor', style = {} }) {
  const sizeMap = {
    small: { width: '14px', height: '14px', borderWidth: '2px' },
    medium: { width: '24px', height: '24px', borderWidth: '3px' },
    large: { width: '40px', height: '40px', borderWidth: '4px' },
  };

  const dimensions = sizeMap[size] || sizeMap.medium;

  const spinnerStyle = {
    display: 'inline-block',
    width: dimensions.width,
    height: dimensions.height,
    border: `${dimensions.borderWidth} solid rgba(255, 255, 255, 0.3)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'bistro-spin 0.8s linear infinite',
    verticalAlign: 'middle',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <span
      data-testid="spinner"
      className={`spinner spinner-${size}`}
      style={spinnerStyle}
      aria-label="Loading"
    />
  );
}
