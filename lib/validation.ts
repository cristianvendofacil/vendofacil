import { z } from "zod";

export const ZONES_ORDER = [
  "Rincón de los Sauces",
  "Añelo",
  "Catriel",
  "Buta Ranquil",
  "Barrancas",
  "Chos Malal",
  "Las Lagunas",
] as const;

export const ListingSchema = z.object({
  title: z.string().min(8).max(80),
  description: z.string().min(30).max(2000),
  zone: z.enum(ZONES_ORDER),
  price_amount: z.number().int().positive(),
  currency: z.enum(["ARS", "USD"]),
  price_period: z.enum(["night", "week", "month"]),
  property_type: z.enum(["house", "apartment", "room", "other"]),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  sqm: z.number().int().min(0).max(2000),
  capacity: z.number().int().min(1).max(100),
  min_stay_days: z.number().int().min(1).max(365),
  availability_from: z.string().optional(),
});
