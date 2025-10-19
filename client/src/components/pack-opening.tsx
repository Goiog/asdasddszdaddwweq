import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import type { ChineseWord} from "@/lib/card-utils";
import { allCards } from "@/lib/card-utils";
import Card from "@/components/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RecognitionRecallExercise from "./recognition-recall-exercise";
import CardWithDetails from "./CardWithDetails"; // adjust path if needed

interface PackOpeningProps {
  onPackOpened: (cards: (ChineseWord & { unlocked?: boolean; isNew?: boolean })[]) => void;
  uniqueCards?: any[];
  userId?: string;
}

export const PACK_CONFIGS: Record<string, PackConfig> = {
  hsk1: { count: 5, hskLevel: "1", title: "HSK 1", description: "Basic words" },
  hsk2: { count: 6, hskLevel: "2", title: "HSK 2", description: "Elementary" },
  hsk3: { count: 6, hskLevel: "3", title: "HSK 3", description: "Intermediate" },
  hsk4: { count: 6, hskLevel: "4", title: "HSK 4", description: "Upper-intermediate" },
  hsk5: { count: 6, hskLevel: "5", title: "HSK 5", description: "Advanced" },
  hsk6: { count: 6, hskLevel: "6", title: "HSK 6", description: "Fluent" },
};

