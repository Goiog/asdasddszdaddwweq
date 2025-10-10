import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChineseWord } from "@/lib/card-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card as UICard } from "@/components/ui/card";
import { pinyinNumericToAccents } from "@/components/pinyinUtils";
import { CheckCircle, XCircle, BookOpen, Target } from "lucide-react";

interface ExerciseProps {
  cards: ChineseWord[];
  onComplete: (cards: ChineseWord[]) => void;
}

export default function Exercises({ cards, onComplete }: ExerciseProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<'pinyin' | 'translation'>('pinyin');
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [exerciseScore, setExerciseScore] = useState<{pinyin: number, translation: number}>({pinyin: 0, translation: 0});

  // Handle edge cases with useEffect to avoid render-time side effects
  useEffect(() => {
    if (!cards || cards.length === 0) {
      onComplete([]);
      return;
    }
    if (currentCardIndex >= cards.length) {
      console.error('Invalid card index:', currentCardIndex);
      onComplete(cards);
      return;
    }
  }, [cards, currentCardIndex, onComplete]);

  // Guard against empty cards array
  if (!cards || cards.length === 0) {
    return <div>Loading...</div>;
  }

  const currentCard = cards[currentCardIndex];
  const isLastCard = currentCardIndex === cards.length - 1;
  const isLastExerciseType = exerciseType === 'translation';

  // Guard against invalid card index
  if (!currentCard) {
    return <div>Loading...</div>;
  }

  // Generate wrong choices for multiple choice - memoized to prevent regeneration
  const choices = useMemo(() => {
    if (exerciseType !== 'translation') return [];
    
    const correctAnswer = currentCard.translation;
    const choices = [correctAnswer];
    const otherCards = cards.filter(card => card.id !== currentCard.id);
    
    // Add two random wrong answers
    const availableCards = [...otherCards];
    while (choices.length < 3 && availableCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const randomCard = availableCards[randomIndex];
      if (!choices.includes(randomCard.translation)) {
        choices.push(randomCard.translation);
      }
      availableCards.splice(randomIndex, 1);
    }
    
    // If we still don't have enough choices and the pack is very small, 
    // add placeholder choices to reach minimum of 3
    while (choices.length < 3) {
      choices.push(`Option ${choices.length}`);
    }
    
    // Proper seeded Fisher-Yates shuffle for deterministic but randomized order
    const seededShuffle = (array: string[], seed: string): string[] => {
      // Simple seeded PRNG (mulberry32)
      let seedNum = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        seedNum = ((seedNum << 5) - seedNum) + char;
        seedNum = seedNum & seedNum; // Convert to 32-bit integer
      }
      seedNum = Math.abs(seedNum);
      
      const seededRandom = () => {
        seedNum = (seedNum * 1664525 + 1013904223) % 4294967296;
        return seedNum / 4294967296;
      };

      // Fisher-Yates shuffle with seeded random
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };
    
    // Use card ID as seed for consistent but properly shuffled order
    const shuffleSeed = `${currentCard.id}-translation`;
    return seededShuffle(choices, shuffleSeed);
  }, [currentCard.id, currentCard.translation, exerciseType, cards]);

  // Helper function to normalize pinyin for comparison
  const normalizePinyin = (pinyin: string): string => {
    let normalized = pinyin.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Handle common ü variations before accent conversion
    normalized = normalized.replace(/u:/g, 'ü').replace(/v/g, 'ü');
    
    // If input contains tone numbers, convert to diacritical marks
    if (/\d/.test(normalized)) {
      normalized = pinyinNumericToAccents(normalized);
    }
    
    // Also normalize the diacritical form back to a consistent format
    // Remove apostrophes and normalize spaces
    return normalized.replace(/'/g, '').replace(/\s+/g, ' ').trim();
  };

  const checkAnswer = () => {
    let correct = false;
    
    if (exerciseType === 'pinyin') {
      const normalizedAnswer = normalizePinyin(userAnswer);
      const normalizedPinyin = normalizePinyin(currentCard.pinyin);
      correct = normalizedAnswer === normalizedPinyin;
    } else {
      correct = selectedChoice === currentCard.translation;
    }

    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setExerciseScore(prev => ({
        ...prev,
        [exerciseType]: prev[exerciseType] + 1
      }));
    }
  };

  const nextExercise = () => {
    setShowResult(false);
    setUserAnswer('');
    setSelectedChoice(null);

    if (exerciseType === 'pinyin') {
      // Move to translation exercise for the same card
      setExerciseType('translation');
    } else {
      // Move to next card with pinyin exercise
      if (isLastCard) {
        onComplete(cards);
        return;
      }
      setCurrentCardIndex(prev => prev + 1);
      setExerciseType('pinyin');
    }
  };

  const progress = ((currentCardIndex * 2 + (exerciseType === 'translation' ? 1 : 0)) / (cards.length * 2)) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-green-900/20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent mb-2">
            Card Exercises
          </h2>
          <p className="text-muted-foreground">Master your new cards!</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Card {currentCardIndex + 1} of {cards.length} • {exerciseType === 'pinyin' ? 'Pinyin' : 'Translation'} Exercise
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCardIndex}-${exerciseType}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <UICard className="p-8 shadow-2xl border-2 border-purple-500/30">
              {/* Exercise Icon */}
              <div className="text-center mb-6">
                {exerciseType === 'pinyin' ? (
                  <BookOpen className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                ) : (
                  <Target className="w-12 h-12 mx-auto text-green-500 mb-2" />
                )}
              </div>

              {/* Card Display */}
              <div className="text-center mb-8">
                <div className="text-6xl md:text-8xl font-chinese mb-4">
                  {currentCard.chinese}
                </div>
                <div className="text-lg text-muted-foreground">
                  HSK Level {currentCard.hsklevel}
                </div>
              </div>

              {!showResult ? (
                <>
                  {exerciseType === 'pinyin' ? (
                    <PinyinExercise 
                      userAnswer={userAnswer}
                      setUserAnswer={setUserAnswer}
                      onSubmit={checkAnswer}
                    />
                  ) : (
                    <TranslationExercise 
                      choices={choices}
                      selectedChoice={selectedChoice}
                      setSelectedChoice={setSelectedChoice}
                      onSubmit={checkAnswer}
                    />
                  )}
                </>
              ) : (
                <ExerciseResult 
                  isCorrect={isCorrect}
                  correctAnswer={exerciseType === 'pinyin' ? currentCard.pinyin : currentCard.translation}
                  userAnswer={exerciseType === 'pinyin' ? userAnswer : selectedChoice || ''}
                  onNext={nextExercise}
                  isLastExercise={isLastCard && isLastExerciseType}
                />
              )}
            </UICard>
          </motion.div>
        </AnimatePresence>

        {/* Score Display */}
        <div className="fixed bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
          <div className="text-sm font-semibold mb-1">Score</div>
          <div className="flex gap-4 text-xs">
            <span>Pinyin: {exerciseScore.pinyin}/{cards.length}</span>
            <span>Translation: {exerciseScore.translation}/{cards.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PinyinExerciseProps {
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  onSubmit: () => void;
}

function PinyinExercise({ userAnswer, setUserAnswer, onSubmit }: PinyinExerciseProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Type the Pinyin</h3>
        <p className="text-muted-foreground">Enter the correct pinyin pronunciation for this character</p>
      </div>
      
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Enter pinyin (e.g., ni3 hao3)"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="text-center text-lg"
          onKeyDown={(e) => e.key === 'Enter' && userAnswer.trim() && onSubmit()}
          data-testid="input-pinyin"
          autoFocus
        />
        
        <Button 
          onClick={onSubmit}
          disabled={!userAnswer.trim()}
          className="w-full"
          size="lg"
          data-testid="button-submit-pinyin"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  );
}

