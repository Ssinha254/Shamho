-- SQL policies to allow read-only anon (publishable key) access
-- Run these in the Supabase SQL editor if you want public, read-only access

-- NOTE: Review these before applying. They make SELECT unrestricted for the listed tables/views.

-- Allow anon select on underlying tables used by the frontend
CREATE POLICY allow_anon_select_members ON members FOR SELECT USING (true);
CREATE POLICY allow_anon_select_products ON products FOR SELECT USING (true);
CREATE POLICY allow_anon_select_locations ON locations FOR SELECT USING (true);
CREATE POLICY allow_anon_select_batches ON batches FOR SELECT USING (true);
CREATE POLICY allow_anon_select_transactions ON transactions FOR SELECT USING (true);
CREATE POLICY allow_anon_select_transaction_items ON transaction_items FOR SELECT USING (true);

CREATE POLICY allow_anon_select_product_batch ON product_batch FOR SELECT USING (true);
CREATE POLICY allow_anon_select_inventory_view ON inventory_view FOR SELECT USING (true);

-- If you have read-only views (recommended), you can create policies on them as well
-- (Postgres allows RLS on views that are marked with security_barrier; if your views are simple selects,
-- it's typically enough to allow anon on underlying tables or create dedicated policy on the view name.)
DO $$
BEGIN
  BEGIN
    CREATE POLICY allow_anon_select_transaction_detail_view ON transaction_detail_view FOR SELECT USING (true);
  EXCEPTION WHEN undefined_table THEN
    -- view does not exist, ignore
    RAISE NOTICE 'transaction_detail_view not found, skip policy creation';
  END;

  BEGIN
    CREATE POLICY allow_anon_select_batch_details ON batch_details FOR SELECT USING (true);
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'batch_details not found, skip policy creation';
  END;
END$$;

-- If you want to restrict more, replace USING (true) with conditions, or create policies only on views.
