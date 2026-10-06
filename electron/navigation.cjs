const SEARCH_ENGINES = {
  Google: 'https://www.google.com/search?q=',
  DuckDuckGo: 'https://duckduckgo.com/?q=',
  Bing: 'https://www.bing.com/search?q=',
};

function isWebUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function resolveAddress(value, engine = 'Google') {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Endereço inválido.');
  const input = value.trim();
  if (!input) throw new Error('Digite um endereço ou uma pesquisa.');

  if (/^https?:/i.test(input)) {
    if (!isWebUrl(input)) throw new Error('Este endereço não é válido.');
    return new URL(input).href;
  }

  const first = input.split('/')[0];
  const looksLikeHost = !/\s/.test(input) && (
    /^localhost(?::\d+)?$/i.test(first) ||
    /^\[[\da-f:]+\](?::\d+)?$/i.test(first) ||
    /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/.test(first) ||
    /^(?:[a-z\d-]+\.)+[a-z\d-]{2,}(?::\d+)?$/i.test(first)
  );
  if (looksLikeHost) {
    const local = /^localhost(?::\d+)?$/i.test(first) || /^127\.0\.0\.1(?::\d+)?$/.test(first) || /^\[::1\](?::\d+)?$/.test(first);
    const url = `${local ? 'http' : 'https'}://${input}`;
    if (isWebUrl(url)) return new URL(url).href;
  }

  // Check schemes after host:port so localhost:5173 stays a usable address.
  if (/^[a-z][a-z\d+.-]*:/i.test(input)) {
    throw new Error('Apenas endereços HTTP e HTTPS são permitidos.');
  }

  return `${SEARCH_ENGINES[engine] || SEARCH_ENGINES.Google}${encodeURIComponent(input)}`;
}

function describeLoadError(code) {
  if ([-105, -137, -107].includes(code)) return 'not-found';
  if ([-200, -201, -202, -206, -207, -208].includes(code)) return 'certificate';
  if ([-20, -22].includes(code)) return 'blocked';
  if ([-106, -102, -101, -118, -109].includes(code)) return 'connection';
  return 'loading';
}

module.exports = { isWebUrl, resolveAddress, describeLoadError };