interface TranslationExerciseProps {
  choices: string[];
  selectedChoice: string | null;
  setSelectedChoice: (choice: string) => void;
  onSubmit: () => void;
}

function TranslationExercise({ choices, selectedChoice, setSelectedChoice, onSubmit }: TranslationExerciseProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Choose the Translation</h3>
        <p className="text-muted-foreground">Select the correct English translation</p>
      </div>
      
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <Button
            key={choice}
            variant={selectedChoice === choice ? "default" : "outline"}
            onClick={() => setSelectedChoice(choice)}
            className="w-full text-left justify-start h-auto p-4"
            data-testid={`choice-${index}`}
          >
            <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
            {choice}
          </Button>
        ))}
      </div>
      
      <Button 
        onClick={onSubmit}
        disabled={!selectedChoice}
        className="w-full"
        size="lg"
        data-testid="button-submit-translation"
      >
        Submit Answer
      </Button>
    </div>
  );
}

interface ExerciseResultProps {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  onNext: () => void;
  isLastExercise: boolean;
}

function ExerciseResult({ isCorrect, correctAnswer, userAnswer, onNext, isLastExercise }: ExerciseResultProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center space-y-6"
    >
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
        isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
      }`}>
        {isCorrect ? (
          <CheckCircle className="w-8 h-8 text-green-600" />
        ) : (
          <XCircle className="w-8 h-8 text-red-600" />
        )}
      </div>
      
      <div>
        <h3 className={`text-xl font-semibold mb-2 ${
          isCorrect ? 'text-green-600' : 'text-red-600'
        }`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </h3>
        
        {!isCorrect && (
          <div className="space-y-2">
            <p className="text-muted-foreground">Your answer: <span className="font-medium">{userAnswer}</span></p>
            <p className="text-muted-foreground">Correct answer: <span className="font-medium text-green-600">{correctAnswer}</span></p>
          </div>
        )}
      </div>
      
      <Button 
        onClick={onNext}
        className="w-full"
        size="lg"
        data-testid={isLastExercise ? "button-finish-exercises" : "button-next-exercise"}
      >
        {isLastExercise ? 'Finish Exercises' : 'Next Exercise'}
      </Button>
    </motion.div>
  );
}
