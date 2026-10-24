ALTER TABLE "inventory_movements"
  DROP CONSTRAINT "inventory_movements_direction_matches_type";

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_direction_matches_type" CHECK (
    ("type" = 'PURCHASE' AND "quantity_delta" < 0) OR
    ("type" = 'RESTOCK' AND "quantity_delta" > 0) OR
    ("type" = 'INITIAL_STOCK' AND "quantity_delta" > 0) OR
    ("type" = 'ADJUSTMENT' AND "quantity_delta" <> 0)
  );
