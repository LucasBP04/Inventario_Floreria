import { z } from "zod";

// MongoDB ObjectId: 24-char hex string
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID inválido");

// ── Flower ────────────────────────────────────
export const FlowerSchema = z.object({
  name: z.string().min(2),
  bouquetSize: z.number().int().positive(),
  pricePerBouquet: z.number().positive(),
  isFoliage: z.boolean().default(false),
});

// ── FlowerBatch (incoming stock) ─────────────
export const BatchSchema = z.object({
  flowerId: objectId,
  quantity: z.number().int().positive(),
  supplier: z.string().min(2),
  receivedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// ── Waste ─────────────────────────────────────
export const WasteSchema = z.object({
  batchId: objectId,
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
});

// ── Order ─────────────────────────────────────
export const OrderItemSchema = z.object({
  flowerId: objectId,
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const OrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  channel: z.enum(["WHATSAPP", "FACEBOOK", "OTHER"]).default("WHATSAPP"),
  arrangement: z.string().min(3),
  deliveryDate: z.string().datetime(),
  notes: z.string().optional(),
  seasonId: objectId.optional(),
  items: z.array(OrderItemSchema).min(1),
});

// ── Season ────────────────────────────────────
export const SeasonSchema = z.object({
  name: z.string().min(2),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  multiplier: z.number().positive().default(1),
  targetUnits: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

// ── User ─────────────────────────────────────
export const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["OWNER", "EMPLOYEE"]).default("EMPLOYEE"),
});
