// src/lib/functions.ts
import { supabase } from "./supabase";
import {ChineseWord }  from "./card-utils";

export const TABLE_NAME = "ChineseDatabase";
/**
 * Helper to throw a nicer error with Supabase response error.
 */
function throwIfError(result: { error: any }) {
  if (result.error) throw result.error;
}

/* --------------------------------------------------------------------------
 * RPC: unlockCard
 * - Calls PostgreSQL function "unlock_card(p_card_id BIGINT)" which does:
 *     INSERT INTO unlocked_cards(card_id, user_id) VALUES(p_card_id, auth.uid())
 *     ON CONFLICT (card_id, user_id) DO NOTHING;
 * - This RPC uses auth.uid() server-side, so the client does not supply user_id.
 * -------------------------------------------------------------------------*/
export async function unlockCard(cardId: number | string): Promise<void> {
  // ensure cardId passed as string if it's larger than JS safe int
  const p_card_id = typeof cardId === 'number' ? String(cardId) : cardId;

  const { error } = await supabase.rpc('unlock_card', { p_card_id });
  throwIfError({ error });
}

/* --------------------------------------------------------------------------
 * RPC: unlockCardsBulk
 * - Calls PostgreSQL function "unlock_cards_bulk(p_card_ids BIGINT[])" which does
 *   unnest(p_card_ids) + auth.uid() + ON CONFLICT DO NOTHING
 * - Useful if user unlocks many cards at once (batching).
 * -------------------------------------------------------------------------*/
export async function unlockCardsBulk(cardIds: Array<number | string>): Promise<void> {
  // Convert to array of strings to avoid bigint issues
  const p_card_ids = cardIds.map((id) => (typeof id === 'number' ? String(id) : id));
  const { error } = await supabase.rpc('unlock_cards_bulk', { p_card_ids });
  throwIfError({ error });
}

/* --------------------------------------------------------------------------
 * Check if current authenticated user has unlocked a card.
 * - Returns true if unlocked, false otherwise.
 * -------------------------------------------------------------------------*/
export async function hasUnlocked(cardId: number | string): Promise<boolean> {
  const cardIdStr = typeof cardId === 'number' ? String(cardId) : cardId;

  const { data, error } = await supabase
    .from('unlocked_cards')
    .select('card_id', { count: 'exact', head: false })
    .eq('card_id', cardIdStr)
    .limit(1);

  throwIfError({ error });

  // data may be an array — if at least one row, it's unlocked
  return Array.isArray(data) && data.length > 0;
}

/* --------------------------------------------------------------------------
 * Get a single card's full info from ChineseDatabase
 * - Note: table name is "ChineseDatabase" (camel case) as you used earlier.
 * - Returns null if not found.
 * -------------------------------------------------------------------------*/
export async function getCard(cardId: number | string): Promise<ChineseWord | null> {
  const cardIdStr = typeof cardId === 'number' ? String(cardId) : cardId;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', cardIdStr)
    .limit(1)
    .maybeSingle();

  throwIfError({ error });
  return data ?? null;
}

/* --------------------------------------------------------------------------
 * Get a all card full info from ChineseDatabase
 * - Note: table name is "ChineseDatabase"
 * - Returns null if not found.
 * -------------------------------------------------------------------------*/
export async function allCards(): Promise<ChineseWord[]> {

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .limit(500);

  throwIfError({ error });
  return data ?? [];
}
/* --------------------------------------------------------------------------
 * Get all unlocked card IDs for the current user
 * - Returns an array of card_id strings (BIGINTs as strings).
 * -------------------------------------------------------------------------*/
export async function getUserUnlockedCardIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('unlocked_cards')
    .select('card_id')
    .order('date_unlocked', { ascending: false });

  throwIfError({ error });

  if (!Array.isArray(data)) return [];

  // Each row is { card_id: '...' }
  return data.map((r: any) => String(r.card_id));
}

/* --------------------------------------------------------------------------
 * Get full card rows for all cards unlocked by current user
 * - Joins unlocked_cards -> ChineseDatabase client-side (two queries).
 * - You could instead create a view or a RPC that returns joined results server-side.
 * -------------------------------------------------------------------------*/
export async function getUserUnlockedCards(): Promise<ChineseWord[]> {
  const cardIds = await getUserUnlockedCardIds();
  if (cardIds.length === 0) return [];

  // Query ChineseDatabase for these ids. Use .in() with array of strings.
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .in('id', cardIds);

  throwIfError({ error });

  return (data ?? []) as ChineseWord[];
}

/* --------------------------------------------------------------------------
 * Optional: function to check and unlock in a single flow with optimistic UI:
 * - This is a convenience wrapper: it checks hasUnlocked(), and only calls unlockCard()
 *   if not already unlocked. Useful to avoid RPC calls when unnecessary.
 * -------------------------------------------------------------------------*/
export async function ensureUnlocked(cardId: number | string): Promise<{ alreadyUnlocked: boolean }> {
  const already = await hasUnlocked(cardId);
  if (already) return { alreadyUnlocked: true };

  await unlockCard(cardId);
  return { alreadyUnlocked: false };
}

/* --------------------------------------------------------------------------
 * Example usage:
 *
 * import { unlockCard, hasUnlocked, getCard, getUserUnlockedCards } from '~/lib/functions';
 *
 * // unlock
 * await unlockCard(12345);
 *
 * // check
 * const ok = await hasUnlocked(12345);
 *
 * // read a card
 * const card = await getCard(12345);
 *
 * // get all unlocked
 * const unlocked = await getUserUnlockedCards();
 * -------------------------------------------------------------------------*/
