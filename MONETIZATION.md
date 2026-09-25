# 💰 Monetization & Affiliate Setup

How every product/link on ashura.gg earns residual income, and exactly
what to sign up for. Do these once; the site is already wired to use them.

## How the affiliate system works

All affiliate IDs live in **one file**: `assets/affiliates.js`.
Product links on the Hardware page use data-attributes:

```html
<a data-aff="amazon" data-asin="B09YZ3BNYP" data-q="Glorious GMMK 2 96">View on Amazon →</a>
```

On page load, `affiliates.js` reads your tag and turns each into a real
tracked link. **Set your tag once, the whole site updates.**

## Sign-up checklist (in priority order)

### 1. Amazon Associates  ← do this first, covers everything
- Apply: https://affiliate-program.amazon.com/
- You need a live site (ashura.gg qualifies) and must make ~3 qualifying
  sales within 180 days to stay approved.
- After approval you get a tag like `ashura-20`.
- **Set it:** open `assets/affiliates.js`, set `amazonTag: 'ashura-20'`.
- Every Amazon link on the site instantly becomes an earning link.
- **Best links:** replace `data-q="..."` searches with exact products via
  `data-asin="XXXXXXXXXX"` (the ASIN from the product page URL). Exact
  product links convert far better than searches.

### 2. ExitLag  ← already done
- Your link `exitlag.com/refer/SOLASHUR` is live on the Sponsors page.

### 3. Brand-direct programs (higher payouts, optional)
Apply per brand for your top items; they often pay more than Amazon:
- **Razer** (Basilisk): https://www.razer.com/affiliate-program
- **SteelSeries** (Arctis Nova): often via Impact/partner network
- **Logitech** (C930e): via their affiliate network
- **Corsair**: https://www.corsair.com/affiliates
When approved, put the tracking URL prefix in `affiliates.js` under `brand`.

## Product images (compliance — read this)

⚠️ **Do NOT scrape/save Amazon product images.** It violates the
Associates operating agreement and can get your account terminated.

Compliant ways to add real product images:
1. **Amazon SiteStripe** (after approval): each product page has a
   SiteStripe bar → "Image" or "Text+Image" → copy the snippet, paste the
   image URL into the `<img>` inside that card's `.product-shot`.
2. **Brand press/media kits:** Razer, SteelSeries, etc. publish official
   product PNGs for partners. Allowed with attribution.

Each Hardware card already has an image slot ready:
```html
<div class="product-shot">...<img alt="" hidden></div>
```
Put the official image URL in the `<img src="...">` and remove `hidden`.
Until then, the branded gradient tile + icon looks clean and legit.

## Legal must-dos
- Keep the "As an Amazon Associate I earn from qualifying purchases"
  disclosure visible (already on the Hardware page). Required.
- Paid links use `rel="sponsored nofollow"` (the affiliate script adds
  this automatically). Good for FTC + SEO compliance.
- Never add an affiliate tag before you're approved for that program.
