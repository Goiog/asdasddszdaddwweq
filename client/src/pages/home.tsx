import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChineseWord } from "@shared/schema";
import Navigation from "@/components/navigation";
import PackOpening from "@/components/pack-opening";
import { loadCollectionFromLocalStorage, addCardToLocalCollection } from "@/lib/card-utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const [collection, setCollection] = useState(loadCollectionFromLocalStorage());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get all available words
  const { data: allWords = [], isLoading } = useQuery<ChineseWord[]>({
    queryKey: ["/api/words"],
  });

  // Mutation to initialize words from palabras.txt
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/words/initialize", {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initialize words");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Words Initialized",
        description: `Loaded ${data.words.length} Chinese words successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize words",
        variant: "destructive",
      });
    },
  });

  const handlePackOpened = (cards: ChineseWord[]) => {
    // Add cards to local collection
    let updatedCollection = collection;
    cards.forEach(card => {
      updatedCollection = addCardToLocalCollection(card);
    });
    setCollection(updatedCollection);
  };

  // Auto-initialize words if none exist
  useEffect(() => {
    if (!isLoading && allWords.length === 0) {
      initializeMutation.mutate();
    }
  }, [isLoading, allWords.length]);

  const uniqueCards = collection.reduce((acc: any[], item: any) => {
    const existing = acc.find(c => c.word?.id === item.word?.id);
    if (!existing) acc.push(item);
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        cardCount={uniqueCards.length} 
        totalCards={allWords.length} 
      />
      
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
              disabled={initializeMutation.isPending}
              className="w-full"
              data-testid="initialize-words-btn"
            >
              {initializeMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Chinese Words"
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Pack Opening Interface */}
      {allWords.length > 0 && (
        <PackOpening 
          onPackOpened={handlePackOpened} 
          uniqueCards={uniqueCards}
        />
      )}
    </div>
  );
}
