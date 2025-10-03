import { type User, type InsertUser, type ChineseWord, type InsertChineseWord, type UserCard, type InsertUserCard, type PackOpening, type InsertPackOpening } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chinese word methods
  getAllWords(): Promise<ChineseWord[]>;
  getWordById(id: string): Promise<ChineseWord | undefined>;
  createWord(word: InsertChineseWord): Promise<ChineseWord>;
  createManyWords(words: InsertChineseWord[]): Promise<ChineseWord[]>;
  clearAllWords(): Promise<void>;
  
  // User card methods
  getUserCards(userId: string): Promise<UserCard[]>;
  addUserCard(userCard: InsertUserCard): Promise<UserCard>;
  getUserCardByCardId(userId: string, cardId: string): Promise<UserCard | undefined>;
  
  // Pack opening methods
  createPackOpening(packOpening: InsertPackOpening): Promise<PackOpening>;
  getUserPackOpenings(userId: string): Promise<PackOpening[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chineseWords: Map<string, ChineseWord>;
  private userCards: Map<string, UserCard>;
  private packOpenings: Map<string, PackOpening>;

  constructor() {
    this.users = new Map();
    this.chineseWords = new Map();
    this.userCards = new Map();
    this.packOpenings = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllWords(): Promise<ChineseWord[]> {
    return Array.from(this.chineseWords.values());
  }

  async getWordById(id: string): Promise<ChineseWord | undefined> {
    return this.chineseWords.get(id);
  }

  async createWord(word: InsertChineseWord): Promise<ChineseWord> {
    const chineseWord: ChineseWord = { 
      ...word,
      firstChar: word.firstChar || null,
      secondChar: word.secondChar || null,
      thirdChar: word.thirdChar || null,
      hsklevel: word.hsklevel || null,
      imagedefinition: word.imagedefinition || null,
      explanation: word.explanation || null,
      fullDefinition: word.fullDefinition || null,
      frequency: word.frequency || null,
      rarity: word.rarity || "common"
    };
    this.chineseWords.set(word.id, chineseWord);
    return chineseWord;
  }

  async createManyWords(words: InsertChineseWord[]): Promise<ChineseWord[]> {
    const createdWords: ChineseWord[] = [];
    for (const word of words) {
      const created = await this.createWord(word);
      createdWords.push(created);
    }
    return createdWords;
  }

  // Method to clear all words (useful for re-initialization)
  async clearAllWords(): Promise<void> {
    this.chineseWords.clear();
  }

  async getUserCards(userId: string): Promise<UserCard[]> {
    return Array.from(this.userCards.values()).filter(
      (card) => card.userId === userId,
    );
  }

  async addUserCard(userCard: InsertUserCard): Promise<UserCard> {
    const id = randomUUID();
    const card: UserCard = { 
      ...userCard,
      userId: userCard.userId || null,
      cardId: userCard.cardId || null,
      id, 
      obtainedAt: new Date(),
      count: userCard.count || 1 
    };
    this.userCards.set(id, card);
    return card;
  }

  async getUserCardByCardId(userId: string, cardId: string): Promise<UserCard | undefined> {
    return Array.from(this.userCards.values()).find(
      (card) => card.userId === userId && card.cardId === cardId,
    );
  }

  async createPackOpening(packOpening: InsertPackOpening): Promise<PackOpening> {
    const id = randomUUID();
    const opening: PackOpening = { 
      ...packOpening,
      userId: packOpening.userId || null,
      cardsObtained: packOpening.cardsObtained || null,
      id, 
      openedAt: new Date() 
    };
    this.packOpenings.set(id, opening);
    return opening;
  }

  async getUserPackOpenings(userId: string): Promise<PackOpening[]> {
    return Array.from(this.packOpenings.values()).filter(
      (opening) => opening.userId === userId,
    );
  }
}

export const storage = new MemStorage();
