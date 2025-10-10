import { useState } from "react";
import { ChevronLeft, ChevronRight, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import pinyin from "pinyin";
import Card, { CardVisual } from "./card";
import type { ChineseWord } from "@/lib/card-utils";
import { getLayoutImageUrl } from "@/lib/card-utils"; // <-- new import


// Import the existing functions we need
function speakChinese(text: string) {
  if (!text) return;
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    window.speechSynthesis.speak(utterance);
  }
}

function normalizeChinese(text: string) {
  return (text ?? "")
    .replace(/\s+/g, "") // remove spaces
    .replace(/[，。！？,.!?]/g, "") // remove punctuation
    .replace(/第一/g, "第1")
    .replace(/第二/g, "第2")
    .replace(/第三/g, "第3")
    .replace(/第四/g, "第4")
    .replace(/第五/g, "第5")
    .replace(/第六/g, "第6")
    .replace(/第七/g, "第7")
    .replace(/第八/g, "第8")
    .replace(/第九/g, "第9")
    .replace(/第十/g, "第10");
}

function listenChinese(
  expected: string,
  onResult: (result: string, isCorrect: boolean) => void,
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Sorry, your browser does not support speech recognition.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function (event: any) {
    const userSaid = event.results[0][0].transcript;
    const normalizedExpected = normalizeChinese(expected);
    const normalizedUserSaid = normalizeChinese(userSaid);
    const isCorrect = normalizedExpected === normalizedUserSaid;
    onResult(userSaid, isCorrect);
  };

  recognition.onerror = function (event: any) {
    console.error("Speech recognition error", event.error);
    onResult("Error occurred during speech recognition", false);
  };

  recognition.start();
}

function renderPinyinWithCharacters(text: string) {
  const safeText = text ?? "";
  const result = pinyin(safeText, {
    style: pinyin.STYLE_TONE,
    heteronym: false,
  });

  const characters = safeText.split("");

  return (
    <span>
      {characters.map((char, i) => (
        <ruby key={i} className="mx-0.5">
          <span>{char}</span>
          <rt className="text-xs text-muted-foreground">{result[i]?.[0]}</rt>
        </ruby>
      ))}
    </span>
  );
}

function renderDiffWithPinyin(expected: string, actual: string) {
  const expectedSafe = expected ?? "";
  const actualSafe = actual ?? "";

  const expectedChars = expectedSafe.split("");
  const actualChars = actualSafe.split("");

  const result = pinyin(actualSafe, {
    style: pinyin.STYLE_TONE,
    heteronym: false,
  });

  return (
    <span>
      {actualChars.map((char, i) => {
        const isDifferent = char !== expectedChars[i];
        return (
          <ruby key={i} className="mx-0.5">
            <span className={isDifferent ? "text-red-600 font-bold" : ""}>
              {char}
            </span>
            <rt className="text-xs text-muted-foreground">{result[i]?.[0]}</rt>
          </ruby>
        );
      })}
    </span>
  );
}

interface CardModalProps {
  card: ChineseWord | null;
  isOpen: boolean;
  onClose: () => void;
  onCardChange?: (card: ChineseWord) => void;
  allCards?: ChineseWord[];
}

