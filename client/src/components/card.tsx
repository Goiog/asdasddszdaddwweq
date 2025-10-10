import { 
  getImageUrl, 
  getLayoutImageUrl,  // 👈 new helper imported from card-utils
  type ChineseWord
} from "@/lib/card-utils";
import { useState } from "react";
import { pinyinNumericToAccents } from "./pinyinUtils";


interface CardVisualProps {
  card: ChineseWord;
  size?: "sm" | "lg";
}


export function CardVisual({ card, size = "sm" }: CardVisualProps) {
  const [imageError, setImageError] = useState(false);

  const dimensions = size === "lg" ? "h-[32rem]" : "h-72";

  // 👇 Dynamic layout image URL fetched from render server
  const layoutUrl = getLayoutImageUrl(card.HSK ?? 1);

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
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br" />
        )}
      </div>

      {/* Overlay Image from render server */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={layoutUrl}
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
          {pinyinNumericToAccents(card.Pinyin)}
        </div>

        <div className="flex flex-col items-center mt-0.1 font-chinese">
          <div className="relative inline-block whitespace-nowrap leading-[1]">
            {/* Text */}
            <div
              className={`${size === "lg" ? "text-[2em]" : "text-[1.2em]"} relative z-10
                          font-extrabold bg-gradient-to-b from-black via-gray-800 to-black
                          bg-clip-text text-transparent drop-shadow-[0_0_10px_white]`}
            >
              {card.Chinese}
            </div>
          </div>
        </div>

        <div className="mt-auto text-center">
          <span
            className={`${size === "lg" ? "text-[0.8em]" : "text-[0.5em]"} text-black drop-shadow-[0_0_4px_white]`}
          >
            {card.Id}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
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

  const showNewBadge = card.isNew === true && card.unlocked !== true;
  const showOwnedDuplicateBadge = card.isNew === true && card.unlocked === true;

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      data-testid={`card-${card.Id}`}
    >
      {showNewBadge && (
        <span className="absolute top-2 right-2 z-50 bg-gradient-to-r from-green-400 to-green-600 
        text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
          ✨ NEW
        </span>
      )}

      {showOwnedDuplicateBadge && (
        <span className="absolute top-2 right-2 z-50 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
          ✓ OWNED
        </span>
      )}

      <CardVisual card={card} size="sm" />
    </div>
  );
}
