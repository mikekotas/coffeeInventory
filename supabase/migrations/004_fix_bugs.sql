-- ============================================================
-- FIX 1: Rewrite deduct_stock_on_sale trigger
--
-- Bug: When stock dropped below warning threshold and no draft
-- order existed, the trigger tried:
--   INSERT INTO orders (created_by) SELECT NEW.sale_id ...
-- NEW.sale_id is a sale UUID, not a profile UUID — this violates
-- the orders.created_by FK → profiles(id), throwing an exception
-- that aborted the sale_items INSERT and caused the edge function
-- to return 500.
--
-- Fix: Use a single correct INSERT with staff_id from the sales
-- table. Also wrap non-critical logic in EXCEPTION blocks so a
-- failure in notification/order creation never aborts the sale.
-- ============================================================

CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
  new_stock NUMERIC;
  draft_order_id UUID;
  existing_order_item UUID;
  sale_staff_id UUID;
BEGIN
  -- Loop through each ingredient in the recipe for this product
  FOR r IN
    SELECT rec.inventory_id, rec.quantity_required, inv.name, inv.unit,
           inv.warning_threshold, inv.critical_threshold
    FROM recipes rec
    JOIN inventory inv ON inv.id = rec.inventory_id
    WHERE rec.product_id = NEW.product_id
  LOOP
    -- Deduct stock
    UPDATE inventory
    SET stock_qty = stock_qty - (r.quantity_required * NEW.qty_sold)
    WHERE id = r.inventory_id
    RETURNING stock_qty INTO new_stock;

    -- Non-critical: notifications + auto-draft-order
    -- Wrapped so any failure here never aborts the sale
    BEGIN
      -- Create notification if below thresholds
      IF new_stock <= r.critical_threshold THEN
        INSERT INTO notifications (inventory_id, message, severity, status)
        VALUES (
          r.inventory_id,
          r.name || ' is CRITICALLY LOW: ' || ROUND(new_stock, 1) || ' ' || r.unit ||
          ' remaining (critical threshold: ' || r.critical_threshold || ' ' || r.unit || ')',
          'critical',
          'unread'
        );
      ELSIF new_stock <= r.warning_threshold THEN
        INSERT INTO notifications (inventory_id, message, severity, status)
        VALUES (
          r.inventory_id,
          r.name || ' is running low: ' || ROUND(new_stock, 1) || ' ' || r.unit ||
          ' remaining (warning threshold: ' || r.warning_threshold || ' ' || r.unit || ')',
          'warning',
          'unread'
        );
      END IF;

      -- Auto-add to draft order if below warning threshold
      IF new_stock <= r.warning_threshold THEN
        -- Find existing draft order (most recent)
        SELECT id INTO draft_order_id
        FROM orders
        WHERE status = 'draft'
        ORDER BY created_at DESC
        LIMIT 1;

        -- Create draft order if none exists
        IF draft_order_id IS NULL THEN
          SELECT staff_id INTO sale_staff_id
          FROM sales
          WHERE id = NEW.sale_id;

          INSERT INTO orders (created_by, status)
          VALUES (sale_staff_id, 'draft')
          RETURNING id INTO draft_order_id;
        END IF;

        -- Check if this item is already in the draft order
        SELECT id INTO existing_order_item
        FROM order_items
        WHERE order_id = draft_order_id AND inventory_id = r.inventory_id;

        -- Only add if not already there
        IF existing_order_item IS NULL AND draft_order_id IS NOT NULL THEN
          INSERT INTO order_items (order_id, inventory_id, quantity_requested, source, notes)
          VALUES (
            draft_order_id,
            r.inventory_id,
            r.warning_threshold * 3,
            'auto_threshold',
            'Auto-added: stock dropped to ' || ROUND(new_stock, 1) || ' ' || r.unit
          );
        END IF;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'deduct_stock_on_sale: non-critical section failed for inventory_id=%: %',
        r.inventory_id, SQLERRM;
    END;

  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- FIX 2: Allow staff to update order_items in draft orders
--
-- Bug: ordersStore.addItem() calls .update() on order_items when
-- the item already exists in the draft. The existing policy
-- order_items_update_admin only allows admins, so staff gets an
-- RLS error and "Failed to add to order" is shown.
--
-- Fix: Add a policy allowing any authenticated user to UPDATE
-- order_items that belong to a draft order.
-- ============================================================

DROP POLICY IF EXISTS "order_items_update_draft" ON order_items;
CREATE POLICY "order_items_update_draft" ON order_items
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_items.order_id AND status = 'draft'
    )
  );
