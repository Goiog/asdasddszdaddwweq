import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chineseWords = pgTable("chinese_words", {
  id: varchar("id").primaryKey(), // e.g., "000001"
  pinyin: text("pinyin").notNull(),
  chinese: text("chinese").notNull(),
  translation: text("translation").notNull(),
  firstChar: text("first_char"),
  secondChar: text("second_char"),
  thirdChar: text("third_char"),
  fourthChar: text("fourth_char"),
  hsklevel: text("hsklevel"), // HSK level 1-6
  imagedefinition: text("imagedefinition"),
  explanation: text("explanation"),
  fullDefinition: text("full_definition"),
  examples: text("examples"),
  frequency: integer("frequency"),
  rarity: text("rarity").notNull().default("common"), // common, rare, epic, legendary
});

export const userCards = pgTable("user_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  cardId: varchar("card_id").references(() => chineseWords.id),
  obtainedAt: timestamp("obtained_at").defaultNow(),
  count: integer("count").default(1),
});

export const packOpenings = pgTable("pack_openings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  packType: text("pack_type").notNull(), // starter, advanced, premium
  cardsObtained: jsonb("cards_obtained"), // array of card IDs
  openedAt: timestamp("opened_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChineseWordSchema = createInsertSchema(chineseWords);
export const insertUserCardSchema = createInsertSchema(userCards).omit({ id: true, obtainedAt: true });
export const insertPackOpeningSchema = createInsertSchema(packOpenings).omit({ id: true, openedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChineseWord = typeof chineseWords.$inferSelect;
export type UserCard = typeof userCards.$inferSelect;
export type PackOpening = typeof packOpenings.$inferSelect;
export type InsertChineseWord = z.infer<typeof insertChineseWordSchema>;
export type InsertUserCard = z.infer<typeof insertUserCardSchema>;
export type InsertPackOpening = z.infer<typeof insertPackOpeningSchema>;

export const CardRarity = z.enum(["common", "rare", "epic", "legendary"]);
export const PackType = z.enum(["hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6"]);
