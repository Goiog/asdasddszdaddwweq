import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type ChineseWord = {
  id: string;
  simplified?: string | null;
  traditional?: string | null;
  pinyin?: string | null;
  meaning?: string | null;
  hsk_level?: number | null;
  tags?: string[] | null;
  user_id?: string | null;
};

// -----------------------------
// Pack configs and helpers
// -----------------------------
export type PackConfig = {
  /** kind of pack: 'random' | 'hsk' | 'tag' | 'search' */
  kind: 'random' | 'hsk' | 'tag' | 'search';
  /** desired size of pack */
  size?: number;
  /** for kind='hsk' list of levels */
  levels?: number[];
  /** for kind='tag' single tag name */
  tag?: string;
  /** for kind='search' query string */
  query?: string;
  /** human friendly description */
  description?: string;
};

export const PACK_CONFIGS: Record<string, PackConfig> = {
  default: { kind: 'random', size: 10, description: 'Random selection of words' },
  hsk1: { kind: 'hsk', levels: [1], size: 10, description: 'HSK level 1 pack' },
  hsk2: { kind: 'hsk', levels: [2], size: 10, description: 'HSK level 2 pack' },
  hsk1_2: { kind: 'hsk', levels: [1, 2], size: 12, description: 'Mixed HSK 1 & 2' },
  common_verbs: { kind: 'tag', tag: 'verbs', size: 12, description: 'Common verbs' },
};

/** Helper: open a pack using either openPack or appropriate queries based on PackConfig */
export async function getPackFromConfig(cfg: PackConfig | string): Promise<ChineseWord[]> {
  const conf: PackConfig = typeof cfg === 'string' ? (PACK_CONFIGS[cfg] || PACK_CONFIGS.default) : cfg;
  const size = conf.size ?? 10;
  if (conf.kind === 'random') return getRandomWords(size);
  if (conf.kind === 'hsk') {
    const levels = conf.levels ?? [];
    if (levels.length === 0) return getRandomWords(size);
    // reuse openPack implementation (it already supports hsk:... syntax)
    return openPack(`hsk:${levels.join(',')}`, size);
  }
  if (conf.kind === 'tag') {
    const tag = conf.tag || '';
    return openPack(`tag:${tag}`, size);
  }
  if (conf.kind === 'search') {
    const q = conf.query || '';
    return searchWords(q, size);
  }
  return getRandomWords(size);
}

// -----------------------------
// Env & Supabase init (Vite)
// -----------------------------
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? "";
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? ""; // your Render server origin for images

