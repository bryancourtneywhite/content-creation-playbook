# 🔧 How to Update Your Gear (30 seconds)

Your Hardware page builds itself from **one file**: `data/products.json`.
Never touch `hardware.html` — just edit the JSON, commit, and push.

## Add a new item (e.g. you upgraded your GPU)

1. Open `data/products.json`.
2. Copy an existing product block and change the fields:

```json
{
  "id": "gpu-9070xt",
  "category": "pc",              // pc | peripherals | stream
  "icon": "🎮",
  "brand": "AMD",
  "badge": "GPU",
  "name": "AMD Radeon RX 9070 XT",
  "blurb": "One-line description of why you use it.",
  "image": "",                   // official image URL (Best Buy / SiteStripe) or ""
  "asin": "",                    // Amazon 10-char code (from /dp/XXXXXXXXXX) or ""
  "amazonQ": "AMD Radeon RX 9070 XT",   // Amazon search fallback
  "bestbuy": ""                  // product-specific Impact link, or "" to use your main link
}
```

3. Save. Then:

```powershell
cd d:\content-creation-playbook
git add data/products.json
git commit -m "Gear: swap in RX 9070 XT"
git push origin main
```

The live site updates in ~1 minute. Same URL.

## Remove an item
Delete its block from the `products` array. Push.

## Field reference
| Field | What it does |
|-------|--------------|
| `id` | Unique key (any short string) |
| `category` | Which section: `pc`, `peripherals`, or `stream` |
| `icon` | Emoji shown on the tile + badge |
| `brand` | Small brand chip on the image tile |
| `badge` | Pill label (CPU, GPU, Mouse, etc.) |
| `name` | Product title |
| `blurb` | One-line description |
| `image` | Official product image URL. Leave `""` for the branded icon tile. **Use Best Buy / Amazon SiteStripe images — never AI/fake renders.** |
| `asin` | Amazon product code — makes the Amazon button link the exact product |
| `amazonQ` | Amazon search text (used if no `asin`) |
| `bestbuy` | Product-specific Best Buy Impact link. Empty = falls back to your main Creator link |
| `free` | `true` for free software (shows a plain link, no Purchase modal) |
| `freeUrl` / `freeLabel` | Link + button text for free items |

## Best links = best conversions
- **Best Buy:** generate a product-specific Impact link (drops buyers on the exact product, not the homepage). Paste into `bestbuy`.
- **Amazon:** grab the `asin` from the product URL (`amazon.com/dp/`**`XXXXXXXXXX`**).
- **Images:** copy the official image address from the Best Buy product page.
