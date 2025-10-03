import { type ChineseWord } from "@shared/schema";


export interface PackConfig {
  count: number;
  hskLevel: string;
  title: string;
  description: string;
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

export function getImageUrl(card: { id: string}): string {
  return `/api/images/${card.id}.webp`;
}

export function saveCollectionToLocalStorage(cards: any[]) {
  localStorage.setItem("chineseCards_collection", JSON.stringify(cards));
}

export function loadCollectionFromLocalStorage(): any[] {
  const saved = localStorage.getItem("chineseCards_collection");
  return saved ? JSON.parse(saved) : [];
}

export function addCardToLocalCollection(card: ChineseWord) {
  const collection = loadCollectionFromLocalStorage();
  const existing = collection.find((c: any) => c.word?.id === card.id);
  
  if (existing) {
    existing.count = (existing.count || 1) + 1;
  } else {
    collection.push({
      id: Math.random().toString(36),
      userId: "guest",
      cardId: card.id,
      count: 1,
      obtainedAt: new Date().toISOString(),
      word: card
    });
  }
  
  saveCollectionToLocalStorage(collection);
  return collection;
}
