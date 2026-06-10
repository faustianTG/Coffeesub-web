# ☕ CoffeeSub — Coffee Subscription QR Web App

A production-ready Next.js 15 app for managing coffee subscriptions via QR codes, powered by Supabase.

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [Supabase Setup](#3-supabase-setup)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Run the App](#5-run-the-app)
6. [How to Test](#6-how-to-test)
7. [Project Structure](#7-project-structure)

---

## 1. Prerequisites

Make sure you have these installed before starting:

- **Node.js** v18.17 or higher → https://nodejs.org
- **npm** v9 or higher (comes with Node.js)
- A **Supabase account** (free) → https://supabase.com

To verify your Node version:
```bash
node -v   # should print v18.17.0 or higher
npm -v    # should print 9.x or higher
```

---

## 2. Project Setup

### Step 1 — Extract the zip

Unzip the downloaded file and open the folder:
```bash
unzip coffee-subscription.zip
cd coffee-subscription
```

### Step 2 — Install dependencies

```bash
npm install
```

This will install all packages. Should take about 30–60 seconds.

### Step 3 — Verify no vulnerabilities

```bash
npm audit
```

Should return **0 vulnerabilities**. If it doesn't, run `npm audit fix`.

---

## 3. Supabase Setup

### Step 1 — Create a new Supabase project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Give it a name (e.g. `coffeesub`), set a strong database password, choose a region close to you
4. Click **"Create new project"** and wait ~2 minutes for it to provision

---

### Step 2 — Create the database tables

Go to **SQL Editor** in your Supabase dashboard and run the following SQL to create all required tables:

```sql
-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  claim_balance INT NOT NULL DEFAULT 0,
  duration_days INT NOT NULL DEFAULT 30
);

-- Valid QR codes registry
CREATE TABLE qr_codes (
  qr_code TEXT PRIMARY KEY
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT,
  qr_code TEXT REFERENCES customer_qr_codes(qr_code),
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  subscription_expires_at TIMESTAMPTZ,
  claim_balance INT NOT NULL DEFAULT 0,
  claimed_coffee INT NOT NULL DEFAULT 0,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores
CREATE TABLE stores (
  name TEXT PRIMARY KEY,
  is_active BOOLEAN DEFAULT TRUE
);

-- Items
CREATE TABLE items (
  item_name TEXT PRIMARY KEY,
  essential_plan BOOLEAN DEFAULT FALSE,
  unlimited_plan BOOLEAN DEFAULT FALSE,
  promo_plan BOOLEAN DEFAULT FALSE
);

-- Redemptions
CREATE TABLE redemption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer(id),
  store_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_by_user_id UUID NOT NULL REFERENCES auth.users(id)
);
```

---

### Step 3 — Set Row Level Security (RLS) policies

Still in the **SQL Editor**, run this to allow users to access only their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Customer: users can read and update their own record
CREATE POLICY "Users can view own customer record"
  ON customers FOR SELECT
  USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can insert own customer record"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update own customer record"
  ON customers FOR UPDATE
  USING (auth.uid() = created_by_user_id);

-- QR codes: authenticated users can insert and select
CREATE POLICY "Authenticated users can insert QR codes"
  ON qr_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read QR codes"
  ON qr_codes FOR SELECT
  TO authenticated
  USING (true);

-- Redemptions: users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
  ON redemption FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE created_by_user_id = auth.uid()
    )
  );

-- Subscription plans, stores, items: anyone authenticated can read
CREATE POLICY "Authenticated users can read subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read stores"
  ON stores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read items"
  ON items FOR SELECT
  TO authenticated
  USING (true);
```

---

### Step 4 — Seed some test data (optional but recommended)

```sql
-- Add sample subscription plans
INSERT INTO subscription_plans (name, claim_balance, duration_days) VALUES
  ('Essential', 10, 30),
  ('Unlimited', 999, 30),
  ('Promo', 5, 14);

-- Add sample stores
INSERT INTO stores (name, is_active) VALUES
  ('CoffeeSub KL Sentral', TRUE),
  ('CoffeeSub Bangsar', TRUE),
  ('CoffeeSub KLCC', TRUE);

-- Add sample items
INSERT INTO items (item_name, essential_plan, unlimited_plan, promo_plan) VALUES
  ('Espresso', TRUE, TRUE, TRUE),
  ('Latte', TRUE, TRUE, FALSE),
  ('Cold Brew', FALSE, TRUE, FALSE),
  ('Cappuccino', TRUE, TRUE, TRUE);
```

---

### Step 5 — Disable Email Confirmation (for testing)

1. Go to **Authentication → Sign In Methods → Email**
2. Toggle **"Confirm email"** to **OFF**
3. Click **Save**

This allows users to register and log in instantly without any email verification. Re-enable when going to production.

---

### Step 6 — Get your API credentials

1. Go to **Project Settings → API**
2. Copy your **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
3. Copy your **anon / public** key (long JWT string)

---

## 4. Configure Environment Variables

In the project root, create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and paste your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **No quotes around the values. No spaces around the `=` sign.**

---

## 5. Run the App

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

You should see the CoffeeSub login page.

---

## 6. How to Test

### ✅ Test 1 — Registration

1. Go to `http://localhost:3000/register`
2. Fill in your full name, a real email, optional phone, and a password (min 6 chars)
3. Click **Create Account**
4. You should be redirected to `/verify`

**Verify in Supabase:**
- **Authentication → Users** → new user appears with status "Waiting for verification"

---

### ✅ Test 2 — OTP Verification

1. Check your email inbox for a **6-digit code** from Supabase
2. Enter it on the `/verify` page
3. Click **Verify & Continue**
4. You should be redirected to `/dashboard`

**Verify in Supabase:**
- **Authentication → Users** → user status is now "Confirmed"
- **Table Editor → customer** → a new row exists with your name
- **Table Editor → customer_qr_codes** → a UUID row exists
- **customer.qr_code** column matches a row in `customer_qr_codes`

---

### ✅ Test 3 — Dashboard

On `/dashboard` you should see:
- ☕ Your name in the welcome heading
- A **QR code** rendered visually in the card
- **Credits Left**, **Coffees Claimed**, **Expires** stats
- Status badge showing **EXPIRED** (normal — no plan assigned yet)

To test with an active plan, run this in **Supabase SQL Editor** (replace the email):
```sql
UPDATE customers
SET
  subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'Essential'),
  subscription_expires_at = NOW() + INTERVAL '30 days',
  claim_balance = 10
WHERE created_by_user_id = (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
);
```

Then refresh the page — the badge should show **ACTIVE** and credits should show `10`.

---

### ✅ Test 4 — Sign Out & Login

1. Click **Sign out** in the navbar
2. Go to `http://localhost:3000/login`
3. Enter your email and password
4. Should redirect to `/dashboard`

---

### ✅ Test 5 — Route Protection

While **logged out**, try visiting:
- `http://localhost:3000/dashboard` → should redirect to `/login`
- `http://localhost:3000/profile` → should redirect to `/login`

---

### ✅ Test 6 — Profile Page

Go to `/profile` while logged in:
- Your name, email, phone should appear
- Subscription plan details shown
- Redemption history (empty until redemptions are added)

To test redemption history, insert a test record in **Supabase SQL Editor**:
```sql
INSERT INTO redemption (customer_id, store_name, item_name, redeemed_by_user_id)
VALUES (
  (SELECT id FROM customers WHERE created_by_user_id = (
    SELECT id FROM auth.users WHERE email = 'your@email.com'
  )),
  'CoffeeSub Bangsar',
  'Latte',
  (SELECT id FROM auth.users WHERE email = 'your@email.com')
);
```

Refresh `/profile` — the redemption should appear in the history list.

---

## 7. Project Structure

```
coffee-subscription/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Redirects to /login
│   ├── globals.css             # Tailwind + CoffeeSub theme
│   ├── register/page.tsx       # Registration form
│   ├── verify/page.tsx         # OTP verification
│   ├── login/page.tsx          # Sign in
│   ├── dashboard/page.tsx      # QR card + stats
│   └── profile/page.tsx        # Profile + redemption history
├── components/
│   ├── Navbar.tsx              # Top navigation
│   └── QRCodeDisplay.tsx       # Canvas QR renderer
├── lib/
│   ├── supabaseClient.ts       # Supabase browser client
│   ├── auth.ts                 # Auth helpers
│   └── qr.ts                   # QR code generator
├── services/
│   ├── customerService.ts      # Customer DB queries
│   └── redemptionService.ts    # Redemption DB queries
├── types/
│   └── index.ts                # TypeScript types
├── middleware.ts               # Route protection
├── .env.local.example          # Environment variable template
└── package.json
```
