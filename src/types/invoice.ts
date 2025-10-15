import { z } from "zod";
import { InvoiceHeaderPayload, InvoiceLinePayload, InvoiceUpsertLinesPayload } from "shared/zod/invoice";

export type InvoiceHeader = z.infer<typeof InvoiceHeaderPayload>;
export type InvoiceLine = z.infer<typeof InvoiceLinePayload>;
export type InvoiceUpsertLines = z.infer<typeof InvoiceUpsertLinesPayload>;

// Types avec relations pour les réponses API enrichies
export type InvoiceHeaderWithRelations = InvoiceHeader & {
  supplier?: {
    id: string;
    name: string;
  } | null;
  restaurant?: {
    id: string;
    name: string;
  } | null;
  storage_path?: string;
  supplierName?: string;
};