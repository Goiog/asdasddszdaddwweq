import { useState, useEffect, useMemo,useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChineseWord } from "@/lib/card-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card as UICard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pinyinNumericToAccents } from "@/components/pinyinUtils";
import Card from "@/components/card";
import { CheckCircle, XCircle, BookOpen, Target, Users } from "lucide-react";

interface RecognitionRecallExerciseProps {
  cards: ChineseWord[];
  onAddToCollection: (trainedCards: ChineseWord[]) => void; // renamed
  onBack: () => void;
}

type ExerciseData = 
  | { card: ChineseWord; type: 'pinyin_fill' }
  | { card: ChineseWord; type: 'translation_choice'; choices: string[] }
  | { card: ChineseWord; type: 'character_choice'; choices: ChineseWord[] };

type ExerciseType = 'pinyin_fill' | 'translation_choice' | 'character_choice';

export default function RecognitionRecallExercise({ 
  cards, 
  onAddToCollection, 
  onBack 
}: RecognitionRecallExerciseProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);

  // Generate exercises when component mounts
  // Generate exercises when component mounts
  useEffect(() => {
    if (cards.length > 0) {
      const exerciseData: ExerciseData[] = [];

      for (const card of cards) {
        // Shuffle exercise types and pick 2 distinct ones
        const types: ExerciseType[] = shuffleArray(['pinyin_fill', 'translation_choice', 'character_choice']);
        const selectedTypes = types.slice(0, 2);

        for (const type of selectedTypes) {
          if (type === 'pinyin_fill') {
            exerciseData.push({ card, type });
          } else if (type === 'translation_choice') {
            exerciseData.push({
              card,
              type,
              choices: generateTranslationChoices(card, cards)
            });
          } else {
            exerciseData.push({
              card,
              type,
              choices: generateCharacterChoices(card, cards)
            });
          }
        }
      }

      setExercises(shuffleArray(exerciseData));
    }
  }, [cards]);

  useEffect(() => {
    if (showFinalResults) {
      onAddToCollection(uniqueTrainedCards);
    }
  }, [showFinalResults]);

  // Generate translation choices from cards with similar themes/HSK levels
  const generateTranslationChoices = (targetCard: ChineseWord, allCards: ChineseWord[]): string[] => {
    const choices = [targetCard.Translation];
    
    // First try to find cards with same HSK level
    let candidateCards = allCards.filter(card => 
      card.id !== targetCard.id && card.HSK === targetCard.HSK
    );
    
    // If not enough, expand to adjacent HSK levels
    if (candidateCards.length < 2) {
      candidateCards = allCards.filter(card => 
        card.id !== targetCard.id && 
        Math.abs(Number(card.HSK || 1) - Number(targetCard.HSK || 1)) <= 1
      );
    }
    
    // If still not enough, use any other cards
    if (candidateCards.length < 2) {
      candidateCards = allCards.filter(card => card.id !== targetCard.id);
    }
    
    // Add unique translations until we have 3 total
    const shuffledCandidates = shuffleArray(candidateCards);
    for (const card of shuffledCandidates) {
      if (choices.length >= 3) break;
      if (!choices.includes(card.Translation)) {
        choices.push(card.Translation);
      }
    }
    
    // Only add placeholder if we absolutely can't find enough unique translations
    // This should rarely happen in a real dataset
    while (choices.length < 3) {
      choices.push(`Alternative meaning ${choices.length}`);
    }
    
    return shuffleArray(choices);
  };

  // Generate character choices with shared pinyin letters
  const generateCharacterChoices = (targetCard: ChineseWord, allCards: ChineseWord[]): ChineseWord[] => {
    const choices = [targetCard];
    const targetPinyin = targetCard.Pinyin.toLowerCase().replace(/\d/g, '');
    
    // Find cards with pinyin that shares at least 1 letter
    const similarPinyinCards = allCards.filter(card => {
      if (card.id === targetCard.id) return false;
      const cardPinyin = card.Pinyin.toLowerCase().replace(/\d/g, '');
      
      // Check if they share at least one letter
      for (let char of cardPinyin) {
        if (targetPinyin.includes(char) && char.match(/[a-z]/)) {
          return true;
        }
      }
      return false;
    });
    
    // Add two cards with shared letters
    while (choices.length < 3 && similarPinyinCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * similarPinyinCards.length);
      choices.push(similarPinyinCards[randomIndex]);
      similarPinyinCards.splice(randomIndex, 1);
    }
    
    // Fallback to any other cards if not enough
    while (choices.length < 3) {
      const otherCards = allCards.filter(card => !choices.find(c => c.id === card.id));
      if (otherCards.length > 0) {
        choices.push(otherCards[Math.floor(Math.random() * otherCards.length)]);
      } else {
        break;
      }
    }
    
    return shuffleArray(choices);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const currentExercise = exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

  if (!currentExercise || exercises.length === 0) {
    return <div>Loading exercises...</div>;
  }

  const checkAnswer = () => {
    let correct = false;
    
    switch (currentExercise.type) {
      case 'pinyin_fill':
        const normalizedAnswer = normalizePinyin(Array.isArray(userAnswer) ? userAnswer.join("") : userAnswer);
        const normalizedPinyin = normalizePinyin(currentExercise.card.Pinyin);
        correct = normalizedAnswer === normalizedPinyin;
        break;
      case 'translation_choice':
        correct = selectedChoice === currentExercise.card.Translation;
        break;
      case 'character_choice':
        correct = selectedChoice === currentExercise.card.id;
        break;
    }

    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextExercise = () => {
    setShowResult(false);
    setUserAnswer([]);
    setSelectedChoice(null);

    if (isLastExercise) {
      setShowFinalResults(true);
    } else {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const normalizePinyin = (pinyin: string): string => {
    let normalized = pinyin.toLowerCase().trim().replace(/\s+/g, ' ');
    normalized = normalized.replace(/u:/g, 'ü').replace(/v/g, 'ü');
    
    if (/\d/.test(normalized)) {
      normalized = pinyinNumericToAccents(normalized);
    }
    
    return normalized.replace(/'/g, '').replace(/\s+/g, ' ').trim();
  };

  const addToneToInput = (tone: string) => {
    const vowels = userAnswer.match(/[aeiouü]/g);
    if (!vowels) return;
    
    const lastVowel = vowels[vowels.length - 1];
    const toneMap: { [key: string]: { [key: string]: string } } = {
      'ā': { 'a': 'ā', 'e': 'ē', 'i': 'ī', 'o': 'ō', 'u': 'ū', 'ü': 'ǖ' },
      'á': { 'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú', 'ü': 'ǘ' },
      'ǎ': { 'a': 'ǎ', 'e': 'ě', 'i': 'ǐ', 'o': 'ǒ', 'u': 'ǔ', 'ü': 'ǚ' },
      'à': { 'a': 'à', 'e': 'è', 'i': 'ì', 'o': 'ò', 'u': 'ù', 'ü': 'ǜ' }
    };
    
    if (toneMap[tone] && toneMap[tone][lastVowel]) {
      const newAnswer = userAnswer.replace(new RegExp(lastVowel + '(?!.*' + lastVowel + ')'), toneMap[tone][lastVowel]);
      setUserAnswer(newAnswer);
    }
  };

  const getExerciseIcon = (type: ExerciseType) => {
    switch (type) {
      case 'pinyin_fill': return <BookOpen className="w-12 h-12 text-blue-500" />;
      case 'translation_choice': return <Target className="w-12 h-12 text-green-500" />;
      case 'character_choice': return <Users className="w-12 h-12 text-purple-500" />;
    }
  };

  const getExerciseTitle = (type: ExerciseType) => {
    switch (type) {
      case 'pinyin_fill': return 'Fill in the Pinyin';
      case 'translation_choice': return 'Choose the Translation';
      case 'character_choice': return 'Choose the Character';
    }
  };

  const getExerciseDescription = (type: ExerciseType) => {
    switch (type) {
      case 'pinyin_fill': return 'Type the correct pinyin pronunciation for this character';
      case 'translation_choice': return 'Select the correct English translation';
      case 'character_choice': return 'Select the correct character for this pinyin';
    }
  };
  const uniqueTrainedCards = Array.from(
    new Map(exercises.map(e => [e.card.id, e.card])).values()
  );
  
    // Automatically add cards to collection once final results appear
  

  if (showFinalResults) {
  // Automatically trigger adding cards to collection once final results are shown

  return (
    <div className="relative overflow-hidden rounded-xl p-6">
      <div className="absolute top-0 left-0 right-0 bottom-0 h-full w-full pointer-events-none" />
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-gray-700 mb-4">
            Exercise Complete!
          </h2>
          <p className="text-xl text-muted-foreground mb-2">
            Final Score: {score} / {exercises.length}
          </p>
        </motion.div>

        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-center mb-6">Cards Trained</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {uniqueTrainedCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  card={card}
                  onClick={() => {}}
                  className="transform hover:scale-105 transition-transform"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={onBack} size="lg">
            Back to Training
          </Button>
        </div> */}
      </div>
    </div>
  );
}


  return (
    <div className="relative overflow-hidden rounded-xl p-6">
      <div className="absolute inset-0 pointer-events-none" />
        <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
        {/* Score Display */}
          <div className="text-m text-gray-600 font-medium mt-2">
            <span className="text-green-600 font-semibold">{score}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-blue-600">
              {currentExerciseIndex + (showResult ? 1 : 0)}
            </span>
            <span className="ml-1">correct</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentExerciseIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            <UICard className="relative p-8 border-2 border-gray-500/30">
              {/* Top-left icon */}
              <div className="absolute top-4 left-4">
                {getExerciseIcon(currentExercise.type)}
              </div>

              {/* Static 2-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* LEFT: Character / Pinyin / HSK Level */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  {currentExercise.type === 'character_choice' ? (
                    <>
                      <div className="text-2xl font-mono">
                        {pinyinNumericToAccents(currentExercise.card.Pinyin)}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        HSK Level {currentExercise.card.HSK}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl md:text-8xl font-chinese">
                        {currentExercise.card.Chinese}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        HSK Level {currentExercise.card.HSK}
                      </div>
                    </>
                  )}
                </div>

                {/* RIGHT: Exercise Interaction */}
                <div className="flex flex-col justify-center">
                  {!showResult ? (
                    <>
                      {currentExercise.type === 'pinyin_fill' && (
                        <PinyinFillExercise 
                          correctPinyin={currentExercise.card.Pinyin}
                          userAnswer={userAnswer}
                          setUserAnswer={setUserAnswer}
                          onSubmit={checkAnswer}
                          onAddTone={addToneToInput}
                        />
                      )}
                      {currentExercise.type === 'translation_choice' && (
                        <TranslationChoiceExercise 
                          choices={currentExercise.choices as string[]}
                          selectedChoice={selectedChoice}
                          setSelectedChoice={setSelectedChoice}
                          onSubmit={checkAnswer}
                        />
                      )}
                      {currentExercise.type === 'character_choice' && (
                        <CharacterChoiceExercise 
                          choices={currentExercise.choices as ChineseWord[]}
                          selectedChoice={selectedChoice}
                          setSelectedChoice={setSelectedChoice}
                          onSubmit={checkAnswer}
                        />
                      )}
                    </>
                  ) : (
                    <ExerciseResult 
                      isCorrect={isCorrect}
                      currentExercise={currentExercise}
                      userAnswer={currentExercise.type === 'pinyin_fill' ? userAnswer : selectedChoice || ''}
                      onNext={nextExercise}
                      isLastExercise={isLastExercise}
                    />
                  )}
                </div>
              </div>
            </UICard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Component for pinyin fill-in exercise with tone buttons
interface PinyinFillExerciseProps {
  correctPinyin: string; // NEW
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  onSubmit: () => void;
  onAddTone: (tone: string) => void;
}

function PinyinFillExercise({
  correctPinyin,
  userAnswer,
  setUserAnswer,
  onSubmit,
}: PinyinFillExerciseProps) {
  const normalizedAnswer = correctPinyin.replace(/\s/g, "");
  const answerLength = normalizedAnswer.length;
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [selectedAccentIndex, setSelectedAccentIndex] = useState<number | null>(null);
  const [invalidAccentIndex, setInvalidAccentIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!Array.isArray(userAnswer)) {
      setUserAnswer(Array(answerLength).fill(""));
    }
  }, [answerLength, setUserAnswer, userAnswer]);

  // Convert 'v' => 'ü' on typing
  const normalizeV = (ch: string) => {
    if (!ch) return "";
    return ch === "v" || ch === "V" ? "ü" : ch;
  };

  const handleChange = (index: number, value: string) => {
    const newAnswer = Array.isArray(userAnswer)
      ? [...userAnswer]
      : Array(answerLength).fill("");
    const lastChar = value.slice(-1);
    newAnswer[index] = normalizeV(lastChar);
    setUserAnswer(newAnswer);

    if (lastChar && index < answerLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Helper: get base vowel while PRESERVING diaeresis (ü)
  const getBaseVowel = (char: string, fallbackIndex: number) => {
    // prefer the typed char, fallback to the solution char
    let source = (char || normalizedAnswer[fallbackIndex] || "").toString();

    // if user typed 'v' treat it as 'ü'
    if (/^v$/i.test(source)) return "ü";

    // Normalize to NFD so accents and diaeresis are combining marks
    const nfd = source.normalize("NFD");

    // Remove only tone combining marks: grave \u0300, acute \u0301, caron \u030C, macron \u0304
    // (Do NOT remove \u0308 = diaeresis)
    const withoutTone = nfd.replace(/[\u0300\u0301\u030C\u0304]/g, "");

    // If there's a diaeresis combining mark left, treat as ü
    const hasDiaeresis = /\u0308/.test(withoutTone) || /[ü]/i.test(source);

    // Remove diaeresis mark to get the base letter (e.g. 'u' from 'u\u0308')
    const baseLetter = withoutTone.replace(/\u0308/g, "").replace(/[\u0300-\u036f]/g, "");

    return hasDiaeresis ? "ü" : (baseLetter || "").toLowerCase();
  };

  const handleToneInsert = (tone: string) => {
    if (selectedAccentIndex === null) return;

    const newAnswer = Array.isArray(userAnswer)
      ? [...userAnswer]
      : Array(answerLength).fill("");
    const typedChar = newAnswer[selectedAccentIndex] || "";
    const base = getBaseVowel(typedChar, selectedAccentIndex);

    // Only vowels a, e, i, o, u, ü accepted
    if (!/[aeiouü]/i.test(base)) {
      setInvalidAccentIndex(selectedAccentIndex);
      setTimeout(() => setInvalidAccentIndex(null), 420);
      return;
    }

    const toneMap: Record<string, Record<string, string>> = {
      "ˉ": { a: "ā", e: "ē", i: "ī", o: "ō", u: "ū", ü: "ǖ" },
      "ˊ": { a: "á", e: "é", i: "í", o: "ó", u: "ú", ü: "ǘ" },
      "ˇ": { a: "ǎ", e: "ě", i: "ǐ", o: "ǒ", u: "ǔ", ü: "ǚ" },
      "ˋ": { a: "à", e: "è", i: "ì", o: "ò", u: "ù", ü: "ǜ" },
    };

    const mapped = toneMap[tone] && toneMap[tone][base];
    if (mapped) {
      newAnswer[selectedAccentIndex] = mapped;
      setUserAnswer(newAnswer);
      // keep focus on the input
      inputRefs.current[selectedAccentIndex]?.focus();
    }
  };

  const syllables = correctPinyin.split(" ");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Fill in the Pinyin</h3>
        <p className="text-muted-foreground">Type (use "v" for ü), click a box above a letter, then choose a tone.</p>
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        {syllables.map((syllable, sIndex) => (
          <div key={sIndex} className="flex gap-2">
            {Array.from(syllable).map((_, index) => {
              const globalIndex = syllables.slice(0, sIndex).join("").length + index;
              const isSelected = selectedAccentIndex === globalIndex;
              const isInvalid = invalidAccentIndex === globalIndex;

              return (
                <div key={globalIndex} className="flex flex-col items-center">
                  <button
                    className={`w-6 h-4 rounded-sm border text-xs mb-1 transition-colors
                      ${isInvalid ? "border-red-500 bg-red-100" : isSelected ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-gray-50"}`}
                    onClick={() => setSelectedAccentIndex(globalIndex)}
                    aria-label={`Select accent slot ${globalIndex}`}
                  />

                  <Input
                    ref={(el) => (inputRefs.current[globalIndex] = el!)}
                    type="text"
                    maxLength={1}
                    value={Array.isArray(userAnswer) ? userAnswer[globalIndex] || "" : ""}
                    onChange={(e) => handleChange(globalIndex, e.target.value)}
                    className="w-10 h-12 text-center text-lg border-b-2"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-2">
        {["ˉ", "ˊ", "ˇ", "ˋ"].map((t) => (
          <Button key={t} variant="outline" size="sm" onClick={() => handleToneInsert(t)} disabled={selectedAccentIndex === null}>
            {t}
          </Button>
        ))}
      </div>

      <Button onClick={onSubmit} disabled={!Array.isArray(userAnswer) || userAnswer.some((c) => !c)} className="w-full" size="lg">
        Submit Answer
      </Button>
    </div>
  );
}









// Component for translation multiple choice
interface TranslationChoiceExerciseProps {
  choices: string[];
  selectedChoice: string | null;
  setSelectedChoice: (choice: string) => void;
  onSubmit: () => void;
}

function TranslationChoiceExercise({ 
  choices, 
  selectedChoice, 
  setSelectedChoice, 
  onSubmit 
}: TranslationChoiceExerciseProps) {
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
      >
        Submit Answer
      </Button>
    </div>
  );
}

// Component for character choice based on pinyin
interface CharacterChoiceExerciseProps {
  choices: ChineseWord[];
  selectedChoice: string | null;
  setSelectedChoice: (choice: string) => void;
  onSubmit: () => void;
}

function CharacterChoiceExercise({ 
  choices, 
  selectedChoice, 
  setSelectedChoice, 
  onSubmit 
}: CharacterChoiceExerciseProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Choose the Character</h3>
        <p className="text-muted-foreground">Select the correct character for this pinyin</p>
      </div>
      
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <Button
            key={choice.id}
            variant={selectedChoice === choice.id ? "default" : "outline"}
            onClick={() => setSelectedChoice(choice.id)}
            className="w-full text-left justify-start h-auto p-4"
          >
            <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
            <span className="text-base">{choice.Chinese}</span>
          </Button>
        ))}
      </div>

      
      <Button 
        onClick={onSubmit}
        disabled={!selectedChoice}
        className="w-full"
        size="lg"
      >
        Submit Answer
      </Button>
    </div>
  );
}

// Results component
interface ExerciseResultProps {
  isCorrect: boolean;
  currentExercise: ExerciseData;
  userAnswer: string;
  onNext: () => void;
  isLastExercise: boolean;
}

function ExerciseResult({ 
  isCorrect, 
  currentExercise, 
  userAnswer, 
  onNext, 
  isLastExercise 
}: ExerciseResultProps) {
  const getCorrectAnswer = () => {
    switch (currentExercise.type) {
      case 'pinyin_fill':
        return currentExercise.card.Pinyin;
      case 'translation_choice':
        return currentExercise.card.Translation;
      case 'character_choice':
        return currentExercise.card.Chinese;
      default:
        return '';
    }
  };

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
            <p className="text-muted-foreground">
              Your answer: <span className="font-medium">{userAnswer}</span>
            </p>
            <p className="text-muted-foreground">
              Correct answer: <span className="font-medium text-green-600">{getCorrectAnswer()}</span>
            </p>
          </div>
        )}
      </div>
      
      <Button 
        onClick={onNext}
        className="w-full"
        size="lg"
      >
        {isLastExercise ? 'View Results' : 'Next Exercise'}
      </Button>
    </motion.div>
  );
}
