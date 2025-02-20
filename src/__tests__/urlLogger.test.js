import { logUrl, getUrls } from '../services/urlLogger';

// Mock fetch
global.fetch = jest.fn();

describe('URL Logger Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('logUrl makes POST request with correct data', async () => {
    const mockUrl = 'https://example.com';
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    }));

    await logUrl(mockUrl);

    expect(fetch).toHaveBeenCalledWith('/api/log-url', expect.objectContaining({
      method: 'POST',
      headers: expect.any(Object),
      body: expect.any(String)
    }));
  });

  test('getUrls makes GET request', async () => {
    const mockUrls = [{ url: 'https://example.com' }];
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockUrls)
    }));

    const result = await getUrls();
    expect(result).toEqual(mockUrls);
    expect(fetch).toHaveBeenCalledWith('/api/urls');
  });
}); 