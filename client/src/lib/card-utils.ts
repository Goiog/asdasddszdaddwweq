import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Environment — use the Vite env names you provided
 */
export const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ?? ""; // your Render server origin for database
export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? "";
export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ?? ""; // your Render server origin for images

  let _supabase: SupabaseClient | null = null;
  
// Create a Supabase client (exported for tests or direct usage)
export function createSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  // If envs are missing we still create the client (avoids runtime crash while building),
  // but it's good to log so you can catch missing envs in dev.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // optional: console.warn("Supabase env missing, createClient will use empty strings");
  }

  _supabase = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "", {
    // you can tune options here, e.g. auth/persistSession depending on your needs
    // avoid introducing any packages that might import react-query
  });

  return _supabase;
}

export type ChineseWord = {
  id: string;
  Id?: number; // original numeric Id if you need it
  Chinese?: string | null;
  Pinyin?: string | null;
  Translation?: string | null;
  HSK?: string | null;
  Frequency?: number | null;
  Theme?: string | null;
  Image?: string | null;
  Examples?: string | null;
  Meaning?: string | null;
  // local/UI helpers (not stored in DB)
  unlocked?: boolean;
  isNew?: boolean;
};

/** Map a DB row (Supabase) to our frontend ChineseWord shape */
function mapDbRowToChineseWord(r: any): ChineseWord {
  if (!r) return null as any;
  const Id = r.Id ?? r.id ?? r.IdCard ?? null; // be permissive
  return {
    id: String(Id ?? r.Id ?? r.id ?? ""),
    Id: typeof Id === "number" ? Id : Id ? Number(Id) : undefined,
    Chinese: r.Chinese ?? r.chinese ?? null,
    Pinyin: r.Pinyin ?? r.pinyin ?? null,
    Translation: r.Translation ?? r.translation ?? null,
    HSK: r.HSK ?? r.hsk ?? null,
    Frequency:
      typeof r.Frequency === "number"
        ? r.Frequency
        : r.Frequency
        ? Number(r.Frequency)
        : null,
    Theme: r.Theme ?? r.theme ?? null,
    Image: r.Image ?? r.image ?? null,
    Examples: r.Examples ?? r.examples ?? null,
    Meaning: r.Meaning ?? r.meaning ?? null,
  };
}

/** Convenience: wrap Supabase errors */
async function handleResult<T>(res: {
  data: T | null;
  error: any;
  status?: number;
}): Promise<T> {
  if (res.error) {
    const err = new Error(res.error.message || String(res.error));
    (err as any).original = res.error;
    throw err;
  }
  return res.data as T;
}

// -----------------------------
// Main DB functions (client-side Supabase + RLS)
// -----------------------------
const TABLE_NAME = "ChineseDatabase";

/** Fetch all words from Supabase table. */
export async function fetchAllWords(): Promise<ChineseWord[]> {
  const supabase = createSupabaseClient();
  const res = await supabase.from(TABLE_NAME).select("*");
  const rows = await handleResult<any[]>(res);
  return (rows || []).map(mapDbRowToChineseWord).filter(Boolean);
}

/** Fetch a single word by numeric id (or string) */
export async function fetchWordById(id: string): Promise<ChineseWord | null> {
  const supabase = createSupabaseClient();
  // Id is numeric in DB; be permissive
  const numeric = Number(id);
  const res = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("Id", Number.isFinite(numeric) ? numeric : id)
    .limit(1);
  const rows = await handleResult<any[]>(res);
  if (!rows || rows.length === 0) return null;
  return mapDbRowToChineseWord(rows[0]);
}

/** Search words by q (searches Chinese, Pinyin, Translation). Limit default 50. */
export async function searchWords(q: string, limit = 50): Promise<ChineseWord[]> {
  if (!q || q.trim() === "") return [];
  const supabase = createSupabaseClient();
  // Basic full-text-ish search using ilike on key columns (safe for RLS+anon)
  const like = `%${q.replace(/%/g, "\\%")}%`;
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .or(
      `Chinese.ilike.${like},Pinyin.ilike.${like},Translation.ilike.${like}`
    )
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapDbRowToChineseWord);
}

/** Get n random words (client-side randomness). */
export async function getRandomWords(count = 10): Promise<ChineseWord[]> {
  const all = await fetchAllWords();
  // simple shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}

// -----------------------------
// Image helper (use your Render server)
// -----------------------------
/**
 * getImageUrl expects a card with `id` (string). It will return:
 *  - API_BASE + /Images/{id}.webp  (if API_BASE set)
 *  - /Images/{id}.webp             (if API_BASE empty, same-origin)
 *
 * If your DB stores full image URLs in `Image`, callers can prefer that field.
 */
export function getImageUrl(card: { id: string; Image?: string | null }): string {
  // If API_BASE is empty we'll fall back to a relative path (useful for same-origin setups)
  const base = API_BASE || "";
  // keep same format you already use
  return `${base}/Images/${card.id}.webp`;
}

// -----------------------------
// Local collection helpers (localStorage-backed)
// -----------------------------
const LOCAL_COLLECTION_KEY = "my_app_collection_v1";

/** Normalize a stored item (backwards compat) */
function normalizeStoredCard(c: any): ChineseWord {
  if (!c) return c;
  // ensure id is string
  return {
    ...c,
    id: typeof c.id === "number" ? String(c.id) : c.id ?? String(c.Id ?? ""),
  };
}

export function loadCollectionFromLocalStorage(): ChineseWord[] {
  try {
    const raw = localStorage.getItem(LOCAL_COLLECTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStoredCard);
  } catch (e) {
    console.warn("Unable to load collection from localStorage", e);
    return [];
  }
}

function saveCollectionToLocalStorage(collection: ChineseWord[]) {
  try {
    localStorage.setItem(
      LOCAL_COLLECTION_KEY,
      JSON.stringify(collection.map((c) => ({ ...c })))
    );
  } catch (e) {
    console.warn("Unable to save collection to localStorage", e);
  }
}

/** Add a card to the local collection. Returns the updated collection. */
export function addCardToLocalCollection(card: ChineseWord): ChineseWord[] {
  const current = loadCollectionFromLocalStorage();
  if (current.some((c) => c.id === card.id)) return current;
  const next = [normalizeStoredCard(card), ...current];
  saveCollectionToLocalStorage(next);
  return next;
}

/** Remove a card by id from the local collection. Returns the updated collection. */
export function removeCardFromLocalCollection(id: string): ChineseWord[] {
  const next = loadCollectionFromLocalStorage().filter((c) => c.id !== id);
  saveCollectionToLocalStorage(next);
  return next;
}

/** Check whether a card id is in the local collection. */
export function isCardInLocalCollection(id: string): boolean {
  return loadCollectionFromLocalStorage().some((c) => c.id === id);
}
