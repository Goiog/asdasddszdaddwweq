// /shared/schema.ts
import { z } from "zod";

/**
 * Pure Zod types and helpers that are safe to import in the browser.
 * Keep these independent of drizzle-orm and any Node-only packages.
 */

export const CardRarity = z.enum(["common", "rare", "epic", "legendary"]);
export type CardRarity = z.infer<typeof CardRarity>;

export const PackType = z.enum(["hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6"]);
export type PackType = z.infer<typeof PackType>;

/* Insert schemas used by client to validate requests before sending to server */
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6), // adjust to your rules
});
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertChineseWordSchema = z.object({
  id: z.string(), // e.g., "000001"
  pinyin: z.string(),
  chinese: z.string(),
  translation: z.string(),
  firstChar: z.string().optional().nullable(),
  secondChar: z.string().optional().nullable(),
  thirdChar: z.string().optional().nullable(),
  fourthChar: z.string().optional().nullable(),
  hsklevel: z.string().optional().nullable(),
  imagedefinition: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  fullDefinition: z.string().optional().nullable(),
  examples: z.string().optional().nullable(),
  frequency: z.number().optional().nullable(),
  rarity: CardRarity.optional(),
});
export type InsertChineseWord = z.infer<typeof insertChineseWordSchema>;

/* similarly for UserCard and PackOpening */
export const insertUserCardSchema = z.object({
  userId: z.string(),
  cardId: z.string(),
  count: z.number().optional().default(1),
});
export type InsertUserCard = z.infer<typeof insertUserCardSchema>;

export const insertPackOpeningSchema = z.object({
  userId: z.string(),
  packType: PackType,
  cardsObtained: z.array(z.string()), // array of card IDs
});
export type InsertPackOpening = z.infer<typeof insertPackOpeningSchema>;
