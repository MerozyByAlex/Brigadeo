/*
  # Invoice line price history trigger

  1. Trigger Function
    - `log_invoice_line_price_history()` function to automatically log price data
    - Triggered on AFTER INSERT of invoice_line records
    - Fetches parent invoice data for organization and restaurant context

  2. Price History Logging
    - Creates product_price_history record for each new invoice_line
    - Maps invoice_line fields to price_history structure
    - Uses 'invoice_line' as source_type with source_id pointing to invoice_line.id
    - Inherits currency, organization_id, and restaurant_id from parent invoice

  3. Data Mapping
    - price_excl_cents: from invoice_line.unit_price_excl_cents
    - quantity: from invoice_line.quantity
    - unit_type: from invoice_line.unit_type
    - unit_base_qty: from invoice_line.unit_base_qty
    - product_id: set to NULL (will be linked later if needed)

  4. Idempotence
    - Uses DROP TRIGGER IF EXISTS for safe re-application
    - Function uses CREATE OR REPLACE for updates
*/

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.log_invoice_line_price_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert price history record by fetching parent invoice data
  INSERT INTO product_price_history (
    organization_id,
    restaurant_id,
    product_id,
    source_type,
    source_id,
    currency,
    price_excl_cents,
    quantity,
    unit_type,
    unit_base_qty,
    recorded_at
  )
  SELECT 
    i.organization_id,
    i.restaurant_id,
    NULL, -- product_id will be linked later if needed
    'invoice_line',
    NEW.id,
    i.currency,
    NEW.unit_price_excl_cents,
    NEW.quantity,
    NEW.unit_type,
    NEW.unit_base_qty,
    now()
  FROM invoice i
  WHERE i.id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS log_invoice_line_price_history_trigger ON invoice_line;

CREATE TRIGGER log_invoice_line_price_history_trigger
  AFTER INSERT ON invoice_line
  FOR EACH ROW
  EXECUTE FUNCTION log_invoice_line_price_history();