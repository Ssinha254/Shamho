# COMPLETE SUPABASE WORK DONE TILL NOW

## Current live schema used by the app

Use these exact names in frontend queries and RPCs:

- `members(member_id, member_code, member_name, mobile, village, member_type, share_count, credit_limit, outstanding_amount, joined_at)`
- `products(product_id, product_code, product_name, product_category, unit)`
- `locations(location_id, location_code, remarks)`
- `product_batch(batch_id, batch_code, product_id, location_id, manufacture_date, expiry_date, quantity, cost_per_unit, created_at)`
- `technician(technician_id, technician_code, technician_name, mobile, assigned_area)`
- `users(user_id, name, email, phone, password_hash, role, technician_id, is_active, created_at)`
- `transactions(transaction_id, transaction_code, member_id, technician_id, transaction_date, payment_type, total_amount, remarks)`
- `transaction_items(transaction_item_id, transaction_id, batch_id, quantity, rate, total_price, transaction_type)`
- `ai_record(ai_record_id, member_id, technician_id, batch_id, animal_id, ai_date, pregnancy_status)`

Views currently in use:

- `inventory_view(batch_id, batch_code, product_name, product_category, location_code, quantity, cost_per_unit, manufacture_date, expiry_date, status)`
- `member_summary_view(member_id, member_code, member_name, village, credit_limit, outstanding_amount, total_bills, total_purchase, last_purchase_date)`
- `ai_analytics_view(technician_name, total_ai, successful_ai, conception_rate)`
- `transaction_detail_view(transaction_id, transaction_code, transaction_date, member_name, member_code, technician_name, product_name, batch_code, quantity, rate, total_price, transaction_type)`

Frontend rules:

- Use `member_id`, not `id`, for member table lookups.
- Use `product_id`, `location_id`, `batch_id`, `transaction_id`, `ai_record_id`, and `technician_id` as the primary keys.
- Use `inventory_view` for inventory listing.
- Use `transaction_detail_view` for transaction display.
- Use `ai_record` for AI entries and `ai_analytics_view` for dashboard analytics.

Legacy examples below are retained only as older notes. The block above is the source of truth for the app.

Your ERP backend currently includes:

- database schema
- relationships
- constraints
- views
- RPC functions
- triggers
- RLS
- policies
- sample data
- frontend connection setup
- QR architecture planning

You are now at a proper ERP MVP stage.

---

# 1. TABLES CREATED / DESIGNED

---

## MEMBERS

Purpose:
Stores farmer/shareholder data.

Schema:

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  village VARCHAR(255),
  member_type VARCHAR(50),
  shares INTEGER DEFAULT 0,
  outstanding DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Relationships:

```text
members.id
↓
transactions.member_id

members.id
↓
ai_records.member_id
```

---

## PRODUCTS

Purpose:
Stores all products.

Examples:

- Wheat Bran
- Semen
- Mineral Mixture
- Feed

Schema:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Relationships:

```text
products.id
↓
batches.product_id
```

---

## LOCATIONS

Purpose:
Warehouse/grid/tank locations.

Examples:

```text
A1
A2
T1
T2
```

Schema:

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_code VARCHAR(50) UNIQUE NOT NULL,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Relationships:

```text
locations.id
↓
batches.location_id
```

---

## BATCHES

Purpose:
Inventory batch tracking.

Schema:

```sql
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code VARCHAR(100) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  location_id UUID REFERENCES locations(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(12,2),
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Relationships:

```text
batches.id
↓
transaction_items.batch_id

batches.id
↓
ai_records.semen_batch_id
```

---

## TRANSACTIONS

Purpose:
Bill header table.

One bill per member.

Schema:

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no VARCHAR(50) UNIQUE NOT NULL,
  member_id UUID REFERENCES members(id),
  technician_id UUID REFERENCES auth.users(id),
  payment_type VARCHAR(50) DEFAULT 'CASH',
  total DECIMAL(12,2) NOT NULL,
  notes TEXT,
  date TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Relationships:

```text
transactions.id
↓
transaction_items.transaction_id
```

---

## TRANSACTION_ITEMS

Purpose:
Stores products inside bill.

Schema:

```sql
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

