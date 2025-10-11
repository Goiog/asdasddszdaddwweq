// collection.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Card from "@/components/card";
import { NewCardModal as CardModal } from "@/components/new-card-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid, List, Search } from "lucide-react";
import {
  loadCollectionFromLocalStorage,
  fetchAllWords,
  type ChineseWord as RawChineseWordFromLib,
  API_BASE,
} from "@/lib/card-utils";
import type { ChineseWord } from "@/types/chinese-word"; // import your type file or adjust path

// Defensive normalizer: accept many possible DB shapes and return ChineseWord
function normalizeRowToChineseWord(raw: any): ChineseWord {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      Chinese: null,
      Pinyin: "",
      Translation: "",
      HSK: null,
      Frequency: null,
      Theme: null,
      Image: null,
      Examples: null,
      Meaning: null,
      unlocked: false,
      isNew: false,
    };
  }

  const numericId = raw?.Id ?? raw?.id ?? raw?.cardId ?? raw?.ID ?? undefined;
  const idStr = numericId != null ? String(numericId) : (raw?.id ? String(raw.id) : "");

  const chinese = raw?.Chinese ?? raw?.chinese ?? raw?.hanzi ?? null;
  const pinyin = raw?.Pinyin ?? raw?.pinyin ?? raw?.py ?? "";
  const translation = raw?.Translation ?? raw?.translation ?? raw?.Meaning ?? raw?.meaning ?? "";
  const hsk = raw?.HSK ?? raw?.hsk ?? raw?.hsklevel ?? null;
  const freq = raw?.Frequency != null ? Number(raw.Frequency) : null;
  const theme = raw?.Theme ?? raw?.theme ?? null;

  return {
    id: String(idStr ?? ""),
    Id: Number.isFinite(Number(numericId)) ? Number(numericId) : undefined,
    Chinese: chinese ?? null,
    Pinyin: pinyin ?? "",
    Translation: translation ?? "",
    HSK: hsk ?? null,
    Frequency: Number.isFinite(freq as number) ? (freq as number) : null,
    Theme: theme ?? null,
    Image: raw?.Image ?? raw?.image ?? null,
    Examples: raw?.Examples ?? raw?.examples ?? null,
    Meaning: raw?.Meaning ?? raw?.meaning ?? null,
    unlocked: Boolean(raw?.unlocked ?? false),
    isNew: Boolean(raw?.isNew ?? false),
  };
}

export default function Collection() {
  // collection in localStorage may contain older shapes; normalize on load to ChineseWord
  const [collection] = useState<RawChineseWordFromLib[] | any[]>(() => {
    const raw = loadCollectionFromLocalStorage();
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => normalizeRowToChineseWord(r));
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [hskFilter, setHskFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCard, setSelectedCard] = useState<ChineseWord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // fetch rows and normalize immediately into ChineseWord[]
  const { data: allWordsRaw = [], isLoading } = useQuery<any[]>({
    queryKey: ["words"],
    queryFn: async () => {
      const rows = await fetchAllWords();
      return rows ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const allWords: ChineseWord[] = useMemo(() => {
    return (allWordsRaw ?? []).map((r: any) => normalizeRowToChineseWord(r));
  }, [allWordsRaw]);

  // Deduplicate collection (collection now contains ChineseWord items normalized already)
  const uniqueCards = useMemo(() => {
    const seen = new Set<string>();
    const out: ChineseWord[] = [];
    for (const item of collection) {
      const row = normalizeRowToChineseWord(item);
      if (!row.id) continue;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
    }
    return out;
  }, [collection]);

  // Combine DB words with owned/unlocked flag
  const combinedCards = useMemo(() => {
    const ownedIds = new Set(uniqueCards.map((c) => String(c.id)));
    return allWords.map((word) => ({
      word,
      unlocked: ownedIds.has(String(word.id)),
    }));
  }, [allWords, uniqueCards]);

  // Stats
  const stats = useMemo(() => {
    const ownedByHSK: Record<string, number> = {};
    uniqueCards.forEach((w) => {
      const level = String(w.HSK ?? "Unknown");
      ownedByHSK[level] = (ownedByHSK[level] || 0) + 1;
    });

    const totalByHSK: Record<string, number> = {};
    allWords.forEach((w) => {
      const level = String(w.HSK ?? "Unknown");
      totalByHSK[level] = (totalByHSK[level] || 0) + 1;
    });

    return { ownedByHSK, totalByHSK };
  }, [uniqueCards, allWords]);

  // Themes
  const allThemes = useMemo(() => {
    const set = new Set<string>();
    allWords.forEach((w) => {
      if (w.Theme) set.add(w.Theme);
    });
    return Array.from(set).sort();
  }, [allWords]);

  // Filtering + sorting (use ChineseWord fields)
  const filteredCards = useMemo(() => {
    let filtered = combinedCards.filter(({ word }) => {
      if (!word) return false;

      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const pinyin = (word.Pinyin ?? "").toLowerCase();
        const chinese = (word.Chinese ?? "").toLowerCase();
        const translation = (word.Translation ?? "").toLowerCase();
        if (!pinyin.includes(q) && !chinese.includes(q) && !translation.includes(q)) {
          return false;
        }
      }

      if (hskFilter && hskFilter !== "all" && String(word.HSK ?? "Unknown") !== hskFilter) {
        return false;
      }

      if (themeFilter && themeFilter !== "all" && (word.Theme ?? "") !== themeFilter) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const wa = a.word;
      const wb = b.word;

      switch (sortBy) {
        case "pinyin": {
          return (wa.Pinyin ?? "").localeCompare(wb.Pinyin ?? "");
        }
        case "chinese": {
          return (wa.Chinese ?? "").localeCompare(wb.Chinese ?? "");
        }
        case "recent": {
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
        }
        case "id":
        default: {
          const ai = Number(wa.id) || 0;
          const bi = Number(wb.id) || 0;
          return ai - bi;
        }
      }
    });

    return filtered;
  }, [combinedCards, searchQuery, hskFilter, themeFilter, sortBy]);

  const handleCardClick = (card: ChineseWord) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const progressPercentage = allWords.length > 0 ? (uniqueCards.length / allWords.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation cardCount={uniqueCards.length} totalCards={allWords.length} />

      <div className="container mx-auto px-4 py-8">
        {/* header, stats, filters same as before (omitted here for brevity) */}
        {/* ... */}

        {/* Card Grid/List */}
        {filteredCards.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 justify-items-center"
                : "space-y-4"
            }
            data-testid="card-collection"
          >
            {filteredCards.map(({ word, unlocked }) => {
              // Now `word` is already ChineseWord — pass directly to Card which expects ChineseWord
              return (
                <div key={word.id} className="relative">
                  <Card card={word} size="l" onClick={() => unlocked && handleCardClick(word)} className={viewMode === "list" ? "flex-row max-w-none" : ""} />
                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/90 rounded-xl flex items-center justify-center">
                      <img src={`${API_BASE}/Images/Locked.png`} alt="Locked" className="w-16 h-16 opacity-80" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Modal - pass ChineseWord directly */}
      <CardModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCard(null);
        }}
        onCardChange={(newCard) => {
          // newCard is ChineseWord — update selected card in the same shape
          setSelectedCard(newCard ?? null);
        }}
        allCards={allWords}
      />
    </div>
  );
}
