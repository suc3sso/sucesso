/* Checkout-only USD formatting + Venezuela BCV conversion UI. */
(() => {
  'use strict';

  const usdNumber = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatUSD = (value) => `$${usdNumber.format(Number(value) || 0)}`;
  const parseMoney = (value) => {
    let s = String(value ?? '').trim().replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
    if (!s) return 0;
    const comma = s.lastIndexOf(',');
    const dot = s.lastIndexOf('.');
    if (comma > -1 && dot > -1) {
      if (comma > dot) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (comma > -1) {
      const decimals = s.length - comma - 1;
      s = decimals === 2 ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  window.__formatCheckoutUSD = formatUSD;
  window.__parseCheckoutMoney = parseMoney;

  function isVE() {
    const select = document.getElementById('pais');
    if (select) return select.value !== 'United States';
    return String(localStorage.getItem('sucesso-selected-country') || 'VE').toUpperCase() === 'VE';
  }

  function scopes() {
    return [
      document.querySelector('.summary-section'),
      document.getElementById('mobile-summary-content')
    ].filter(Boolean);
  }

  function currentTotal(scope) {
    return parseMoney(scope?.querySelector('#total-final')?.textContent || 0);
  }

  function paint(rateData) {
    const venezuela = isVE();
    scopes().forEach(scope => {
      const row = scope.querySelector('.checkout-ves-total-row');
      const amount = scope.querySelector('.checkout-total-ves');
      const rateLine = scope.querySelector('.checkout-bcv-rate');
      if (row) row.hidden = !venezuela;
      if (rateLine) rateLine.hidden = !venezuela;
      if (!venezuela) return;

      const rate = Number(rateData?.rate || window.SucessoBCV?.readCache?.()?.rate);
      const total = currentTotal(scope);
      if (amount) amount.textContent = Number.isFinite(rate) && rate > 0
        ? window.SucessoBCV.formatVES(total * rate)
        : '— VES';
      if (rateLine) rateLine.textContent = Number.isFinite(rate) && rate > 0
        ? `1 USD = ${window.SucessoBCV.formatRate(rate)} VES`
        : 'Tasa BCV no disponible';
    });
  }

  async function refresh(force = false) {
    paint(window.SucessoBCV?.readCache?.());
    if (!isVE()) return;
    const data = await window.SucessoBCV?.getRate?.({ force });
    if (isVE()) paint(data);
  }

  const observedTotals = new WeakSet();
  function watchTotals() {
    document.querySelectorAll('#total-final').forEach(el => {
      if (observedTotals.has(el)) return;
      observedTotals.add(el);
      new MutationObserver(() => paint(window.SucessoBCV?.readCache?.())).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    watchTotals();
    refresh(false);
    // The mobile order summary is cloned by checkout.html in a later DOMContentLoaded listener.
    // Rebind once on the next task so its cloned total participates without a mutation loop.
    setTimeout(() => { watchTotals(); paint(window.SucessoBCV?.readCache?.()); }, 0);
    document.getElementById('pais')?.addEventListener('change', () => setTimeout(() => refresh(false), 0));
  });
  window.__refreshCheckoutBCV = refresh;
  window.addEventListener('sucesso:bcv-rate', e => paint(e.detail));
  window.addEventListener('sucesso:checkout-country-change', () => refresh(false));
})();
