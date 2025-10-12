import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Card from "@/components/card";
import { NewCardModal as CardModal } from "@/components/new-card-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import{ ProgressHSKPanel} from "@/components/ProgressHSKPanel"; // adjust path
import { Grid, Hash, Palette, ArrowUpDown , LockOpen , Lock} from "lucide-react";
import {
  loadCollectionFromLocalStorage,
  fetchAllWords,
  ChineseWord
} from "@/lib/card-utils";
import { SearchBar } from "@/components/SearchBar";
import { Checkbox } from "@/components/ui/checkbox";
// Improved Collection page:
// - clearer responsive layout inspired by GitHub (clean header, dense cards on wide screens)
// - accessible progress bar, aria labels, keyboard-friendly controls
// - debounced search to reduce re-renders
// - skeleton while loading
// - consistent normalization and types

function normalizeRowToChineseWord(raw: any): ChineseWord {
  if (!raw || typeof raw !== "object") return {
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

  const numericId = raw?.Id ?? raw?.id ?? raw?.cardId ?? raw?.ID ?? undefined;
  const idStr = numericId != null ? String(numericId) : (raw?.id ? String(raw.id) : "");

  return {
    id: String(idStr ?? ""),
    Id: Number.isFinite(Number(numericId)) ? Number(numericId) : undefined,
    Chinese: raw?.Chinese ?? raw?.chinese ?? raw?.hanzi ?? null,
    Pinyin: raw?.Pinyin ?? raw?.pinyin ?? raw?.py ?? "",
    Translation: raw?.Translation ?? raw?.translation ?? raw?.Meaning ?? raw?.meaning ?? "",
    HSK: raw?.HSK ?? raw?.hsk ?? raw?.hsklevel ?? null,
    Frequency: raw?.Frequency != null ? Number(raw.Frequency) : null,
    Theme: raw?.Theme ?? raw?.theme ?? null,
    Image: raw?.Image ?? raw?.image ?? null,
    Examples: raw?.Examples ?? raw?.examples ?? null,
    Meaning: raw?.Meaning ?? raw?.meaning ?? null,
    unlocked: Boolean(raw?.unlocked ?? false),
    isNew: Boolean(raw?.isNew ?? false),
  };
}

export default function CollectionPage(): JSX.Element {
  // Load local collection (normalized)
  const [collection] = useState<ChineseWord[] | any[]>(() => {
    const raw = loadCollectionFromLocalStorage();
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => normalizeRowToChineseWord(r));
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [hskFilter, setHskFilter] = useState<string | "all">("all");
  const [themeFilter, setThemeFilter] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCard, setSelectedCard] = useState<ChineseWord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"hanzi" | "pinyin" | "translation">("hanzi")
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);


  // Debounce search (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch all words from remote source and normalize
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

  // Deduplicate local collection
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

  // Combine DB words with owned flag
  const combinedCards = useMemo(() => {
    const ownedIds = new Set(uniqueCards.map((c) => String(c.id)));
    return allWords.map((word) => ({ word, unlocked: ownedIds.has(String(word.id)) }));
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

  // Collect themes
  const allThemes = useMemo(() => {
    const set = new Set<string>();
    allWords.forEach((w) => {
      if (w.Theme) set.add(w.Theme);
    });
    return Array.from(set).sort();
  }, [allWords]);

  // Filter + sort logic
  const filteredCards = useMemo(() => {
    let filtered = combinedCards.filter(({ word, unlocked }) => {
      if (!word) return false;

      if (debouncedQuery) {
        const q = debouncedQuery.toLowerCase();
        if (searchMode === "hanzi") {
          if (!(word.Chinese ?? "").toLowerCase().includes(q)) return false;
        } else if (searchMode === "pinyin") {
          if (!(word.Pinyin ?? "").toLowerCase().includes(q)) return false;
        } else if (searchMode === "translation") {
          if (!(word.Translation ?? "").toLowerCase().includes(q)) return false;
        }
      }

      if (hskFilter && hskFilter !== "all" && String(word.HSK ?? "Unknown") !== hskFilter) return false;
      if (themeFilter && themeFilter !== "all" && (word.Theme ?? "") !== themeFilter) return false;
      if (showOnlyUnlocked && !unlocked) return false;

      return true;
    });

    filtered.sort((a, b) => {
      const wa = a.word;
      const wb = b.word;
      switch (sortBy) {
        case "pinyin":
          return (wa.Pinyin ?? "").localeCompare(wb.Pinyin ?? "");
        case "chinese":
          return (wa.Chinese ?? "").localeCompare(wb.Chinese ?? "");
        case "recent":
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          return 0;
        case "id":
        default:
          return (Number(wa.id) || 0) - (Number(wb.id) || 0);
      }
    });

    return filtered;
  }, [
    combinedCards,
    debouncedQuery,
    hskFilter,
    themeFilter,
    sortBy,
    showOnlyUnlocked,   // ✅ ADD THIS
    searchMode          // (optional but recommended)
  ]);

  const handleCardClick = (card: ChineseWord, unlocked: boolean) => {
    if (!unlocked) return;
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const progressPercentage = allWords.length > 0 ? (uniqueCards.length / allWords.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation cardCount={uniqueCards.length} totalCards={allWords.length} />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          {/*<div>
            <h1 className="text-3xl font-bold leading-tight">My Collection</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse, filter and review your Chinese vocabulary cards.</p>
          </div>*/}
          <div className="w-full flex items-center gap-3">
           {/*  <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} title="Grid view">
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} title="List view">
                <List className="h-4 w-4" />
              </Button>
            </div>*/}
            
            <ProgressHSKPanel
              progressPercentage={progressPercentage}
              uniqueCards={uniqueCards}
              allWords={allWords}
              stats={stats}
            />

          </div>
        </div>

        {/* Filters */}
        <section className="bg-card border border-border rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
            {/* Search */}
            <div className="col-span-1 md:col-span-2">
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
              />
            </div>

            {/* HSK Filter */}
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <Select value={hskFilter} onValueChange={(v: string) => setHskFilter(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="HSK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All HSK Levels</SelectItem>
                  <SelectItem value="1">HSK 1</SelectItem>
                  <SelectItem value="2">HSK 2</SelectItem>
                  <SelectItem value="3">HSK 3</SelectItem>
                  <SelectItem value="4">HSK 4</SelectItem>
                  <SelectItem value="5">HSK 5</SelectItem>
                  <SelectItem value="6">HSK 6</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme Filter */}
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Select value={themeFilter} onValueChange={(v: string) => setThemeFilter(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  {allThemes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v: string) => setSortBy(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">By ID</SelectItem>
                  <SelectItem value="pinyin">By Pinyin</SelectItem>
                  <SelectItem value="chinese">By Chinese</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Unlocked Only Checkbox */}
            <div className="flex items-center gap-2">
              <LockOpen className="h-4 w-4 text-muted-foreground" />
              <Checkbox
                id="unlockedOnly"
                checked={showOnlyUnlocked}
                onCheckedChange={(checked) => setShowOnlyUnlocked(Boolean(checked))}
              />
              <label
                htmlFor="unlockedOnly"
                className="text-sm text-muted-foreground select-none cursor-pointer"
              >
                Unlocked only
              </label>
            </div>
          </div>
        </section>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6 h-40" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredCards.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🃏</div>
            <h3 className="text-2xl font-bold mb-2">No cards found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting filters or open new packs to add cards to your collection.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => (window.location.href = "/")}>Open packs</Button>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setHskFilter("all"); setThemeFilter("all"); setSortBy("id"); }}>Reset filters</Button>
            </div>
          </div>
        )}

        {/* Cards grid / list */}
        {!isLoading && filteredCards.length > 0 && (
          <section aria-live="polite">
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 justify-items-center" : "space-y-4"}>
              {filteredCards.map(({ word, unlocked }) => (
                <div key={word.id} className="relative">
                  <Card card={word} size={viewMode === "grid" ? "l" : "m"} onClick={() => handleCardClick(word, unlocked)} className={viewMode === "list" ? "flex-row w-full" : ""} />

                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white opacity-80" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        

      </main>

      {/* Modal */}
      <CardModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedCard(null); }}
        onCardChange={(newCard) => setSelectedCard(newCard ?? null)}
        allCards={allWords}
      />
    </div>
  );
}
