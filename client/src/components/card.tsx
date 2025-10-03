import { type ChineseWord } from "@shared/schema";
import { getImageUrl } from "@/lib/card-utils";
import { useState } from "react";
import { pinyinNumericToAccents } from "./pinyinUtils";


interface CardVisualProps {
  card: ChineseWord;
  size?: "sm" | "lg";
}


export function CardVisual({ card, size = "sm" }: CardVisualProps) {
  const [imageError, setImageError] = useState(false);

  const dimensions = size === "lg" ? "h-[32rem]" : "h-72";
  const LayoutColorMap: Record<string, string> = {
    "1": "/api/images/Layout_HSK1.png",
    "2": "/api/images/Layout_HSK2.png",
    "3": "/api/images/Layout_HSK3.png",
    "4": "/api/images/Layout_HSK4.png",
    "5": "/api/images/Layout_HSK5.png",
    "6": "/api/images/Layout_HSK6.png",
    default: "/api/images/Layout_HSK1.png",
  };

  const LayoutClass = LayoutColorMap[card.hsklevel?.toString() ?? "default"];

  return (
    <div
      className={`aspect-[720/1024] relative ${
        size === "lg" ? "w-[20rem] border-0" : "w-[12rem] border-0"
      } overflow-hidden rounded-lg`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {!imageError ? (
          <img
            src={getImageUrl(card)}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br" />
        )}
      </div>

      {/* Overlay Image */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={LayoutClass}
          alt="Overlay"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Card Content Overlay */}
      <div
        className={`${size === "lg" ? "pb-1" : "pb-0"} absolute inset-0 flex flex-col h-full  text-center font-sans`}
      >
        {/* pinyin */}
        <div
          className={`${size === "lg" ? "text-[0.7em]" : "text-[0.5em]"} text-black drop-shadow-[0_0_4px_white]`}
        >
          {pinyinNumericToAccents(card.pinyin)}
        </div>

        <div className="flex flex-col items-center mt-0.1 font-chinese">
          <div className="relative inline-block whitespace-nowrap leading-[1]">

            {/* Text */}
            <div
              className={`${size === "lg" ? "text-[2em]" : "text-[1.2em]"} relative z-10
                          font-extrabold bg-gradient-to-b from-black via-gray-800 to-black
                          bg-clip-text text-transparent drop-shadow-[0_0_10px_white]`}
            >
              {card.chinese}
            </div>
          </div>
        </div>

        <div className="mt-auto text-center">
          <span
            className={`${size === "lg" ? "text-[0.8em]" : "text-[0.5em]"} text-black drop-shadow-[0_0_4px_white]`}
          >
            {card.id}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  // accept both flags — server uses isNew; client code (pack-opening) sets unlocked
  card: ChineseWord & { isNew?: boolean; unlocked?: boolean };
  onClick?: () => void;
  showAnimation?: boolean;
  className?: string;
}

export default function Card({
  card,
  onClick,
  showAnimation = false,
  className = "",
}: CardProps) {
  const cardClasses = `
    relative card-3d bg-card border border-border rounded-xl p-4 shadow-lg hover:shadow-xl 
    transition-all duration-300 cursor-pointer card-${card.rarity} ${className}
    ${showAnimation ? "animate-card-reveal" : ""}
  `.trim();

  // Decide which badge to show:
  // - True NEW badge only if card was obtained in this pack AND the user did not already own it
  const showNewBadge = card.isNew === true && card.unlocked !== true;
  // - If it was obtained but user already owned it, show a small "Owned" / duplicate badge
  const showOwnedDuplicateBadge = card.isNew === true && card.unlocked === true;

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      data-testid={`card-${card.id}`}
    >
      {/* NEW badge: only when it's truly new to the user */}
      {showNewBadge && (
        <span className="absolute top-2 right-2 z-50 bg-gradient-to-r from-green-400 to-green-600 
        text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
          ✨ NEW
        </span>
      )}

      {/* Duplicate/Owned badge when the card was obtained but already unlocked */}
      {showOwnedDuplicateBadge && (
        <span className="absolute top-2 right-2 z-50 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
          ✓ OWNED
        </span>
      )}

      <CardVisual card={card} size="sm" />
    </div>
  );
}
