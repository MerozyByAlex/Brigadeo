/*
  # Extend RLS for invoice_line writes

  1. New Policies
    - Add INSERT policy for invoice_line table
    - Add UPDATE policy for invoice_line table  
    - Add DELETE policy for invoice_line table

  2. Security Rules
    - All write operations must verify that the parent invoice belongs to user's organization
    - Reuse existing organization membership mechanism (profiles + auth.uid())
    - USING and WITH CHECK clauses enforce same organization access control
    - Preserve existing SELECT policy unchanged

  3. Organization Membership Check
    - Uses same pattern as existing invoice policies
    - Lookup via profiles table where user_id = auth.uid()
    - Ensures consistent access control across all invoice-related tables
*/

-- Add INSERT policy for invoice_line
CREATE POLICY "Users can insert invoice lines for their organization invoices"
  ON invoice_line
  FOR INSERT
  TO authenticated
  WITH CHECK (invoice_id IN (
    SELECT i.id
    FROM invoice i
    WHERE i.organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  ));

-- Add UPDATE policy for invoice_line
CREATE POLICY "Users can update invoice lines for their organization invoices"
  ON invoice_line
  FOR UPDATE
  TO authenticated
  USING (invoice_id IN (
    SELECT i.id
    FROM invoice i
    WHERE i.organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  ))
  WITH CHECK (invoice_id IN (
    SELECT i.id
    FROM invoice i
    WHERE i.organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  ));

-- Add DELETE policy for invoice_line
CREATE POLICY "Users can delete invoice lines for their organization invoices"
  ON invoice_line
  FOR DELETE
  TO authenticated
  USING (invoice_id IN (
    SELECT i.id
    FROM invoice i
    WHERE i.organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  ));