import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock the theme
jest.mock('../theme', () => ({
  __esModule: true,
  default: {
    palette: {
      primary: { main: '#000000' },
      secondary: { main: '#ffffff' }
    }
  }
}));

// Mock the websocket service
jest.mock('../api/websocket', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn()
}));

// Mock the fetch service
jest.mock('../api/fetch', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

describe('Basic Application Tests', () => {
  test('environment is production', () => {
    expect(process.env.NODE_ENV).toBe('production');
  });

  // Add more test cases as needed
  test('mocked services are defined', () => {
    const websocket = require('../api/websocket');
    const fetch = require('../api/fetch');
    
    expect(websocket.connect).toBeDefined();
    expect(websocket.disconnect).toBeDefined();
    expect(fetch.get).toBeDefined();
    expect(fetch.post).toBeDefined();
  });
}); 