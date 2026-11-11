# Finds & Choices GH — setup and launch checklist

## Current architecture
- GitHub Pages serves the static storefront.
- Supabase Auth handles customer sign-up, sign-in, email confirmation and password reset.
- Supabase Postgres stores profiles and the product catalogue.
- RLS makes active products public and restricts product creation, edits and archiving to the administrator role.
- The admin page verifies the signed-in user with Supabase before revealing its management interface.
- Affiliate checkout remains on the retailer's site. This website does not take customer payments or fulfil orders.

## Important: static hosting and protected pages
GitHub Pages is static hosting. The HTML file for `admin.html` can still be downloaded by anyone who knows its URL; JavaScript cannot make the file itself private. The admin interface is hidden until Supabase verifies the user, and the database RLS policies are the actual security boundary for private products and all product changes. Do not put secrets or private customer data in the page source. If you later need the HTML route itself to return a server-side 401/403, move the admin app to a hosting platform with server-side route protection.

## Supabase project already connected
Project URL: https://ogvrwtuczajygkqhlsgq.supabase.co
The public publishable key is configured in `assets/js/supabase-config.js`. It is intended for browser use. Never place a Supabase secret/service-role key or database password in frontend code or GitHub.

The schema migrations `profiles_and_admin_managed_product_catalogue` and `separate_public_and_admin_catalogue_read_policies` are applied. Both `profiles` and `products` have RLS enabled. The security advisor currently returns no security lints.

## Configure Auth before testing
In Supabase Dashboard → Authentication → URL Configuration, set:

**Site URL**
`https://kaylee7-ai.github.io/Finds-Choices-GH/`

**Redirect URLs**
- `https://kaylee7-ai.github.io/Finds-Choices-GH/auth.html`
- `https://kaylee7-ai.github.io/Finds-Choices-GH/auth.html?mode=reset`

The code sends email confirmation and password-reset links back to `auth.html`. Add local development URLs only if you actually use a local server. Keep the allowlist as narrow as possible.

In Authentication → Providers, confirm Email is enabled. Keep email confirmation enabled for public registration and configure a reliable email sender before launch. Test that confirmation and password-reset messages arrive and that their links return to the site.

## Create the first administrator
1. Register the intended site administrator through the website's `auth.html` page.
2. Confirm that email address.
3. In Supabase SQL Editor, replace the email below with the confirmed administrator email and run it:
```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where lower(email) = lower('ADMIN_EMAIL_HERE')
);
```
4. Confirm exactly one row was updated. Sign out and back in, then open `admin.html`.
5. Do not create an admin self-registration feature. New sign-ups always receive customer role.

## Add products
Open `admin.html` after administrator access is assigned. Add the product name, category, retailer, product type, price, secure product URL, optional image URL and description. Set status to Active to publish it. Use the actual tracked affiliate URL issued by an approved affiliate programme; ordinary product links do not automatically earn commissions. Draft products remain private.

## Test before publishing
- Register and confirm a customer account; sign in and sign out.
- A signed-out visitor opening `admin.html` should be redirected to sign in.
- A customer account must be denied access to the admin interface and product-management operations.
- Promote the intended administrator using SQL; sign in again.
- Add a draft product and verify it is not public.
- Change it to Active and verify it appears on the storefront.
- Edit and archive it; archived products should disappear.
- Test password reset, email confirmation, search, category filters, product links and mobile layout.
- Verify each affiliate URL is a real tracking link from an approved affiliate programme.
- Confirm the affiliate disclosure is visible to visitors.

## Scope
This is a product-discovery and affiliate storefront, not a cart or checkout service. Customers complete purchases at the linked retailer. Search-engine indexing and rankings are not guaranteed.
