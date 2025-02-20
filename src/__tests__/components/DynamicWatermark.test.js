import React from 'react';
import { render, screen } from '@testing-library/react';
import DynamicWatermark from '../../components/DynamicWatermark';

describe('DynamicWatermark Component', () => {
  const mockProps = {
    text: 'Test Watermark',
    opacity: 0.5
  };

  test('renders watermark with correct text', () => {
    render(<DynamicWatermark {...mockProps} />);
    expect(screen.getByText('Test Watermark')).toBeInTheDocument();
  });

  test('applies correct opacity style', () => {
    render(<DynamicWatermark {...mockProps} />);
    const watermark = screen.getByText('Test Watermark');
    expect(watermark).toHaveStyle({ opacity: 0.5 });
  });
}); 