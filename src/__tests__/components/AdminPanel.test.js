import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminPanel from '../../components/AdminPanel';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../api/fetch', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

describe('AdminPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders admin panel with controls', () => {
    render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  test('handles data refresh', async () => {
    const mockFetch = require('../../api/fetch');
    mockFetch.get.mockResolvedValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>
    );
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(mockFetch.get).toHaveBeenCalled();
  });
}); 