import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import TrainingArea from "@/components/training-area";
import { loadCollectionFromLocalStorage, fetchAllWords } from "@/lib/card-utils";
import type { ChineseWord } from "@/lib/card-utils";

export default function Training() {
  const [collection] = useState(loadCollectionFromLocalStorage());

  const {
      data: allWords = [],
      isLoading,
      isError,
      refetch,
    } = useQuery<ChineseWord[]>({
      queryKey: ["words"],
      queryFn: fetchAllWords,
      // Keep previous data while refetching to avoid UI flashes
      keepPreviousData: true,
      // stale time short so manual refresh is meaningful in dev; tune as needed
      staleTime: 1000 * 60,
    });

  // Get unique unlocked cards from collection
  const uniqueCards = collection.reduce<ChineseWord[]>((acc, item) => {
      if (!acc.find((c) => c.Id === item.Id)) acc.push(item);
      return acc;
    }, []);

  // Get all unlocked words from the collection
  const unlockedWords = uniqueCards
    .map((item: any) => item.word)
    .filter(Boolean) as ChineseWord[];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation cardCount={uniqueCards.length} totalCards={allWords.length} />
      
      <TrainingArea unlockedCards={unlockedWords} />
    </div>
  );
}