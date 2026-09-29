// Minimal fetch mock for the browser libs that call /api/clinical/*.
export function mockFetchOnce(body: unknown, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

export function lastFetch(): { url: string; method: string; body: any } {
  const calls = (global.fetch as jest.Mock).mock.calls;
  const [url, init] = calls[calls.length - 1];
  return {
    url,
    method: init?.method ?? "GET",
    body: init?.body ? JSON.parse(init.body) : undefined,
  };
}
