/* ------------------------------------------------------------------
   Central affiliate config for Ashura Whole Heavens.
   ALL affiliate IDs live here. Products declare intent via data-attrs;
   this builds the real Best Buy + Amazon links and powers the
   "Purchase" modal (pick your store).

   Compliance:
   - Only add an Amazon tag AFTER approval.
   - Product images: use official retailer/brand images (Best Buy product
     images, Amazon SiteStripe, or brand press kits). Never fake renders.
   ------------------------------------------------------------------ */
window.AFFILIATES = {
  // Best Buy (via Impact) — ALREADY APPROVED. Main tracked link:
  bestBuyMain: 'https://bestbuycreators.7tiv.net/X4x4xX',

  // Amazon Associates tag — approved.
  amazonTag: 'solashur0f-20',
  amazonDomain: 'www.amazon.com'
};

/* Amazon link builder. Priority:
   1. amazonUrl  — a ready SiteStripe/amzn.to link (tag already baked in)
   2. asin       — exact product, tag appended
   3. q          — search fallback, tag appended */
window.amazonLink = function (opts) {
  var A = window.AFFILIATES || {};
  var domain = A.amazonDomain || 'www.amazon.com';
  // 1) Ready-made tracked link — use as-is (already has the tag).
  if (opts.amazonUrl) return opts.amazonUrl;
  // 2/3) Build from ASIN or search, then append the tag.
  var base = opts.asin
    ? 'https://' + domain + '/dp/' + encodeURIComponent(opts.asin) + '/'
    : 'https://' + domain + '/s?k=' + encodeURIComponent(opts.q || '');
  if (A.amazonTag) {
    base += (base.indexOf('?') === -1 ? '?' : '&') + 'tag=' + encodeURIComponent(A.amazonTag);
  }
  return base;
};

/* Best Buy link: use a product-specific Impact link if provided,
   otherwise fall back to the main tracked link. */
window.bestBuyLink = function (opts) {
  var A = window.AFFILIATES || {};
  return (opts && opts.bestbuy) ? opts.bestbuy : (A.bestBuyMain || '#');
};

/* ---------- Purchase modal (pick your store) ---------- */
(function () {
  var modal, titleEl, bbEl, amzEl, brandEl, brandNameEl;

  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'buy-modal';
    modal.setAttribute('hidden', '');
    modal.innerHTML =
      '<div class="buy-backdrop" data-close></div>' +
      '<div class="buy-dialog" role="dialog" aria-modal="true" aria-label="Choose where to buy">' +
        '<button class="buy-x" data-close aria-label="Close">✕</button>' +
        '<div class="buy-title">Where would you like to buy?</div>' +
        '<div class="buy-name" id="buy-name"></div>' +
        '<div class="buy-options">' +
          '<a class="buy-opt brand" id="buy-brand" target="_blank" rel="sponsored nofollow noopener" hidden>' +
            '<span class="buy-store" id="buy-brand-name">Brand Store</span>' +
            '<span class="buy-sub">Official store · best price for the creator</span></a>' +
          '<a class="buy-opt bestbuy" id="buy-bb" target="_blank" rel="sponsored nofollow noopener">' +
            '<span class="buy-store">Best Buy</span>' +
            '<span class="buy-sub">Ships or in-store pickup</span></a>' +
          '<a class="buy-opt amazon" id="buy-amz" target="_blank" rel="sponsored nofollow noopener">' +
            '<span class="buy-store">Amazon</span>' +
            '<span class="buy-sub">Fast Prime delivery</span></a>' +
        '</div>' +
        '<p class="buy-disc">Affiliate links — buying through them supports the channel at no extra cost.</p>' +
      '</div>';
    document.body.appendChild(modal);
    titleEl = modal.querySelector('#buy-name');
    bbEl = modal.querySelector('#buy-bb');
    amzEl = modal.querySelector('#buy-amz');
    brandEl = modal.querySelector('#buy-brand');
    brandNameEl = modal.querySelector('#buy-brand-name');

    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(data) {
    if (!modal) buildModal();
    titleEl.textContent = data.name || '';
    bbEl.href = window.bestBuyLink(data);
    amzEl.href = window.amazonLink(data);
    // Brand-direct option (e.g. Razer) — highest payout, shown first when present.
    if (data.brandUrl) {
      brandEl.href = data.brandUrl;
      brandNameEl.textContent = (data.brandLabel || 'Official Store');
      brandEl.removeAttribute('hidden');
    } else {
      brandEl.setAttribute('hidden', '');
    }
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (modal) { modal.setAttribute('hidden', ''); document.body.style.overflow = ''; }
  }
  window.openBuyModal = openModal;

  /* Wire up every .buy-btn on the page. Data-attrs on the button:
       data-name="AMD Ryzen 9 5900X"
       data-asin="B08..."   (optional, Amazon exact)
       data-q="AMD Ryzen 9 5900X"  (Amazon search fallback)
       data-bestbuy="https://bestbuycreators.7tiv.net/XXXX"  (optional per-product)
  */
  function wire() {
    document.querySelectorAll('.buy-btn').forEach(function (btn) {
      if (btn._buyWired) return;      // avoid double-binding on re-render
      btn._buyWired = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal({
          name: btn.getAttribute('data-name') || '',
          amazonUrl: btn.getAttribute('data-amazon-url') || '',
          asin: btn.getAttribute('data-asin') || '',
          q: btn.getAttribute('data-q') || '',
          bestbuy: btn.getAttribute('data-bestbuy') || '',
          brandUrl: btn.getAttribute('data-brand-url') || '',
          brandLabel: btn.getAttribute('data-brand-label') || ''
        });
      });
    });
  }
  // Exposed so dynamically-rendered pages (Hardware) can re-wire new cards.
  window.wireBuyButtons = wire;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
