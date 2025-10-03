import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import TrainingArea from "@/components/training-area";
import { loadCollectionFromLocalStorage } from "@/lib/card-utils";
import type { ChineseWord } from "@shared/schema";

export default function Training() {
  const [collection] = useState(loadCollectionFromLocalStorage());

  // Query to get all available words
  const { data: allWords = [] } = useQuery<ChineseWord[]>({
    queryKey: ["/api/words"],
  });

  // Get unique unlocked cards from collection
  const uniqueCards = collection.reduce((acc: any[], item: any) => {
    const existing = acc.find(c => c.word?.id === item.word?.id);
    if (!existing) acc.push(item);
    return acc;
  }, []);

  // Get all unlocked words from the collection
  const unlockedWords = uniqueCards
    .map((item: any) => item.word)
    .filter(Boolean) as ChineseWord[];

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        cardCount={uniqueCards.length} 
        totalCards={allWords.length} 
      />
      
      <TrainingArea unlockedCards={unlockedWords} />
    </div>
  );
}