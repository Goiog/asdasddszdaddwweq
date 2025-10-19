import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Headphones, Link, Shuffle, Tag, User, Play, Lock } from "lucide-react";
import { ChineseWord } from "@/lib/card-utils";
import RecognitionRecallExercise from "./recognition-recall-exercise";

interface TrainingAreaProps {
  unlockedCards: ChineseWord[];
}

interface ExerciseType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  minCards: number;
}

const exerciseTypes: ExerciseType[] = [
  {
    id: "recognition-recall",
    title: "Recognition & Recall Exercises",
    description: "Test your ability to recognize Chinese characters and recall their meanings",
    icon: <Brain className="w-6 h-6" />,
    color: "bg-blue-500",
    minCards: 6
  },
  {
    id: "listening-pronunciation",
    title: "Listening & Pronunciation",
    description: "Practice listening to pinyin pronunciation and speaking Chinese words",
    icon: <Headphones className="w-6 h-6" />,
    color: "bg-green-500",
    minCards: 3
  },
  {
    id: "connect-usage",
    title: "Connect & Usage",
    description: "Learn how to use words in context and connect related concepts",
    icon: <Link className="w-6 h-6" />,
    color: "bg-purple-500",
    minCards: 4
  },
  {
    id: "mixed-mode",
    title: "Mixed-Mode",
    description: "Random mix of different exercise types for comprehensive practice",
    icon: <Shuffle className="w-6 h-6" />,
    color: "bg-orange-500",
    minCards: 10
  },
  {
    id: "category-training",
    title: "Category Training",
    description: "Focus on specific HSK levels or themes to master particular areas",
    icon: <Tag className="w-6 h-6" />,
    color: "bg-red-500",
    minCards: 8
  },
  {
    id: "personalized",
    title: "Personalized",
    description: "Adaptive exercises based on your performance and learning patterns",
    icon: <User className="w-6 h-6" />,
    color: "bg-cyan-500",
    minCards: 15
  }
];

export default function TrainingArea({ unlockedCards }: TrainingAreaProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<string | null>(null);

  const handleStartExercise = (exerciseId: string) => {
    if (exerciseId === "recognition-recall") {
      setActiveExercise(exerciseId);
    } else {
      // Other exercises will be implemented later
      console.log(`Starting exercise: ${exerciseId}`);
    }
  };

  const handleExerciseComplete = (trainedCards: ChineseWord[]) => {
    // Handle exercise completion - could save progress, show results, etc.
    console.log("Exercise completed with cards:", trainedCards);
    setActiveExercise(null);
    setSelectedExercise(null);
  };

  const handleExerciseBack = () => {
    setActiveExercise(null);
    setSelectedExercise(null);
  };

  const isExerciseAvailable = (exercise: ExerciseType) => {
    return unlockedCards.length >= exercise.minCards;
  };

  const getAvailableCardsByHSK = () => {
    const cardsByHSK: Record<number, number> = {};
    unlockedCards.forEach(card => {
      const level = Number(card.hsklevel) || 1;
      cardsByHSK[level] = (cardsByHSK[level] || 0) + 1;
    });
    return cardsByHSK;
  };

  const cardsByHSK = getAvailableCardsByHSK();

  // If recognition & recall exercise is active, render it
  if (activeExercise === "recognition-recall") {
    return (
      <RecognitionRecallExercise
        cards={unlockedCards}
        onComplete={handleExerciseComplete}
        onBack={handleExerciseBack}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Training Area</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Choose from different training exercises to improve your Chinese vocabulary skills
        </p>
        <div className="flex justify-center items-center space-x-4 mb-8">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            🃏 {unlockedCards.length} cards unlocked
          </Badge>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5, 6].map(level => (
              <Badge 
                key={level} 
                variant={cardsByHSK[level] > 0 ? "default" : "outline"}
                className="text-sm"
              >
                HSK {level}: {cardsByHSK[level] || 0}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {unlockedCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-muted rounded-xl p-8 max-w-md mx-auto">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-4">No Cards Available</h2>
            <p className="text-muted-foreground mb-6">
              You need to unlock some cards first by opening packs before you can start training exercises.
            </p>
            <Button asChild>
              <a href="/">Go to Pack Opening</a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exerciseTypes.map((exercise) => {
            const isAvailable = isExerciseAvailable(exercise);
            
            return (
              <Card 
                key={exercise.id}
                className={`transition-all duration-200 ${
                  isAvailable 
                    ? "hover:shadow-lg cursor-pointer border-2 hover:border-primary" 
                    : "opacity-60 cursor-not-allowed"
                } ${selectedExercise === exercise.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => isAvailable && setSelectedExercise(exercise.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${exercise.color} text-white`}>
                      {exercise.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{exercise.title}</CardTitle>
                      {!isAvailable && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Need {exercise.minCards} cards
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="text-sm mb-4">
                    {exercise.description}
                  </CardDescription>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="text-xs">
                      Min: {exercise.minCards} cards
                    </Badge>
                    
                    <Button 
                      size="sm"
                      disabled={!isAvailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartExercise(exercise.id);
                      }}
                      className="gap-2"
                    >
                      {isAvailable ? (
                        <>
                          <Play className="w-4 h-4" />
                          Start
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Locked
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedExercise && (
        <div className="mt-8 text-center">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold mb-4">Exercise Selected</h3>
            <p className="text-muted-foreground mb-4">
              You have selected "{exerciseTypes.find(e => e.id === selectedExercise)?.title}". 
              Exercise content will be implemented in the next phase.
            </p>
            <div className="flex space-x-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setSelectedExercise(null)}
              >
                Back to Selection
              </Button>
              <Button 
                onClick={() => handleStartExercise(selectedExercise)}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Start Exercise
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}