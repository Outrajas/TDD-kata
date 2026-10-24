ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_price_positive" CHECK ("price" > 0),
  ADD CONSTRAINT "vehicles_stock_nonnegative" CHECK ("stock_quantity" >= 0);

ALTER TABLE "purchases"
  ADD CONSTRAINT "purchases_price_positive" CHECK ("unit_price_at_purchase" > 0);

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_nonzero_delta" CHECK ("quantity_delta" <> 0),
  ADD CONSTRAINT "inventory_movements_nonnegative_after" CHECK ("quantity_after" >= 0),
  ADD CONSTRAINT "inventory_movements_direction_matches_type" CHECK (
    ("type" = 'PURCHASE' AND "quantity_delta" < 0) OR
    ("type" = 'RESTOCK' AND "quantity_delta" > 0)
  );

CREATE FUNCTION prevent_inventory_movement_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'inventory movements are append-only';
END;
$$;

CREATE TRIGGER "inventory_movements_append_only"
  BEFORE UPDATE OR DELETE ON "inventory_movements"
  FOR EACH ROW EXECUTE FUNCTION prevent_inventory_movement_mutation();
