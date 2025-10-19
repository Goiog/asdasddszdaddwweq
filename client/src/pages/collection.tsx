import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Card from "@/components/card";
import { NewCardModal as CardModal } from "@/components/new-card-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProgressHSKPanel } from "@/components/ProgressHSKPanel"; // adjust path
import { Grid, Hash, Palette, ArrowUpDown, LockOpen, Lock, Trophy } from "lucide-react";
import {
  ChineseWord, getUserUnlockedCards,allCards
} from "@/lib/card-utils";
import { SearchBar } from "@/components/SearchBar";
import PaginationBar from "@/components/PaginationBar";
import { ProgressRing , ProgressToggleButton} from "@/components/ProgressRingButton";


export default function CollectionPage(): JSX.Element {
  // Load local collection (normalized)


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
  const [isProgressOpen, setIsProgressOpen] = useState<boolean>(false);
  
  // Pagination state (new)
  const PAGE_SIZE = 12;
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);


  // Reset page to 1 when filters or search changes so user doesn't land on an empty page
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, hskFilter, themeFilter, sortBy, showOnlyUnlocked, searchMode]);

  // Fetch all words from remote source and normalize
  const {
    data: allWords = [],
    isLoading: isAllWordsLoading,
  } = useQuery<ChineseWord[]>({
    queryKey: ["words"],
    queryFn: allCards,
    staleTime: 1000 * 60 * 5,
  });


  // Deduplicate local collection
  const {
    data: uniqueCards = [],
    isLoading: isCollectionLoading,
    refetch: refetchCollection,
  } = useQuery<ChineseWord[]>({
    queryKey: ["userUnlockedCards"],
    queryFn: getUserUnlockedCards,
    staleTime: 1000 * 60 * 5, // cache 5 minutes
  });

  // Combine DB words with owned flag
  const combinedCards = useMemo(() => {
    const ownedIds = new Set(uniqueCards.map((c) => String(c.Id)));
    return allWords.map((word) => ({
      word,
      unlocked: ownedIds.has(String(word.Id)),
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
          return (Number(wa.Id) || 0) - (Number(wb.Id) || 0);
      }
    });

    return filtered;
  }, [
    combinedCards,
    debouncedQuery,
    hskFilter,
    themeFilter,
    sortBy,
    showOnlyUnlocked,
    searchMode
  ]);

  // Pagination calculations (new)
  const totalItems = filteredCards.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  // ensure current page is within bounds
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const visibleCards = filteredCards.slice(startIndex, endIndex);

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
        {/* Filters */}
        <section className="bg-card border border-border rounded-2xl p-4 mb-8 relative">
          

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 items-center">
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
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
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

            {/* Unlocked Only Checkbox (kept in its place) */}
            <div className="flex items-center gap-2">
              {/*<LockOpen className="h-4 w-4 text-muted-foreground" />
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
              </label> */}
            </div>
             {/* Trophy toggle button — stays on the right */}

            <ProgressToggleButton
              isOpen={isProgressOpen}
              onToggle={() => setIsProgressOpen((s) => !s)}
              progressPercentage={progressPercentage}
              uniqueCards={uniqueCards}
              allWords={allWords}
              stats={stats}
            />
          </div>
        </section>

        {/* Progression Bar */}
        {/* Note: margin-bottom is reduced when folded to bring cards grid closer */}
        <div
          className={
            "flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 " +
            (isProgressOpen ? "mb-8" : "mb-2")
          }
        >
          <div
            id="progression-panel"
            className={
              "w-full flex items-center gap-3 overflow-hidden transition-all duration-300 " +
              (isProgressOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")
            }
            aria-hidden={!isProgressOpen}
          >
            <ProgressHSKPanel
              progressPercentage={progressPercentage}
              uniqueCards={uniqueCards}
              allWords={allWords}
              stats={stats}
            />
          </div>
        </div>

        {/* Loading skeleton */}
        {isAllWordsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6 h-40" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isAllWordsLoading && filteredCards.length === 0 && (
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

        {/* Cards grid / list with pagination */}
        {!isAllWordsLoading && filteredCards.length > 0 && (
          <section aria-live="polite">
            {/* Top pagination bar */}
            <PaginationBar
              page={page}
              setPage={setPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />

            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 justify-items-center" : "space-y-4"}>
              {visibleCards.map(({ word, unlocked }) => (
                <div key={word.Id} className="relative">
                  <Card card={word} size={viewMode === "grid" ? "l" : "m"} onClick={() => handleCardClick(word, unlocked)} className={`${viewMode === "list" ? "flex-row w-full" : ""} ${!unlocked ? "filter: blur" : ""}`} />

                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white opacity-80 " />
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
