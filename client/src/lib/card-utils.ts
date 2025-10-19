import { SUPABASE_URL, supabase} from "./supabase";

export const TABLE_NAME = "ChineseDatabase";

export type ChineseWord = {
  Id: string;
  Chinese?: string | null;
  Pinyin?: string ;
  Translation?: string;
  HSK?: string | null;
  Frequency?: number | null;
  Theme?: string | null;
  Image?: string | null;
  Examples?: string | null;
  Meaning?: string | null;
  Category?: string |null;
};

function throwIfError(result: { error: any }) {
  if (result.error) throw result.error;
}

export async function unlockCard(cardId: number | string): Promise<void> {
  // ensure cardId passed as string if it's larger than JS safe int
  const p_card_id = typeof cardId === 'number' ? String(cardId) : cardId;

  const { error } = await supabase.rpc('unlock_card', { p_card_id });
  throwIfError({ error });
}

export async function unlockCardsBulk(cardIds: Array<number | string>): Promise<void> {
  // Convert to array of strings to avoid bigint issues
  const p_card_ids = cardIds.map((Id) => (typeof Id === 'number' ? String(Id) : Id));
  const { error } = await supabase.rpc('unlock_cards_bulk', { p_card_ids });
  throwIfError({ error });
}

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

export async function getCard(cardId: number | string): Promise<ChineseWord | null> {
  const cardIdStr = typeof cardId === 'number' ? String(cardId) : cardId;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('Id', cardIdStr)
    .limit(1)
    .maybeSingle();

  throwIfError({ error });
  return data ?? null;
}

export async function allCards(): Promise<ChineseWord[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("Id", { ascending: true }) // explicit ordering
    .range(0, 499);                    // explicit range (0-based inclusive)

  throwIfError({ error });
  return (data ?? []) as ChineseWord[];
}
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

export async function getUserUnlockedCards(): Promise<ChineseWord[]> {
  const cardIds = await getUserUnlockedCardIds();
  if (cardIds.length === 0) return [];

  // Query ChineseDatabase for these ids. Use .in() with array of strings.
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .in('Id', cardIds);

  throwIfError({ error });

  return (data ?? []) as ChineseWord[];
}

export async function ensureUnlocked(cardId: number | string): Promise<{ alreadyUnlocked: boolean }> {
  const already = await hasUnlocked(cardId);
  if (already) return { alreadyUnlocked: true };

  await unlockCard(cardId);
  return { alreadyUnlocked: false };
}

/** Get n random words (client-sIde randomness). */
export async function getRandomWords(count = 10): Promise<ChineseWord[]> {
  const all = await allCards();
  // simple shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}

export function getImageUrl(
  card: { Id: string; Image?: string | null },
  size: number = 273 // default to small
): string {
  const base = SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/ChineseRequest/${card.Id}_${size}.webp`;
}
