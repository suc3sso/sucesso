/* Shared BCV USD/VES rate helper. Uses public read-only APIs and caches locally. */
(() => {
  'use strict';
  if (window.SucessoBCV) return;

  const CACHE_KEY = 'sucesso-bcv-usd-ves-v1';
  const CACHE_TTL = 60 * 60 * 1000; // refresh at most hourly; BCV normally changes once per business day
  let inflight = null;

  function readCache() {
    try {
      const data = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!data || !Number.isFinite(Number(data.rate))) return null;
      return {
        rate: Number(data.rate),
        effectiveDate: data.effectiveDate || data.date || '',
        updatedAt: data.updatedAt || '',
        source: data.source || 'BCV',
        cachedAt: Number(data.cachedAt || 0)
      };
    } catch (_) { return null; }
  }

  function writeCache(data) {
    const normalized = {
      rate: Number(data.rate),
      effectiveDate: data.effectiveDate || '',
      updatedAt: data.updatedAt || '',
      source: data.source || 'BCV',
      cachedAt: Date.now()
    };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(normalized)); } catch (_) {}
    window.dispatchEvent(new CustomEvent('sucesso:bcv-rate', { detail: normalized }));
    return normalized;
  }

  async function fetchJson(url, timeoutMs = 7000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async function fetchFresh() {
    // Primary: BCV Today. Its rate endpoint mirrors the official BCV-published USD/VES rate.
    try {
      const data = await fetchJson('https://bcv.today/api/v1/rate.json');
      const rate = Number(data?.USD);
      if (Number.isFinite(rate) && rate > 0) {
        return writeCache({
          rate,
          effectiveDate: data?.effective_date || data?.date || '',
          updatedAt: data?.updated_at || '',
          source: 'BCV'
        });
      }
    } catch (_) {}

    // Fallback: DolarApi official quote (source BCV).
    try {
      const data = await fetchJson('https://ve.dolarapi.com/v1/dolares/oficial');
      const rate = Number(data?.promedio ?? data?.venta ?? data?.compra);
      if (Number.isFinite(rate) && rate > 0) {
        return writeCache({
          rate,
          effectiveDate: data?.fechaActualizacion || '',
          updatedAt: data?.fechaActualizacion || '',
          source: data?.fuente || 'BCV'
        });
      }
    } catch (_) {}

    return readCache();
  }

  async function getRate(options = {}) {
    const force = Boolean(options.force);
    const cached = readCache();
    if (!force && cached && Date.now() - cached.cachedAt < CACHE_TTL) return cached;
    if (inflight) return inflight;
    inflight = fetchFresh().finally(() => { inflight = null; });
    return inflight;
  }

  function formatVES(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '— VES';
    return `${new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)} VES`;
  }

  function formatRate(value) {
    const rate = Number(value);
    if (!Number.isFinite(rate)) return '—';
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rate);
  }

  function convertUSD(amount, rateLike) {
    const rate = Number(typeof rateLike === 'object' ? rateLike?.rate : rateLike);
    const usd = Number(amount);
    return Number.isFinite(rate) && Number.isFinite(usd) ? usd * rate : NaN;
  }

  function isVenezuela() {
    return String(localStorage.getItem('sucesso-selected-country') || '').toUpperCase() === 'VE';
  }

  window.SucessoBCV = { getRate, readCache, formatVES, formatRate, convertUSD, isVenezuela };
})();