export default function PackOpening({ onPackOpened, uniqueCards: uniqueCardsProp, userId = "guest" }: PackOpeningProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [openingProgress, setOpeningProgress] = useState(0);
  const [revealedCards, setRevealedCards] = useState<(ChineseWord & { unlocked?: boolean; isNew?: boolean })[]>([]);
  const [showCards, setShowCards] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ChineseWord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [collectionUnique, setCollectionUnique] = useState<any[]>(uniqueCardsProp ?? []);

  // small UI states
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  useEffect(() => { if (uniqueCardsProp) setCollectionUnique(uniqueCardsProp); }, [uniqueCardsProp]);

  useEffect(() => {
    if (collectionUnique.length === 0 && !uniqueCardsProp) {
      (async () => {
        try {
          const res = await fetch(`/api/collection?userId=${encodeURIComponent(userId)}`);
          if (!res.ok) return;
          const d = await res.json();
          const items = d.uniqueCards ?? d.items ?? d;
          if (Array.isArray(items)) setCollectionUnique(items);
        } catch (err) {
          console.warn("Could not fetch collection for unlocks:", err);
        }
      })();
    }
  }, [userId, uniqueCardsProp, collectionUnique.length]);

  const isUnlocked = (word: any) => collectionUnique.some((item: any) => item.word?.Id === word.Id || item.Id === word.Id);

  useEffect(() => {
    if (revealedCards.length > 0) {
      setRevealedCards(prev => prev.map(c => ({ ...c, unlocked: isUnlocked(c), isNew: c.isNew })));
    }
  }, [collectionUnique]);

  // --- keep the weighted sampling + fetch logic as-is (cleaned slightly) ---
  function weightedSampleWithoutReplacement<T>(arr: T[], n: number, weightAccessor: (item: T) => number) {
    const copy = arr.slice();
    const out: T[] = [];
    if (n >= copy.length) {
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, n);
    }
    for (let k = 0; k < n; k++) {
      const weights = copy.map(item => {
        const w = Number(weightAccessor(item) ?? 0);
        return isFinite(w) && w > 0 ? w : 0;
      });
      const sum = weights.reduce((s, a) => s + a, 0);
      if (sum <= 0) { out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]); continue; }
      let r = Math.random() * sum;
      let idx = 0, cum = 0;
      for (; idx < weights.length; idx++) {
        cum += weights[idx]; if (r < cum) break;
      }
      if (idx >= copy.length) idx = copy.length - 1;
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  async function fetchCardsForPack(packType: string) {
    const config = PACK_CONFIGS[packType];
    if (!config) throw new Error("Unknown pack type: " + packType);
    const rows = await allCards();
    const usedField = "HSK" as keyof ChineseWord;
    const candidates = rows.filter(r => {
      if (!usedField) return true;
      const rawVal = r[usedField];
      if (rawVal === undefined || rawVal === null) return false;
      return String(rawVal) === String(config.hskLevel);
    });
    const pool = candidates.length >= config.count ? candidates : rows;
    const sampled = weightedSampleWithoutReplacement(pool, config.count, (r: any) => {
      if (r.Frequency === null || r.Frequency === undefined) return 1;
      const num = Number(r.Frequency); return isFinite(r.Frequency) ? Math.max(0, r.Frequency) : 0;
    });
    return sampled as ChineseWord[];
  }

  const openPack = async (packType: string) => {
    setIsOpening(true); setOpeningProgress(0); setRevealedCards([]); setShowCards(false);
    let progressInterval: any = null;
    try {
      progressInterval = setInterval(() => setOpeningProgress(p => Math.min(100, p + 12)), 140);
      const cardsFromDb = await fetchCardsForPack(packType);
      const processedCards = cardsFromDb.map((card: ChineseWord) => ({ ...card, unlocked: isUnlocked(card), isNew: true }));
      // small animation delay
      setTimeout(() => {
        if (progressInterval) clearInterval(progressInterval);
        setOpeningProgress(100);
        setRevealedCards(processedCards);
        setShowCards(true);
        toast({ title: "Pack Opened", description: `You received ${processedCards.length} cards.` });
      }, 700);
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Error opening pack:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to open pack", variant: "destructive" });
      setIsOpening(false); setOpeningProgress(0);
    }
  };

  const resetPackOpening = () => {
    setIsOpening(false); setOpeningProgress(0); setRevealedCards([]); setShowCards(false); setShowExercises(false); setSelectedCard(null); setIsModalOpen(false);
  };

  const handleStartExercises = () => { setShowCards(false); setShowExercises(true); };
  const handleAddToCollection = (cards: ChineseWord[]) => {
    const out = cards.map((c: any) => ({
      ...c,
      unlocked: isUnlocked(c),
      isNew: true,
    }));

    onPackOpened(out);
    toast({
      title: "Exercises Complete",
      description: "Cards added to your collection.",
    });
  };

  const handleCardClick = (card: ChineseWord) => { setSelectedCard(card); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedCard(null); };



  function PackCardClean({ packType, title, description, details, onClick }: { packType: string; title: string; description: string; details: string; onClick: () => void; }) {
    return (
      <motion.div layout whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-md shadow-sm p-5 flex flex-col" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }} aria-label={`Open ${title}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-slate-700 font-medium text-lg">{title}</div>
            <div className="text-slate-500 text-sm mt-1">{description}</div>
          </div>
          <div className="text-sm text-slate-400">{details}</div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-600">Pack • {packType.toUpperCase()}</div>
          <Button onClick={(e)=>{ e.stopPropagation(); onClick(); }} className="px-3 py-1 rounded-md text-sm">Open</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-background text-slate-900">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar (filters) */}
          <aside className="lg:col-span-1 bg-white border border-slate-200 rounded-md p-4 sticky top-6 h-fit">
            <div className="text-sm font-semibold text-slate-700">Filters</div>
            <div className="mt-3 flex flex-col gap-2">
              <button className={`text-left px-3 py-2 rounded-md ${activeFilter === null ? 'bg-slate-100' : 'hover:bg-slate-50'}`} onClick={() => setActiveFilter(null)}>All Levels</button>
              {Object.entries(PACK_CONFIGS).map(([key, cfg]) => (
                <button key={key} className={`text-left px-3 py-2 rounded-md ${activeFilter === key ? 'bg-slate-100' : 'hover:bg-slate-50'}`} onClick={() => setActiveFilter(key)}>{cfg.title} • Level {cfg.hskLevel}</button>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-500">Tip: Open a pack to reveal cards, then start exercises to add them to your collection.</div>
          </aside>

          {/* Main content */}
          <section className="lg:col-span-3">
            {/* Intro */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Open Card Packs</h1>
                <p className="text-sm text-slate-500">Pick a pack to reveal new words. Design inspired by GitHub: clear hierarchy and compact spacing.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={resetPackOpening} className="hidden sm:inline-flex">Reset</Button>
              </div>
            </div>

            {/* Inside the <section className="lg:col-span-3"> … */}
            {!isOpening ? (
              // existing pack grid
              <div className={`${viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-2'}`}>
                {Object.entries(PACK_CONFIGS)
                  .filter(([k]) => (activeFilter ? activeFilter === k : true))
                  .map(([packType, config]) => (
                    <PackCardClean
                      key={packType}
                      packType={packType}
                      title={config.title}
                      description={`${config.count} cards`}
                      details={`HSK ${config.hskLevel}`}
                      onClick={() => openPack(packType)}
                    />
                  ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-md p-6">
                {!showExercises ? (
                  <PackOpeningAnimation
                    progress={openingProgress}
                    cards={revealedCards}
                    showCards={showCards}
                    onContinue={resetPackOpening}
                    onCardClick={handleCardClick}
                    onStartExercises={() => setShowExercises(true)}
                  />
                ) : (
                  <RecognitionRecallExercise
                    cards={revealedCards}
                    onAddToCollection={handleAddToCollection}   // ✅ renamed
                    onBack={() => setShowExercises(false)}        // ✅ stays the same
                  />
                )}

              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}

// --- Updated PackOpeningAnimation (supports "show all after last chevron") ---
function PackOpeningAnimation({ progress, cards, showCards, onContinue, onCardClick, onStartExercises }: PackOpeningAnimationProps) {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (showCards && cards.length) {
      setIndex(0);
      setShowAll(false);
    }
  }, [showCards, cards.length]);

  if (!showCards) {
    return (
      <div>
        <div className="mb-3 text-sm text-slate-600">Opening pack...</div>
        <div className="w-full bg-slate-100 rounded-md h-2 overflow-hidden">
          <motion.div style={{ width: `${progress}%` }} className="h-2 bg-slate-700" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  if (cards.length === 0) return <div className="text-sm text-slate-500">No cards found.</div>;

  // When showAll is true render all cards at once (grid)
  if (showAll) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">All cards</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
          {cards.map((card, i) => (
            <motion.div
              key={card.Id ?? i}
              layout
              whileHover={{ y: -4 }}
              className="bg-white rounded-sm cursor-pointer"
              onClick={() => {
                // find the index of the clicked card
                const i = cards.findIndex(c => c.Id === card.Id);
                if (i !== -1) {
                  setIndex(i);      // show that card
                  setShowAll(false); // exit "show all" mode
                }
              }}
            >
              <Card card={card} size="m" />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex justify-center items-center">
          <Button onClick={onStartExercises}>Start Exercises</Button>
        </div>
      </div>
    );
  }

  // Normal single-card view with chevrons
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">
          Card {index + 1} of {cards.length}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            className="p-2 rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>

          <button
            onClick={() => {
              if (index < cards.length - 1) {
                setIndex(i => Math.min(cards.length - 1, i + 1));
              } else {
                // If already at the last card, pressing the right chevron shows all cards together
                setShowAll(true);
              }
            }}
            className="p-2 rounded-full border border-slate-300 hover:bg-slate-100 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      <CardWithDetails
        cards={cards}
        index={index}
        onCardClick={onCardClick}
      />
    </div>
  );
}

// --- Type helpers ---
interface PackConfig { count: number; hskLevel: string; title: string; description: string; }
interface PackOpeningAnimationProps { progress: number; cards: ChineseWord[]; showCards: boolean; onContinue: () => void; onCardClick: (card: ChineseWord) => void; onStartExercises: () => void; }