export function NewCardModal({
  card,
  isOpen,
  onClose,
  onCardChange,
  allCards = [],
}: CardModalProps) {
  const { toast } = useToast();
  
  // State for examples interaction
  const [exampleStates, setExampleStates] = useState<Record<number, {
    userSaid: string | null;
    isCorrect: boolean | null;
    translation: string | null;
  }>>({});
  
  // State for related cards pagination
  const [relatedCardsStates, setRelatedCardsStates] = useState<Record<string, number>>({});

  if (!isOpen || !card) return null;

  // Ensure we always work with strings
  const chineseText = typeof card.Chinese === "string" ? card.Chinese : "";
  const layoutUrl = getLayoutImageUrl(card.HSK ?? 1);

  // Navigation functions - clone array before sorting to avoid mutating parent state
  const sortedCards = [...allCards].sort((a, b) => Number(a.Id) - Number(b.Id));
  const currentIndex = sortedCards.findIndex(c => c.Id === card.Id);
  
  // Guard against missing cards
  if (currentIndex === -1) {
    console.warn('Current card not found in allCards array:', card.Id);
  }
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < sortedCards.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious && onCardChange) {
      onCardChange(sortedCards[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext && onCardChange) {
      onCardChange(sortedCards[currentIndex + 1]);
    }
  };

  // Dislike function
  const handleDislike = async () => {
    try {
      await apiRequest("POST", "/api/cards/dislike", { cardId: card.Id });
      
      toast({
        title: "Card disliked",
        description: "This card has been added to your disliked list.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save dislike. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Update example state
  const updateExampleState = (index: number, updates: Partial<typeof exampleStates[0]>) => {
    setExampleStates(prev => ({
      ...prev,
      [index]: { ...prev[index], ...updates }
    }));
  };

  // Update related cards state
  const updateRelatedCardsState = (char: string, startIndex: number) => {
    setRelatedCardsStates(prev => ({ ...prev, [char]: startIndex }));
  };

  // Dummy translation function
  const translateChineseToEnglish = async (text: string) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const result = await response.json();
      return result[0][0][0];
    } catch (error) {
      return "Translation failed";
    }
  };

  // Split into unique characters (safe)
  const characters = Array.from(new Set(chineseText.split("").filter(Boolean)));

  const examples = typeof card.Examples === "string" && card.Examples.trim().length > 0
    ? card.Examples.split(/\d+\.\s*/).filter(Boolean)
    : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="card-modal"
    >
      <div
        className="bg-card border border-border rounded-2xl p-8 max-w-7xl w-full shadow-2xl transform transition-all flex flex-col gap-6 
                         max-h-[80vh] max-w-[145vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Arrows */}
        {allCards.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all
                ${canGoPrevious 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
              data-testid="prev-card-arrow"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all
                ${canGoNext 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
              data-testid="next-card-arrow"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Top Section */}
        <div className="flex gap-8 items-start">
          {/* Left side */}
          <div className="flex-1 space-y-4">
            <div className="flex items-baseline gap-3 mb-4">
              {chineseText && (
                <h3 className="text-4xl font-bold text-foreground">
                  {chineseText}
                </h3>
              )}
              {card.Translation && (
                <span className="text-xl text-muted-foreground">
                  {card.Translation}
                </span>
              )}
              <button
                className="w-10 h-10 flex items-center justify-center bg-secondary hover:bg-secondary/80 
                           text-secondary-foreground rounded-lg transition-colors ml-2"
                onClick={() => speakChinese(chineseText)}
                data-testid="speak-button"
              >
                🔊
              </button>
            </div>

            {card.Meaning && (
              <div>
                <p
                  className="text-foreground text-sm leading-relaxed whitespace-pre-line text-justify"
                  dangerouslySetInnerHTML={{
                    __html: (card.Meaning ?? "")
                      .replace(/^### (.*)$/gm, "<strong>$1</strong>")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                  }}
                />
              </div>
            )}

            {/* Examples */}
            {examples.length > 0 && (
              <div className="space-y-3">
                {examples.map((rawExample, index) => {
                  const example = (rawExample ?? "").trim();
                  const exampleState = exampleStates[index] || { userSaid: null, isCorrect: null, translation: null };
                  
                  return (
                    <div
                      key={index}
                      className="flex flex-col bg-muted/20 border border-border rounded-md p-4 shadow-sm"
                    >
                      {/* Chinese with pinyin */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg leading-relaxed">
                          {renderPinyinWithCharacters(example)}
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => speakChinese(example)}
                            className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm"
                            data-testid={`speak-example-${index}`}
                          >
                            🔊
                          </button>
                          <button
                            onClick={() =>
                              listenChinese(example, (result, correct) => {
                                updateExampleState(index, { userSaid: result, isCorrect: correct });
                              })
                            }
                            className="px-3 py-1 rounded bg-primary hover:bg-primary/80 text-primary-foreground text-sm"
                            data-testid={`listen-example-${index}`}
                          >
                            🎤
                          </button>
                          <button
                            onClick={async () => {
                              const result = await translateChineseToEnglish(example);
                              updateExampleState(index, { translation: result });
                            }}
                            className="px-3 py-1 rounded bg-accent hover:bg-accent/80 text-accent-foreground text-sm"
                            data-testid={`translate-example-${index}`}
                          >
                            🌐
                          </button>
                        </div>
                      </div>

                      {/* Feedback */}
                      {exampleState.userSaid && (
                        <div className="mt-2 text-lg text-foreground flex items-center gap-2">
                          <span>
                            {renderDiffWithPinyin(example, exampleState.userSaid)}
                          </span>
                          {exampleState.isCorrect ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-red-600">❌</span>
                          )}
                        </div>
                      )}

                      {/* Translation */}
                      {exampleState.translation && (
                        <div className="mt-2 text-muted-foreground text-sm italic text-justify">
                          {exampleState.translation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Right side — Card visual with dislike button */}
          <div className="relative flex-shrink-0">
            {/* Pass layoutUrl to CardVisual so overlay comes from render server */}
            {/* `as any` used here so this remains non-breaking if CardVisual's props haven't been typed yet */}
            <CardVisual {...({ card, size: "lg", layoutUrl } as any)} />

            <button
              onClick={handleDislike}
              className="absolute bottom-2 right-2 w-12 h-12 flex items-center justify-center 
                         rounded-full bg-destructive hover:bg-destructive/90 
                         text-destructive-foreground shadow-lg transition-colors"
              data-testid="dislike-button"
            >
              <ThumbsDown className="w-6 h-6" />
            </button>
          </div>

        </div>

        {/* Bottom Section — Related cards */}
        {allCards && allCards.length > 0 && (
          <div className="mt-6 space-y-4">
            {characters.map((char) => {
              const related = allCards
                .filter((c) => (c.Chinese ?? "").includes(char) && c.Id !== card.Id)
                .sort((a, b) => Number(a.Id) - Number(b.Id));

              if (related.length === 0) return null;

              const startIndex = relatedCardsStates[char] || 0;
              const visibleCards = related.slice(startIndex, startIndex + 5);
              const canGoLeft = startIndex > 0;
              const canGoRight = startIndex + 5 < related.length;

              return (
                <div key={char}>
                  <h4 className="text-lg font-semibold mb-2">
                    Cards containing "{char}"
                    {(() => {
                      const matchingCard = allCards.find(
                        (c) => c.Chinese === char,
                      );
                      return matchingCard?.Translation
                        ? `: ${matchingCard.Translation}`
                        : "";
                    })()}
                  </h4>

                  <div className="flex items-center gap-2">
                    {/* Left arrow */}
                    <button
                      onClick={() => updateRelatedCardsState(char, Math.max(0, startIndex - 1))}
                      disabled={!canGoLeft}
                      className="p-2 rounded-full bg-secondary disabled:opacity-30 hover:bg-secondary/80"
                      data-testid={`related-prev-${char}`}
                    >
                      <ChevronLeft />
                    </button>

                    {/* Card list */}
                    <div className="flex gap-3 overflow-hidden flex-1">
                      {visibleCards.map((relatedCard) => {
                        // compute layout url per related card (so they each use the right HSK layout)
                        const relatedLayoutUrl = getLayoutImageUrl(relatedCard.HSK ?? 1);
                        return (
                          // again cast to any to avoid TS errors if Card prop types not updated yet
                          <Card
                            key={relatedCard.Id}
                            card={relatedCard as any}
                            onClick={() => onCardChange && onCardChange(relatedCard)}
                            {...({ layoutUrl: relatedLayoutUrl } as any)}
                          />
                        );
                      })}
                    </div>

                    {/* Right arrow */}
                    <button
                      onClick={() => updateRelatedCardsState(char, Math.min(related.length - 5, startIndex + 1))}
                      disabled={!canGoRight}
                      className="p-2 rounded-full bg-secondary disabled:opacity-30 hover:bg-secondary/80"
                      data-testid={`related-next-${char}`}
                    >
                      <ChevronRight />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
