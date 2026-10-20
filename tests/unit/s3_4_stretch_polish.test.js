import { describe, it, expect } from 'vitest';
import React from 'react';
import { Spinner } from '../../client/src/components/Spinner.jsx';

describe('S3.4 Stretch Polish Unit Tests', () => {
  it('should export a functional Spinner component with default size and spinner data-testid', () => {
    expect(Spinner).toBeDefined();
    expect(typeof Spinner).toBe('function');

    const element = Spinner({ size: 'medium' });
    expect(element).not.toBeNull();
    expect(element.props['data-testid']).toBe('spinner');
  });

  it('should support size variants ("small", "medium", "large")', () => {
    const smallSpinner = Spinner({ size: 'small' });
    const largeSpinner = Spinner({ size: 'large' });

    expect(smallSpinner.props['data-testid']).toBe('spinner');
    expect(largeSpinner.props['data-testid']).toBe('spinner');
    expect(smallSpinner.props.className).toContain('spinner-small');
    expect(largeSpinner.props.className).toContain('spinner-large');
  });
});
