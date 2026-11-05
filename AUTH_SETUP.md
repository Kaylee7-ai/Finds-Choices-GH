# Finds & Choices GH — setup and launch checklist

## Current architecture
- GitHub Pages serves the static storefront.
- Supabase Auth handles customer sign-up, sign-in, email confirmation and password reset.
- Supabase Postgres stores profiles and the product catalogue.
- RLS makes active products public and restricts product creation, edits and archiving to the administrator role.
- Affiliate checkout remains on the retailer's site. This website does not take customer payments or fulfil orders.

## Supabase project already connected
Project URL: https://ogvrwtuczajygkqhlsgq.supabase.co
The public publishable key is configured in `assets/js/supabase-config.js`. It is intended for browser use. Never place a secret/service-role key or database password in frontend code or GitHub.

The schema migration `profiles_and_admin_managed_product_catalogue` has been applied to the connected project. Both `profiles` and `products` have RLS enabled. The security advisor returned no security lints at the time of setup.

## Configure Auth before testing
In Supabase → Authentication → URL Configuration:
- Site URL: `https://kaylee7-ai.github.io/Finds-Choices-GH/`
- Add `https://kaylee7-ai.github.io/Finds-Choices-GH/**` only if required for nested auth redirect paths; prefer exact URLs such as the storefront and `auth.html`.
- Ensure email confirmation is enabled and configure a reliable email sender before public launch.

## Create the first administrator
1. Register the intended site administrator through the website's `auth.html` page.
2. Confirm that email address.
3. In Supabase SQL Editor, replace the email below and run it:
```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where lower(email) = lower('ADMIN_EMAIL_HERE')
);
```
4. Confirm one row was updated. Sign out and back in, then visit `admin.html`.
5. Do not create an admin self-registration feature. New sign-ups always receive customer role.

## Add products
Open `admin.html` after administrator access is assigned. Add the product name, category, retailer, product type, price, secure product URL, optional image URL and description. Set status to Active to publish it. Use the actual tracked affiliate URL issued by an approved affiliate programme; ordinary product links do not automatically earn commissions. Draft products remain private.

## Important affiliate and age-related requirements
Affiliate programmes have their own eligibility, disclosure, tax, and payout terms. A responsible adult must own and operate any commercial account or payout arrangement where programme rules require an adult account holder. Do not enter false ages or use another person's account without their informed permission. Confirm programme approval before describing links as commission-earning.

## Test before publishing
- Register and confirm a customer account; sign in and sign out.
- Customer account must be denied access to `admin.html`.
- Promote the responsible administrator using SQL; sign in again.
- Add a draft product and verify it is not public.
- Change it to Active and verify it appears on the storefront.
- Edit and archive it; archived products should disappear.
- Test search, category filters, product links and mobile layout.
- Verify each affiliate URL is a real tracking link from an approved programme.
- Confirm the affiliate disclosure is visible to visitors.

## Scope
This is a product-discovery and affiliate storefront, not a cart or checkout service. Customers complete purchases at the linked retailer. Search-engine indexing and rankings are not guaranteed.
