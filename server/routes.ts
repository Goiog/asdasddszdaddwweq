import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChineseWordSchema, type ChineseWord } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static images
  app.use("/api/images", (req, res, next) => {
    // Remove leading slash from req.path to avoid double slash
    const fileName = req.path.startsWith('/') ? req.path.slice(1) : req.path;
    // Try both with and without leading space in filename
    const imagePath = path.join(process.cwd(), "server", "public", "Images", fileName);
    const imagePathWithSpace = path.join(process.cwd(), "server", "public", "Images", ` ${fileName}`);
    
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else if (fs.existsSync(imagePathWithSpace)) {
      res.sendFile(imagePathWithSpace);
    } else {
      // Send a default placeholder or 404
      res.status(404).json({ error: "Image not found" });
    }
  });

  // Initialize words from database.csv file
  app.post("/api/words/initialize", async (req, res) => {
    try {
      const csvPath = path.join(process.cwd(), "server", "public", "database.csv");
      
      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ error: "Database file not found" });
      }

      // Clear existing words first
      await storage.clearAllWords();
      
      const words: any[] = [];
      
      const fileContent = fs.readFileSync(csvPath, "utf-8");
      const lines = fileContent.split("\n").filter(line => line.trim());

      // Process CSV data (skip header if present, or process all lines)
      console.log(`Processing ${lines.length} lines from CSV`);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        if (lineIndex === 0) console.log(`Starting CSV parsing, first line: ${line.substring(0, 100)}...`);
        
        // Parse CSV line - handle quoted values with nested quotes properly
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
              // Escaped quote (double quote)
              current += '"';
              i += 2;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
              i++;
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            parts.push(current);
            current = '';
            i++;
          } else {
            current += char;
            i++;
          }
        }
        
        // Add the last field
        parts.push(current);

        // Accept rows with at least 5 essential fields (id, chinese, pinyin, translation, fullDefinition)
        if (parts.length >= 5) {
          if (lineIndex % 1000 === 0) {
            console.log(`Processing line ${lineIndex + 1}, parts: ${parts.length}`);
          }
          const id = parts[0]?.trim() || "";
          const chinese = parts[1]?.trim() || "";
          const pinyin = parts[2]?.trim() || "";
          const translation = parts[3]?.trim() || "";
          //const fullDefinition = parts[4]?.trim() || "";
         // const firstChar = parts[5]?.trim() || chinese;
         // const secondChar = parts[6]?.trim() || "";
         // const thirdChar = parts[7]?.trim() || "";
          const hsklevel = parts[4]?.trim() || "";
          const frequency = parts[5] ? Number(parts[5].trim()) : 0;
          const theme = parts[6]?.trim() || "";
          const imagedefinition = parts[7]?.trim() || "";
          const explanation = parts[8]?.trim() || "";
          const examples = parts[9]?.trim() || "";
          let rarity = "common";
          if (frequency > 50000000) rarity = "legendary";
          else if (frequency > 10000000) rarity = "epic";
          else if (frequency > 1000000) rarity = "rare";

          words.push({
            id,
            chinese,
            pinyin,
            translation,
            hsklevel,
            theme,
            imagedefinition,
            explanation,
            examples,
            frequency,
            rarity,
          });
        }
      }

      console.log(`Parsed ${words.length} words from CSV file`);

      const createdWords = await storage.createManyWords(words);
      res.json({ 
        message: `Initialized ${createdWords.length} words`,
        words: createdWords 
      });
    } catch (error) {
      console.error("Error initializing words:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : error);
      res.status(500).json({ error: "Failed to initialize words" });
    }
  });

  // Get all words
  app.get("/api/words", async (req, res) => {
    try {
      const words = await storage.getAllWords();
      res.json(words);
    } catch (error) {
      console.error("Error fetching words:", error);
      res.status(500).json({ error: "Failed to fetch words" });
    }
  });

  // Get word by ID
  app.get("/api/words/:id", async (req, res) => {
    try {
      const word = await storage.getWordById(req.params.id);
      if (!word) {
        return res.status(404).json({ error: "Word not found" });
      }
      res.json(word);
    } catch (error) {
      console.error("Error fetching word:", error);
      res.status(500).json({ error: "Failed to fetch word" });
    }
  });

  // Open a pack (simulate pack opening)
  // Open a pack (simulate pack opening)
  app.post("/api/packs/open", async (req, res) => {
    try {
      const { packType, userId = "guest" } = req.body;

      if (!["hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6"].includes(packType)) {
        return res.status(400).json({ error: "Invalid pack type" });
      }

      const allWords = await storage.getAllWords();
      if (allWords.length === 0) {
        return res.status(400).json({ error: "No words available. Please initialize words first." });
      }

      const packConfig = {
        hsk1: { count: 5, hskLevel: "1" },
        hsk2: { count: 5, hskLevel: "2" },
        hsk3: { count: 5, hskLevel: "3" },
        hsk4: { count: 5, hskLevel: "4" },
        hsk5: { count: 5, hskLevel: "5" },
        hsk6: { count: 5, hskLevel: "6" }
      };
      const config = packConfig[packType as keyof typeof packConfig];

      // words for HSK level
      const wordsOfLevel = allWords.filter(w => w.hsklevel === config.hskLevel);
      if (wordsOfLevel.length === 0) {
        return res.status(400).json({ error: `No HSK level ${config.hskLevel} words available` });
      }

      // build unlocked set BEFORE we add any new cards
      const userCards = await storage.getUserCards(userId);
      const unlockedIds = new Set(userCards.map((uc: any) => uc.cardId));

      // helper weighted selection (unchanged)
      const selectWeightedRandomCard = (cards: ChineseWord[]): ChineseWord => {
        const weights = cards.map(card => card.frequency || 1);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let randomValue = Math.random() * totalWeight;
        for (let i = 0; i < cards.length; i++) {
          randomValue -= weights[i];
          if (randomValue <= 0) return cards[i];
        }
        return cards[cards.length - 1];
      };
      const pickUnique = (pool: ChineseWord[]) => {
        if (!pool.length) return null;
        return selectWeightedRandomCard(pool);
      };

      const lockedCards = wordsOfLevel.filter(w => !unlockedIds.has(w.id));
      const obtainedCards: (ChineseWord & { isNew: boolean })[] = [];

      // STEP 1: pick up to 3 new cards (from locked)
      for (let i = 0; i < 3 && lockedCards.length > 0; i++) {
        const card = pickUnique(lockedCards);
        if (!card) break;
        obtainedCards.push({ ...card, isNew: true });
        lockedCards.splice(lockedCards.findIndex(c => c.id === card.id), 1);
      }

      // STEP 2: fill remaining slots (allow duplicates; mark isNew based on unlockedIds)
      while (obtainedCards.length < config.count) {
        const card = pickUnique(wordsOfLevel) as ChineseWord;
        if (!card) break;
        const isNew = !unlockedIds.has(card.id);
        obtainedCards.push({ ...card, isNew });
      }

      // --- CHANGE: only add to storage if card is true 'new' for that user ---
      for (const randomCard of obtainedCards) {
        if (randomCard.isNew) {
          await storage.addUserCard({
            userId,
            cardId: randomCard.id,
            count: 1
          });
        } else {
          // already owned — do not add a duplicate record
          // If you prefer incrementing a 'count' for duplicates instead of ignoring,
          // change this to call a storage function that increments the existing count.
        }
      }

      // Record pack opening
      await storage.createPackOpening({
        userId,
        packType,
        cardsObtained: obtainedCards.map(c => c.id)
      });

      res.json({
        packType,
        cards: obtainedCards,
        message: `Opened ${packType} pack successfully!`
      });
    } catch (error) {
      console.error("Error opening pack:", error);
      res.status(500).json({ error: "Failed to open pack" });
    }
  });

  // NEW: accept either /api/collection/:userId OR /api/collection?userId=...
  app.get("/api/collection", async (req, res) => {
    try {
      const userId = String(req.query.userId ?? "guest");
      const userCards = await storage.getUserCards(userId);

      const cardsWithDetails = await Promise.all(
        userCards.map(async (userCard) => {
          const word = await storage.getWordById(userCard.cardId!);
          return {
            ...userCard,
            word
          };
        })
      );

      res.json(cardsWithDetails);
    } catch (error) {
      console.error("Error fetching collection (query):", error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });



  // Get user's collection
  app.get("/api/collection/:userId", async (req, res) => {
    try {
      const userId = req.params.userId || "guest";
      const userCards = await storage.getUserCards(userId);
      
      const cardsWithDetails = await Promise.all(
        userCards.map(async (userCard) => {
          const word = await storage.getWordById(userCard.cardId!);
          return {
            ...userCard,
            word
          };
        })
      );

      res.json(cardsWithDetails);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  // Save disliked card ID to CSV
  app.post("/api/cards/dislike", async (req, res) => {
    try {
      const { cardId } = req.body;
      
      if (!cardId) {
        return res.status(400).json({ error: "Card ID is required" });
      }

      const csvPath = path.join(process.cwd(), "disliked_cards.csv");
      const timestamp = new Date().toISOString();
      const csvRow = `${cardId},${timestamp}\n`;

      // Create file with header if it doesn't exist
      if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, "cardId,timestamp\n");
      }

      // Append the new row
      fs.appendFileSync(csvPath, csvRow);

      res.json({ success: true, message: "Card disliked and saved" });
    } catch (error) {
      console.error("Error saving disliked card:", error);
      res.status(500).json({ error: "Failed to save disliked card" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
