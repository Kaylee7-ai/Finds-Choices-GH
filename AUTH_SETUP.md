# Finds & Choices GH — Authentication setup

This repository is a static GitHub Pages storefront. Authentication is provided by Supabase; GitHub Pages does not run a private server.

## What this stage adds

- Customer email/password registration and sign-in.
- Email confirmation and password-reset flow.
- Persistent Supabase-managed browser sessions.
- A protected admin page that checks the signed-in user's database role.
- A profile table where new users are always assigned the `customer` role.
- Row Level Security (RLS) so a customer can read only their own profile.

The existing product cards and external retailer checkout links remain unchanged. The admin page is an authentication foundation, not yet a product/order management system.

## 1. Create a Supabase project

Create a project in the Supabase dashboard using an account controlled by the responsible site operator. Keep database credentials private.

In **Project Settings → API**, copy:
- Project URL
- Publishable key (or legacy anon key)

Do not copy or publish the `service_role` key, database password, or any secret key.

## 2. Configure the browser client

Edit `assets/js/supabase-config.js`:

```js
export const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY";
```

The URL and publishable/anon key are public browser configuration. They are safe to expose only when RLS is enabled and policies are correct. They are not substitutes for database permissions.

## 3. Create the database profile table

In the Supabase dashboard, open **SQL Editor**, paste the complete contents of `supabase/schema.sql`, and run it.

The trigger creates one profile row for every new auth user. The trigger always sets `role = 'customer'`. The browser client has no policy that permits users to change their role.

## 4. Configure authentication URLs

In **Authentication → URL Configuration**:
- Set the Site URL to the published GitHub Pages site, for example `https://kaylee7-ai.github.io/Finds-Choices-GH/`.
- Add that same site URL and the `auth.html` reset/confirmation redirect to the allowed Redirect URLs.
- Enable email confirmations.
- Use a properly configured email provider before public launch.

If you test on localhost, add the exact local development URL to the allowed redirect list too. Do not use a broad wildcard in production.

## 5. Promote the first administrator

1. Register the intended administrator account through `auth.html`.
2. Confirm its email.
3. In Supabase SQL Editor, run the following, replacing the email with the administrator account's exact email:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where lower(email) = lower('ADMIN_EMAIL_HERE')
);
```

4. Confirm exactly one row was updated.
5. Sign out and sign back in, then open `admin.html`.

Never add an admin-registration form or a client-side "make me admin" control. Keep administrator access limited to trusted site operators. If no profile row is updated, check that the account has registered and confirmed its email.

## 6. Deploy and test

Commit the files to the repository and allow GitHub Pages to deploy. Test the published URL:

- A new user can register and receives a confirmation email.
- An unconfirmed account cannot sign in if email confirmation is required.
- A confirmed customer can sign in and sign out.
- Password-reset email returns to `auth.html?mode=reset`.
- A customer opening `admin.html` sees an access-denied message.
- Only the manually promoted admin account sees the admin dashboard.
- A user cannot change their role through the browser or by editing page JavaScript.

Use a separate test customer and test administrator. Do not test with real customer information.

## Security notes

- Never store passwords yourself. Supabase Auth handles password verification.
- Supabase manages the auth session and refresh-token lifecycle. Do not copy access or refresh tokens into custom localStorage keys.
- The browser client uses only the public publishable/anon key.
- Never put a service-role key in HTML, JavaScript, GitHub, or GitHub Actions logs.
- RLS is the real data boundary. Hiding an admin page or checking a role in JavaScript is not sufficient protection for future database writes.
- Before adding orders, addresses, payments, or customer support records, design separate tables and restrictive RLS policies. This current storefront does not collect those details or process payments.
- Use HTTPS, keep dependencies updated, and review Supabase Auth rate limits and email settings before launch.

## Current scope and next stage

This first stage establishes customer and admin identity. It intentionally does not create shopping carts, payment processing, customer addresses, or database-backed product editing. A later stage can migrate the five existing product cards into a `products` table, then add admin-only product create/update/archive policies using `public.is_admin()`.
