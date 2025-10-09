import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChineseWord } from "@/lib/card-utils";
import { createSupabaseClient, TABLE_NAME } from "@/lib/card-utils"; // <-- new import
import Card from "./card";
import { NewCardModal as CardModal } from "./new-card-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Exercises from "./exercises";
import RecognitionRecallExercise from "./recognition-recall-exercise"; // ✅ import at top

interface PackOpeningProps {
  onPackOpened: (cards: (ChineseWord & { unlocked?: boolean; isNew?: boolean })[]) => void;
  uniqueCards?: any[]; // optional: pass the user's collection items (used to compute unlocked)
  userId?: string; // optional: defaults to "guest" when fetching collection
}

export const PACK_CONFIGS: Record<string, PackConfig> = {
  hsk1: {
    count: 6,
    hskLevel: "1",
    title: "HSK Level 1 Pack",
    description: "500 most basic Chinese words"
  },
  hsk2: {
    count: 6,
    hskLevel: "2",
    title: "HSK Level 2 Pack",
    description: "750 elementary Chinese words"
  },
  hsk3: {
    count: 6,
    hskLevel: "3",
    title: "HSK Level 3 Pack",
    description: "1000 intermediate Chinese words"
  },
  hsk4: {
    count: 6,
    hskLevel: "4",
    title: "HSK Level 4 Pack",
    description: "1000 upper-intermediate words"
  },
  hsk5: {
    count: 6,
    hskLevel: "5",
    title: "HSK Level 5 Pack",
    description: "1000 advanced Chinese words"
  },
  hsk6: {
    count: 6,
    hskLevel: "6",
    title: "HSK Level 6 Pack",
    description: "1100 fluent level words"
  }
};

