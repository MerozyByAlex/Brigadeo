-- Test invoice currency constraint

-- Ensure the constraint exists
SELECT conname FROM pg_constraint
WHERE conname = 'invoice_currency_format_check';

-- Attempt to insert an invalid currency value
DO $$
DECLARE
  org_id uuid;
  rest_id uuid;
BEGIN
  SELECT o.id, r.id INTO org_id, rest_id
  FROM organization o
  JOIN restaurant r ON r.organization_id = o.id
  LIMIT 1;

  IF org_id IS NULL THEN
    RAISE NOTICE 'No organization/restaurant data available to test insert';
  ELSE
    BEGIN
      INSERT INTO public.invoice (id, organization_id, restaurant_id, file_url, invoice_date, currency)
      VALUES (gen_random_uuid(), org_id, rest_id, 'http://example.com', now(), 'usd');
      RAISE EXCEPTION 'Constraint invoice_currency_format_check not enforced';
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE 'Constraint enforced as expected';
    END;
  END IF;
END $$;
