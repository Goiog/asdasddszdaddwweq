import { useState, useEffect} from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import TrainingArea from "@/components/training-area";
import { getUserUnlockedCards, allCards } from "@/lib/card-utils";
import type { ChineseWord } from "@/lib/card-utils";

export default function Training() {
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

  // Get all unlocked words from the collection
  const unlockedWords = uniqueCards
    .map((item: any) => item.word)
    .filter(Boolean) as ChineseWord[];

  return (
    <div className="min-h-screen bg-background">
      <Navigation cardCount={uniqueCards.length} totalCards={allWords.length} />
      
      <TrainingArea unlockedCards={unlockedWords} />
    </div>
  );
}