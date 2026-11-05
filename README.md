# Finds & Choices GH — Repository Notes

## Live storefront
https://kaylee7-ai.github.io/Finds-Choices-GH/

The GitHub Pages site serves the `main` branch. The current work is in the draft pull request linked below and is not live until reviewed, tested and merged.

## Current product catalogue
The original homepage contains five curated Tezeon listings. The new Supabase catalogue is ready to supply active products after the branch is deployed and the administrator adds listings. If no active database products exist, the original curated cards remain as a fallback.

## Product and commission model
- **Affiliate listing:** Buyers complete checkout at the retailer. Commission is possible only when the store uses a valid tracking URL from an approved affiliate programme and meets that programme's terms.
- **Resale listing:** The operator is responsible for fulfilment, delivery, returns and customer support. Do not activate a resale checkout until those arrangements are properly established.
- This site does not currently process payments or take customer orders.

## Supabase features in this branch
- `auth.html` — customer registration, sign-in, sign-out and password reset.
- `admin.html` — administrator-only product manager to add, edit and archive products.
- `assets/js/supabase-config.js` — public project URL and publishable key only.
- `assets/js/catalog.js` — loads active products from Supabase for the public storefront.
- `assets/js/admin.js` — admin role verification and catalogue management.
- `supabase/schema.sql` — profiles, products, signup trigger and row-level security.
- `AUTH_SETUP.md` — Auth configuration, admin promotion, product workflow and launch checks.
- `robots.txt` and `sitemap.xml` — public storefront crawler guidance.

The connected Supabase project has the `profiles` and `products` tables with RLS enabled. The security advisor returned no security lints at the time of setup.

## Before publishing
1. Set the Supabase Auth Site URL and exact GitHub Pages redirect URLs.
2. Confirm email delivery and email confirmation.
3. Register the responsible site administrator and promote the account manually using the SQL in `AUTH_SETUP.md`.
4. Test customer access denial, admin product create/edit/archive, public catalogue loading, search, filters and mobile layout.
5. Confirm each commission link is a genuine tracking URL issued by an approved affiliate programme.
6. Review the draft pull request before merging.

## Search engines
The branch includes a canonical URL, social metadata, `robots.txt` and a sitemap. These help crawlers discover the public homepage but cannot guarantee indexing, recommendation or ranking.

## Privacy and account operation
Do not collect customer addresses, phone numbers, payment details or order information until a separate lawful and secure checkout/privacy workflow exists. Affiliate programme eligibility, business ownership and payouts must follow the programme's rules and be managed by an eligible responsible adult where required.

## GitHub Pages
Expected configuration: branch `main`, folder `/(root)`, homepage `index.html`. Changes in the feature branch are not public until merged and deployed.
