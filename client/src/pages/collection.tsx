import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ChineseWord } from "@shared/schema";
import Navigation from "@/components/navigation";
import Card from "@/components/card";
import { NewCardModal as CardModal } from "@/components/new-card-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid, List, Search } from "lucide-react";
import { loadCollectionFromLocalStorage } from "@/lib/card-utils";

export default function Collection() {
  const [collection] = useState(loadCollectionFromLocalStorage());
  const [searchQuery, setSearchQuery] = useState("");
  const [hskFilter, setHskFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCard, setSelectedCard] = useState<ChineseWord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query to get all available words for stats
  const { data: allWords = [] } = useQuery<ChineseWord[]>({
    queryKey: ["/api/words"],
  });

  // Process collection data
  const uniqueCards = collection.reduce((acc: any[], item: any) => {
    const existing = acc.find(c => c.word?.id === item.word?.id);
    if (!existing) acc.push(item);
    return acc;
  }, []);
  const combinedCards = useMemo(() => {
    return allWords.map((word) => {
      //const unlocked = uniqueCards.some((item: any) => item.word?.id === word.id);
      const unlocked = true;
      return { word, unlocked };
    });
  }, [allWords, uniqueCards]);
  // Calculate stats
  const stats = useMemo(() => {
    // Count owned cards by HSK level
    const ownedByHSK: Record<string, number> = {};
    uniqueCards.forEach((item: any) => {
      const level = item.word?.hsklevel || "Unknown";
      ownedByHSK[level] = (ownedByHSK[level] || 0) + 1;
    });

    // Count total available cards by HSK level
    const totalByHSK: Record<string, number> = {};
    allWords.forEach((word: any) => {
      const level = word.hsklevel || "Unknown";
      totalByHSK[level] = (totalByHSK[level] || 0) + 1;
    });

    return { ownedByHSK, totalByHSK };
  }, [uniqueCards, allWords]);

  const filteredCards = useMemo(() => {
    let filtered = combinedCards.filter(({ word }) => {
      if (!word) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !word.pinyin.toLowerCase().includes(query) &&
          !word.chinese.toLowerCase().includes(query) &&
          !word.translation.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // HSK filter
      if (hskFilter && hskFilter !== "all" && String(word.hsklevel) !== hskFilter) {
        return false;
      }

      // ✅ Theme filter
      if (themeFilter && themeFilter !== "all" && word.theme !== themeFilter) {
        return false;
      }

      return true;
    });

    // Sorting logic (unchanged) …
    filtered.sort((a, b) => { /* ... */ });

    return filtered;
  }, [combinedCards, searchQuery, hskFilter, themeFilter, sortBy]);

  // All unique theme values from the loaded words
  const allThemes = useMemo(() => {
    const themes = new Set<string>();
    allWords.forEach((word) => {
      if (word.theme) themes.add(word.theme);
    });
    return Array.from(themes).sort(); // optional sort
  }, [allWords]);

  const handleCardClick = (card: ChineseWord) => {
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
                {allThemes.map(theme => (
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
            
            {/* View Toggle */}
            {/* <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                className="flex-1"
                data-testid="grid-view-btn"
              >
                <Grid className="mr-2 h-4 w-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className="flex-1"
                data-testid="list-view-btn"
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
            </div> */}
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
            <Button onClick={() => window.location.href = "/"} data-testid="open-packs-btn">
              Open Card Packs
            </Button>
          </div>
        )}

        {/* Card Grid/List */}
        {/* {uniqueCards.length > 0 && (
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
                  onClick={() => unlocked && handleCardClick(word)} // only clickable if unlocked
                  className={viewMode === "list" ? "flex-row max-w-none" : ""}
                />
                {!unlocked && (
                  <div className="absolute inset-0 bg-black/90 rounded-2xl flex items-center justify-center">
                    <img 
                      src="/api/images/Locked.png" 
                      alt="Locked" 
                      className="w-16 h-16 opacity-80" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}*/}
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
                  onClick={() => unlocked && handleCardClick(word)} // only clickable if unlocked
                  className={viewMode === "list" ? "flex-row max-w-none" : ""}
                />
                {!unlocked && (
                  <div className="absolute inset-0 bg-black/90 rounded-2xl flex items-center justify-center">
                    <img
                      src="/api/images/Locked.png"
                      alt="Locked"
                      className="w-16 h-16 opacity-80"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More - For future pagination */}
        {filteredCards.length > 0 && filteredCards.length < uniqueCards.length && (
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              data-testid="load-more-btn"
            >
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
          setSelectedCard(newCard);
        }}
        allCards={allWords}
      />
    </div>
  );
}