Why separate table?

Because:

```text
1 bill
↓
many products
```

Normalized structure.

---

## AI_RECORDS

Purpose:
Artificial insemination records.

Schema:

```sql
CREATE TABLE ai_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  animal_id VARCHAR(100),
  semen_batch_id UUID REFERENCES batches(id),
  technician_id UUID REFERENCES auth.users(id),
  pregnancy_status VARCHAR(50) DEFAULT 'PENDING',
  remarks TEXT,
  date TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

# 2. VIEWS CREATED

---

## batch_details

Purpose:
Readable inventory data.

Joins:

```text
batches
products
locations
```

Contains:

```text
product_name
location_code
quantity
status
expiry
```

---

## member_outstanding

Purpose:
Member credit summary.

Uses:

```sql
SUM(transactions.total)
```

for CREDIT transactions.

---

## transaction_details

Purpose:
Frontend-ready bill view.

Joins:

```text
transactions
members
auth.users
```

---

# 3. RPC FUNCTIONS CREATED

---

## create_sale_transaction()

Main billing automation.

Does:

```text
1. create bill
2. insert items
3. reduce stock
4. calculate total
5. update member outstanding
```

---

## add_stock()

Adds inventory quantity.

---

## damage_stock()

Reduces damaged stock.

---

## return_stock()

Returns stock.

---

## get_member_outstanding()

Returns member due amount.

---

## get_conception_rate()

Calculates:

```text
positive AI / total AI
```

---

# 4. TRIGGERS CREATED / DISCUSSED

---

## trg_update_transaction_total

Purpose:

Automatically recalculates:

```text
transactions.total
```

when transaction_items change.

---

## updated_at trigger

Purpose:

Automatically updates:

```text
updated_at = now()
```

for modified rows.

---

## stock deduction trigger

Purpose:

Automatically reduces:

```text
batches.quantity
```

after sale.

---

## outstanding update trigger

Purpose:

Automatically increases:

```text
members.outstanding
```

for credit bills.

---

## batch status trigger

Purpose:

Auto updates:

```text
ACTIVE
EMPTY
DAMAGED
EXPIRED
```

based on stock/expiry.

---

# 5. INDEXES CREATED / DISCUSSED

Indexes improve speed.

Main indexed columns:

```sql
member_code
product_code
location_code
batch_code
member_id
batch_id
transaction_date
```

Used for:

- searching
- filtering
- QR lookup
- dashboard speed

---

# 6. RLS (ROW LEVEL SECURITY)

Enabled on major tables.

Example:

```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
```

---

# 7. POLICIES

Example policy:

```sql
CREATE POLICY "Users can see their transactions"
```

Uses:

```sql
auth.uid()
```

for access control.

---

# 8. SUPABASE AUTH

Integrated logically.

Used:

```text
auth.users
```

Technicians login through Supabase Auth.

---

# 9. SAMPLE DATA INSERTED

You inserted sample data into:

```text
members
products
locations
batches
```

Possibly transactions too.

---

# 10. ENV SETUP

Frontend connected using:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Quick SQL: enable read-only anon access (optional)

If you want the frontend to read data using the publishable (anon) key without signing in, apply read-only SELECT policies on the views or underlying tables. A helper SQL file is included at `db/policies.sql`.

Run the SQL in Supabase SQL editor or adapt it to your security model. By default it creates permissive SELECT policies (USING (true)) for these tables/views:

- `members`, `products`, `locations`, `batches`, `transactions`, `transaction_items`, `transaction_detail_view`, `batch_details`.

If you prefer strict access, keep RLS and require user sign-in; alternatively create sanitized public views and allow anon only on them.

![alt text](image.png)
![ ai analytics](image-1.png)
![alt text](image-2.png)![alt text](image-3.png)
