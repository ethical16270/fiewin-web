import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WebView from '../../components/WebView';
import { BrowserRouter } from 'react-router-dom';

// Mock the websocket service
jest.mock('../../api/websocket', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn()
}));

describe('WebView Component', () => {
  const mockProps = {
    url: 'https://example.com',
    onNavigate: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders iframe with correct URL', () => {
    render(
      <BrowserRouter>
        <WebView {...mockProps} />
      </BrowserRouter>
    );
    
    const iframe = screen.getByTitle('web-content');
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain(mockProps.url);
  });

  test('handles navigation events', () => {
    render(
      <BrowserRouter>
        <WebView {...mockProps} />
      </BrowserRouter>
    );
    
    const iframe = screen.getByTitle('web-content');
    fireEvent.load(iframe);
    
    expect(mockProps.onNavigate).toHaveBeenCalledWith(mockProps.url);
  });
}); 