/* ------------------------------------------------------------------
   Central affiliate config for Ashura Whole Heavens.
   Put ALL your affiliate IDs here in ONE place. Every product link on
   the site is generated from this, so when you get approved for a
   program you paste the tag here once and the whole site updates.

   IMPORTANT (compliance):
   - Only add a tag AFTER you're approved for that program. Using an
     unapproved Amazon tag violates the Associates agreement.
   - Product images: don't scrape Amazon images. Use SiteStripe image
     links or official brand press assets. See hardware.html image slots.
   ------------------------------------------------------------------ */
window.AFFILIATES = {
  // Amazon Associates: your tracking tag, e.g. 'ashura-20'. Leave '' until approved.
  amazonTag: '',
  // Amazon marketplace domain (US default).
  amazonDomain: 'www.amazon.com',

  // Optional brand-direct affiliate base URLs (fill when approved).
  // If set, a product can opt to use these instead of Amazon.
  brand: {
    razer: '',        // e.g. your Razer/Impact tracking URL prefix
    steelseries: '',
    corsair: '',
    logitech: ''
  }
};

/* Build an Amazon link. If a tag exists, append it (real earning link);
   otherwise fall back to a plain search so the link still works. */
window.amazonLink = function (opts) {
  var A = window.AFFILIATES || {};
  var domain = A.amazonDomain || 'www.amazon.com';
  var base;
  if (opts.asin) {
    base = 'https://' + domain + '/dp/' + encodeURIComponent(opts.asin) + '/';
  } else {
    base = 'https://' + domain + '/s?k=' + encodeURIComponent(opts.q || '');
  }
  if (A.amazonTag) {
    base += (base.indexOf('?') === -1 ? '?' : '&') + 'tag=' + encodeURIComponent(A.amazonTag);
  }
  return base;
};

/* Apply affiliate tags to every element that declares its product intent
   via data-attributes. Called on DOMContentLoaded by pages that opt in.
   Usage on an <a>:
     data-aff="amazon" data-asin="B09YZ3BNYP"   (preferred: exact product)
     data-aff="amazon" data-q="Razer Basilisk V3 X"  (fallback: search)
*/
window.applyAffiliateLinks = function () {
  var links = document.querySelectorAll('a[data-aff]');
  links.forEach(function (a) {
    var kind = a.getAttribute('data-aff');
    if (kind === 'amazon') {
      a.href = window.amazonLink({
        asin: a.getAttribute('data-asin') || '',
        q: a.getAttribute('data-q') || ''
      });
      // Compliance: mark paid links.
      var rel = (a.getAttribute('rel') || '');
      if (rel.indexOf('sponsored') === -1) rel = (rel + ' sponsored nofollow noopener').trim();
      a.setAttribute('rel', rel);
      a.setAttribute('target', '_blank');
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.applyAffiliateLinks);
} else {
  window.applyAffiliateLinks();
}
