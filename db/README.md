# Database Documentation

## Schema Overview

This database supports a multi-tenant restaurant management system with invoice processing, ingredient tracking, and recipe management.

## Core Tables

### Authentication & Organizations
- `users` - User authentication (managed by Supabase Auth)
- `profiles` - User profile information linked to auth.users
- `organization` - Multi-tenant organizations
- `organization_subscription` - Subscription management per organization
- `organization_modules` - Feature modules enabled per organization

### Restaurant Management
- `restaurant` - Restaurant entities within organizations
- `supplier` - Supplier/vendor information per organization
- `invoice` - Invoice headers with supplier and restaurant references
- `invoice_line` - Individual line items within invoices

### Ingredient & Product Management
- `ingredient_category` - Categories for organizing ingredients (global + per-org)
- `ingredient` - Master ingredient list per organization
- `product` - Purchased products linked to ingredients
- `product_price_history` - Historical price tracking for cost analysis

### Recipe Management
- `recipes` - Recipe definitions per restaurant
- `recipe_ingredients` - Ingredient quantities per recipe

### Subscription & Billing
- `subscription_modules` - Available subscription modules
- `subscription_logs` - Audit log for subscription events
- `stripe_customers` - Stripe customer mapping
- `stripe_subscriptions` - Stripe subscription data
- `stripe_orders` - One-time payment records

## Security Model

All tables use Row Level Security (RLS) with organization-based access control:

```sql
-- Standard organization membership check
organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
)
```

## Key Features

### Multi-tenancy
- Organization-scoped data isolation
- Shared global categories with per-org overrides
- Consistent RLS policies across all tables

### Invoice Processing
- PDF upload and storage integration
- Automated line item extraction
- Price history tracking for cost analysis

### Cost Calculation
- Unit-based pricing (weight/volume/unit)
- Historical price tracking
- Recipe cost estimation

## Changelog

### Phase 1 (January 2025)
- **Supplier/Invoice Consolidation**: Consolidated supplier table structure and ensured single supplier_id foreign key on invoice table
- **Invoice Line RLS Extension**: Added INSERT, UPDATE, DELETE policies for invoice_line table with organization-based access control
- **Product Price History**: Created product_price_history table for tracking price changes over time with proper indexing and RLS
- **Automated Price Logging**: Implemented trigger to automatically log price history when invoice lines are created