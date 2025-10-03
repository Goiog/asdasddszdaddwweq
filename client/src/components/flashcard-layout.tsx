import { useState } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashcardLayoutProps {
  character?: string;
  pinyin?: string;
  progress?: number;
  weeklyProgress?: boolean[];
}

export default function FlashcardLayout({
  character = "你",
  pinyin = "nǐ",
  progress = 75,
  weeklyProgress = [true, true, true, true, true, false, false],
}: FlashcardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f1ed]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Chinese Learning
            </h1>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="/" className="text-gray-700 hover:text-gray-900 transition-colors">
                Home
              </a>
              <a href="/lessons" className="text-gray-700 hover:text-gray-900 transition-colors">
                Lessons
              </a>
              <a href="/progress" className="text-gray-700 hover:text-gray-900 transition-colors">
                Progress
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-gray-200 pt-4">
              <a
                href="/"
                className="text-gray-700 hover:text-gray-900 transition-colors py-2"
              >
                Home
              </a>
              <a
                href="/lessons"
                className="text-gray-700 hover:text-gray-900 transition-colors py-2"
              >
                Lessons
              </a>
              <a
                href="/progress"
                className="text-gray-700 hover:text-gray-900 transition-colors py-2"
              >
                Progress
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Flashcards Section */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Flashcards
            </h2>

            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              {/* Card Display */}
              <div className="bg-[#faf8f6] rounded-xl p-8 md:p-12 mb-6 min-h-[280px] md:min-h-[320px] flex flex-col items-center justify-center relative">
                {/* Navigation Arrows */}
                <button className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-gray-700" />
                </button>
                
                <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-gray-700" />
                </button>

                {/* Chinese Character */}
                <div className="text-center">
                  <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#c76b5f] mb-4">
                    {character}
                  </div>
                  <div className="text-xl md:text-2xl text-gray-700">
                    {pinyin}
                  </div>
                </div>
              </div>

              {/* Flip Button */}
              <div className="flex justify-center">
                <Button
                  className="bg-[#c76b5f] hover:bg-[#b55a4e] text-white px-12 py-6 rounded-full text-lg font-medium transition-colors"
                >
                  Flip
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Progress
            </h2>

            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              {/* Circular Progress */}
              <div className="flex justify-center mb-8">
                <div className="relative w-48 h-48 md:w-56 md:h-56">
                  {/* Progress Circle SVG */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    {/* Background Circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#d1ddd1"
                      strokeWidth="16"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#5a8e8a"
                      strokeWidth="16"
                      strokeDasharray={`${2 * Math.PI * 85}`}
                      strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  {/* Progress Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-bold text-gray-900">
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Weekly Calendar */}
              <div className="space-y-3">
                <div className="flex justify-center gap-3 md:gap-4 text-sm md:text-base font-medium text-gray-600">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                    <div key={index} className="w-8 md:w-10 text-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-3 md:gap-4">
                  {weeklyProgress.map((completed, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-lg transition-colors ${
                        completed
                          ? "bg-[#5a8e8a]"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
