# Store categories and products

## Canonical taxonomy

**Source of truth:** [`src/data/storeCategories.ts`](../src/data/storeCategories.ts)

- **13 Store home tiles** grouped by `tileGroup`: `products` (4), `vehicles` (5), `services` (4)
- **Spare Parts** — utility category (no `tileGroup`); default FK for `isSparePart` products

Products link via required `Product.categoryId` (Mongo `Category._id` as string). APIs resolve to human-readable `category` name. **There are no product subcategories** in MongoDB.

Service **subcategories** are separate static config: [`src/data/serviceCategoryConfig.ts`](../src/data/serviceCategoryConfig.ts), stored on `Service.serviceSubCategory`.

## Seed scripts

| Command | Purpose |
|---------|---------|
| `npm run seed:categories` | Upsert 13 tiles + Spare Parts (no CDN `imageUrl`; client bundled fallback) |
| `SEED_DEALER_USER_ID=... npm run seed:all-inventory` | Tiles with CDN images + demo services/products for one dealer |
| `npm run seed:products` | Legacy sample products (resolves `storeCategoryName` at runtime) |
| `SEED_DEALER_USER_ID=... npm run seed:dealer-products` | Premium demo products per canonical category |
| `npm run seed:migrate-categories` | Repoint products from legacy category names; deactivate legacy docs |

**Recommended order (new environment):**

```bash
cd server
npm run seed:categories
SEED_DEALER_USER_ID='<dealer_object_id>' npm run seed:all-inventory
```

**Existing DB with old names** (e.g. `Car Care`, `Tyres & Wheels`): run `npm run seed:migrate-categories` once before dropping client legacy image aliases.

## Client images

Bundled tile fallbacks: [`client/src/config/storeCategoryImages.ts`](../../client/src/config/storeCategoryImages.ts) — canonical keys must match `storeCategories.ts` names.

## Legacy name mapping

See `LEGACY_CATEGORY_ALIASES` in `storeCategories.ts` (e.g. `Car Care` → `Car Care & Maintenance`, `Tyres & Wheels` → `Tires & Wheels`).
