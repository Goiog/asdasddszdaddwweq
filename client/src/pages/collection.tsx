// collection.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ChineseWord as RawChineseWord } from "@shared/schema";
import Navigation from "@/components/navigation";
import Card from "@/components/card";
import { NewCardModal as CardModal } from "@/components/new-card-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid, List, Search } from "lucide-react";
import { loadCollectionFromLocalStorage, fetchAllWords } from "@/lib/card-utils";

/**
 * Normalized word shape used by this component (keeps fields the component expects)
 */
type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  translation: string;
  hsklevel: string;
  theme?: string | null;
  // keep the rest of the raw data if you need it later
  __raw?: any;
};

export default function Collection() {
  // Load local collection from localStorage (tolerate two formats):
  // - older: array of objects with .word property (e.g. { word: {...} })
  // - newer: array of plain word objects (e.g. {...})
  const [collection] = useState(() => {
    const raw = loadCollectionFromLocalStorage() as any[]; // whatever card-utils returns
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      if (item && (item as any).word) return item; // keep { word: ... } shape
      return { word: item }; // wrap plain word into { word }
    });
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [hskFilter, setHskFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCard, setSelectedCard] = useState<Word | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query Supabase via card-utils.fetchAllWords()
  const { data: allWordsRaw = [], isLoading } = useQuery<RawChineseWord[]>({
    queryKey: ["words"],
    queryFn: async () => {
      const rows = await fetchAllWords();
      return rows;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Normalize DB rows into the lowercase shape the component expects
  const allWords: Word[] = useMemo(() => {
    return (allWordsRaw ?? []).map((w: any) => {
      const id = w.id ?? (w.Id != null ? String(w.Id) : "");
      const chinese = (w.Chinese ?? w.chinese ?? "") as string;
      const pinyin = (w.Pinyin ?? w.pinyin ?? "") as string;
      const translation = (w.Translation ?? w.translation ?? "") as string;
      // Many older components used `hsklevel` (string). Normalize HSK into `hsklevel`
      const hsklevel = (w.HSK ?? w.hsk ?? w.hsklevel ?? "Unknown") as string;
      const theme = (w.Theme ?? w.theme ?? null) as string | null;

      return {
        id,
        chinese,
        pinyin,
        translation,
        hsklevel: String(hsklevel),
        theme,
        __raw: w,
      };
    });
  }, [allWordsRaw]);

  // Deduplicate collection items by word id
  const uniqueCards = useMemo(() => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const item of collection) {
      const word = item?.word;
      if (!word) continue;
      const id = (word.id ?? String(word.Id ?? "")) as string;
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ word: { 
        // make sure collection's word uses the same fields the rest of the component uses
        id,
        chinese: word.chinese ?? word.Chinese ?? "",
        pinyin: word.pinyin ?? word.Pinyin ?? "",
        translation: word.translation ?? word.Translation ?? "",
        hsklevel: word.hsklevel ?? word.HSK ?? word.hsk ?? "Unknown",
        theme: word.theme ?? word.Theme ?? null,
        __raw: word,
      }, raw: item });
    }
    return out;
  }, [collection]);

  // Combine allWords with unlocked flag (owned in collection)
  const combinedCards = useMemo(() => {
    const ownedIds = new Set(uniqueCards.map((c: any) => c.word.id));
    return allWords.map((word) => {
      const unlocked = ownedIds.has(word.id);
      return { word, unlocked };
    });
  }, [allWords, uniqueCards]);

  // Stats
  const stats = useMemo(() => {
    const ownedByHSK: Record<string, number> = {};
    uniqueCards.forEach((item: any) => {
      const level = String(item.word?.hsklevel ?? "Unknown");
      ownedByHSK[level] = (ownedByHSK[level] || 0) + 1;
    });

    const totalByHSK: Record<string, number> = {};
    allWords.forEach((word) => {
      const level = String(word.hsklevel ?? "Unknown");
      totalByHSK[level] = (totalByHSK[level] || 0) + 1;
    });

    return { ownedByHSK, totalByHSK };
  }, [uniqueCards, allWords]);

  // All unique themes
  const allThemes = useMemo(() => {
    const set = new Set<string>();
    allWords.forEach((w) => {
      if (w.theme) set.add(w.theme);
    });
    return Array.from(set).sort();
  }, [allWords]);

  // Filtering + sorting
  const filteredCards = useMemo(() => {
    let filtered = combinedCards.filter(({ word }) => {
      if (!word) return false;

      // Search
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const pinyin = (word.pinyin ?? "").toLowerCase();
        const chinese = (word.chinese ?? "").toLowerCase();
        const translation = (word.translation ?? "").toLowerCase();
        if (!pinyin.includes(q) && !chinese.includes(q) && !translation.includes(q)) {
          return false;
        }
      }

      // HSK filter
      if (hskFilter && hskFilter !== "all" && String(word.hsklevel) !== hskFilter) {
        return false;
      }

      // Theme filter
      if (themeFilter && themeFilter !== "all" && (word.theme ?? "") !== themeFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      const wa = a.word;
      const wb = b.word;

      switch (sortBy) {
        case "pinyin": {
          const A = (wa.pinyin ?? "").toString();
          const B = (wb.pinyin ?? "").toString();
          return A.localeCompare(B);
        }
        case "chinese": {
          const A = (wa.chinese ?? "").toString();
          const B = (wb.chinese ?? "").toString();
          return A.localeCompare(B);
        }
        case "recent": {
          // show unlocked (owned) items first, then by id descending
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          // fallthrough to id comparison
        }
        // default id sort (numeric if possible)
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

  const handleCardClick = (card: Word) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const progressPercentage = allWords.length > 0 ? (uniqueCards.length / allWords.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        cardCount={uniqueCards.length}
        totalCards={allWords.length}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Collection Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">My Collection</h2>
            <p className="text-muted-foreground">Browse and manage your Chinese vocabulary cards</p>
          </div>

          {/* Collection Stats by HSK Level */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Object.keys(stats.totalByHSK).map((level) => (
              <div
                key={level}
                className="bg-card border border-border rounded-lg p-4 text-center"
              >
                <div className="text-2xl font-bold text-primary">
                  {stats.ownedByHSK[level] || 0} / {stats.totalByHSK[level]}
                </div>
                <div className="text-sm text-muted-foreground">HSK {level}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>

            {/* HSK Level Filter */}
            <Select value={hskFilter} onValueChange={setHskFilter}>
              <SelectTrigger data-testid="hsk-filter">
                <SelectValue placeholder="All HSK Levels" />
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

            {/* Theme Filter */}
            <Select value={themeFilter} onValueChange={setThemeFilter}>
              <SelectTrigger data-testid="theme-filter">
                <SelectValue placeholder="All Themes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Themes</SelectItem>
                {allThemes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="sort-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Sort by ID</SelectItem>
                <SelectItem value="pinyin">Sort by Pinyin</SelectItem>
                <SelectItem value="chinese">Sort by Chinese</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Collection Progress</span>
            <span className="text-sm text-muted-foreground" data-testid="progress-percentage">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>

        {/* Empty State */}
        {uniqueCards.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🃏</div>
            <h3 className="text-2xl font-bold mb-2">No Cards Yet</h3>
            <p className="text-muted-foreground mb-6">
              Open some card packs to start building your collection!
            </p>
            <Button onClick={() => (window.location.href = "/")} data-testid="open-packs-btn">
              Open Card Packs
            </Button>
          </div>
        )}

        {/* Card Grid/List */}
        {filteredCards.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
                : "space-y-4"
            }
            data-testid="card-collection"
          >
            {filteredCards.map(({ word, unlocked }: any) => (
              <div key={word.id} className="relative">
                <Card
                  card={word}
                  onClick={() => unlocked && handleCardClick(word)}
                  className={viewMode === "list" ? "flex-row max-w-none" : ""}
                />
                {!unlocked && (
                  <div className="absolute inset-0 bg-black/90 rounded-2xl flex items-center justify-center">
                    <img src="/api/images/Locked.png" alt="Locked" className="w-16 h-16 opacity-80" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More - For future pagination */}
        {filteredCards.length > 0 && filteredCards.length < uniqueCards.length && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" data-testid="load-more-btn">
              Load More Cards
            </Button>
          </div>
        )}
      </div>

      {/* Card Modal */}
      <CardModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCard(null);
        }}
        onCardChange={(newCard) => {
          setSelectedCard(newCard as any);
        }}
        allCards={allWords}
      />
    </div>
  );
}
