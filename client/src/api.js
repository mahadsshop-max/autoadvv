// Thin wrapper around fetch. Every call shares credentials so the Discord
// session cookie travels with each request, and JSON bodies are encoded
// consistently. Errors are normalised into a thrown Error with the server
// message when one is available.

async function request(method, url, body) {
  const options = {
    method,
    credentials: 'include',
    headers: {},
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
};

// Some calls (auth checks, polling) should not throw on a non-OK response.
// This variant returns null instead so callers can branch on the result.
export async function tryGet(url) {
  try {
    return await api.get(url);
  } catch {
    return null;
  }
}
