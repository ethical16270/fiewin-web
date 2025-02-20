import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HackInterface from '../../components/HackInterface';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../api/websocket');
jest.mock('../../services/urlLogger');

describe('HackInterface Component', () => {
  const mockProps = {
    onHackComplete: jest.fn(),
    targetAmount: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders hack interface with initial state', () => {
    render(
      <BrowserRouter>
        <HackInterface {...mockProps} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Target Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/1000/)).toBeInTheDocument();
  });

  test('handles hack initiation', async () => {
    render(
      <BrowserRouter>
        <HackInterface {...mockProps} />
      </BrowserRouter>
    );
    
    const startButton = screen.getByRole('button', { name: /start hack/i });
    fireEvent.click(startButton);
    
    // Check if progress indicators appear
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });
}); 