if (!SUPABASE_ANON_KEY) {
  console.warn(`[card-utils] VITE_SUPABASE_ANON_KEY not set. Set it in your .env for Vite (VITE_SUPABASE_ANON_KEY=<key>).
Note: anon key is safe for client-side use when RLS is enabled.`);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------
// Helpers
// -----------------------------
async function handleResult<T>(res: { data: T | null; error: any }): Promise<T> {
  if (res.error) {
    const err = new Error(res.error.message || String(res.error));
    (err as any).original = res.error;
    throw err;
  }
  return res.data as T;
}

// -----------------------------
// Image helper (use your Render server)
// -----------------------------
export function getImageUrl(card: { id: string }): string {
  // If API_BASE is empty we'll fall back to a relative path (useful for same-origin setups)
  const base = API_BASE || "";
  // keep same format you already use
  return `${base}/Images/${card.id}.webp`;
}

// -----------------------------
// Main DB functions (client-side Supabase + RLS)
// -----------------------------

export async function fetchAllWords(): Promise<ChineseWord[]> {
  const res = await supabase.from<ChineseWord>("chinese_words").select("*");
  return handleResult(res as any);
}

export async function fetchWordById(id: string): Promise<ChineseWord | null> {
  const res = await supabase.from<ChineseWord>("chinese_words").select("*").eq("id", id).maybeSingle();
  if ((res as any).error) throw (res as any).error;
  return (res as any).data as ChineseWord | null;
}

export async function fetchWordsByHSK(hskLevel: number, limit = 500): Promise<ChineseWord[]> {
  const res = await supabase
    .from<ChineseWord>("chinese_words")
    .select("*")
    .eq("hsk_level", hskLevel)
    .limit(limit);
  return handleResult(res as any);
}

export async function searchWords(q: string, limit = 50): Promise<ChineseWord[]> {
  if (!q || q.trim().length === 0) return [];
  const pattern = `%${q.trim()}%`;

  const [bySimplified, byTraditional, byPinyin] = await Promise.all([
    supabase.from<ChineseWord>("chinese_words").select("*").ilike("simplified", pattern).limit(limit),
    supabase.from<ChineseWord>("chinese_words").select("*").ilike("traditional", pattern).limit(limit),
    supabase.from<ChineseWord>("chinese_words").select("*").ilike("pinyin", pattern).limit(limit),
  ] as any);

  const map = new Map<string, ChineseWord>();
  for (const set of [bySimplified, byTraditional, byPinyin]) {
    if (set.error) continue;
    (set.data || []).forEach((w: ChineseWord) => map.set(w.id, w));
  }
  return Array.from(map.values()).slice(0, limit);
}

export async function getRandomWords(count = 10): Promise<ChineseWord[]> {
  try {
    const res = await supabase.from<ChineseWord>("chinese_words").select("*").order("random()", { ascending: false }).limit(count);
    return handleResult(res as any);
  } catch (err) {
    console.warn("random() ordering failed, falling back to client-side selection", err);
    const res2 = await supabase.from<ChineseWord>("chinese_words").select("*").limit(1000);
    const all = (res2 as any).data || [];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, Math.min(count, all.length));
  }
}

/**
 * openPack: simple client-side pack generator that queries DB then samples.
 * Keep this client-side only when packs are user-specific or derived solely from public/allowed rows.
 */
export async function openPack(packType: string, size = 10): Promise<ChineseWord[]> {
  if (!packType || packType === "random") return getRandomWords(size);

  if (packType.startsWith("hsk:")) {
    const levelStr = packType.split(":")[1];
    const levels = levelStr.split(",").map((s) => parseInt(s, 10)).filter(Boolean);
    if (levels.length === 0) return getRandomWords(size);
    const { data, error } = await supabase.from<ChineseWord>("chinese_words").select("*").in("hsk_level", levels).limit(500);
    if (error) throw error;
    const pool = (data || []) as ChineseWord[];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(size, pool.length));
  }

  if (packType.startsWith("tag:")) {
    const tag = packType.split(":")[1];
    const { data, error } = await supabase.from<ChineseWord>("chinese_words").select("*").cs("tags", [tag]).limit(500);
    if (error) throw error;
    const pool = (data || []) as ChineseWord[];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(size, pool.length));
  }

  const results = await searchWords(packType, Math.max(10, size));
  return results.slice(0, size);
}

const LOCAL_COLLECTION_KEY = "local_card_collection_v1";


/**
* Load the user's saved collection from localStorage.
* Returns an array of ChineseWord (empty array when nothing saved or on error).
*/
export function loadCollectionFromLocalStorage(): ChineseWord[] {
try {
const raw = localStorage.getItem(LOCAL_COLLECTION_KEY);
if (!raw) return [];
const parsed = JSON.parse(raw);
if (!Array.isArray(parsed)) return [];
return parsed as ChineseWord[];
} catch (err) {
console.warn("[card-utils] Failed to load local collection:", err);
return [];
}
}


function saveCollectionToLocalStorage(collection: ChineseWord[]) {
try {
localStorage.setItem(LOCAL_COLLECTION_KEY, JSON.stringify(collection));
} catch (err) {
console.warn("[card-utils] Failed to save local collection:", err);
}
}


/**
* Add a card to the local collection (no duplicates by id). Returns the updated collection.
*/
export function addCardToLocalCollection(card: ChineseWord): ChineseWord[] {
const coll = loadCollectionFromLocalStorage();
if (coll.find((c) => c.id === card.id)) return coll; // already present
const next = coll.concat(card);
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