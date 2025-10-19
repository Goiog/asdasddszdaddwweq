import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChineseWord } from "@/lib/card-utils";
import Navigation from "@/components/navigation";
import PackOpening from "@/components/pack-opening";
import {
  getUserUnlockedCards,
  unlockCard,
  allCards,
} from "@/lib/card-utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Home() {

  const {
    data: collection = [],
    isLoading: isCollectionLoading,
    refetch: refetchCollection,
  } = useQuery<ChineseWord[]>({
    queryKey: ["userUnlockedCards"],
    queryFn: getUserUnlockedCards,
    staleTime: 1000 * 60 * 5, // cache for 5 min
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: allWords = [],
    isLoading,
    isError,
    refetch: refetchAllWords,
  } = useQuery<ChineseWord[]>({
    queryKey: ["words"],
    queryFn: allCards,
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  function usePackHandler() {
    const queryClient = useQueryClient();

    const handlePackOpened = async (cards: ChineseWord[]) => {
      if (!cards || cards.length === 0) return;
      if (cards.length > 5) cards = cards.slice(0, 5);

      try {
        // 1️⃣ Unlock the new cards on the backend
        await Promise.all(cards.map((c) => unlockCard(c.Id)));

        // 2️⃣ Option A — let React Query automatically refetch:
        await queryClient.invalidateQueries({ queryKey: ["userUnlockedCards"] });

        toast({ title: "Success!", description: "Cards unlocked!" });
      } catch (err) {
        console.error("Error unlocking cards", err);
        toast({ title: "Error", description: "Failed to unlock cards." });
      }
    };

    return { handlePackOpened };
  }
  const { handlePackOpened } = usePackHandler();
  // dedupe by id
  const uniqueCards = collection.reduce<ChineseWord[]>((acc, item) => {
    if (!acc.find((c) => c.Id === item.Id)) acc.push(item);
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation cardCount={uniqueCards.length} totalCards={allWords?.length} />

      {/* If no words, show message and a manual refresh button that re-queries Supabase */}
      {!isLoading && allWords.length === 0 && (
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">No cards found</h2>
            <p className="text-muted-foreground mb-6">
              It looks like your Supabase table is empty or unreachable. Your front-end now reads directly
              from Supabase using the client in <code>card-utils</code>.
            </p>

            <Button
              onClick={async () => {
                try {
                  await refetchAllWords();
                  toast({
                    title: "Refetched",
                    description: "Tried to reload words from Supabase.",
                  });
                  // invalidate to be safe
                  queryClient.invalidateQueries({ queryKey: ["words"] });
                } catch (err) {
                  toast({
                    title: "Error",
                    description:
                      err instanceof Error ? err.message : "Failed to fetch words",
                    variant: "destructive",
                  });
                }
              }}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh words from Supabase
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              If this keeps happening, confirm your environment variables are set:
              <br />
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
            </p>

            {isError && (
              <p className="text-destructive text-sm mt-2">
                Failed to fetch words — check console/network and Supabase credentials.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pack Opening Interface */}
      {allWords.length > 0 && (
        <PackOpening onPackOpened={handlePackOpened} uniqueCards={uniqueCards} />
      )}
    </div>
  );
}
