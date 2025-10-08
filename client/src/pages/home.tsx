import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChineseWord } from "@shared/schema";
import Navigation from "@/components/navigation";
import PackOpening from "@/components/pack-opening";
import {
  loadCollectionFromLocalStorage,
  addCardToLocalCollection,
} from "@/lib/card-utils";
import { fetchAllWords } from "@/lib/card-utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const [collection, setCollection] = useState<ChineseWord[]>(
    loadCollectionFromLocalStorage()
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get all available words (uses client-side Supabase via card-utils)
  const {
    data: allWords = [],
    isLoading,
    isError,
  } = useQuery<ChineseWord[]>({
    queryKey: ["words"],
    queryFn: fetchAllWords,
    // optional: keep previous data while refetching
    keepPreviousData: true,
  });

  // Mutation to initialize words from server (server still handles CSV -> DB migration)
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/words/initialize", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to initialize words");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // data might be { words: [...] } or an array — handle both
      const count =
        (data && (data.words?.length ?? (Array.isArray(data) ? data.length : 0))) ||
        0;

      toast({
        title: "Words Initialized",
        description: `Loaded ${count} Chinese words successfully!`,
      });

      // invalidate the supabase-backed query so fetchAllWords runs again
      queryClient.invalidateQueries({ queryKey: ["words"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to initialize words",
        variant: "destructive",
      });
    },
  });

  const handlePackOpened = (cards: ChineseWord[]) => {
    // Add cards to local collection (addCardToLocalCollection persists to localStorage)
    cards.forEach((card) => addCardToLocalCollection(card));
    // reload collection from storage and set state (keeps shape consistent)
    setCollection(loadCollectionFromLocalStorage());
  };

  // Auto-initialize words if none exist
  useEffect(() => {
    if (!isLoading && allWords.length === 0 && !initializeMutation.isLoading) {
      initializeMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, allWords.length]);

  // Deduplicate collection by card.id (collection stores ChineseWord objects)
  const uniqueCards = collection.reduce<ChineseWord[]>((acc, item) => {
    if (!acc.find((c) => c.id === item.id)) acc.push(item);
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation cardCount={uniqueCards.length} totalCards={allWords.length} />

      {/* Show initialization button if no words loaded */}
      {!isLoading && allWords.length === 0 && (
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Initialize Card Database</h2>
            <p className="text-muted-foreground mb-6">
              Load Chinese words from the database to start playing!
            </p>
            <Button
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isLoading}
              className="w-full"
              data-testid="initialize-words-btn"
            >
              {initializeMutation.isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Chinese Words"
              )}
            </Button>
            {isError && (
              <p className="text-destructive text-sm mt-2">
                Failed to fetch words — check console/network.
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
