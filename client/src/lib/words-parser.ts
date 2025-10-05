export interface WordData {
  id: string;
  pinyin: string;
  chinese: string;
  translation: string;
  fullDefinition?: string;
  frequency?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export function parseWordsLine(line: string): WordData | null {
  const parts = line.split("|");
  
  if (parts.length < 6) return null;
  
  const id = parts[0].trim();
  const chinese = parts[2].trim();
  const pinyin = parts[3].trim();
  const translation = parts[4].trim();
  const fullDefinition = parts[5].trim();
  const frequency = parseInt(parts[10]) || 0;
  
  if (!id || !chinese || !pinyin || !translation) return null;
  
  // Assign rarity based on frequency
  let rarity: "common" | "rare" | "epic" | "legendary" = "common";
  if (frequency > 50000000) rarity = "legendary";
  else if (frequency > 10000000) rarity = "epic";
  else if (frequency > 1000000) rarity = "rare";
  
  return {
    id,
    chinese,
    pinyin,
    translation,
    fullDefinition,
    frequency,
    rarity
  };
}

export function parseWordsFile(content: string): WordData[] {
  const lines = content.split("\n").filter(line => line.trim() && !line.startsWith("000000"));
  const words: WordData[] = [];
  
  for (const line of lines) {
    const word = parseWordsLine(line);
    if (word) {
      words.push(word);
    }
  }
  
  return words;
}