export default function PackOpening({ onPackOpened, uniqueCards: uniqueCardsProp, userId = "guest" }: PackOpeningProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [openingProgress, setOpeningProgress] = useState(0);
  // allow unlocked flag and isNew flag on cards
  const [revealedCards, setRevealedCards] = useState<(ChineseWord & { unlocked?: boolean; isNew?: boolean })[]>([]);
  const [showCards, setShowCards] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ChineseWord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // local state to hold the uniqueCards (either from prop or fetched)
  const [collectionUnique, setCollectionUnique] = useState<any[]>(uniqueCardsProp ?? []);

  // Helper: create supabase client (uses envs configured in card-utils)
  const supabase = createSupabaseClient();

  // Helper functions for HSK styling (moved inside component)
  const getHSKGradient = (level: number): string => {
    const gradients = {
      1: "from-green-400 to-green-600",
      2: "from-blue-400 to-blue-600",
      3: "from-purple-400 to-purple-600",
      4: "from-orange-400 to-orange-600",
      5: "from-red-400 to-red-600",
      6: "from-yellow-400 to-amber-600"
    };
    return gradients[level as keyof typeof gradients] || "from-gray-400 to-gray-600";
  };

  const getHSKIcon = (level: number): string => {
    const icons = {
      1: "🌱", // Beginner
      2: "🌿", // Growing
      3: "🌸", // Blooming  
      4: "🌺", // Advanced blooming
      5: "🔥", // Fire/intensity
      6: "👑"  // Crown/mastery
    };
    return icons[level as keyof typeof icons] || "⭐";
  };

  // If parent provided uniqueCards prop, keep local in sync
  useEffect(() => {
    if (uniqueCardsProp) {
      setCollectionUnique(uniqueCardsProp);
    }
  }, [uniqueCardsProp]);

  // If no uniqueCards were passed in, try to fetch the user's collection once
  useEffect(() => {
    if (collectionUnique.length === 0 && !uniqueCardsProp) {
      (async () => {
        try {
          const res = await fetch(`/api/collection?userId=${encodeURIComponent(userId)}`);
          if (!res.ok) return;
          const d = await res.json();
          // assume d.uniqueCards or d.items - be tolerant
          const items = d.uniqueCards ?? d.items ?? d;
          if (Array.isArray(items)) {
            setCollectionUnique(items);
          }
        } catch (err) {
          // swallow errors silently; unlocking will default to false
          console.warn("Could not fetch collection for unlocks:", err);
        }
      })();
    }
    // only run on mount or when userId changes
  }, [userId, uniqueCardsProp, collectionUnique.length]);

  // predicate copied from collection.tsx snippet you provided:
  const isUnlocked = (word: any) => {
    return collectionUnique.some((item: any) => item.word?.id === word.id || item.id === word.id);
  };

  // whenever collectionUnique changes, recompute unlocked flag on revealed cards (preserve isNew)
  useEffect(() => {
    if (revealedCards.length > 0) {
      setRevealedCards(prev => prev.map(c => ({ ...c, unlocked: isUnlocked(c), isNew: c.isNew })));
    }
  }, [collectionUnique]); // eslint-disable-line react-hooks/exhaustive-deps

  // helper: pick N random unique items from array
  function pickRandom<T>(arr: T[], n: number) {
    const out: T[] = [];
    const copy = arr.slice();
    while (out.length < n && copy.length > 0) {
      const i = Math.floor(Math.random() * copy.length);
      out.push(...copy.splice(i, 1));
    }
    return out;
  }

  /**
   * Core DB logic:
   * - fetches candidate rows from the table (using supabase client)
   * - robustly detects an HSK-level field inside rows (tries several common names)
   * - filters by pack config's hskLevel, then picks `count` random cards
   *
   * This approach pulls the rows client-side and samples locally to avoid depending on
   * DB ordering functions; it's tolerant of different column names for the HSK level.
   */
  async function fetchCardsForPack(packType: string) {
    const config = PACK_CONFIGS[packType];
    if (!config) throw new Error("Unknown pack type: " + packType);

    // fetch rows from DB table
    const { data, error } = await supabase.from(TABLE_NAME).select("*").limit(1000); // limit to avoid huge fetches
    if (error) {
      throw error;
    }
    const rows: any[] = Array.isArray(data) ? data : [];

    // try to detect which property in the row represents the HSK level
    const hskFieldCandidates = ["hskLevel", "HSKLevel", "hsk_level", "hsk", "level", "HSK"];
    // find a candidate that appears in at least one row
    const detectedField = hskFieldCandidates.find(f => rows.some(r => r && Object.prototype.hasOwnProperty.call(r, f)));
    // fallback: use any property that contains "hsk" (case-insensitive)
    const fallbackField = Object.keys(rows[0] ?? {}).find(k => /hsk/i.test(k));

    const usedField = detectedField ?? fallbackField;

    // filter rows that match the requested HSK level
    const candidates = rows.filter(r => {
      if (!usedField) {
        // If we couldn't detect a field, be permissive and include everything
        return true;
      }
      const rawVal = r[usedField];
      if (rawVal === undefined || rawVal === null) return false;
      return String(rawVal) === String(config.hskLevel);
    });

    // if there are fewer candidates than requested, fall back to sampling from all rows
    const pool = candidates.length >= config.count ? candidates : rows;

    const sampled = pickRandom(pool, config.count);

    // Map sampled rows to the expected ChineseWord shape (best-effort)
    const normalized: ChineseWord[] = sampled.map((r: any) => {
      return {
        // Keep original row fields — your Card component probably expects fields like `id`, `Chinese`, `Pinyin`, `Translation`, etc.
        ...r,
      } as ChineseWord;
    });

    return normalized;
  }

  const openPack = async (packType: string) => {
    setIsOpening(true);
    setOpeningProgress(0);
    setRevealedCards([]);
    setShowCards(false);

    // progress simulation (will keep running until progress reaches 100 or cleared)
    let progressInterval: any = null;
    try {
      progressInterval = setInterval(() => {
        setOpeningProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // *** NEW: fetch the cards directly from the database (Supabase) ***
      const cardsFromDb = await fetchCardsForPack(packType);

      // Mark which cards are unlocked by checking collectionUnique, set isNew true
      const processedCards: (ChineseWord & { unlocked?: boolean; isNew?: boolean })[] = cardsFromDb.map((card: ChineseWord) => {
        const cardIsUnlocked = isUnlocked(card);
        return {
          ...card,
          unlocked: cardIsUnlocked,
          isNew: true,
        };
      });

      // ensure progress reaches 100 before revealing UI (gives animation time)
      setTimeout(() => {
        // clear interval and finalize progress
        if (progressInterval) clearInterval(progressInterval);
        setOpeningProgress(100);

        setRevealedCards(processedCards);
        setShowCards(true);

        toast({
          title: "Pack Opened!",
          description: `You received ${processedCards.length} cards.`,
        });
      }, 700); // small delay to let animation feel natural

    } catch (error) {
      console.error("Error opening pack:", error);
      if (progressInterval) clearInterval(progressInterval);

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open pack",
        variant: "destructive",
      });

      setIsOpening(false);
      setOpeningProgress(0);
    }
  };

  const resetPackOpening = () => {
    setIsOpening(false);
    setOpeningProgress(0);
    setRevealedCards([]);
    setShowCards(false);
    setShowExercises(false);
    setSelectedCard(null);
    setIsModalOpen(false);
  };

  const handleStartExercises = () => {
    setShowCards(false);
    setShowExercises(true);
  };

  const handleExercisesComplete = (cards: ChineseWord[]) => {
    // ensure we pass cards with unlocked flag and isNew flag
    const out = cards.map((c: any) => {
      const cardIsUnlocked = isUnlocked(c);
      return {
        ...c,
        unlocked: cardIsUnlocked,
        isNew: true // All cards from pack opening are considered obtained in this session
      };
    });
    setShowExercises(false);
    onPackOpened(out);
    toast({
      title: "Exercises Complete!",
      description: "Great job! Cards added to your collection.",
    });
  };

  const handleCardClick = (card: ChineseWord) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  // Show exercises if exercise mode is active
  if (showExercises) {
    return (
      <RecognitionRecallExercise
        cards={revealedCards}               // 👈 passes the (possibly unlocked) revealed cards
        onComplete={handleExercisesComplete}
        onBack={() => {
          setShowExercises(false);
          setShowCards(true);               // go back to cards view if user cancels
        }}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614732414444-096e5f1122d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')] bg-cover bg-center opacity-20"></div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="particle absolute w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ top: "20%", left: "10%", animationDelay: "0s" }}></div>
          <div className="particle absolute w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ top: "60%", left: "80%", animationDelay: "1s" }}></div>
          <div className="particle absolute w-3 h-3 bg-yellow-400 rounded-full animate-ping" style={{ top: "80%", left: "20%", animationDelay: "2s" }}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          {!isOpening ? (
            <>
              {/* Header */}
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text mb-4 text-[#ab917e]">
                  Open Card Packs
                </h2>
                <p className="text-xl text-muted-foreground">Discover new Chinese words and expand your vocabulary!</p>
              </div>

              {/* Pack Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {Object.entries(PACK_CONFIGS).map(([packType, config]) => {
                  const hskNum = parseInt(config.hskLevel);
                  const gradient = getHSKGradient(hskNum);
                  const icon = getHSKIcon(hskNum);
                  const price = hskNum <= 2 ? "Free" : `${hskNum * 50} Coins`;

                  return (
                    <PackCard
                      key={packType}
                      packType={packType}
                      title={config.title}
                      description={`${config.count} Cards • Level ${config.hskLevel}`}
                      details={config.description}
                      price={price}
                      gradient={gradient}
                      icon={icon}
                      className={hskNum >= 5 ? "animate-glow-pulse" : ""}
                      onClick={() => openPack(packType)}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <PackOpeningAnimation
              progress={openingProgress}
              cards={revealedCards}
              showCards={showCards}
              onContinue={resetPackOpening}
              onCardClick={handleCardClick}
              onStartExercises={handleStartExercises}
            />
          )}
        </div>
      </div>
      <CardModal 
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCardChange={(newCard) => {
          setSelectedCard(newCard);
        }}
        allCards={revealedCards}
      />
    </>
  );
}

interface PackCardProps {
  packType: string;
  title: string;
  description: string;
  details: string;
  price: string;
  gradient: string;
  icon: string;
  className?: string;
  onClick: () => void;
}

function PackCard({ packType, title, description, details, price, gradient, icon, className = "", onClick }: PackCardProps) {
  return (
    <motion.div
      className={`pack-container group cursor-pointer transform transition-all duration-300 hover:scale-105 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      data-testid={`pack-${packType}`}
    >
      <div className={`pack-unopened rounded-2xl p-8 text-center shadow-2xl border-2`}>
        <motion.div
          className={`w-24 h-32 mx-auto mb-6 bg-gradient-to-b ${gradient} rounded-xl shadow-lg relative`}
          whileHover={{ rotate: [0, -2, 2, 0] }}
          transition={{ duration: 0.5 }}
        >
          <div className={`absolute inset-2 bg-gradient-to-b ${gradient.replace("400", "300").replace("600", "500")} rounded-lg`}>
            <div className="flex items-center justify-center h-full">
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        </motion.div>
        <h3 className="text-2xl font-bold mb-2 text-[#b88888]">{title}</h3>
        <p className="mb-4 text-[#6e3b18]">{description}</p>
        <div className="bg-black/20 rounded-lg p-3 mb-4">
          <div className="text-sm text-[#ffffff]">Contains:</div>
          <div className="text-white font-semibold">{details}</div>
        </div>
        <Button 
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-colors"
          data-testid={`open-pack-${packType}`}
        >
          Open Pack - {price}
        </Button>
      </div>
    </motion.div>
  );
}

interface PackOpeningAnimationProps {
  progress: number;
  cards: ChineseWord[];
  showCards: boolean;
  onContinue: () => void;
  onCardClick: (card: ChineseWord) => void;
  onStartExercises: () => void;
}

function PackOpeningAnimation({ progress, cards, showCards, onContinue, onCardClick, onStartExercises }: PackOpeningAnimationProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [hasViewedAllCards, setHasViewedAllCards] = useState(false);
  const [viewMode, setViewMode] = useState<"individual" | "all">("individual");

  // Reset state when cards are revealed
  useEffect(() => {
    if (showCards && cards.length > 0) {
      setCurrentCardIndex(0);
      setHasViewedAllCards(cards.length === 1);
      setViewMode("individual");
    }
  }, [showCards, cards.length]);

  // Update hasViewedAllCards when currentCardIndex changes
  useEffect(() => {
    if (showCards && cards.length > 0 && viewMode === "individual") {
      setHasViewedAllCards(currentCardIndex === cards.length - 1);
    }
  }, [showCards, cards.length, currentCardIndex, viewMode]);

  const handlePrevCard = () => {
    setCurrentCardIndex(i => Math.max(0, i - 1));
  };

  const handleNextCard = () => {
    setCurrentCardIndex(i => Math.min(i + 1, cards.length - 1));
  };

  const handleViewAllCards = () => {
    setViewMode("all");
  };

  return (
    <div className="text-center" data-testid="pack-opening-animation">
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-white mb-4">
          {showCards ? "Your Cards" : "Opening Pack..."}
        </h3>
        {!showCards && (
          <div className="w-16 h-2 bg-secondary rounded-full mx-auto overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              data-testid="opening-progress"
            />
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {showCards && cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {viewMode === "individual" ? (
              <>
                {/* Card Progress Indicator */}
                <div className="text-white/70 text-sm mb-4">
                  Card {currentCardIndex + 1} of {cards.length}
                </div>

                {/* Single Card Display with Navigation */}
                <div className="relative flex items-center justify-center min-h-[400px]" data-testid="card-navigation">
                  {/* Left Navigation Area */}
                  <button
                    onClick={handlePrevCard}
                    disabled={currentCardIndex === 0}
                    className={`absolute left-0 top-0 h-full w-24 flex items-center justify-center z-10 transition-colors ${
                      currentCardIndex > 0 
                        ? "text-white/50 hover:text-white cursor-pointer" 
                        : "text-white/20 cursor-not-allowed"
                    }`}
                    data-testid="prev-card-btn"
                    aria-label="Previous card"
                  >
                    <div className="text-3xl">‹</div>
                  </button>

                  {/* Current Card */}
                  <div className="flex justify-center px-32" data-testid="current-card-container">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentCardIndex}
                        initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                        animate={{ opacity: 1, scale: 1.4, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                        transition={{ 
                          duration: 0.6,
                          type: "spring",
                          stiffness: 100
                        }}
                      >
                        <Card 
                          card={cards[currentCardIndex]} 
                          showAnimation
                          onClick={() => onCardClick(cards[currentCardIndex])}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Right Navigation Area */}
                  <button
                    onClick={handleNextCard}
                    disabled={currentCardIndex === cards.length - 1}
                    className={`absolute right-0 top-0 h-full w-24 flex items-center justify-center z-10 transition-colors ${
                      currentCardIndex < cards.length - 1 
                        ? "text-white/50 hover:text-white cursor-pointer" 
                        : "text-white/20 cursor-not-allowed"
                    }`}
                    data-testid="next-card-btn"
                    aria-label="Next card"
                  >
                    <div className="text-3xl">›</div>
                  </button>
                </div>

                {/* Navigation Instructions */}
                <div className="text-white/60 text-sm">
                  {currentCardIndex < cards.length - 1 ? (
                    "Click the right side to see the next card"
                  ) : (
                    "You've seen all cards!"
                  )}
                </div>
                
                {/* View All Cards Button - show after viewing all cards individually */}
                {hasViewedAllCards && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Button 
                      onClick={handleViewAllCards}
                      className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                      data-testid="view-all-cards-btn"
                    >
                      View All Cards Together
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                {/* All Cards Grid View */}
                <div className="text-white/70 text-sm mb-4">
                  All {cards.length} Cards
                </div>
                
                <div className="flex flex-wrap justify-center gap-10">
                  {cards.map((card, index) => (
                    <motion.div
                      key={`${card.id}-${index}`}
                      initial={{ opacity: 0, scale: 1, rotateY: 180 }}
                      animate={{ opacity: 1, scale: 1.1, rotateY: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        duration: 0.6,
                        type: "spring",
                        stiffness: 100
                      }}
                    >
                      <Card 
                        card={card} 
                        showAnimation 
                        onClick={() => onCardClick(card)}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Continue Button - show in all cards view */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: cards.length * 0.1 }}
                  className="text-center"
                >
                  <p className="text-muted-foreground mb-4">
                    Complete the exercises to master these cards and add them to your collection!
                  </p>
                  <Button 
                    onClick={onStartExercises}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    data-testid="start-exercises-btn"
                  >
                    🎯 Start Exercises
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
